---
order: 7
---

# Go - 并发编程

Go 的并发是其核心特性之一，通过 Goroutine 和 Channel 实现。

## Goroutine

Goroutine 是 Go 的轻量级线程，由 Go 运行时管理。

### 创建 Goroutine

```go
// 使用 go 关键字启动
func sayHello() {
    fmt.Println("Hello")
}

go sayHello()  // 异步执行

// 匿名函数
go func() {
    fmt.Println("匿名函数")
}()

// 带参数
go func(msg string) {
    fmt.Println(msg)
}("hello")
```

### Goroutine 特点

| 特点     | 说明                           |
| :------- | :----------------------------- |
| 轻量级   | 初始栈只有 2KB，可动态增长     |
| 数量大   | 可以创建数十万个 Goroutine     |
| 调度高效 | Go 运行时调度，无需系统调用    |
| 共享内存 | 同一进程内，可直接访问共享变量 |

### 等待 Goroutine 完成

```go
import "sync"

func main() {
    var wg sync.WaitGroup

    for i := 0; i < 5; i++ {
        wg.Add(1)  // 计数 +1
        go func(n int) {
            defer wg.Done()  // 计数 -1
            fmt.Println(n)
        }(i)
    }

    wg.Wait()  // 等待所有 Goroutine 完成
    fmt.Println("全部完成")
}
```

## Channel

Channel 是 Goroutine 之间通信的管道。

### 创建 Channel

```go
// 无缓冲 Channel
ch := make(chan int)

// 有缓冲 Channel
ch := make(chan int, 10)  // 容量为 10

// 只发送 Channel
var sendOnly chan<- int

// 只接收 Channel
var recvOnly <-chan int
```

### 发送和接收

```go
ch := make(chan int)

// 发送
go func() {
    ch <- 42  // 发送数据
}()

// 接收
value := <-ch  // 接收数据
fmt.Println(value)

// 接收并丢弃
<-ch
```

### 无缓冲 vs 有缓冲

```go
// 无缓冲：同步通信，发送和接收必须同时就绪
ch := make(chan int)
go func() {
    ch <- 1  // 阻塞，直到有接收者
}()
<-ch  // 阻塞，直到有发送者

// 有缓冲：异步通信，缓冲满时发送阻塞，空时接收阻塞
ch := make(chan int, 3)
ch <- 1  // 不阻塞
ch <- 2  // 不阻塞
ch <- 3  // 不阻塞
ch <- 4  // 阻塞，缓冲已满
```

### 关闭 Channel

```go
ch := make(chan int, 3)
ch <- 1
ch <- 2
close(ch)  // 关闭 channel

// 关闭后仍可接收
fmt.Println(<-ch)  // 1
fmt.Println(<-ch)  // 2
fmt.Println(<-ch)  // 0（默认值，channel 已空）

// 检查 channel 是否关闭
value, ok := <-ch
if !ok {
    fmt.Println("channel 已关闭")
}

// 向已关闭的 channel 发送会 panic
// ch <- 3  // panic!
```

### 遍历 Channel

```go
ch := make(chan int, 5)
go func() {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)  // 必须关闭，否则 range 会阻塞
}()

// 使用 range 遍历
for value := range ch {
    fmt.Println(value)
}
```

## select

select 用于同时监听多个 Channel。

```go
ch1 := make(chan int)
ch2 := make(chan string)

go func() {
    time.Sleep(time.Second)
    ch1 <- 1
}()

go func() {
    time.Sleep(2 * time.Second)
    ch2 <- "hello"
}()

// 等待多个 channel
select {
case v := <-ch1:
    fmt.Println("ch1:", v)
case v := <-ch2:
    fmt.Println("ch2:", v)
case <-time.After(3 * time.Second):
    fmt.Println("超时")
}
```

### 非阻塞操作

```go
select {
case v := <-ch:
    fmt.Println("接收:", v)
default:
    fmt.Println("没有数据")
}
```

### 超时控制

```go
select {
case result := <-ch:
    fmt.Println("结果:", result)
case <-time.After(5 * time.Second):
    fmt.Println("超时")
}
```

## 并发模式

### 生产者-消费者

```go
func producer(ch chan<- int) {
    for i := 0; i < 10; i++ {
        ch <- i
        fmt.Println("生产:", i)
    }
    close(ch)
}

func consumer(ch <-chan int) {
    for v := range ch {
        fmt.Println("消费:", v)
    }
}

func main() {
    ch := make(chan int, 5)
    go producer(ch)
    consumer(ch)
}
```

### 工作池

```go
func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        fmt.Printf("Worker %d 处理 Job %d\n", id, job)
        time.Sleep(time.Second)
        results <- job * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    // 启动 3 个 worker
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }

    // 发送 9 个任务
    for j := 1; j <= 9; j++ {
        jobs <- j
    }
    close(jobs)

    // 收集结果
    for i := 1; i <= 9; i++ {
        <-results
    }
}
```

### 扇入扇出

```go
// 扇出：一个 channel 分发给多个 goroutine
func fanOut(ch <-chan int, n int) []<-chan int {
    outs := make([]<-chan int, n)
    for i := 0; i < n; i++ {
        out := make(chan int)
        outs[i] = out
        go func() {
            for v := range ch {
                out <- v * 2
            }
            close(out)
        }()
    }
    return outs
}

// 扇入：多个 channel 合并为一个
func fanIn(chs ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    
    for _, ch := range chs {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                out <- v
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

## 同步原语

### sync.Mutex

```go
type Counter struct {
    mu    sync.Mutex
    value int
}

func (c *Counter) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}
```

### sync.RWMutex

```go
type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *Cache) Get(key string) string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.data[key]
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
}
```

### sync.Once

```go
var once sync.Once
var instance *Singleton

func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{}
    })
    return instance
}
```

### sync.Pool

```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func process() {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()
    
    // 使用 buf...
}
```

## Context

Context 用于控制 Goroutine 的生命周期。

```go
import "context"

func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("收到取消信号")
            return
        default:
            fmt.Println("工作中...")
            time.Sleep(time.Second)
        }
    }
}

func main() {
    // 可取消的 context
    ctx, cancel := context.WithCancel(context.Background())
    
    go worker(ctx)
    
    time.Sleep(3 * time.Second)
    cancel()  // 取消
    time.Sleep(time.Second)
}

// 带超时
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// 带截止时间
ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(5*time.Second))
defer cancel()

// 带值
ctx := context.WithValue(context.Background(), "key", "value")
value := ctx.Value("key").(string)
```
