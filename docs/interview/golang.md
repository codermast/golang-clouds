---
order: 1
icon: logos:go
---

# Golang 面试题

Go 语言面试高频考点，覆盖基础语法、数据结构、并发编程、内存管理、GC、调度器等核心知识。

---

## 一、基础语法

### Q1: Go 有哪些基本数据类型？

| 分类 | 类型 |
| :--- | :--- |
| 布尔 | `bool` |
| 整型 | `int`, `int8`, `int16`, `int32`, `int64` |
| 无符号 | `uint`, `uint8`, `uint16`, `uint32`, `uint64`, `uintptr` |
| 浮点 | `float32`, `float64` |
| 复数 | `complex64`, `complex128` |
| 字符串 | `string` |
| 字符 | `byte` (uint8), `rune` (int32) |

> **注意**：`int` 的大小取决于操作系统（32位系统是int32，64位是int64）。

---

### Q2: Go中new和make的区别

| 特性 | new | make |
| :--- | :--- | :--- |
| 返回类型 | 返回指针 `*T` | 返回值 `T` |
| 初始化 | 零值 | 初始化内部结构 |
| 适用类型 | 所有类型 | slice、map、channel |

```go
// new - 分配内存，返回指针，零值初始化
p := new(int)       // *int，值为 0
s := new([]int)     // *[]int，值为 nil

// make - 分配并初始化内部结构
slice := make([]int, 0, 10)     // []int，已初始化
m := make(map[string]int)       // map，已初始化
ch := make(chan int, 5)         // chan，已初始化
```

---

### Q3: Go的defer原理是什么

**defer 特点：**
1. **延迟执行**：函数返回前执行
2. **LIFO 顺序**：后进先出（栈结构）
3. **参数预计算**：声明时求值，非执行时

**底层实现：**

```go
type _defer struct {
    siz     int32    // 参数大小
    started bool
    sp      uintptr  // 栈指针
    pc      uintptr  // 程序计数器
    fn      *funcval // 延迟函数
    link    *_defer  // 链表指针
}
```

**执行时机：**
1. 函数 return 值赋给返回变量
2. 执行 defer 函数（LIFO）
3. 函数返回

**经典陷阱：**

```go
// 情况一：返回值是匿名变量
func f1() int {
    x := 5
    defer func() { x++ }()
    return x  // 返回 5（x 的副本）
}

// 情况二：返回值是命名变量
func f2() (x int) {
    defer func() { x++ }()
    return 5  // 返回 6（defer 修改了命名返回值）
}
```

---

### Q4: Go的select可以用于什么

**用途：**
1. 多路 Channel 复用
2. 超时控制
3. 非阻塞操作

```go
select {
case msg := <-ch1:
    // 处理 ch1
case ch2 <- x:
    // 发送到 ch2
case <-time.After(time.Second):
    // 超时处理
default:
    // 非阻塞（所有 case 不满足时执行）
}
```

**特点：**
- 随机选择就绪的 case（避免饥饿）
- 没有 default 时会阻塞
- case 必须是 Channel 操作

---

### Q5: Go值接收者和指针接收者的区别

| 特性 | 值接收者 | 指针接收者 |
| :--- | :--- | :--- |
| 调用时 | 复制整个值 | 只复制指针 |
| 修改原值 | 不可以 | 可以 |
| nil 接收者 | 无法调用（panic） | 可以调用 |
| 接口实现 | T 和 *T 都实现 | 只有 *T 实现 |

**选择建议：**
- 需要修改接收者 → 指针接收者
- 大结构体 → 指针接收者（避免复制开销）
- 一致性 → 同一类型保持统一风格

---

### Q6: Go的Struct能不能比较

**能否比较取决于字段类型：**

| 可比较类型 | 不可比较类型 |
| :--- | :--- |
| 基本类型（int、string、bool） | slice |
| 指针 | map |
| 数组（元素可比较） | function |
| 接口（动态类型和值都可比较） | 包含不可比较字段的结构体 |

