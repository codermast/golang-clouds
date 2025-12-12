---
order: 2
---

# Go 面试 - 并发篇

Go 并发编程面试高频题目，GMP 是重中之重。

## Goroutine

### Q1: Goroutine 和线程的区别？

**答案：**

| 特性     | Goroutine            | OS Thread      |
| :------- | :------------------- | :------------- |
| 内存占用 | 初始 2KB，可动态增长 | 固定 1-8MB     |
| 创建销毁 | 用户态，开销小       | 内核态，开销大 |
| 切换成本 | ~200ns               | ~1-2μs         |
| 调度     | Go runtime 调度      | 操作系统调度   |
| 数量     | 可创建百万级         | 通常数千个     |
| 通信     | Channel              | 共享内存 + 锁  |

**为什么 Goroutine 更轻量？**
1. 用户态调度，不需要系统调用
2. 栈初始只有 2KB，按需增长
3. 复用线程，M:N 调度模型

---

### Q2: 如何控制 Goroutine 的并发数量？

**答案：**

**1. 使用带缓冲的 Channel（信号量）**

```go
func main() {
    sem := make(chan struct{}, 10)  // 最多 10 个并发
    var wg sync.WaitGroup
    
    for i := 0; i < 100; i++ {
        wg.Add(1)
        sem <- struct{}{}  // 获取信号量
        
        go func(id int) {
            defer wg.Done()
            defer func() { <-sem }()  // 释放信号量
            
            // 工作...
        }(i)
    }
    
    wg.Wait()
}
```

**2. Worker Pool 模式**

```go
func main() {
    jobs := make(chan int, 100)
    var wg sync.WaitGroup
    
    // 启动固定数量的 worker
    for w := 0; w < 10; w++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                process(job)
            }
        }()
    }
    
    // 发送任务
    for i := 0; i < 100; i++ {
        jobs <- i
    }
    close(jobs)
    
    wg.Wait()
}
```

**3. 第三方库**

```go
import "github.com/panjf2000/ants/v2"

pool, _ := ants.NewPool(10)
defer pool.Release()

for i := 0; i < 100; i++ {
    pool.Submit(func() {
        // 工作...
    })
}
```

---

### Q3: 如何优雅地关闭 Goroutine？

**答案：**

**1. 使用 Context**

```go
func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("收到取消信号，退出")
            return
        default:
            // 工作...
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    go worker(ctx)
    
    time.Sleep(time.Second)
    cancel()  // 发送取消信号
}
```

**2. 使用 Channel**

```go
func worker(done <-chan struct{}) {
    for {
        select {
        case <-done:
            return
        default:
            // 工作...
        }
    }
}

func main() {
    done := make(chan struct{})
    go worker(done)
    
    time.Sleep(time.Second)
    close(done)  // 关闭 channel
}
```

---

### Q4: Goroutine 泄漏是什么？如何避免？

**答案：**

Goroutine 泄漏是指 Goroutine 无法正常退出，一直占用资源。

**常见原因：**

```go
// 1. Channel 阻塞
func leak1() {
    ch := make(chan int)
    go func() {
        ch <- 1  // 永久阻塞，无人接收
    }()
    // 函数返回，goroutine 泄漏
}

// 2. 无限循环没有退出条件
func leak2() {
    go func() {
        for {
            // 无法退出
        }
    }()
}

// 3. 等待锁
func leak3() {
    var mu sync.Mutex
    mu.Lock()
    go func() {
        mu.Lock()  // 永久阻塞
        defer mu.Unlock()
    }()
    // 忘记 mu.Unlock()
}
```

**避免方法：**

1. 使用 Context 控制生命周期
2. 使用带超时的操作
3. 确保 Channel 有消费者
4. 使用 `goleak` 测试检测泄漏

```go
import "go.uber.org/goleak"

func TestMain(m *testing.M) {
    goleak.VerifyTestMain(m)
}
```

---

## Channel

### Q5: Channel 的底层实现？

**答案：**

```go
type hchan struct {
    qcount   uint           // 队列中的元素数量
    dataqsiz uint           // 环形队列大小（缓冲区容量）
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

**关键点：**
1. 底层是**环形队列** + **等待队列**
2. 使用**互斥锁**保证并发安全
3. 发送/接收操作会根据情况阻塞或唤醒 Goroutine

---

### Q6: 有缓冲和无缓冲 Channel 的区别？

**答案：**

| 特性     | 无缓冲 chan    | 有缓冲 chan       |
| :------- | :------------- | :---------------- |
| 创建     | `make(chan T)` | `make(chan T, n)` |
| 发送阻塞 | 直到有接收者   | 直到缓冲区满      |
| 接收阻塞 | 直到有发送者   | 直到缓冲区空      |
| 同步性   | 同步通信       | 异步通信          |
| 用途     | Goroutine 同步 | 缓冲、解耦        |

```go
// 无缓冲：同步，发送和接收必须同时就绪
ch := make(chan int)
go func() {
    ch <- 1  // 阻塞，直到 main 准备接收
}()
<-ch  // 阻塞，直到 goroutine 发送

