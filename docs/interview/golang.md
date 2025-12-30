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

### Q9: Go 的 error 处理机制

**error 是一个接口：**

```go
type error interface {
    Error() string
}
```

**错误处理方式：**

```go
// 1. 直接返回
if err != nil {
    return err
}

// 2. 包装错误（Go 1.13+）
if err != nil {
    return fmt.Errorf("读取配置失败: %w", err)
}

// 3. 错误判断
if errors.Is(err, os.ErrNotExist) {
    // 处理文件不存在
}

// 4. 类型断言
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    fmt.Println(pathErr.Path)
}
```

**errors.Is vs errors.As：**

| 函数 | 作用 | 场景 |
| :--- | :--- | :--- |
| `errors.Is` | 判断是否是特定错误值 | sentinel error |
| `errors.As` | 判断是否是特定错误类型 | 自定义 error 类型 |

---

### Q10: 如何自定义 error

```go
// 方法一：实现 error 接口
type MyError struct {
    Code    int
    Message string
}

func (e *MyError) Error() string {
    return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// 方法二：使用 errors.New
var ErrNotFound = errors.New("not found")

// 方法三：使用 fmt.Errorf
err := fmt.Errorf("user %d not found", userID)
```

---

### Q11: panic 和 recover 的使用

**panic：** 程序遇到无法恢复的错误时使用

```go
// 触发 panic
panic("something went wrong")

// 常见触发场景
arr[100]          // 数组越界
nil.Method()      // nil 指针调用方法
close(closedChan) // 重复关闭 channel
```

**recover：** 捕获 panic，必须在 defer 中使用

```go
func safeCall() {
    defer func() {
        if r := recover(); r != nil {
            log.Printf("Recovered: %v", r)
            // 打印堆栈
            debug.PrintStack()
        }
    }()
    
    // 可能 panic 的代码
    riskyOperation()
}
```

---

### Q12: panic 和 error 如何选择

| 场景 | 选择 | 原因 |
| :--- | :--- | :--- |
| 预期内的错误 | error | 调用方可处理 |
| 编程错误/bug | panic | 不应该发生 |
| 初始化失败 | panic | 程序无法继续 |
| 库函数 | error | 不应强制终止程序 |

**原则：**
- **优先用 error**：Go 推荐显式错误处理
- **panic 慎用**：只用于真正的异常情况
- **库代码不要 panic**：让调用方决定如何处理

---

### Q13: defer、panic、recover 的执行顺序

```go
func main() {
    defer fmt.Println("1")
    defer fmt.Println("2")
    
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered:", r)
        }
    }()
    
    defer fmt.Println("3")
    
    panic("error!")
    
    defer fmt.Println("4")  // 不会执行
}

// 输出：
// 3
// Recovered: error!
// 2
// 1
```

**执行流程：**
1. panic 发生后，停止正常执行
2. 按 LIFO 顺序执行 defer
3. 遇到 recover 则捕获 panic
4. recover 后续的 defer 继续执行

---

## 二、数据结构

### Q14: string 底层结构是什么？

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

### Q15: slice 底层结构和扩容机制

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

### Q16: Go中对nil的Slice和空Slice的处理是一致的吗

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

### Q17: slice 作为参数传递会发生什么

slice 是**值传递**，但传递的是 header（ptr, len, cap），底层数组共享。

```go
func modify(s []int) {
    s[0] = 100       // ✅ 会修改原切片
    s = append(s, 4) // ❌ 不会影响原切片的 len
}
```

如果要修改原切片的长度，需要传指针 `*[]int`。

---

### Q18: map 的底层实现

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

### Q19: map 为什么是无序的

1. **哈希分布**：key 按哈希值分布，不是按插入顺序
2. **扩容迁移**：扩容时数据会重新分布到新 bucket
3. **故意随机化**：Go 在遍历时故意加入随机起始位置

---

### Q20: map vs sync.Map 深度对比及增删改查实现细节

#### 1. 核心对比总结