```go
type Person struct {
    Name string
    Age  int
}
p1 := Person{"Tom", 18}
p2 := Person{"Tom", 18}
fmt.Println(p1 == p2)  // true ✅

type Data struct {
    Values []int  // 包含 slice
}
// d1 == d2  // 编译错误！❌
```

**深度比较：** 使用 `reflect.DeepEqual()`

---

### Q7: Go函数返回局部变量的指针是否安全

**安全！Go 的逃逸分析会处理。**

```go
func createUser() *User {
    u := User{Name: "Tom"}  // 逃逸到堆
    return &u               // 安全返回
}
```

**原理：**
- 编译器进行逃逸分析
- 需要逃逸的变量分配在堆上
- 堆上的变量由 GC 管理

---

### Q8: Go中两个Nil可能不相等吗

**可能！接口类型的 nil 判断有陷阱。**

```go
var p *int = nil
var i interface{} = p
fmt.Println(i == nil)  // false! ❌
```

**原因：** 接口由 `(type, value)` 组成，只有两者都为 nil 才等于 nil。

```go
type eface struct {
    _type *_type         // 类型：*int（非 nil）
    data  unsafe.Pointer // 值：nil
}
```

---

## 二、数据结构

### Q9: string 底层结构是什么？

```go
type stringStruct struct {
    str unsafe.Pointer  // 指向底层字节数组
    len int             // 字符串长度（字节数）
}
```

**特点：**
- string 是**不可变**的
- `len(s)` 返回字节数，不是字符数
- 使用 `utf8.RuneCountInString(s)` 获取字符数

**字符串拼接性能对比：**

| 方式 | 性能 | 场景 |
| :--- | :--- | :--- |
| `+` | 低 | 少量拼接 |
| `fmt.Sprintf` | 低 | 格式化 |
| `strings.Builder` | 高 | 大量拼接（推荐） |
| `bytes.Buffer` | 高 | 需要字节操作 |

---

### Q10: slice 底层结构和扩容机制

**底层结构：**

```go
type slice struct {
    array unsafe.Pointer  // 指向底层数组
    len   int             // 当前长度
    cap   int             // 容量
}
```

**扩容规则（Go 1.18+）：**

```go
if oldCap < 256 {
    newCap = oldCap * 2  // 翻倍
} else {
    newCap = oldCap + (oldCap + 3*256) / 4  // 约 1.25 倍增长
}
```

**注意事项：**
- 预分配可避免扩容：`make([]int, 0, 100)`
- 扩容后底层数组可能变化，原切片不受影响

---

### Q11: Go中对nil的Slice和空Slice的处理是一致的吗

**不完全一致。**

```go
var nilSlice []int          // nil slice: nil, len=0, cap=0
emptySlice := []int{}       // 空 slice: 非 nil, len=0, cap=0
emptySlice2 := make([]int, 0) // 空 slice: 非 nil, len=0, cap=0
```

| 操作 | nil Slice | 空 Slice |
| :--- | :--- | :--- |
| `len()` | 0 | 0 |
| `cap()` | 0 | 0 |
| `append()` | 正常 | 正常 |
| `== nil` | **true** | **false** |
| JSON 序列化 | `null` | `[]` |

---

### Q12: slice 作为参数传递会发生什么

slice 是**值传递**，但传递的是 header（ptr, len, cap），底层数组共享。

```go
func modify(s []int) {
    s[0] = 100       // ✅ 会修改原切片
    s = append(s, 4) // ❌ 不会影响原切片的 len
}
```

如果要修改原切片的长度，需要传指针 `*[]int`。

---

### Q13: map 的底层实现

**底层结构：**

