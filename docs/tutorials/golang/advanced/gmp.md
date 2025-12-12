---
order: 2
---

# Go - GMP 调度模型

GMP 是 Go 运行时调度器的核心模型，理解它对于编写高性能 Go 程序至关重要。

## GMP 概念

### G - Goroutine

```go
// G 代表 Goroutine，包含：
// - 栈信息（栈指针、栈大小）
// - 调度信息（状态、优先级）
// - 上下文信息（寄存器）

type g struct {
    stack       stack   // 栈内存范围 [stack.lo, stack.hi)
    stackguard0 uintptr // 栈溢出检查
    m           *m      // 当前关联的 M
    sched       gobuf   // 调度上下文（PC、SP 等）
    atomicstatus uint32 // G 的状态
    goid         int64  // G 的唯一标识
    // ...
}
```

**G 的状态：**

| 状态       | 说明                    |
| :--------- | :---------------------- |
| _Gidle     | 刚创建，未初始化        |
| _Grunnable | 可运行，在运行队列中    |
| _Grunning  | 正在运行                |
| _Gsyscall  | 在系统调用中            |
| _Gwaiting  | 等待中（channel、锁等） |
| _Gdead     | 已退出                  |

### M - Machine

```go
// M 代表操作系统线程
type m struct {
    g0      *g     // 调度栈，用于执行调度代码
    curg    *g     // 当前运行的 G
    p       puintptr // 关联的 P
    spinning bool  // 是否在自旋寻找工作
    // ...
}
```

**M 的特点：**
- M 是真正执行代码的实体
- M 必须关联一个 P 才能执行 G
- M 的数量默认最大 10000（可通过 `runtime.SetMaxThreads` 修改）

### P - Processor

```go
// P 代表逻辑处理器，是 G 和 M 之间的桥梁
type p struct {
    id          int32
    status      uint32 // P 的状态
    m           muintptr // 关联的 M
    runqhead    uint32   // 本地队列头
    runqtail    uint32   // 本地队列尾
    runq        [256]guintptr // 本地运行队列
    runnext     guintptr // 下一个要运行的 G
    // ...
}
```

**P 的作用：**
- 管理本地 G 队列（最多 256 个）
- 持有 mcache（内存分配缓存）
- P 的数量决定并行度，默认等于 CPU 核数

## GMP 调度流程

### 整体架构

```
              ┌───────────────────────────────────────┐
              │            全局队列 (Global Queue)     │
              │        ┌──┬──┬──┬──┬──┬──┬──┐        │
              │        │G │G │G │G │G │G │G │        │
              │        └──┴──┴──┴──┴──┴──┴──┘        │
              └───────────────────────────────────────┘
                              ↑  ↓
        ┌─────────────────────┼──┼─────────────────────┐
        │                     │  │                     │
   ┌────┴────┐           ┌────┴──┴───┐           ┌────┴────┐
   │    P    │           │     P     │           │    P    │
   │ ┌─────┐ │           │  ┌─────┐  │           │ ┌─────┐ │
   │ │runq │ │           │  │runq │  │           │ │runq │ │
   │ └─────┘ │           │  └─────┘  │           │ └─────┘ │
   └────┬────┘           └─────┬─────┘           └────┬────┘
        │                      │                      │
   ┌────┴────┐           ┌─────┴─────┐           ┌────┴────┐
   │    M    │           │     M     │           │    M    │
   │  (OS    │           │   (OS     │           │  (OS    │
   │ Thread) │           │  Thread)  │           │ Thread) │
   └─────────┘           └───────────┘           └─────────┘
```

### 调度循环

```go
// 调度循环伪代码
func schedule() {
    // 1. 从 runnext 获取 G
    gp := pp.runnext
    if gp != nil {
        pp.runnext = nil
        return gp
    }
    
    // 2. 从本地队列获取 G
    gp = runqget(pp)
    if gp != nil {
        return gp
    }
    
    // 3. 从全局队列获取 G
    gp = globrunqget(pp, 0)
    if gp != nil {
        return gp
    }
    
    // 4. 从其他 P 偷取 G
    gp = stealWork(pp)
    if gp != nil {
        return gp
    }
    
    // 5. 没有可运行的 G，休眠
    stopm()
}
```

### G 的创建