| 特性 | map (配合 RWMutex) | sync.Map |
| :--- | :--- | :--- |
| **线程安全** | 不安全（需手动加锁） | 并发安全 |
| **锁颗粒度** | 整个 map（大锁），竞争激烈 | 读写分离，只有 dirty 部分加锁（细锁） |
| **性能场景** | **写操作多**、通用场景 | **读多写少**、Key 集合稳定、多核竞争 |
| **内存占用** | 较低 | 较高（维护 read 和 dirty 两个 map） |
| **零值可用** | `make` 后可用，nil map 写会 panic | 直接声明即可使用（开箱即用） |

#### 2. map 的增删改查实现 (hmap)

Go 标准 `map` 使用哈希表实现，采用 **链地址法** 解决冲突：

- **查 (Load)**：
    1. 计算 Key 的 Hash 值。
    2. 取 Hash 低位定位于哪个 Bucket（桶）。
    3. 遍历桶内的 8 个槽位，通过 **tophash**（Hash 高 8 位）快速过滤，再匹配 Key。
    4. 若桶满且未找到，继续查找 **overflow bucket**（溢出桶）。
- **增/改 (Store)**：定位到 Bucket 后，寻找空位或已存在的 Key。若负载因子 > 6.5 或溢出桶过多，触发 **渐进式扩容**。
- **删 (Delete)**：定位到槽位，将 Key/Value 清理，并重置 tophash。

#### 3. sync.Map 的增删改查实现 (read/dirty)

`sync.Map` 采用了 **读写分离** 和 **内存换时间** 的策略：

- **底层结构**：
    - `read`：原子访问（`atomic.Value`），包含只读数据，不加锁。
    - `dirty`：原生 map，包含全量数据，操作需加互斥锁。
    - `misses`：计数器，记录 read 未命中而查 dirty 的次数。

- **查 (Load)**：
    1. 先从 `read` 原子读取，命中则返回（极其高效）。
    2. 若未命中且 `amended=true`（说明 dirty 有 read 没有的数据），加锁访问 `dirty`。
    3. **Miss 升级**：若 misses 达到 `len(dirty)`，将 dirty 整体迁移给 read，清空 dirty，实现“冷数据变热”。
- **增 (Store)**：
    1. 若 Key 在 `read` 中且未被标记为 `expunged`，尝试 **CAS** 无锁更新。
    2. 若 CAS 失败（不在 read 或已被删），加锁处理：双检查（Double Check），写入或更新 `dirty`。
- **删 (Delete)**：
    1. 若 Key 在 `read` 中，直接将其 Value 标记为 `nil`（逻辑删除，无锁）。
    2. 若不在 `read` 且 `amended=true`，加锁物理删除 `dirty` 中的 Key。

#### 4. 为什么 sync.Map 适合读多写少？
因为在读多写少的场景下，绝大多数操作都能在 `read` map 中通过原子操作完成，完全避开了互斥锁，从而在大规模并发下性能远超 `RWMutex + map`。而在写多的场景下，频繁的 `dirty` 写入和 `miss` 迁移会导致性能陡降。

---

### Q21: Go中的map如何实现顺序读取

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

### Q22: interface 的底层结构

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

### Q23: 协程、线程、进程的区别

| 特性 | 进程 | 线程 | 协程(Goroutine) |
| :--- | :--- | :--- | :--- |
| 定义 | 资源分配单位 | CPU 调度单位 | 用户态轻量级线程 |
| 内存 | 独立地址空间 | 共享进程内存 | 共享线程内存 |
| 创建开销 | 很大 | 较大(~1MB) | 很小(~2KB) |
| 切换开销 | 很大 | 较大(~1μs) | 很小(~200ns) |
| 调度 | 操作系统 | 操作系统 | Go runtime(用户态) |
| 数量级 | 数百 | 数千 | 数百万 |

---

### Q24: Goroutine和线程的区别

| 特性 | Goroutine | OS Thread |
| :--- | :--- | :--- |
| 内存占用 | 初始 2KB，可动态增长 | 固定 1-8MB |
| 创建销毁 | 用户态，开销小 | 内核态，开销大 |
| 切换成本 | ~200ns | ~1-2μs |
| 调度 | Go runtime（用户态） | 操作系统（内核态） |
| 数量 | 可创建百万级 | 通常数千个 |
| 栈 | 动态伸缩（2KB-1GB） | 固定大小 |

