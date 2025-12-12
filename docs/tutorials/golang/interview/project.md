---
order: 4
---

# Go 面试 - 项目实战篇

Go 项目实战、框架、中间件相关面试题目。

## Web 框架

### Q1: Gin 中间件的实现原理？

**答案：**

Gin 中间件采用**洋葱模型**，基于责任链模式。

```go
// Context 中保存了 handler 链
type Context struct {
    handlers HandlersChain  // []HandlerFunc
    index    int8           // 当前执行的 handler 索引
}

// Next 调用下一个 handler
func (c *Context) Next() {
    c.index++
    for c.index < int8(len(c.handlers)) {
        c.handlers[c.index](c)
        c.index++
    }
}

// Abort 终止后续 handler
func (c *Context) Abort() {
    c.index = abortIndex  // 63
}
```

**执行流程：**

```
请求 → Middleware1 → Middleware2 → Handler → Middleware2 → Middleware1 → 响应

func Middleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 前置处理
        fmt.Println("before")
        
        c.Next()  // 调用后续 handler
        
        // 后置处理
        fmt.Println("after")
    }
}
```

---

### Q2: 如何实现一个限流中间件？

**答案：**

**令牌桶算法：**

```go
import "golang.org/x/time/rate"

func RateLimitMiddleware(r rate.Limit, b int) gin.HandlerFunc {
    limiter := rate.NewLimiter(r, b)  // 每秒 r 个请求，最大突发 b 个
    
    return func(c *gin.Context) {
        if !limiter.Allow() {
            c.AbortWithStatusJSON(429, gin.H{
                "error": "请求过于频繁",
            })
            return
        }
        c.Next()
    }
}

// 使用
r.Use(RateLimitMiddleware(100, 10))  // 每秒 100 个请求，突发 10 个
```

**滑动窗口（按 IP 限流）：**

```go
type IPLimiter struct {
    ips map[string]*rate.Limiter
    mu  sync.RWMutex
    r   rate.Limit
    b   int
}

func (l *IPLimiter) GetLimiter(ip string) *rate.Limiter {
    l.mu.Lock()
    defer l.mu.Unlock()
    
    limiter, exists := l.ips[ip]
    if !exists {
        limiter = rate.NewLimiter(l.r, l.b)
        l.ips[ip] = limiter
    }
    return limiter
}

func IPRateLimitMiddleware(l *IPLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        ip := c.ClientIP()
        if !l.GetLimiter(ip).Allow() {
            c.AbortWithStatusJSON(429, gin.H{"error": "请求过于频繁"})
            return
        }
        c.Next()
    }
}
```

---

### Q3: Gin 的路由是怎么实现的？

**答案：**

Gin 使用**基数树（Radix Tree）**实现路由。

```
路由：
/user/info
/user/list
/user/:id

基数树：
        /user
       /     \
    /info   /:id
     |
   /list
```

**优点：**
- 查找效率高，O(k)，k 是路径长度
- 支持动态路由（`:id`、`*filepath`）
- 内存占用小，公共前缀只存一次

---

## 数据库

### Q4: GORM 的 Hook 机制？

**答案：**

GORM 提供了模型的生命周期钩子：

```go
type User struct {
    ID       uint
    Name     string
    Password string
}

// 创建前
func (u *User) BeforeCreate(tx *gorm.DB) error {
    u.Password = hashPassword(u.Password)
    return nil
}

// 创建后
func (u *User) AfterCreate(tx *gorm.DB) error {
    sendWelcomeEmail(u.Email)
    return nil
}

// 更新前
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    if tx.Statement.Changed("Password") {
        u.Password = hashPassword(u.Password)
    }
    return nil
}

// 删除前
func (u *User) BeforeDelete(tx *gorm.DB) error {
    if u.Role == "admin" {
        return errors.New("不能删除管理员")
    }
    return nil
}

// 查询后
func (u *User) AfterFind(tx *gorm.DB) error {
    // 解密敏感字段
    return nil
}
```