```go
type hmap struct {
    count     int            // 元素个数
    B         uint8          // bucket 数量 = 2^B
    hash0     uint32         // 哈希种子（随机化）
    buckets   unsafe.Pointer // bucket 数组
    oldbuckets unsafe.Pointer // 扩容时的旧 bucket
}
```

**bucket 结构：**
- 每个 bucket 存 8 个 key-value
- 高 8 位哈希用于快速比较（tophash）
- 溢出 bucket 用链表处理

**扩容条件：**
1. 负载因子 > 6.5（翻倍扩容）
2. overflow bucket 过多（等量扩容，整理碎片）

---

### Q14: map 为什么是无序的

1. **哈希分布**：key 按哈希值分布，不是按插入顺序
2. **扩容迁移**：扩容时数据会重新分布到新 bucket
3. **故意随机化**：Go 在遍历时故意加入随机起始位置

---

### Q15: 并发读写 map 会怎样

会 **panic**！map 不是并发安全的。

**解决方案：**

| 方案 | 适用场景 |
| :--- | :--- |
| `sync.Mutex` | 通用场景 |
| `sync.RWMutex` | 读多写少 |
| `sync.Map` | 读多写少，key 稳定 |

```go
var m sync.Map
m.Store(key, value)
value, ok := m.Load(key)
m.Range(func(k, v interface{}) bool { ... })
```

---

### Q16: Go中的map如何实现顺序读取

**map 本身无序，需要额外处理：**

```go
// 方法：收集 key 排序
keys := make([]string, 0, len(m))
for k := range m {
    keys = append(keys, k)
}
sort.Strings(keys)
for _, k := range keys {
    fmt.Println(k, m[k])
}
```

---

### Q17: interface 的底层结构

**空接口 `interface{}`（eface）：**

```go
type eface struct {
    _type *_type         // 类型信息
    data  unsafe.Pointer // 数据指针
}
```

**非空接口（iface）：**

```go
type iface struct {
    tab  *itab           // 类型和方法表
    data unsafe.Pointer  // 数据指针
}
```

---

## 三、并发编程

### Q18: 协程、线程、进程的区别

| 特性 | 进程 | 线程 | 协程(Goroutine) |
| :--- | :--- | :--- | :--- |
| 定义 | 资源分配单位 | CPU 调度单位 | 用户态轻量级线程 |
| 内存 | 独立地址空间 | 共享进程内存 | 共享线程内存 |
| 创建开销 | 很大 | 较大(~1MB) | 很小(~2KB) |
| 切换开销 | 很大 | 较大(~1μs) | 很小(~200ns) |
| 调度 | 操作系统 | 操作系统 | Go runtime(用户态) |
| 数量级 | 数百 | 数千 | 数百万 |

---

### Q19: Goroutine和线程的区别

| 特性 | Goroutine | OS Thread |
| :--- | :--- | :--- |
| 内存占用 | 初始 2KB，可动态增长 | 固定 1-8MB |
| 创建销毁 | 用户态，开销小 | 内核态，开销大 |
| 切换成本 | ~200ns | ~1-2μs |
| 调度 | Go runtime（用户态） | 操作系统（内核态） |
| 数量 | 可创建百万级 | 通常数千个 |
| 栈 | 动态伸缩（2KB-1GB） | 固定大小 |

---

### Q20: Goroutine和Channel的作用分别是什么

**Goroutine：**
- 轻量级并发执行单元
- 由 Go runtime 调度
- 初始内存仅 2KB

**Channel：**
- Goroutine 间的通信机制
- 实现数据同步和传递
- 保证并发安全

**协作关系：**
> "Don't communicate by sharing memory; share memory by communicating."

---

### Q21: 什么是channel，为什么它可以做到线程安全

**Channel 是 Go 中的通信机制**，用于 goroutine 间传递数据。

**底层结构：**

```go
type hchan struct {
    qcount   uint           // 当前元素数量
    dataqsiz uint           // 缓冲区大小
    buf      unsafe.Pointer // 环形队列指针
    lock     mutex          // 互斥锁（关键！）
    sendq    waitq          // 发送等待队列
    recvq    waitq          // 接收等待队列
}
```

