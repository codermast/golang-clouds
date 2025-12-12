---
order: 3
---

# Go 面试 - 内存与 GC 篇

Go 内存管理和垃圾回收面试高频题目。

## 内存分配

### Q1: Go 的内存分配机制？

**答案：**

Go 的内存分配器借鉴了 TCMalloc，采用**多级缓存**：

```
┌─────────────────────────────────────────────────────────┐
│   mcache (每个 P 一个，无锁)                             │
│   ├── tiny allocator (< 16B 对象)                       │
│   └── span cache (各种 size class)                      │
├─────────────────────────────────────────────────────────┤
│   mcentral (每个 size class 一个，有锁)                  │
│   └── 管理特定大小的 span                                │
├─────────────────────────────────────────────────────────┤
│   mheap (全局唯一，有锁)                                 │
│   └── 管理所有 span，向 OS 申请内存                      │
└─────────────────────────────────────────────────────────┘
```

**分配策略：**

| 对象大小   | 分配方式                    |
| :--------- | :-------------------------- |
| < 16B      | mcache.tiny 合并分配        |
| 16B ~ 32KB | mcache -> mcentral -> mheap |
| > 32KB     | 直接从 mheap 分配           |

---

### Q2: 什么是逃逸分析？

**答案：**

逃逸分析决定变量分配在**栈**上还是**堆**上。

**栈上分配：**
- 函数返回后自动回收
- 无 GC 压力
- 性能更好

**堆上分配（逃逸）：**
- 需要 GC 回收
- 有额外开销

**常见逃逸场景：**

```go
// 1. 返回局部变量指针
func escape1() *int {
    x := 10
    return &x  // x 逃逸
}

// 2. 闭包引用
func escape2() func() int {
    x := 10
    return func() int { return x }  // x 逃逸
}

// 3. interface{} 参数
func escape3() {
    x := 10
    fmt.Println(x)  // x 逃逸（fmt.Println 参数是 interface{}）
}

// 4. 切片扩容
func escape4() {
    s := make([]int, 0)
    for i := 0; i < 10000; i++ {
        s = append(s, i)  // 扩容后逃逸
    }
}

// 5. 动态大小
func escape5(n int) {
    s := make([]int, n)  // n 是运行时值，逃逸
    _ = s
}
```

---

### Q3: 如何查看逃逸分析结果？

**答案：**

```bash
# 查看逃逸分析
go build -gcflags="-m" main.go

# 更详细
go build -gcflags="-m -m" main.go

# 输出示例
# ./main.go:5:2: moved to heap: x
# ./main.go:10:13: x escapes to heap
```

---

### Q4: 如何减少内存逃逸？

**答案：**

```go
// 1. 避免返回指针（如果不需要）
// Bad
func newInt() *int {
    n := 10
    return &n
}

// Good
func newInt() int {
    return 10
}

// 2. 预分配切片
// Bad
func process() []int {
    var s []int
    for i := 0; i < 1000; i++ {
        s = append(s, i)
    }
    return s
}

// Good
func process() []int {
    s := make([]int, 0, 1000)
    for i := 0; i < 1000; i++ {
        s = append(s, i)
    }
    return s
}

// 3. 使用 sync.Pool 复用对象
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

// 4. 避免 interface{} 参数（热点路径）
// Bad
func log(v interface{}) {
    fmt.Println(v)
}

// Good
func logInt(v int) {
    fmt.Println(v)
}
```

---

### Q5: 内存对齐是什么？如何优化？

**答案：**

Go 会对结构体字段进行**内存对齐**，可能产生 padding。

```go
// 未优化：24 字节
type Bad struct {
    a bool   // 1 byte
    // 7 bytes padding
    b int64  // 8 bytes
    c bool   // 1 byte
    // 7 bytes padding
}

// 优化后：16 字节
type Good struct {
    b int64  // 8 bytes
    a bool   // 1 byte
    c bool   // 1 byte
    // 6 bytes padding
}
```

**优化原则：将大字段放前面**

```go
// 查看大小和对齐
fmt.Println(unsafe.Sizeof(Bad{}))   // 24
fmt.Println(unsafe.Sizeof(Good{}))  // 16
```