---

### Q25: Goroutine和Channel的作用分别是什么

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

### Q26: 什么是channel，为什么它可以做到线程安全

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

### Q27: 无缓冲Chan的发送和接收是否同步

**是同步的。** 无缓冲 Channel 发送和接收操作必须同时准备好才能完成。

```go
ch := make(chan int)  // 无缓冲

go func() {
    ch <- 42  // 阻塞直到有接收者
}()

val := <-ch  // 阻塞直到有发送者
```

---

### Q28: Channel是同步的还是异步的

**取决于是否有缓冲：**

| 类型 | 创建方式 | 同步性 |
| :--- | :--- | :--- |
| 无缓冲 | `make(chan T)` | 同步 |
| 有缓冲 | `make(chan T, n)` | 异步（缓冲区未满时） |

---

### Q29: Channel 操作的各种情况

| 操作 | nil channel | 已关闭 channel | 正常 channel |
| :--- | :--- | :--- | :--- |
| 发送 | 永久阻塞 | **panic** | 阻塞或成功 |
| 接收 | 永久阻塞 | 返回零值，ok=false | 阻塞或成功 |
| 关闭 | **panic** | **panic** | 成功 |

---

### Q30: Golang并发机制以及CSP并发模型

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

### Q31: Golang中除了加Mutex锁以外还有哪些方式安全读写共享变量

| 方式 | 适用场景 | 说明 |
| :--- | :--- | :--- |
| `sync.RWMutex` | 读多写少 | 读锁共享，写锁排他 |
| `sync.Map` | 并发 map | 内置并发安全的 map |
| `atomic` 包 | 简单类型 | 原子操作，无锁高性能 |
| `channel` | 数据传递 | CSP 模型，通过通信共享内存 |

---

### Q32: Go中的锁有哪些

| 锁类型 | 说明 | 使用场景 |
| :--- | :--- | :--- |
| `sync.Mutex` | 互斥锁 | 保护临界区 |
| `sync.RWMutex` | 读写锁 | 读多写少 |
| `sync.Once` | 单次执行 | 单例初始化 |
| `sync.Cond` | 条件变量 | 等待条件满足 |
| `sync.Map` | 并发安全 map | 并发 map 操作 |
| `atomic` | 原子操作 | 简单类型原子操作 |

---

### Q33: Go中的锁如何实现

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

### Q34: Go中CAS是怎么回事

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

### Q35: Go中数据竞争问题怎么解决

**检测工具：**

```bash
go run -race main.go    # 运行时检测
go test -race ./...     # 测试时检测
```

**解决方案：** Mutex、RWMutex、Atomic、Channel、sync.Once

---

### Q36: Golang中常用的并发模型

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

### Q37: 怎么限制Goroutine的数量

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

### Q38: 怎么查看Goroutine的数量

```go
// 方法一：runtime
fmt.Println(runtime.NumGoroutine())

// 方法二：pprof
import _ "net/http/pprof"
go http.ListenAndServe(":6060", nil)
// 访问 http://localhost:6060/debug/pprof/goroutine
```

---

### Q39: Go主协程如何等其余协程完再操作

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

### Q40: Context 是什么？它的应用场景有哪些？

**Context 是什么：**
`Context` 是 Go 语言标准库中的一个接口，主要用于在 API 边界之间以及 goroutine 之间传递**截止日期（Deadlines）**、**取消信号（Cancellation signals）**以及**请求范围的值（Request-scoped values）**。

**核心原理：**
- **树状结构**：Context 形成一个树状继承体系。根节点通常是 `context.Background()` 或 `context.TODO()`。
- **取消信号传播**：当父 Context 被取消时，所有由它衍生出来的子 Context 也会被取消。
- **线程安全**：Context 是并发安全的，可以被传递给多个 goroutine。

