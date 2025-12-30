---
order: 4
---

# Go - 微服务

微服务架构的核心组件：服务发现、负载均衡、熔断降级。

## 服务发现

### Consul

```go
import (
    "github.com/hashicorp/consul/api"
)

// 注册服务
func RegisterService(address, name, id string, port int) error {
    config := api.DefaultConfig()
    config.Address = address
    
    client, err := api.NewClient(config)
    if err != nil {
        return err
    }
    
    registration := &api.AgentServiceRegistration{
        ID:      id,
        Name:    name,
        Port:    port,
        Address: "127.0.0.1",
        Check: &api.AgentServiceCheck{
            HTTP:                           fmt.Sprintf("http://127.0.0.1:%d/health", port),
            Timeout:                        "5s",
            Interval:                       "10s",
            DeregisterCriticalServiceAfter: "30s",
        },
    }
    
    return client.Agent().ServiceRegister(registration)
}

// 发现服务
func DiscoverService(address, name string) ([]*api.ServiceEntry, error) {
    config := api.DefaultConfig()
    config.Address = address
    
    client, err := api.NewClient(config)
    if err != nil {
        return nil, err
    }
    
    services, _, err := client.Health().Service(name, "", true, nil)
    return services, err
}

// 注销服务
func DeregisterService(address, id string) error {
    config := api.DefaultConfig()
    config.Address = address
    
    client, err := api.NewClient(config)
    if err != nil {
        return err
    }
    
    return client.Agent().ServiceDeregister(id)
}
```

### etcd

```go
import (
    "context"
    "time"
    clientv3 "go.etcd.io/etcd/client/v3"
)

// 注册服务
func RegisterServiceEtcd(endpoints []string, serviceName, serviceAddr string) error {
    client, err := clientv3.New(clientv3.Config{
        Endpoints:   endpoints,
        DialTimeout: 5 * time.Second,
    })
    if err != nil {
        return err
    }
    defer client.Close()
    
    // 创建租约
    lease, err := client.Grant(context.Background(), 10)
    if err != nil {
        return err
    }
    
    // 注册服务
    key := fmt.Sprintf("/services/%s/%s", serviceName, serviceAddr)
    _, err = client.Put(context.Background(), key, serviceAddr, clientv3.WithLease(lease.ID))
    if err != nil {
        return err
    }
    
    // 保持租约
    keepAliveChan, err := client.KeepAlive(context.Background(), lease.ID)
    if err != nil {
        return err
    }
    
    go func() {
        for range keepAliveChan {
            // 心跳
        }
    }()
    
    return nil
}

// 发现服务
func DiscoverServiceEtcd(endpoints []string, serviceName string) ([]string, error) {
    client, err := clientv3.New(clientv3.Config{
        Endpoints:   endpoints,
        DialTimeout: 5 * time.Second,
    })
    if err != nil {
        return nil, err
    }
    defer client.Close()
    
    prefix := fmt.Sprintf("/services/%s/", serviceName)
    resp, err := client.Get(context.Background(), prefix, clientv3.WithPrefix())
    if err != nil {
        return nil, err
    }
    
    var addrs []string
    for _, kv := range resp.Kvs {
        addrs = append(addrs, string(kv.Value))
    }
    
    return addrs, nil
}
```

## 负载均衡

### 轮询

```go
type RoundRobin struct {
    servers []string
    current int
    mu      sync.Mutex
}

func NewRoundRobin(servers []string) *RoundRobin {
    return &RoundRobin{servers: servers}
}

func (r *RoundRobin) Next() string {
    r.mu.Lock()
    defer r.mu.Unlock()
    
    server := r.servers[r.current]
    r.current = (r.current + 1) % len(r.servers)
    return server
}
```

### 加权轮询

```go
type WeightedServer struct {
    Address string
    Weight  int
    Current int
}

type WeightedRoundRobin struct {
    servers []*WeightedServer
    mu      sync.Mutex
}

func (w *WeightedRoundRobin) Next() string {
    w.mu.Lock()
    defer w.mu.Unlock()
    
    totalWeight := 0
    var best *WeightedServer
    
    for _, server := range w.servers {
        server.Current += server.Weight
        totalWeight += server.Weight
        
        if best == nil || server.Current > best.Current {
            best = server
        }
    }
    
    if best == nil {
        return ""
    }
    
    best.Current -= totalWeight
    return best.Address
}
```

### 一致性哈希

```go
import (
    "hash/crc32"
    "sort"
    "sync"
)

type ConsistentHash struct {
    circle       map[uint32]string
    sortedHashes []uint32
    replicas     int
    mu           sync.RWMutex
}

func NewConsistentHash(replicas int) *ConsistentHash {
    return &ConsistentHash{
        circle:   make(map[uint32]string),
        replicas: replicas,
    }
}

func (c *ConsistentHash) hash(key string) uint32 {
    return crc32.ChecksumIEEE([]byte(key))
}

func (c *ConsistentHash) Add(server string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    for i := 0; i < c.replicas; i++ {
        hash := c.hash(fmt.Sprintf("%s#%d", server, i))
        c.circle[hash] = server
        c.sortedHashes = append(c.sortedHashes, hash)
    }
    
    sort.Slice(c.sortedHashes, func(i, j int) bool {
        return c.sortedHashes[i] < c.sortedHashes[j]
    })
}

func (c *ConsistentHash) Get(key string) string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    if len(c.circle) == 0 {
        return ""
    }
    
    hash := c.hash(key)
    idx := sort.Search(len(c.sortedHashes), func(i int) bool {
        return c.sortedHashes[i] >= hash
    })
    
    if idx >= len(c.sortedHashes) {
        idx = 0
    }
    
    return c.circle[c.sortedHashes[idx]]
}
```