**线程安全原因：**
1. **内置互斥锁**：所有操作都在锁保护下进行
2. **等待队列**：发送/接收者会被安全地加入等待队列
3. **原子操作**：关键状态使用原子操作更新

---

### Q22: 无缓冲Chan的发送和接收是否同步

**是同步的。** 无缓冲 Channel 发送和接收操作必须同时准备好才能完成。

```go
ch := make(chan int)  // 无缓冲

go func() {
    ch <- 42  // 阻塞直到有接收者
}()

val := <-ch  // 阻塞直到有发送者
```

---

### Q23: Channel是同步的还是异步的

**取决于是否有缓冲：**

| 类型 | 创建方式 | 同步性 |
| :--- | :--- | :--- |
| 无缓冲 | `make(chan T)` | 同步 |
| 有缓冲 | `make(chan T, n)` | 异步（缓冲区未满时） |

---

### Q24: Channel 操作的各种情况

| 操作 | nil channel | 已关闭 channel | 正常 channel |
| :--- | :--- | :--- | :--- |
| 发送 | 永久阻塞 | **panic** | 阻塞或成功 |
| 接收 | 永久阻塞 | 返回零值，ok=false | 阻塞或成功 |
| 关闭 | **panic** | **panic** | 成功 |

---

### Q25: Golang并发机制以及CSP并发模型

**CSP（Communicating Sequential Processes）模型核心思想：**

> "不要通过共享内存来通信，而要通过通信来共享内存"

**Go 的并发机制：**
1. **Goroutine**：轻量级线程，由 Go runtime 调度
2. **Channel**：goroutine 间的通信管道
3. **Select**：多路复用机制

| 传统模型 | CSP 模型 |
| :--- | :--- |
| 共享内存 + 锁 | 通过 Channel 通信 |
| 容易死锁 | 更安全的并发模式 |

---

### Q26: Golang中除了加Mutex锁以外还有哪些方式安全读写共享变量

| 方式 | 适用场景 | 说明 |
| :--- | :--- | :--- |
| `sync.RWMutex` | 读多写少 | 读锁共享，写锁排他 |
| `sync.Map` | 并发 map | 内置并发安全的 map |
| `atomic` 包 | 简单类型 | 原子操作，无锁高性能 |
| `channel` | 数据传递 | CSP 模型，通过通信共享内存 |

---

### Q27: Go中的锁有哪些

| 锁类型 | 说明 | 使用场景 |
| :--- | :--- | :--- |
| `sync.Mutex` | 互斥锁 | 保护临界区 |
| `sync.RWMutex` | 读写锁 | 读多写少 |
| `sync.Once` | 单次执行 | 单例初始化 |
| `sync.Cond` | 条件变量 | 等待条件满足 |
| `sync.Map` | 并发安全 map | 并发 map 操作 |
| `atomic` | 原子操作 | 简单类型原子操作 |

---

### Q28: Go中的锁如何实现

**sync.Mutex 实现原理：**

```go
type Mutex struct {
    state int32   // 锁状态（locked、woken、starving、waiter count）
    sema  uint32  // 信号量
}
```

**两种模式：**

1. **正常模式**：自旋尝试获取锁 → 失败后加入等待队列 → FIFO 唤醒
2. **饥饿模式**：等待超过 1ms 切换 → 直接把锁交给等待者 → 防止尾部延迟

---

### Q29: Go中CAS是怎么回事

**CAS（Compare And Swap）是原子操作：**

```go
// 如果 addr 的值等于 old，则替换为 new
func CompareAndSwapInt64(addr *int64, old, new int64) bool
```

```go
var counter int64

// CAS 自旋
for {
    old := atomic.LoadInt64(&counter)
    if atomic.CompareAndSwapInt64(&counter, old, old+1) {
        break
    }
}
```