**Go 标准库提供的四种衍生的 Context：**
| 函数 | 作用 | 场景 |
| :--- | :--- | :--- |
| `WithCancel` | 返回一个可手动取消的 Context | 任务完成后手动停止协程 |
| `WithDeadline` | 在指定的时间点自动取消 | 限时任务、截止时间 |
| `WithTimeout` | 在指定的持续时间后自动取消 | RPC 调用超时、数据库查询超时 |
| `WithValue` | 携带请求范围的键值对 | 传递 RequestID、TraceID、用户信息 |

**应用场景：**

1. **超时控制（最常用）**：
   在做网络请求或数据库查询时，防止调用方因为下游响应慢而导致资源一直被占用。
   ```go
   ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
   defer cancel()
   
   req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.example.com", nil)
   resp, err := http.DefaultClient.Do(req)
   ```

2. **取消信号的级联传递**：
   当一个主任务被取消或失败时，与之相关的所有子任务（在不同的 goroutine 中）都应该立即停止。
   ```go
   func main() {
       ctx, cancel := context.WithCancel(context.Background())
       go worker(ctx, "worker1")
       go worker(ctx, "worker2")
       time.Sleep(1 * time.Second)
       cancel() // 两个 worker 都会收到信号并退出
   }
   ```

3. **跨 API 边界传递数据**：
   在 Web 框架（如 Gin）的中间件中，常用来传递 TraceID、用户登录信息等。
   ```go
   // 传递数据
   ctx := context.WithValue(context.Background(), "TraceID", "abc-123")
   // 获取数据
   traceID := ctx.Value("TraceID").(string)
   ```

4. **防止 Goroutine 泄漏**：
   通过 Context 的 `Done()` 通道，确保 Goroutine 在任务不再需要时能及时退出。

**使用原则：**
- 不要将 Context 放入结构体中，而是显式作为函数的第一个参数传递（通常命名为 `ctx`）。
- 不要传递 `nil` 的 Context，如果不确定用什么，使用 `context.TODO()`。
- Context 仅用于传递请求范围的数据，不应用于传递函数的可选参数。

---

### Q41: 如何在goroutine执行一半就退出协程

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

### Q42: Goroutine发生了泄漏如何检测

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

### Q43: 在Go函数中为什么会发生内存泄露

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

### Q44: Go的GPM如何调度

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

### Q45: 为何GPM调度要有P

**P 的存在解决以下问题：**

1. **本地队列**：减少全局锁竞争
2. **mcache 缓存**：每个 P 有独立的内存缓存
3. **控制并发度**：GOMAXPROCS 控制 P 数量
4. **Work Stealing**：P 可以互相偷任务

---

### Q46: Goroutine和KernelThread之间是什么关系

**多对多（M:N）关系：**

- 多个 G 运行在少数 M 上
- P 作为中介连接 G 和 M
- 充分利用多核，避免频繁上下文切换

---

### Q47: G0的作用

**G0 是每个 M（线程）的特殊 goroutine：**

**作用：**
1. 运行调度器代码
2. 执行 cgo、syscall
3. goroutine 栈扩缩容
4. 执行 GC 标记等

**特点：** 每个 M 都有一个 G0，使用系统栈（约 8KB）

---

## 五、内存管理

### Q48: Go语言的栈空间管理是怎么样的

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

### Q49: Go的对象在内存中是怎样分配的

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

### Q50: Go中的逃逸分析是什么

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

### Q51: Golang的内存模型中为什么小对象多了会造成GC压力

**原因分析：**
1. **扫描开销**：GC 需要扫描所有对象
2. **内存碎片**：小对象分散分布
3. **分配压力**：频繁分配增加 mcache/mcentral 压力
4. **三色标记**：每个对象都需要标记

**优化策略：** sync.Pool 复用、预分配、减少逃逸、合并小对象

---

## 六、垃圾回收

### Q52: Golang垃圾回收算法

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

### Q53: GC的触发条件

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

### Q54: GC 过程中的 STW

**两次短暂的 STW：**

```
Mark Setup (STW 1)    ~10-30μs   开启写屏障
Concurrent Mark                   后台标记
Mark Termination (STW 2) ~60-90μs 关闭写屏障
Concurrent Sweep                  清理
```

