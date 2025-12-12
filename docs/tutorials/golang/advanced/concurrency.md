---
order: 1
---

# Go - 并发深入

深入理解 Go 并发编程的核心机制。

## Goroutine 原理

### Goroutine 是什么

Goroutine 是 Go 运行时管理的轻量级线程，不是操作系统线程。

```go
// 创建 Goroutine
go func() {
    fmt.Println("Hello from goroutine")
}()
```

### Goroutine vs 线程

| 特性     | Goroutine            | OS Thread          |
| :------- | :------------------- | :----------------- |
| 创建成本 | 约 2KB 栈空间        | 约 1MB 栈空间      |
| 切换成本 | 用户态切换，约 200ns | 内核态切换，约 1μs |
| 调度     | Go 运行时调度        | 操作系统调度       |
| 数量     | 可创建数十万个       | 通常数千个         |
| 通信     | Channel              | 共享内存 + 锁      |

### Goroutine 栈

```go
// Goroutine 栈是动态增长的
// 初始 2KB，最大可达 1GB（64 位系统）

func recursion(n int) {
    if n == 0 {
        return
    }
    var buf [1024]byte  // 栈上分配
    _ = buf
    recursion(n - 1)
}
```

## Channel 高级用法

### Channel 的底层结构

```go
type hchan struct {
    qcount   uint           // 当前队列中的元素数量
    dataqsiz uint           // 环形队列大小
    buf      unsafe.Pointer // 环形队列指针
    elemsize uint16         // 元素大小
    closed   uint32         // 是否关闭
    sendx    uint           // 发送索引
    recvx    uint           // 接收索引
    recvq    waitq          // 接收等待队列
    sendq    waitq          // 发送等待队列
    lock     mutex          // 互斥锁
}
```

### nil Channel

```go
var ch chan int  // nil channel

// 向 nil channel 发送会永久阻塞
// ch <- 1  // 永久阻塞

// 从 nil channel 接收会永久阻塞
// <-ch  // 永久阻塞

// 关闭 nil channel 会 panic
// close(ch)  // panic

// nil channel 在 select 中的应用
func merge(ch1, ch2 <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for ch1 != nil || ch2 != nil {
            select {
            case v, ok := <-ch1:
                if !ok {
                    ch1 = nil  // 设为 nil，select 会忽略它
                    continue
                }
                out <- v
            case v, ok := <-ch2:
                if !ok {
                    ch2 = nil
                    continue
                }
                out <- v
            }
        }
    }()
    return out
}
```

### 单向 Channel

```go
// 只发送
func producer(ch chan<- int) {
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch)
}

// 只接收
func consumer(ch <-chan int) {
    for v := range ch {
        fmt.Println(v)
    }
}

// 双向转单向是隐式的
func main() {
    ch := make(chan int, 10)
    go producer(ch)  // chan int -> chan<- int
    consumer(ch)     // chan int -> <-chan int
}
```

### Channel 超时和取消

```go
// 超时控制
func doWithTimeout(timeout time.Duration) error {
    done := make(chan struct{})
    
    go func() {
        // 执行耗时操作
        time.Sleep(2 * time.Second)
        close(done)
    }()
    
    select {
    case <-done:
        return nil
    case <-time.After(timeout):
        return errors.New("timeout")
    }
}

// Context 取消
func doWithContext(ctx context.Context) error {
    done := make(chan struct{})
    
    go func() {
        // 执行操作
        time.Sleep(2 * time.Second)
        close(done)
    }()
    
    select {
    case <-done:
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

## sync 包深入

### sync.Mutex 实现原理

```go
// Mutex 状态
// - 正常模式：等待者按 FIFO 排队，但新到的可能抢占
// - 饥饿模式：直接把锁交给队首等待者

type Mutex struct {
    state int32  // 状态
    sema  uint32 // 信号量
}

// state 各个 bit 的含义
// - bit 0: locked，是否被锁定
// - bit 1: woken，是否有 goroutine 被唤醒
// - bit 2: starving，是否处于饥饿模式
// - bit 3-31: waiter count，等待者数量
```

### sync.RWMutex

```go
type RWMutex struct {
    w           Mutex  // 写锁
    writerSem   uint32 // 写等待信号量
    readerSem   uint32 // 读等待信号量
    readerCount int32  // 读者数量
    readerWait  int32  // 写者等待的读者数量
}

// 读锁：多个读者可以同时持有
// 写锁：独占，阻塞其他读写

type Cache struct {
    mu    sync.RWMutex
    items map[string]interface{}
}

func (c *Cache) Get(key string) interface{} {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.items[key]
}

func (c *Cache) Set(key string, value interface{}) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.items[key] = value
}
```

### sync.Cond

```go
// 条件变量，用于等待/通知模式
type Queue struct {
    items []interface{}
    cond  *sync.Cond
}