// 有缓冲：异步，缓冲区未满/空时不阻塞
ch := make(chan int, 1)
ch <- 1  // 不阻塞
ch <- 2  // 阻塞，缓冲区满
```

---

### Q7: Channel 发送和接收的各种情况？

**答案：**

| 操作             | nil channel | 已关闭 channel     | 正常 channel |
| :--------------- | :---------- | :----------------- | :----------- |
| 发送 `ch <- v`   | 永久阻塞    | **panic**          | 阻塞或成功   |
| 接收 `<-ch`      | 永久阻塞    | 返回零值，ok=false | 阻塞或成功   |
| 关闭 `close(ch)` | **panic**   | **panic**          | 成功         |

**记忆口诀：**
- 向已关闭的 Channel 发送会 panic
- 从已关闭的 Channel 接收会得到零值
- 关闭 nil 或已关闭的 Channel 会 panic

---

### Q8: 如何判断 Channel 是否关闭？

**答案：**

```go
// 方法 1：两个返回值
v, ok := <-ch
if !ok {
    fmt.Println("channel 已关闭")
}

// 方法 2：for range（推荐）
for v := range ch {
    fmt.Println(v)
}
// 循环结束说明 channel 已关闭
```

**注意：不能直接判断 Channel 是否关闭**，必须通过接收操作。

---

### Q9: select 的用法和注意事项？

**答案：**

```go
select {
case v := <-ch1:
    fmt.Println("ch1:", v)
case ch2 <- 1:
    fmt.Println("sent to ch2")
case <-time.After(time.Second):
    fmt.Println("timeout")
default:
    fmt.Println("no channel ready")
}
```

**特点：**
1. 随机选择一个就绪的 case 执行
2. 所有 case 都不就绪时，执行 default（如果有）
3. 没有 default 且无 case 就绪时阻塞
4. 空 select `select {}` 永久阻塞

**nil Channel 在 select 中的作用：**

```go
// nil channel 在 select 中会被忽略
ch1 := make(chan int)
var ch2 chan int = nil  // nil channel

select {
case <-ch1:
    // ...
case <-ch2:  // 永远不会选中
    // ...
}
```

---

## GMP 调度模型

### Q10: GMP 是什么？

**答案：**

GMP 是 Go 调度器的核心模型：

| 组件 | 全称      | 说明                                  |
| :--- | :-------- | :------------------------------------ |
| G    | Goroutine | 协程，包含栈、状态、任务函数          |
| M    | Machine   | 操作系统线程，执行 G 的实体           |
| P    | Processor | 逻辑处理器，连接 G 和 M，管理本地队列 |

**关系：**
- G 需要绑定 P 才能在 M 上执行
- P 的数量决定并行度（默认 = CPU 核数）
- M 的数量可以超过 P（阻塞系统调用时）

```
         ┌───────────────────────────────────────┐
         │            全局队列 (Global Queue)     │
         │        ┌──┬──┬──┬──┬──┬──┐            │
         │        │G │G │G │G │G │G │            │
         │        └──┴──┴──┴──┴──┴──┘            │
         └───────────────────────────────────────┘
                           ↑  ↓
     ┌─────────┐      ┌─────────┐      ┌─────────┐
     │    P    │      │    P    │      │    P    │
     │ [G][G]  │      │ [G][G]  │      │ [G][G]  │
     └────┬────┘      └────┬────┘      └────┬────┘
          │                │                │
     ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
     │    M    │      │    M    │      │    M    │
     └─────────┘      └─────────┘      └─────────┘