总 STW 时间通常 < 1ms。

---

### Q55: 如何优化 GC

1. **调整 GOGC**：`GOGC=200` 减少 GC 频率
2. **使用 GOMEMLIMIT**（Go 1.19+）
3. **复用对象**：`sync.Pool`
4. **预分配切片**
5. **减少逃逸**

---

## 七、标准库与实战

### Q56: Go中的http包的实现原理

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

### Q57: sync.Pool 的作用和原理

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

### Q58: sync.Once 的实现原理

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

### Q59: Go 中如何实现单例模式

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

### Q60: pprof 性能分析怎么用

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

## 八、项目实战

### Q61: Gin 中间件的实现原理

**洋葱模型，基于责任链模式：**

```go
type Context struct {
    handlers HandlersChain  // []HandlerFunc
    index    int8           // 当前执行的 handler 索引
}

func (c *Context) Next() {
    c.index++
    for c.index < int8(len(c.handlers)) {
        c.handlers[c.index](c)
        c.index++
    }
}
```

**执行流程：**
```
请求 → Middleware1 → Middleware2 → Handler → Middleware2 → Middleware1 → 响应
```

---

### Q62: GORM 的 Hook 机制

```go
// 创建前
func (u *User) BeforeCreate(tx *gorm.DB) error {
    u.Password = hashPassword(u.Password)
    return nil
}

// 更新前
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    if tx.Statement.Changed("Password") {
        u.Password = hashPassword(u.Password)
    }
    return nil
}
```

**Hook 顺序：**
- 创建：BeforeSave → BeforeCreate → 插入 → AfterCreate → AfterSave
- 更新：BeforeSave → BeforeUpdate → 更新 → AfterUpdate → AfterSave

---

### Q63: 如何实现分布式锁

**Redis 分布式锁：**

```go
// 加锁
func TryLock(ctx context.Context, key, value string, ttl time.Duration) bool {
    ok, _ := rdb.SetNX(ctx, key, value, ttl).Result()
    return ok
}

// 解锁（Lua 保证原子性）
func Unlock(ctx context.Context, key, value string) bool {
    script := redis.NewScript(`
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        end
        return 0
    `)
    result, _ := script.Run(ctx, rdb, []string{key}, value).Int()
    return result == 1
}
```

---

### Q64: 缓存穿透、击穿、雪崩如何解决

| 问题 | 原因 | 解决方案 |
| :--- | :--- | :--- |
| 穿透 | 查询不存在的数据 | 布隆过滤器、缓存空值 |
| 击穿 | 热点 key 过期 | 互斥锁、永不过期 + 异步更新 |
| 雪崩 | 大量 key 同时过期 | 随机过期时间、多级缓存 |

---

### Q65: 如何实现服务熔断

```go
import "github.com/sony/gobreaker"

cb := gobreaker.NewCircuitBreaker(gobreaker.Settings{
    Name:        "my-service",
    MaxRequests: 3,
    Timeout:     30 * time.Second,
    ReadyToTrip: func(counts gobreaker.Counts) bool {
        failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
        return counts.Requests >= 3 && failureRatio >= 0.6
    },
})

result, err := cb.Execute(func() (interface{}, error) {
    return doRequest()
})
```

**熔断器状态：** Closed（正常）→ Open（熔断）→ Half-Open（测试）

---

### Q66: gRPC 和 HTTP 的区别

| 特性 | gRPC | HTTP/REST |
| :--- | :--- | :--- |
| 协议 | HTTP/2 | HTTP/1.1 |
| 序列化 | Protobuf（二进制） | JSON（文本） |
| 性能 | 高 | 较低 |
| 流式传输 | 原生支持 | 需 WebSocket |
| 浏览器 | 需 grpc-web | 原生支持 |

**选择：** 内部服务用 gRPC，对外 API 用 REST

---

### Q67: 如何保证消息不丢失

**三个环节：**
1. **生产者确认**：等待 broker ACK
2. **MQ 持久化**：消息落盘
3. **消费者确认**：手动 ACK

**幂等性处理：**