func NewQueue() *Queue {
    return &Queue{
        cond: sync.NewCond(&sync.Mutex{}),
    }
}

func (q *Queue) Put(item interface{}) {
    q.cond.L.Lock()
    defer q.cond.L.Unlock()
    q.items = append(q.items, item)
    q.cond.Signal()  // 通知一个等待者
}

func (q *Queue) Get() interface{} {
    q.cond.L.Lock()
    defer q.cond.L.Unlock()
    for len(q.items) == 0 {
        q.cond.Wait()  // 等待通知
    }
    item := q.items[0]
    q.items = q.items[1:]
    return item
}
```

### sync.Pool

```go
// 对象池，用于复用临时对象
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func process(data []byte) {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()
    
    buf.Write(data)
    // 处理数据...
}

// 注意：
// 1. Pool 中的对象随时可能被 GC 回收
// 2. 不适合存储需要持久化的对象
// 3. 适合存储临时对象，减少 GC 压力
```

### sync.Map

```go
// 并发安全的 map
var m sync.Map

// 存储
m.Store("key", "value")

// 加载
value, ok := m.Load("key")

// 删除
m.Delete("key")

// 加载或存储
value, loaded := m.LoadOrStore("key", "default")

// 加载并删除
value, loaded := m.LoadAndDelete("key")

// 遍历
m.Range(func(key, value interface{}) bool {
    fmt.Println(key, value)
    return true  // 继续遍历
})

// 适用场景：
// 1. 读多写少
// 2. 不同 goroutine 操作不同的 key
```

## 并发模式

### Pipeline（管道）

```go
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            out <- n
        }
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * n
        }
    }()
    return out
}

func main() {
    // 管道：generate -> square -> print
    for n := range square(generate(1, 2, 3, 4)) {
        fmt.Println(n)
    }
}
```

### Fan-out/Fan-in

```go
// Fan-out：一个 channel 分发给多个 worker
func fanOut(in <-chan int, n int) []<-chan int {
    outs := make([]<-chan int, n)
    for i := 0; i < n; i++ {
        outs[i] = worker(in)
    }
    return outs
}

func worker(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * n
        }
    }()
    return out
}

// Fan-in：多个 channel 合并为一个
func fanIn(chs ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    
    for _, ch := range chs {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for n := range c {
                out <- n
            }
        }(ch)
    }
    
    go func() {
        wg.Wait()
        close(out)
    }()
    
    return out
}
```

### Worker Pool

```go
type Task struct {
    ID   int
    Data interface{}
}

type Result struct {
    TaskID int
    Output interface{}
}

func WorkerPool(numWorkers int, tasks <-chan Task) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup
    
    // 启动 worker
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for task := range tasks {
                // 处理任务
                result := Result{
                    TaskID: task.ID,
                    Output: process(task.Data),
                }
                results <- result
            }
        }(i)
    }
    
    // 等待所有 worker 完成后关闭结果 channel
    go func() {
        wg.Wait()
        close(results)
    }()
    
    return results
}
```

## 常见并发问题

### 数据竞争

```go
// 错误：数据竞争
var counter int
for i := 0; i < 1000; i++ {
    go func() {
        counter++  // 数据竞争！
    }()
}

// 正确：使用 Mutex
var mu sync.Mutex
var counter int
for i := 0; i < 1000; i++ {
    go func() {
        mu.Lock()
        counter++
        mu.Unlock()
    }()
}

// 正确：使用原子操作
var counter int64
for i := 0; i < 1000; i++ {
    go func() {
        atomic.AddInt64(&counter, 1)
    }()
}

// 检测数据竞争
// go run -race main.go
// go test -race ./...
```

### 死锁

```go
// 死锁示例 1：channel 阻塞
func deadlock1() {
    ch := make(chan int)
    ch <- 1  // 死锁：没有接收者
}

// 死锁示例 2：互相等待
func deadlock2() {
    var mu1, mu2 sync.Mutex
    
    go func() {
        mu1.Lock()
        time.Sleep(time.Second)
        mu2.Lock()  // 等待 mu2
        mu2.Unlock()
        mu1.Unlock()
    }()
    
    go func() {
        mu2.Lock()
        time.Sleep(time.Second)
        mu1.Lock()  // 等待 mu1，死锁！
        mu1.Unlock()
        mu2.Unlock()
    }()
}

// 避免死锁：按固定顺序获取锁
```

### Goroutine 泄漏

```go
// 泄漏示例：channel 没有消费者
func leak() {
    ch := make(chan int)
    go func() {
        ch <- 1  // 永久阻塞，goroutine 泄漏
    }()
    // 函数返回，但 goroutine 还在
}

// 解决：使用 context 取消
func noLeak(ctx context.Context) {
    ch := make(chan int)
    go func() {
        select {
        case ch <- 1:
        case <-ctx.Done():
            return  // 收到取消信号，退出
        }
    }()
}
```