---

## 垃圾回收

### Q6: Go GC 使用什么算法？

**答案：**

Go 使用**三色标记清除**算法，配合**混合写屏障**。

**三色标记：**
- **白色**：未扫描，可能是垃圾
- **灰色**：已扫描，但引用的对象未扫描
- **黑色**：已扫描，且引用的对象也已扫描

**标记过程：**
1. 初始：所有对象白色
2. 根对象（栈、全局变量）标记为灰色
3. 取出灰色对象，将其引用的白色对象标记为灰色，自身变黑色
4. 重复直到没有灰色对象
5. 清除所有白色对象

---

### Q7: 什么是写屏障？

**答案：**

写屏障解决**并发标记**时的对象丢失问题。

**问题：**
```
初始：A(黑) → B(灰) → C(白)
并发修改：A(黑) → C(白)，B(灰) ✗ C
结果：C 永远不会被扫描，被错误回收
```

**混合写屏障（Go 1.8+）：**
```go
// 伪代码
func writePointer(slot *unsafe.Pointer, ptr unsafe.Pointer) {
    shade(*slot)  // 将旧值标记为灰色
    if current_stack_is_grey {
        shade(ptr)  // 将新值标记为灰色
    }
    *slot = ptr
}
```

**好处：**
- 不需要 STW 重新扫描栈
- STW 时间大幅降低（< 1ms）

---

### Q8: GC 的触发时机？

**答案：**

1. **堆内存达到阈值**
   - 默认：堆大小达到上次 GC 后的 2 倍（GOGC=100）
   - GOGC=50 表示增长 50% 触发
   - GOGC=off 禁用 GC

2. **定时触发**
   - 2 分钟没有 GC，强制触发

3. **手动触发**
   ```go
   runtime.GC()
   ```

---

### Q9: GC 过程中的 STW 发生在哪里？

**答案：**

Go GC 有两次短暂的 STW：

```
┌─────────────────────────────────────────────────────┐
│ Mark Setup (STW 1)    ~10-30μs                      │
│ ├── 开启写屏障                                       │
│ └── 扫描栈，将根对象入队                             │
├─────────────────────────────────────────────────────┤
│ Concurrent Mark       与用户程序并发                 │
│ └── 后台 mark worker 扫描对象                        │
├─────────────────────────────────────────────────────┤
│ Mark Termination (STW 2)    ~60-90μs                │
│ ├── 关闭写屏障                                       │
│ └── 清理 mcache                                     │
├─────────────────────────────────────────────────────┤
│ Concurrent Sweep      与用户程序并发                 │
│ └── 清理白色对象                                     │
└─────────────────────────────────────────────────────┘
```

**总 STW 时间通常 < 1ms**

---

### Q10: 如何优化 GC？

**答案：**

**1. 调整 GOGC**

```bash
# 减少 GC 频率（内存换 CPU）
GOGC=200 ./myapp

# 增加 GC 频率（CPU 换内存）
GOGC=50 ./myapp
```

**2. 使用 GOMEMLIMIT（Go 1.19+）**

```bash
# 设置内存软限制
GOMEMLIMIT=1GiB ./myapp
```

**3. 复用对象**

```go
// 使用 sync.Pool
var pool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func process() {
    buf := pool.Get().([]byte)
    defer pool.Put(buf)
    // 使用 buf
}
```

**4. 减少内存分配**

```go
// 预分配切片
s := make([]int, 0, 1000)

// 使用 strings.Builder
var b strings.Builder
b.WriteString("hello")
b.WriteString("world")
```

**5. 避免逃逸**

见前面的逃逸分析优化。

---

### Q11: 如何排查内存问题？

**答案：**

**1. pprof 分析**

```go
import _ "net/http/pprof"

go func() {
    http.ListenAndServe(":6060", nil)
}()
```

```bash
# 查看堆内存
go tool pprof http://localhost:6060/debug/pprof/heap

# 常用命令
(pprof) top          # 内存占用排名
(pprof) list funcName # 查看函数
(pprof) web          # 生成图形
```