```go
func processOrder(orderID string) error {
    if processed, _ := redis.Get("processed:" + orderID); processed != "" {
        return nil  // 已处理
    }
    
    if err := doProcess(orderID); err != nil {
        return err
    }
    
    redis.Set("processed:"+orderID, "1", 24*time.Hour)
    return nil
}
```

---

## 九、Gin 框架深入

### Q68: Gin 和 net/http 的关系

**Gin 是基于 net/http 的封装：**

```go
// Gin 的 Engine 实现了 http.Handler 接口
type Engine struct {
    // ...
}

func (engine *Engine) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    // 处理请求
}

// 可以作为 http.Handler 使用
http.ListenAndServe(":8080", engine)
```

**Gin 在 net/http 基础上增加了：**
- 高性能路由（基数树）
- 中间件机制
- 参数绑定
- 错误处理

---

### Q69: Gin 中间件原理和执行顺序

**洋葱模型：**

```
请求 → M1(前) → M2(前) → M3(前) → Handler
响应 ← M1(后) ← M2(后) ← M3(后) ←┘
```

**执行流程：**

```go
func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        
        c.Next()  // 执行后续处理
        
        latency := time.Since(start)
        log.Printf("耗时: %v", latency)
    }
}
```

**关键方法：**
- `c.Next()`：执行后续 handler
- `c.Abort()`：终止后续执行
- `c.AbortWithStatus()`：终止并返回状态码

---

### Q70: 如何实现一个鉴权中间件

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        
        // 1. 检查 Token 是否存在
        if token == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "未授权"})
            return
        }
        
        // 2. 验证 Token
        claims, err := jwt.ParseToken(token)
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{"error": "Token 无效"})
            return
        }
        
        // 3. 将用户信息存入 Context
        c.Set("userID", claims.UserID)
        c.Set("role", claims.Role)
        
        c.Next()
    }
}
```

---

### Q71: Gin 如何处理 panic

**内置 Recovery 中间件：**

```go
r := gin.Default()  // 包含 Logger 和 Recovery

// 手动添加
r.Use(gin.Recovery())

// 自定义 Recovery
r.Use(gin.CustomRecovery(func(c *gin.Context, err interface{}) {
    // 记录日志
    log.Printf("Panic: %v", err)
    
    // 返回错误响应
    c.AbortWithStatusJSON(500, gin.H{
        "error": "服务器内部错误",
    })
}))
```

---

### Q72: HTTP 请求的生命周期

```
1. 请求进入 → net/http 接收
2. Engine.ServeHTTP() → 从连接池获取 Context
3. 路由匹配 → 基数树查找
4. 执行中间件链 → handlers[0:n]
5. 参数绑定 → Query/JSON/Form
6. 业务处理 → Controller
7. 响应写入 → c.JSON() / c.String()
8. Context 回收 → 放回连接池
```

---

### Q73: Gin 参数校验

```go
type CreateUserReq struct {
    Username string `json:"username" binding:"required,min=3,max=20"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"gte=18,lte=100"`
    Password string `json:"password" binding:"required,min=6"`
}

func CreateUser(c *gin.Context) {
    var req CreateUserReq
    
    if err := c.ShouldBindJSON(&req); err != nil {
        // 自定义错误处理
        c.JSON(400, gin.H{
            "error": translateError(err),
        })
        return
    }
    
    // 业务逻辑...
}
```

---

## 十、系统设计与架构

### Q74: 如何设计一个高并发系统

**核心策略：**

| 策略 | 说明 |
| :--- | :--- |
| **缓存** | 多级缓存（本地 + Redis） |
| **异步** | 消息队列解耦 |
| **限流** | 保护系统不被打垮 |
| **分库分表** | 数据库水平扩展 |
| **读写分离** | 主写从读 |
| **负载均衡** | 多实例分担压力 |

---

### Q75: 限流算法有哪些

| 算法 | 特点 | 适用场景 |
| :--- | :--- | :--- |
| **计数器** | 简单，有临界问题 | 简单限流 |
| **滑动窗口** | 解决临界问题 | 精确限流 |
| **令牌桶** | 允许突发流量 | API 限流 |
| **漏桶** | 平滑流量 | 流量整形 |

**令牌桶实现：**

```go
import "golang.org/x/time/rate"