**Hook 顺序：**
- 创建：BeforeSave → BeforeCreate → 插入 → AfterCreate → AfterSave
- 更新：BeforeSave → BeforeUpdate → 更新 → AfterUpdate → AfterSave
- 删除：BeforeDelete → 删除 → AfterDelete

---

### Q5: 如何解决 N+1 查询问题？

**答案：**

**问题示例：**

```go
// N+1 问题：1 次查用户 + N 次查文章
var users []User
db.Find(&users)
for _, user := range users {
    db.Where("user_id = ?", user.ID).Find(&user.Articles)
}
```

**解决方案：使用预加载**

```go
// 1. Preload 预加载
var users []User
db.Preload("Articles").Find(&users)

// 2. 条件预加载
db.Preload("Articles", "status = ?", "published").Find(&users)

// 3. 嵌套预加载
db.Preload("Articles.Comments").Find(&users)

// 4. Joins 预加载（单次查询，更高效）
db.Joins("Profile").Find(&users)
```

---

### Q6: 数据库连接池如何配置？

**答案：**

```go
db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

sqlDB, _ := db.DB()

// 最大空闲连接数
sqlDB.SetMaxIdleConns(10)

// 最大打开连接数
sqlDB.SetMaxOpenConns(100)

// 连接最大生命周期
sqlDB.SetConnMaxLifetime(time.Hour)

// 空闲连接最大生命周期
sqlDB.SetConnMaxIdleTime(10 * time.Minute)
```

**配置建议：**
- MaxOpenConns：根据数据库和应用负载设置，通常 50-200
- MaxIdleConns：设为 MaxOpenConns 的 10%-25%
- ConnMaxLifetime：小于数据库的 wait_timeout

---

## 缓存

### Q7: 如何实现分布式锁？

**答案：**

**Redis 分布式锁：**

```go
// 加锁
func TryLock(ctx context.Context, key, value string, ttl time.Duration) bool {
    ok, _ := rdb.SetNX(ctx, key, value, ttl).Result()
    return ok
}

// 解锁（使用 Lua 保证原子性）
func Unlock(ctx context.Context, key, value string) bool {
    script := redis.NewScript(`
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
    `)
    result, _ := script.Run(ctx, rdb, []string{key}, value).Int()
    return result == 1
}

// 使用
lockKey := "lock:order:123"
lockValue := uuid.New().String()

if TryLock(ctx, lockKey, lockValue, 10*time.Second) {
    defer Unlock(ctx, lockKey, lockValue)
    // 执行业务逻辑
}
```

**Redlock（多节点）：**

```go
import "github.com/go-redsync/redsync/v4"

rs := redsync.New(pool)
mutex := rs.NewMutex("lock:resource")

if err := mutex.Lock(); err != nil {
    return err
}
defer mutex.Unlock()
```

---

### Q8: 缓存穿透、击穿、雪崩如何解决？

**答案：**

| 问题     | 原因                           | 解决方案                    |
| :------- | :----------------------------- | :-------------------------- |
| 缓存穿透 | 查询不存在的数据               | 布隆过滤器、缓存空值        |
| 缓存击穿 | 热点 key 过期，大量请求打到 DB | 互斥锁、永不过期 + 异步更新 |
| 缓存雪崩 | 大量 key 同时过期              | 随机过期时间、多级缓存      |

**缓存穿透 - 布隆过滤器：**

```go
import "github.com/bits-and-blooms/bloom/v3"

var filter = bloom.NewWithEstimates(1000000, 0.01)

func GetUser(id int) (*User, error) {
    // 布隆过滤器判断
    if !filter.TestString(fmt.Sprintf("%d", id)) {
        return nil, errors.New("用户不存在")
    }
    // 查缓存、查 DB...
}
```

**缓存击穿 - 互斥锁：**