## 熔断器

### 简单实现

```go
type State int

const (
    StateClosed State = iota
    StateOpen
    StateHalfOpen
)

type CircuitBreaker struct {
    mu             sync.Mutex
    state          State
    failureCount   int
    successCount   int
    threshold      int
    timeout        time.Duration
    lastFailure    time.Time
}

func NewCircuitBreaker(threshold int, timeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        state:     StateClosed,
        threshold: threshold,
        timeout:   timeout,
    }
}

func (cb *CircuitBreaker) Execute(fn func() error) error {
    cb.mu.Lock()
    
    // 检查状态
    switch cb.state {
    case StateOpen:
        if time.Since(cb.lastFailure) > cb.timeout {
            cb.state = StateHalfOpen
            cb.successCount = 0
        } else {
            cb.mu.Unlock()
            return errors.New("circuit breaker is open")
        }
    }
    
    cb.mu.Unlock()
    
    // 执行操作
    err := fn()
    
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    if err != nil {
        cb.failureCount++
        cb.lastFailure = time.Now()
        
        if cb.failureCount >= cb.threshold {
            cb.state = StateOpen
        }
        
        return err
    }
    
    // 成功
    if cb.state == StateHalfOpen {
        cb.successCount++
        if cb.successCount >= 3 {
            cb.state = StateClosed
            cb.failureCount = 0
        }
    } else {
        cb.failureCount = 0
    }
    
    return nil
}
```

### 使用 gobreaker

```go
import "github.com/sony/gobreaker"

var cb *gobreaker.CircuitBreaker

func init() {
    settings := gobreaker.Settings{
        Name:        "my-service",
        MaxRequests: 3,                // 半开状态最大请求数
        Interval:    10 * time.Second, // 统计间隔
        Timeout:     30 * time.Second, // 开启状态超时时间
        ReadyToTrip: func(counts gobreaker.Counts) bool {
            // 失败率超过 60% 触发熔断
            failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
            return counts.Requests >= 3 && failureRatio >= 0.6
        },
        OnStateChange: func(name string, from gobreaker.State, to gobreaker.State) {
            log.Printf("Circuit breaker %s: %s -> %s\n", name, from, to)
        },
    }
    
    cb = gobreaker.NewCircuitBreaker(settings)
}

// 使用
func CallService() (interface{}, error) {
    return cb.Execute(func() (interface{}, error) {
        // 调用远程服务
        return doRequest()
    })
}
```

## 限流

### 令牌桶

```go
import "golang.org/x/time/rate"

// 创建限流器：每秒 100 个请求，最大突发 10 个
limiter := rate.NewLimiter(100, 10)

// 阻塞等待
if err := limiter.Wait(ctx); err != nil {
    return err
}
// 执行请求...

// 非阻塞
if !limiter.Allow() {
    return errors.New("rate limited")
}
// 执行请求...
```

### 滑动窗口

```go
type SlidingWindow struct {
    mu        sync.Mutex
    size      time.Duration
    limit     int
    timestamps []time.Time
}

func NewSlidingWindow(size time.Duration, limit int) *SlidingWindow {
    return &SlidingWindow{
        size:  size,
        limit: limit,
    }
}

func (sw *SlidingWindow) Allow() bool {
    sw.mu.Lock()
    defer sw.mu.Unlock()
    
    now := time.Now()
    windowStart := now.Add(-sw.size)
    
    // 清理过期记录
    var valid []time.Time
    for _, ts := range sw.timestamps {
        if ts.After(windowStart) {
            valid = append(valid, ts)
        }
    }
    sw.timestamps = valid
    
    // 检查是否超过限制
    if len(sw.timestamps) >= sw.limit {
        return false
    }
    
    sw.timestamps = append(sw.timestamps, now)
    return true
}
```

## 分布式追踪

### OpenTelemetry

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/trace"
)

func initTracer() func() {
    exp, err := jaeger.New(jaeger.WithCollectorEndpoint(
        jaeger.WithEndpoint("http://localhost:14268/api/traces"),
    ))
    if err != nil {
        log.Fatal(err)
    }
    
    tp := trace.NewTracerProvider(
        trace.WithBatcher(exp),
        trace.WithResource(resource.NewWithAttributes(
            semconv.ServiceNameKey.String("my-service"),
        )),
    )
    
    otel.SetTracerProvider(tp)
    
    return func() {
        tp.Shutdown(context.Background())
    }
}

// 使用
tracer := otel.Tracer("my-service")

func handler(ctx context.Context) {
    ctx, span := tracer.Start(ctx, "handler")
    defer span.End()
    
    // 业务逻辑...
    
    // 添加属性
    span.SetAttributes(attribute.String("user_id", "123"))
    
    // 记录事件
    span.AddEvent("processing started")
    
    // 调用其他服务（会传递 trace context）
    callOtherService(ctx)
}
```