limiter := rate.NewLimiter(100, 10)  // 每秒 100 个，突发 10 个

if !limiter.Allow() {
    c.JSON(429, gin.H{"error": "请求过于频繁"})
    return
}
```

---

### Q76: 如何实现服务降级

**降级策略：**

```go
func GetUserInfo(userID string) (*User, error) {
    // 1. 尝试从缓存获取
    if user, err := cache.Get(userID); err == nil {
        return user, nil
    }
    
    // 2. 熔断器检查
    if circuitBreaker.IsOpen() {
        // 降级：返回默认数据
        return getDefaultUser(userID), nil
    }
    
    // 3. 调用服务
    user, err := userService.Get(userID)
    if err != nil {
        circuitBreaker.RecordFailure()
        // 降级：返回缓存的旧数据
        return cache.GetStale(userID), nil
    }
    
    return user, nil
}
```

---

### Q77: 什么是高可用，如何实现

**高可用 = 系统持续提供服务的能力**

| 层面 | 方案 |
| :--- | :--- |
| **应用层** | 多实例部署、无状态服务 |
| **网络层** | 负载均衡、多机房 |
| **数据层** | 主从复制、读写分离 |
| **容灾** | 故障转移、熔断降级 |

**健康检查：**

```go
func healthCheck(c *gin.Context) {
    // 检查依赖服务
    if err := db.Ping(); err != nil {
        c.JSON(503, gin.H{"status": "unhealthy"})
        return
    }
    if err := redis.Ping(); err != nil {
        c.JSON(503, gin.H{"status": "unhealthy"})
        return
    }
    c.JSON(200, gin.H{"status": "healthy"})
}
```

---

## 十一、性能调优

### Q78: pprof 怎么用

**启用 pprof：**

```go
import _ "net/http/pprof"

go func() {
    http.ListenAndServe(":6060", nil)
}()
```

**常用分析：**

```bash
# CPU 分析
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 内存分析
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine 分析
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 阻塞分析
go tool pprof http://localhost:6060/debug/pprof/block

# 常用命令
(pprof) top         # 热点函数
(pprof) list func   # 查看函数代码
(pprof) web         # 生成图形
```

---

### Q79: CPU 飙高如何排查

```bash
# 1. 找到 Go 进程
ps aux | grep myapp

# 2. 采集 CPU Profile
curl http://localhost:6060/debug/pprof/profile?seconds=30 > cpu.pprof

# 3. 分析
go tool pprof cpu.pprof
(pprof) top 20
(pprof) web
```

**常见原因：**
- 死循环
- 频繁 GC
- 锁竞争
- 正则表达式

---

### Q80: 内存暴涨如何排查

```bash
# 采集堆内存
curl http://localhost:6060/debug/pprof/heap > heap.pprof

# 分析
go tool pprof heap.pprof
(pprof) top -inuse_space    # 当前使用
(pprof) top -alloc_space    # 累计分配
```

**常见原因：**
- Goroutine 泄漏
- 缓存无限增长
- 大对象未释放
- 切片底层数组未释放

---

### Q81: 火焰图怎么看

**生成火焰图：**

```bash
go tool pprof -http=:8080 cpu.pprof
```

**解读：**
- **横轴**：占用比例（越宽越耗资源）
- **纵轴**：调用栈深度
- **颜色**：无特殊含义，仅区分

**优化目标：** 找到最宽的"平台"（热点函数）

---

### Q82: 如何优化 JSON 序列化

| 库 | 特点 |
| :--- | :--- |
| encoding/json | 标准库，通用 |
| jsoniter | 兼容标准库，更快 |
| sonic | 字节跳动，SIMD 加速 |
| easyjson | 代码生成，零反射 |

```go
import jsoniter "github.com/json-iterator/go"

var json = jsoniter.ConfigCompatibleWithStandardLibrary
json.Marshal(obj)
json.Unmarshal(data, &obj)
```

---

## 十二、云原生部署

### Q83: Go 服务 Docker 镜像怎么做

**多阶段构建：**

```dockerfile
# 构建阶段
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o main .