```go
func GetUserWithLock(id int) (*User, error) {
    // 1. 查缓存
    if data, err := cache.Get(key); err == nil {
        return data, nil
    }
    
    // 2. 获取锁
    lockKey := "lock:" + key
    if !TryLock(lockKey) {
        time.Sleep(100 * time.Millisecond)
        return GetUserWithLock(id)  // 重试
    }
    defer Unlock(lockKey)
    
    // 3. 双重检查
    if data, err := cache.Get(key); err == nil {
        return data, nil
    }
    
    // 4. 查 DB 并设置缓存
    user, _ := db.GetUser(id)
    cache.Set(key, user, time.Hour)
    return user, nil
}
```

**缓存雪崩 - 随机过期：**

```go
// 基础过期时间 + 随机时间
ttl := time.Hour + time.Duration(rand.Intn(300))*time.Second
cache.Set(key, value, ttl)
```

---

## 微服务

### Q9: 如何实现服务熔断？

**答案：**

```go
import "github.com/sony/gobreaker"

var cb *gobreaker.CircuitBreaker

func init() {
    cb = gobreaker.NewCircuitBreaker(gobreaker.Settings{
        Name:        "my-service",
        MaxRequests: 3,                  // 半开状态最大请求数
        Interval:    10 * time.Second,   // 统计间隔
        Timeout:     30 * time.Second,   // 熔断超时
        ReadyToTrip: func(counts gobreaker.Counts) bool {
            // 失败率 > 60% 且请求数 >= 3 时熔断
            failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
            return counts.Requests >= 3 && failureRatio >= 0.6
        },
    })
}

func CallService() (interface{}, error) {
    return cb.Execute(func() (interface{}, error) {
        return doRequest()
    })
}
```

**熔断器状态：**
- **Closed**：正常状态，请求正常通过
- **Open**：熔断状态，请求直接失败
- **Half-Open**：半开状态，放行部分请求测试

---

### Q10: gRPC 和 HTTP 的区别？

**答案：**

| 特性     | gRPC               | HTTP/REST          |
| :------- | :----------------- | :----------------- |
| 协议     | HTTP/2             | HTTP/1.1 或 HTTP/2 |
| 序列化   | Protobuf（二进制） | JSON（文本）       |
| 性能     | 高                 | 相对较低           |
| 流式传输 | 原生支持           | 需要 WebSocket 等  |
| 代码生成 | 需要 .proto 文件   | 可选（OpenAPI）    |
| 浏览器   | 需要 grpc-web      | 原生支持           |
| 调试     | 需要专门工具       | curl/postman 即可  |

**选择建议：**
- 内部服务间通信：gRPC
- 对外 API：HTTP/REST
- 需要流式传输：gRPC

---

## 场景设计

### Q11: 如何设计一个高并发系统？

**答案：**

**1. 缓存**
```go
// 多级缓存：本地缓存 + Redis
func Get(key string) (interface{}, error) {
    // 1. 本地缓存
    if v, ok := localCache.Get(key); ok {
        return v, nil
    }
    
    // 2. Redis
    if v, err := redis.Get(key); err == nil {
        localCache.Set(key, v, time.Minute)
        return v, nil
    }
    
    // 3. DB
    v, err := db.Get(key)
    if err == nil {
        redis.Set(key, v, time.Hour)
        localCache.Set(key, v, time.Minute)
    }
    return v, err
}
```

**2. 异步处理**
```go
// 使用消息队列
func CreateOrder(order *Order) error {
    // 1. 扣减库存
    if err := deductStock(order); err != nil {
        return err
    }
    
    // 2. 创建订单
    if err := db.Create(order); err != nil {
        return err
    }
    
    // 3. 异步处理后续流程
    mq.Publish("order.created", order)
    
    return nil
}
```

**3. 限流**
```go
// 令牌桶
limiter := rate.NewLimiter(1000, 100)  // 1000 QPS，突发 100

if !limiter.Allow() {
    return errors.New("限流")
}
```

**4. 数据库优化**
- 读写分离
- 分库分表
- 索引优化