```

---

### Q11: G、M、P 各有什么状态？

**答案：**

**G 的状态：**
- `_Gidle`：刚创建，未初始化
- `_Grunnable`：可运行，在运行队列中
- `_Grunning`：正在运行
- `_Gsyscall`：在系统调用中
- `_Gwaiting`：等待中（channel、锁等）
- `_Gdead`：已退出

**P 的状态：**
- `_Pidle`：空闲
- `_Prunning`：正在执行 G
- `_Psyscall`：M 进入系统调用
- `_Pgcstop`：GC 暂停
- `_Pdead`：不再使用

---

### Q12: 调度的时机有哪些？

**答案：**

**主动调度：**
1. `runtime.Gosched()` 主动让出 CPU
2. Channel 操作阻塞
3. 锁操作阻塞
4. `time.Sleep()`

**被动调度（抢占）：**
1. sysmon 检测到 G 运行超过 10ms
2. 系统调用返回
3. GC STW

**Go 1.14+ 基于信号的抢占：**
- 即使没有函数调用也能被抢占
- 通过 SIGURG 信号实现

---

### Q13: Work Stealing 是什么？

**答案：**

当 P 的本地队列为空时，会从其他 P **偷取**一半的 G。

```go
// 偷取流程
func findrunnable() {
    // 1. 检查本地队列
    // 2. 检查全局队列
    // 3. 检查 netpoll
    // 4. 从其他 P 偷取（随机选择 victim）
}
```

**好处：**
- 负载均衡
- 减少锁竞争（每个 P 有本地队列）
- 提高 CPU 利用率

---

### Q14: GOMAXPROCS 设置多少合适？

**答案：**

默认值是 CPU 核数，通常不需要修改。

```go
runtime.GOMAXPROCS(runtime.NumCPU())  // 默认值
```

**特殊场景：**
- CPU 密集型：设置为 CPU 核数
- IO 密集型：可以适当增大（但效果有限）
- 容器环境：根据 cgroup 限制设置

```go
// 容器环境推荐使用 automaxprocs
import _ "go.uber.org/automaxprocs"
```

---

## 锁

### Q15: sync.Mutex 和 sync.RWMutex 的区别？

**答案：**

| 特性      | Mutex               | RWMutex               |
| :-------- | :------------------ | :-------------------- |
| 读锁      | 不支持              | `RLock()`/`RUnlock()` |
| 写锁      | `Lock()`/`Unlock()` | `Lock()`/`Unlock()`   |
| 读读      | 互斥                | 共享                  |
| 读写/写写 | 互斥                | 互斥                  |
| 适用场景  | 读写都多            | 读多写少              |

```go
var rw sync.RWMutex

// 读操作（可并发）
rw.RLock()
_ = data
rw.RUnlock()

// 写操作（独占）
rw.Lock()
data = newValue
rw.Unlock()
```

---

### Q16: sync.Map 和 map+Mutex 怎么选？

**答案：**

| 场景              | 推荐方案      |
| :---------------- | :------------ |
| 读多写少          | sync.Map      |
| 写多              | map + RWMutex |
| 不同 key 并发操作 | sync.Map      |
| 需要遍历          | map + Mutex   |

**sync.Map 原理：**
- 使用 read map（无锁读）和 dirty map（有锁写）
- 读操作优先走 read map
- 写操作会同步到 dirty map

---

### Q17: 如何实现一个读写锁？

**答案：**

```go
type RWLock struct {
    mu      sync.Mutex
    readers int
    writer  bool
    cond    *sync.Cond
}

func NewRWLock() *RWLock {
    l := &RWLock{}
    l.cond = sync.NewCond(&l.mu)
    return l
}

func (l *RWLock) RLock() {
    l.mu.Lock()
    for l.writer {
        l.cond.Wait()  // 有写者，等待
    }
    l.readers++
    l.mu.Unlock()
}

func (l *RWLock) RUnlock() {
    l.mu.Lock()
    l.readers--
    if l.readers == 0 {
        l.cond.Broadcast()  // 唤醒写者
    }
    l.mu.Unlock()
}

func (l *RWLock) Lock() {
    l.mu.Lock()
    for l.writer || l.readers > 0 {
        l.cond.Wait()  // 有读者或写者，等待
    }
    l.writer = true
    l.mu.Unlock()
}

func (l *RWLock) Unlock() {
    l.mu.Lock()
    l.writer = false
    l.cond.Broadcast()  // 唤醒所有等待者
    l.mu.Unlock()
}
```

---

### Q18: sync.Once 的实现原理？

**答案：**

```go
type Once struct {
    done uint32
    m    Mutex
}

func (o *Once) Do(f func()) {
    // 快速路径：已执行过
    if atomic.LoadUint32(&o.done) == 1 {
        return
    }
    
    // 慢速路径：加锁执行
    o.m.Lock()
    defer o.m.Unlock()
    if o.done == 0 {
        defer atomic.StoreUint32(&o.done, 1)
        f()
    }
}
```

**为什么用 done 在前？**
- 热路径优化：大多数情况下直接返回
- 只有第一次需要加锁