**特点：** 无锁并发、硬件级别原子性、适用于简单类型

---

### Q30: Go中数据竞争问题怎么解决

**检测工具：**

```bash
go run -race main.go    # 运行时检测
go test -race ./...     # 测试时检测
```

**解决方案：** Mutex、RWMutex、Atomic、Channel、sync.Once

---

### Q31: Golang中常用的并发模型

**1. Worker Pool（工作池）**

```go
jobs := make(chan int, 100)
for w := 0; w < 10; w++ {
    go worker(jobs)  // 固定 worker 数量
}
```

**2. Pipeline（管道）**

```go
func gen() <-chan int { ... }
func sq(in <-chan int) <-chan int { ... }
```

**3. Fan-out/Fan-in**
- Fan-out：多个 goroutine 读取同一个 channel
- Fan-in：多个 channel 合并到一个

**4. Semaphore（信号量）**

```go
sem := make(chan struct{}, 10)  // 最多 10 个并发
```

---

### Q32: 怎么限制Goroutine的数量

**方法一：带缓冲 Channel（信号量）**

```go
sem := make(chan struct{}, 10)  // 最多 10 个

for i := 0; i < 100; i++ {
    sem <- struct{}{}  // 获取
    go func() {
        defer func() { <-sem }()  // 释放
        // work...
    }()
}
```

**方法二：Worker Pool**（见上题）

**方法三：第三方库**
- `golang.org/x/sync/semaphore`
- `ants`（高性能协程池）

---

### Q33: 怎么查看Goroutine的数量

```go
// 方法一：runtime
fmt.Println(runtime.NumGoroutine())

// 方法二：pprof
import _ "net/http/pprof"
go http.ListenAndServe(":6060", nil)
// 访问 http://localhost:6060/debug/pprof/goroutine
```

---

### Q34: Go主协程如何等其余协程完再操作

**方法一：sync.WaitGroup（推荐）**

```go
var wg sync.WaitGroup
for i := 0; i < 10; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        // work...
    }()
}
wg.Wait()  // 等待所有完成
```

**方法二：Channel**

**方法三：errgroup**

```go
g, ctx := errgroup.WithContext(ctx)
g.Go(func() error { ... })
err := g.Wait()
```

---

### Q35: Go的Context包的用途是什么

**主要用途：**
1. **取消信号传递**
2. **超时控制**
3. **请求范围值传递**
4. **跨 goroutine 控制**

```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

select {
case <-ctx.Done():
    return ctx.Err()
case result := <-doWork(ctx):
    return result
}
```

---

### Q36: 如何在goroutine执行一半就退出协程

**方法一：context 取消（推荐）**

```go
ctx, cancel := context.WithCancel(context.Background())
go func(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return  // 退出
        default:
            // 工作...
        }
    }
}(ctx)
cancel()  // 发送取消信号
```

**方法二：Channel 信号**

**方法三：runtime.Goexit()**

```go
runtime.Goexit()  // 立即终止当前 goroutine
```

---

### Q37: Goroutine发生了泄漏如何检测

**常见泄漏原因：**
- 阻塞在 channel 上无法退出
- 无限循环没有退出条件
- 忘记关闭 channel

**检测方法：**

```go
// 1. runtime
fmt.Println(runtime.NumGoroutine())

// 2. pprof
go tool pprof http://localhost:6060/debug/pprof/goroutine

// 3. goleak（测试用）
func TestNoLeak(t *testing.T) {
    defer goleak.VerifyNone(t)
    // test code
}
```

---

### Q38: 在Go函数中为什么会发生内存泄露

**常见内存泄露场景：**

1. **Goroutine 泄露**：阻塞在 channel 上无法退出
2. **未关闭的资源**：文件句柄、网络连接、HTTP Body
3. **缓存未清理**：全局 map 无限增长
4. **time.Ticker 未停止**