**5. 负载均衡**
- 轮询、加权轮询
- 一致性哈希

---

### Q12: 如何保证消息不丢失？

**答案：**

**消息丢失的三个环节：**
1. 生产者 → MQ
2. MQ 存储
3. MQ → 消费者

**解决方案：**

```go
// 1. 生产者确认
producer.SendMessage(msg)
// 等待 broker 确认

// 2. MQ 持久化
// Kafka：设置 acks=all
// RabbitMQ：设置持久化队列

// 3. 消费者确认
func consume(msg *Message) {
    // 处理消息
    process(msg)
    
    // 手动确认
    msg.Ack()
}
```

**幂等性处理：**

```go
func processOrder(orderID string) error {
    // 1. 检查是否处理过
    if processed, _ := redis.Get("processed:" + orderID); processed != "" {
        return nil  // 已处理，跳过
    }
    
    // 2. 处理订单
    if err := doProcess(orderID); err != nil {
        return err
    }
    
    // 3. 标记已处理
    redis.Set("processed:"+orderID, "1", 24*time.Hour)
    return nil
}
```

---

### Q13: 如何实现一个延迟队列？

**答案：**

**方案一：Redis ZSet**

```go
// 添加延迟任务
func AddDelayTask(task string, delay time.Duration) {
    score := float64(time.Now().Add(delay).Unix())
    rdb.ZAdd(ctx, "delay_queue", redis.Z{
        Score:  score,
        Member: task,
    })
}

// 消费延迟任务
func ConsumeDelayTask() {
    for {
        now := float64(time.Now().Unix())
        // 获取到期的任务
        tasks, _ := rdb.ZRangeByScore(ctx, "delay_queue", &redis.ZRangeBy{
            Min: "-inf",
            Max: fmt.Sprintf("%f", now),
        }).Result()
        
        for _, task := range tasks {
            // 处理任务
            process(task)
            // 删除已处理的任务
            rdb.ZRem(ctx, "delay_queue", task)
        }
        
        time.Sleep(100 * time.Millisecond)
    }
}
```

**方案二：RabbitMQ 死信队列**

```go
// 声明延迟队列
ch.QueueDeclare(
    "delay_queue",
    true,
    false,
    false,
    false,
    amqp.Table{
        "x-dead-letter-exchange":    "dlx",
        "x-dead-letter-routing-key": "process",
        "x-message-ttl":             30000,  // 30 秒
    },
)

// 消息发送到 delay_queue，30 秒后自动转发到死信队列
```

---

### Q14: 如何处理大文件上传？

**答案：**

**分片上传：**

```go
// 前端分片
const CHUNK_SIZE = 5 * 1024 * 1024  // 5MB

// 后端接收
func UploadChunk(c *gin.Context) {
    fileHash := c.PostForm("hash")      // 文件哈希
    chunkIndex := c.PostForm("index")   // 分片索引
    chunk, _ := c.FormFile("chunk")     // 分片数据
    
    // 保存分片
    dst := fmt.Sprintf("uploads/%s/%s", fileHash, chunkIndex)
    c.SaveUploadedFile(chunk, dst)
    
    c.JSON(200, gin.H{"status": "ok"})
}

// 合并分片
func MergeChunks(c *gin.Context) {
    fileHash := c.PostForm("hash")
    totalChunks := c.PostForm("total")
    filename := c.PostForm("filename")
    
    // 合并所有分片
    outFile, _ := os.Create("uploads/" + filename)
    defer outFile.Close()
    
    for i := 0; i < totalChunks; i++ {
        chunkPath := fmt.Sprintf("uploads/%s/%d", fileHash, i)
        chunkData, _ := os.ReadFile(chunkPath)
        outFile.Write(chunkData)
        os.Remove(chunkPath)  // 删除分片
    }
    
    c.JSON(200, gin.H{"status": "ok"})
}
```

**断点续传：**
- 前端记录已上传的分片
- 上传前先查询已有分片
- 只上传缺失的分片