**2. 查看 GC 日志**

```bash
GODEBUG=gctrace=1 ./myapp

# 输出解读
# gc 1 @0.012s 2%: 0.010+1.2+0.021 ms clock, 0.041+0.12/1.1/0+0.085 ms cpu, 4->4->0 MB, 5 MB goal
# gc 1: 第 1 次 GC
# @0.012s: 程序启动后 0.012 秒
# 2%: GC 占用 CPU 百分比
# 4->4->0 MB: GC 前堆大小 -> GC 后堆大小 -> 存活对象
```

**3. 查看内存统计**

```go
var m runtime.MemStats
runtime.ReadMemStats(&m)
fmt.Printf("Alloc: %d MB\n", m.Alloc/1024/1024)
fmt.Printf("HeapAlloc: %d MB\n", m.HeapAlloc/1024/1024)
fmt.Printf("NumGC: %d\n", m.NumGC)
```

---

### Q12: 什么是内存泄漏？Go 中常见的内存泄漏场景？

**答案：**

内存泄漏是指程序不再使用的内存无法被 GC 回收。

**常见场景：**

```go
// 1. Goroutine 泄漏
func leak1() {
    ch := make(chan int)
    go func() {
        <-ch  // 永久阻塞，goroutine 无法退出
    }()
}

// 2. 全局变量持有引用
var cache = make(map[string]*Data)  // 只增不减

// 3. time.Ticker 未关闭
func leak3() {
    ticker := time.NewTicker(time.Second)
    // 忘记 ticker.Stop()
}

// 4. HTTP Body 未关闭
func leak4() {
    resp, _ := http.Get("http://example.com")
    // 忘记 resp.Body.Close()
}

// 5. 切片引用导致底层数组无法回收
func leak5() []int {
    s := make([]int, 1000000)
    return s[:10]  // 底层数组 1000000 个元素无法回收
}
// 正确写法
func noLeak5() []int {
    s := make([]int, 1000000)
    result := make([]int, 10)
    copy(result, s[:10])
    return result
}
```

---

## 性能优化

### Q13: 如何进行性能分析？

**答案：**

**CPU 分析：**
```bash
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

(pprof) top
(pprof) list funcName
(pprof) web
```

**内存分析：**
```bash
go tool pprof http://localhost:6060/debug/pprof/heap

(pprof) top -inuse_space   # 当前使用
(pprof) top -alloc_space   # 累计分配
```

**Goroutine 分析：**
```bash
go tool pprof http://localhost:6060/debug/pprof/goroutine
```

**Trace 分析：**
```bash
curl http://localhost:6060/debug/pprof/trace?seconds=5 > trace.out
go tool trace trace.out
```

---

### Q14: Benchmark 怎么写？

**答案：**

```go
// xxx_test.go
func BenchmarkFib(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Fib(20)
    }
}

// 带内存统计
func BenchmarkFib(b *testing.B) {
    b.ReportAllocs()
    for i := 0; i < b.N; i++ {
        Fib(20)
    }
}

// 表驱动
func BenchmarkFib(b *testing.B) {
    cases := []int{10, 20, 30}
    for _, n := range cases {
        b.Run(fmt.Sprintf("n=%d", n), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                Fib(n)
            }
        })
    }
}
```

```bash
# 运行
go test -bench=.
go test -bench=. -benchmem

# 输出
# BenchmarkFib-8    1000000    1234 ns/op    128 B/op    3 allocs/op
```

---

### Q15: 常见的性能优化技巧？

**答案：**

| 优化点    | 方法                            |
| :-------- | :------------------------------ |
| 内存分配  | 预分配、sync.Pool、减少逃逸     |
| 字符串    | strings.Builder、避免频繁拼接   |
| 切片      | 预分配容量、复用                |
| Map       | 预估大小初始化                  |
| 锁        | 减小锁粒度、读写锁、无锁结构    |
| Goroutine | Worker Pool、控制并发数         |
| IO        | 缓冲、批量操作                  |
| JSON      | 使用 jsoniter、sonic 等高性能库 |