# 运行阶段
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

**最终镜像约 10-20MB**

---

### Q84: K8s 基本组件

| 组件 | 说明 |
| :--- | :--- |
| **Pod** | 最小部署单元 |
| **Deployment** | 管理 Pod 副本 |
| **Service** | 服务发现和负载均衡 |
| **Ingress** | 对外暴露 HTTP 服务 |
| **ConfigMap** | 配置管理 |
| **Secret** | 敏感配置 |

---

### Q85: 服务如何在 K8s 中暴露

```yaml
# Service（集群内部）
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
---
# Ingress（对外）
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80
```

---

### Q86: 如何做滚动更新

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多多 1 个 Pod
      maxUnavailable: 0  # 最少可用数
```

**发布命令：**
```bash
kubectl set image deployment/myapp myapp=myapp:v2
kubectl rollout status deployment/myapp
kubectl rollout undo deployment/myapp  # 回滚
```

---

## 十三、工程能力

### Q87: Go 项目常见目录结构

```
project/
├── cmd/                # 入口
│   └── server/
│       └── main.go
├── internal/           # 私有代码
│   ├── handler/        # HTTP 处理
│   ├── service/        # 业务逻辑
│   ├── repository/     # 数据访问
│   └── model/          # 数据模型
├── pkg/                # 可导出的公共包
├── api/                # API 定义（proto/swagger）
├── configs/            # 配置文件
├── scripts/            # 脚本
├── test/               # 测试
├── go.mod
└── Makefile
```

---

### Q88: 如何写单元测试

```go
// user_service_test.go
func TestCreateUser(t *testing.T) {
    // Arrange
    mockRepo := &MockUserRepo{}
    service := NewUserService(mockRepo)
    
    mockRepo.On("Create", mock.Anything).Return(nil)
    
    // Act
    err := service.Create(&User{Name: "test"})
    
    // Assert
    assert.NoError(t, err)
    mockRepo.AssertExpectations(t)
}

// 表驱动测试
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 1, 2, 3},
        {"negative", -1, -2, -3},
        {"zero", 0, 0, 0},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

---

### Q89: Mock 怎么做

**常用 Mock 库：**

| 库 | 特点 |
| :--- | :--- |
| gomock | 官方，代码生成 |
| testify/mock | 简单易用 |
| mockery | 自动生成 mock |

```go
// 使用 testify/mock
type MockUserRepo struct {
    mock.Mock
}

func (m *MockUserRepo) GetByID(id int64) (*User, error) {
    args := m.Called(id)
    return args.Get(0).(*User), args.Error(1)
}

// 测试中使用
mockRepo.On("GetByID", int64(1)).Return(&User{ID: 1}, nil)
```

---

### Q90: CodeReview 关注什么

| 方面 | 关注点 |
| :--- | :--- |
| **正确性** | 逻辑是否正确，边界条件 |
| **安全性** | SQL注入、XSS、权限校验 |
| **性能** | N+1 查询、大循环、锁粒度 |
| **可读性** | 命名、注释、函数长度 |
| **可测试性** | 依赖注入、接口抽象 |
| **错误处理** | error 是否正确处理 |

---

## 十四、高频考点清单

### 必考

- [ ] slice/map 底层结构和扩容
- [ ] Goroutine vs 线程、GMP 模型
- [ ] Channel 底层和操作表
- [ ] GC 三色标记、写屏障
- [ ] 逃逸分析
- [ ] Context 使用
- [ ] Gin 中间件原理

### 常考

- [ ] defer 执行顺序
- [ ] select 用法
- [ ] sync.Mutex vs RWMutex
- [ ] sync.Pool 原理
- [ ] pprof 使用
- [ ] 限流算法
- [ ] 缓存一致性

### 进阶

- [ ] 系统设计（高并发、高可用）
- [ ] 熔断降级实现
- [ ] Goroutine 泄漏检测
- [ ] 内存泄漏排查
- [ ] Docker/K8s 部署
- [ ] 单元测试和 Mock