```go
ticker := time.NewTicker(time.Second)
defer ticker.Stop()  // 必须停止！
```

---

## 四、GMP 调度器

### Q39: Go的GPM如何调度

**GMP 组件：**

| 组件 | 全称 | 说明 |
| :--- | :--- | :--- |
| G | Goroutine | 协程 |
| M | Machine | 操作系统线程 |
| P | Processor | 逻辑处理器，连接 G 和 M |

**调度流程：**
1. 优先从 P 的本地队列获取 G
2. 本地队列空则从全局队列批量获取
3. 全局队列空则从其他 P 偷取（Work Stealing）
4. 都没有则 M 休眠

**抢占式调度（Go 1.14+）：**
- 基于信号的异步抢占
- 即使没有函数调用也能被抢占

---

### Q40: 为何GPM调度要有P

**P 的存在解决以下问题：**

1. **本地队列**：减少全局锁竞争
2. **mcache 缓存**：每个 P 有独立的内存缓存
3. **控制并发度**：GOMAXPROCS 控制 P 数量
4. **Work Stealing**：P 可以互相偷任务

---

### Q41: Goroutine和KernelThread之间是什么关系

**多对多（M:N）关系：**

- 多个 G 运行在少数 M 上
- P 作为中介连接 G 和 M
- 充分利用多核，避免频繁上下文切换

---

### Q42: G0的作用

**G0 是每个 M（线程）的特殊 goroutine：**

**作用：**
1. 运行调度器代码
2. 执行 cgo、syscall
3. goroutine 栈扩缩容
4. 执行 GC 标记等

**特点：** 每个 M 都有一个 G0，使用系统栈（约 8KB）

---

## 五、内存管理

### Q43: Go语言的栈空间管理是怎么样的

**动态栈机制：**
- 初始栈大小：2KB
- 最大栈大小：1GB（64位系统）
- 动态增长策略

**栈扩容过程：**
1. 检测到栈不足
2. 分配新栈（2 倍大小）
3. 复制旧栈内容
4. 调整栈上指针
5. 释放旧栈

**栈收缩：** GC 时检查，使用率 < 1/4 时收缩

---

### Q44: Go的对象在内存中是怎样分配的

**Go 使用 TCMalloc 多级缓存：**

```
mcache（每个 P 一个，无锁）
    ↓
mcentral（每个 size class 一个，有锁）
    ↓
mheap（全局唯一，管理所有内存）
```

| 对象大小 | 分配方式 |
| :--- | :--- |
| < 16B（tiny） | Tiny Allocator |
| 16B ~ 32KB | mcache → mcentral |
| > 32KB | 直接从 mheap 分配 |

---

### Q45: Go中的逃逸分析是什么

**逃逸分析决定变量分配在栈还是堆。**

**查看逃逸分析：**

```bash
go build -gcflags="-m" main.go
```

**常见逃逸场景：**
1. 返回局部变量指针
2. 闭包引用
3. interface{} 参数
4. 动态大小分配 `make([]int, n)`
5. 切片扩容

```go
func escape() *int {
    x := 42
    return &x  // x 逃逸到堆
}
```

---

### Q46: Golang的内存模型中为什么小对象多了会造成GC压力

**原因分析：**
1. **扫描开销**：GC 需要扫描所有对象
2. **内存碎片**：小对象分散分布
3. **分配压力**：频繁分配增加 mcache/mcentral 压力
4. **三色标记**：每个对象都需要标记

**优化策略：** sync.Pool 复用、预分配、减少逃逸、合并小对象

---

## 六、垃圾回收

### Q47: Golang垃圾回收算法

**三色标记 + 混合写屏障**

**三色标记：**
- **白色**：未扫描，可能是垃圾
- **灰色**：已扫描，引用未扫描
- **黑色**：已扫描完成