```go
// go func() 的底层实现
func newproc(fn *funcval) {
    // 1. 获取当前 G
    gp := getg()
    
    // 2. 获取调用者 PC
    pc := getcallerpc()
    
    // 3. 在系统栈上创建新 G
    systemstack(func() {
        newg := newproc1(fn, gp, pc)
        
        // 4. 将新 G 放入 P 的本地队列
        runqput(pp, newg, true)
        
        // 5. 如果有空闲的 P，唤醒一个 M
        if atomic.Load(&sched.npidle) != 0 {
            wakep()
        }
    })
}
```

## 调度时机

### 主动调度

```go
// 1. runtime.Gosched()
func example() {
    go func() {
        for i := 0; i < 10; i++ {
            fmt.Println(i)
            runtime.Gosched()  // 主动让出 CPU
        }
    }()
}

// 2. channel 操作
ch := make(chan int)
<-ch  // 阻塞，触发调度

// 3. 锁操作
var mu sync.Mutex
mu.Lock()  // 如果锁被持有，触发调度

// 4. time.Sleep
time.Sleep(time.Second)  // 触发调度
```

### 被动调度（抢占）

```go
// Go 1.14+ 基于信号的抢占
// 当 G 运行超过 10ms，会被抢占

func longLoop() {
    for {
        // 这个循环可以被抢占
        // 不再需要函数调用
    }
}
```

**抢占时机：**
- sysmon 后台监控线程每 10ms 检查一次
- 发现 G 运行超过 10ms，发送抢占信号
- G 收到信号后，在安全点暂停执行

### 系统调用

```go
// 系统调用导致的调度
func syscall() {
    // 1. 进入系统调用前
    //    - M 解绑 P
    //    - P 可以绑定其他 M
    
    // 2. 系统调用执行中
    //    - M 被阻塞
    //    - P 继续调度其他 G
    
    // 3. 系统调用返回后
    //    - M 尝试获取原来的 P
    //    - 如果 P 被占用，获取空闲 P
    //    - 如果没有空闲 P，将 G 放入全局队列
}
```

## Work Stealing

当 P 的本地队列为空时，会从其他 P 偷取 G。

```go
func stealWork(pp *p) *g {
    // 随机选择一个 P
    for i := 0; i < 4; i++ {
        victim := allp[fastrand() % len(allp)]
        if victim == pp {
            continue
        }
        
        // 偷取一半的 G
        n := victim.runqlen() / 2
        if n > 0 {
            return runqsteal(pp, victim, n)
        }
    }
    
    return nil
}
```

**偷取策略：**
1. 先检查 victim 的 runnext
2. 从 victim 的本地队列偷取一半
3. 随机选择 victim，避免竞争

## sysmon 监控线程

sysmon 是一个特殊的 M，不需要 P 就能运行。

```go
func sysmon() {
    for {
        // 1. 检查死锁
        checkdead()
        
        // 2. 抢占长时间运行的 G
        retake(now)
        
        // 3. 触发 GC
        if gcTrigger {
            gcStart()
        }
        
        // 4. 归还长时间阻塞的 P
        // 5. 唤醒 netpoller
        
        // 休眠一段时间
        usleep(delay)
    }
}
```

## 调优建议

### 设置 GOMAXPROCS

```go
import "runtime"

func init() {
    // 设置 P 的数量
    // 默认等于 CPU 核数
    runtime.GOMAXPROCS(runtime.NumCPU())
}

// 也可以通过环境变量设置
// GOMAXPROCS=4 ./myapp
```

### 控制 Goroutine 数量

```go
// 使用 worker pool 限制并发数
func processWithLimit(tasks []Task, limit int) {
    sem := make(chan struct{}, limit)
    var wg sync.WaitGroup
    
    for _, task := range tasks {
        wg.Add(1)
        sem <- struct{}{}  // 获取信号量
        
        go func(t Task) {
            defer wg.Done()
            defer func() { <-sem }()  // 释放信号量
            
            process(t)
        }(task)
    }
    
    wg.Wait()
}
```

### 查看调度信息

```go
// 设置 GODEBUG 查看调度信息
// GODEBUG=schedtrace=1000 ./myapp

// 输出示例：
// SCHED 1000ms: gomaxprocs=4 idleprocs=2 threads=6 
//               spinningthreads=0 idlethreads=3 
//               runqueue=0 [2 3 1 0]

// 解释：
// gomaxprocs: P 的数量
// idleprocs: 空闲 P 数量
// threads: M 的数量
// runqueue: 全局队列长度
// [2 3 1 0]: 各 P 本地队列长度
```