**算法流程：**
1. STW → 开启写屏障
2. 并发标记（三色标记）
3. STW → 关闭写屏障
4. 并发清除

**混合写屏障（Go 1.8+）：** 插入屏障 + 删除屏障，无需栈重新扫描

---

### Q48: GC的触发条件

| 触发条件 | 说明 |
| :--- | :--- |
| 堆内存增长 | 达到 GOGC 阈值（默认 100%，即翻倍） |
| 定时触发 | 超过 2 分钟没有 GC |
| 手动触发 | `runtime.GC()` |
| 内存限制 | GOMEMLIMIT（Go 1.19+） |

```bash
GOGC=100   # 默认值，堆内存增长 100% 触发 GC
GOGC=200   # 降低 GC 频率
GOGC=off   # 关闭 GC（不推荐）
```

---

### Q49: GC 过程中的 STW

**两次短暂的 STW：**

```
Mark Setup (STW 1)    ~10-30μs   开启写屏障
Concurrent Mark                   后台标记
Mark Termination (STW 2) ~60-90μs 关闭写屏障
Concurrent Sweep                  清理
```

总 STW 时间通常 < 1ms。

---

### Q50: 如何优化 GC

1. **调整 GOGC**：`GOGC=200` 减少 GC 频率
2. **使用 GOMEMLIMIT**（Go 1.19+）
3. **复用对象**：`sync.Pool`
4. **预分配切片**
5. **减少逃逸**

---

## 七、标准库与实战

### Q51: Go中的http包的实现原理

**核心组件：**

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}

type ServeMux struct {
    mu    sync.RWMutex
    m     map[string]muxEntry
}
```

**工作流程：**
1. ListenAndServe 监听端口
2. Accept 接受连接
3. 为每个连接启动 goroutine
4. 解析 HTTP 请求
5. 路由匹配 → 调用 Handler
6. 写入响应

---

### Q52: sync.Pool 的作用和原理

**作用：** 对象复用，减少 GC 压力

```go
var pool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

buf := pool.Get().(*bytes.Buffer)
buf.Reset()
// 使用 buf...
pool.Put(buf)
```

**注意：** Pool 中的对象可能在任意时刻被 GC 回收

---

### Q53: sync.Once 的实现原理

```go
type Once struct {
    done uint32
    m    Mutex
}

func (o *Once) Do(f func()) {
    if atomic.LoadUint32(&o.done) == 1 {
        return  // 快速路径
    }
    o.m.Lock()
    defer o.m.Unlock()
    if o.done == 0 {
        defer atomic.StoreUint32(&o.done, 1)
        f()
    }
}
```

---

### Q54: Go 中如何实现单例模式

```go
var (
    instance *Singleton
    once     sync.Once
)

func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{}
    })
    return instance
}
```

---

### Q55: pprof 性能分析怎么用

```go
import _ "net/http/pprof"

go http.ListenAndServe(":6060", nil)
```

```bash
# CPU 分析
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 内存分析
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine 分析
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 常用命令
top, list, web, svg
```

---

## 八、高频考点清单

### 必考

- [ ] slice 底层结构、扩容机制
- [ ] map 实现原理、并发安全
- [ ] interface 底层结构、nil 陷阱
- [ ] Goroutine vs 线程
- [ ] Channel 底层实现、操作表
- [ ] GMP 调度模型
- [ ] GC 三色标记、写屏障
- [ ] 逃逸分析

### 常考

- [ ] defer 执行顺序、命名返回值陷阱
- [ ] select 用法、随机选择
- [ ] sync.Mutex vs sync.RWMutex
- [ ] sync.Pool 原理
- [ ] context 使用场景
- [ ] pprof 性能分析

### 进阶

- [ ] Go 内存分配器（mcache/mcentral/mheap）
- [ ] GMP 中 P 的作用
- [ ] Work Stealing 算法
- [ ] 混合写屏障原理
- [ ] Goroutine 泄漏检测
