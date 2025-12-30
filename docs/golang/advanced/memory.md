---
order: 3
---

# Go - 内存模型

理解 Go 的内存分配机制和内存模型。

## 内存分配

### 内存分配器架构

Go 的内存分配采用 TCMalloc 思想：

```
┌─────────────────────────────────────────────────────────┐
│                      Go 内存分配器                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐              │
│   │ mcache  │   │ mcache  │   │ mcache  │   (每个 P)    │
│   └────┬────┘   └────┬────┘   └────┬────┘              │
│        │             │             │                    │
│        └─────────────┼─────────────┘                    │
│                      ↓                                  │
│              ┌───────────────┐                          │
│              │    mcentral   │  (每个 size class)       │
│              └───────┬───────┘                          │
│                      ↓                                  │
│              ┌───────────────┐                          │
│              │     mheap     │  (全局唯一)              │
│              └───────┬───────┘                          │
│                      ↓                                  │
│              ┌───────────────┐                          │
│              │   OS Memory   │                          │
│              └───────────────┘                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 对象大小分类

| 分类  | 大小       | 分配方式             |
| :---- | :--------- | :------------------- |
| Tiny  | < 16B      | mcache.tiny 合并分配 |
| Small | 16B ~ 32KB | mcache -> mcentral   |
| Large | > 32KB     | 直接从 mheap 分配    |

### mcache

```go
// 每个 P 都有一个 mcache，无锁分配
type mcache struct {
    tiny       uintptr // tiny 对象分配器
    tinyoffset uintptr // tiny 对象偏移
    alloc      [numSpanClasses]*mspan // span 缓存
}

// 分配流程
// 1. 根据对象大小找到对应的 span class
// 2. 从 mcache.alloc[class] 获取空闲对象
// 3. 如果 span 用完，从 mcentral 获取新的 span
```

### Size Class

Go 定义了 67 种 size class：

```go
// 部分 size class
// class  bytes/obj  bytes/span  objects
//     1          8        8192     1024
//     2         16        8192      512
//     3         24        8192      341
//     4         32        8192      256
//     5         48        8192      170
//     ...
//    66      32768       32768        1
```

## 逃逸分析

### 什么是逃逸分析

逃逸分析决定变量分配在栈上还是堆上。

```go
// 栈上分配：函数返回后自动回收，无 GC 压力
func stackAlloc() int {
    x := 10  // x 分配在栈上
    return x
}

// 堆上分配：需要 GC 回收
func heapAlloc() *int {
    x := 10
    return &x  // x 逃逸到堆上
}
```

### 逃逸场景

```go
// 1. 返回局部变量指针
func escape1() *int {
    x := 10
    return &x  // 逃逸
}

// 2. 闭包引用
func escape2() func() int {
    x := 10
    return func() int {
        return x  // x 逃逸
    }
}

// 3. 接口类型
func escape3(x int) {
    var i interface{} = x  // x 逃逸
    fmt.Println(i)
}

// 4. 切片/map 存储指针
func escape4() {
    x := 10
    s := []*int{&x}  // x 逃逸
    _ = s
}

// 5. 动态类型
func escape5(size int) {
    s := make([]int, size)  // 动态大小，逃逸
    _ = s
}
```

### 查看逃逸分析

```bash
# 查看逃逸分析结果
go build -gcflags="-m" main.go

# 更详细的输出
go build -gcflags="-m -m" main.go

# 输出示例：
# ./main.go:5:2: x escapes to heap
# ./main.go:5:2: moved to heap: x
```

### 优化建议

```go
// 1. 避免返回指针
// Bad
func newInt(n int) *int {
    return &n
}

// Good
func newInt(n int) int {
    return n
}

// 2. 预分配切片
// Bad
func process() {
    var s []int
    for i := 0; i < 1000; i++ {
        s = append(s, i)  // 多次扩容
    }
}

// Good
func process() {
    s := make([]int, 0, 1000)  // 预分配
    for i := 0; i < 1000; i++ {
        s = append(s, i)
    }
}

// 3. 使用值类型
// Bad
type Point struct { X, Y int }
func (p *Point) Distance() float64 { ... }

// Good（如果不需要修改）
func (p Point) Distance() float64 { ... }
```

## 内存对齐

### 对齐规则

```go
// 结构体字段按照自身大小对齐
type Example struct {
    a bool   // 1 byte
    // 7 bytes padding
    b int64  // 8 bytes, 对齐到 8 的倍数
    c bool   // 1 byte
    // 7 bytes padding
}
// 总大小：24 bytes

// 优化后
type ExampleOptimized struct {
    b int64  // 8 bytes
    a bool   // 1 byte
    c bool   // 1 byte
    // 6 bytes padding
}
// 总大小：16 bytes
```

### 查看对齐信息

```go
import (
    "fmt"
    "unsafe"
)

type Example struct {
    a bool
    b int64
    c bool
}

func main() {
    var e Example
    fmt.Println("Size:", unsafe.Sizeof(e))           // 24
    fmt.Println("Align:", unsafe.Alignof(e))         // 8
    fmt.Println("Offset a:", unsafe.Offsetof(e.a))   // 0
    fmt.Println("Offset b:", unsafe.Offsetof(e.b))   // 8
    fmt.Println("Offset c:", unsafe.Offsetof(e.c))   // 16
}
```

## 内存可见性

### Happens-Before 规则

Go 内存模型定义了 happens-before 关系：

```go
// 1. 初始化：init 函数先于 main 函数
func init() {
    // 这里的修改对 main 可见
}

// 2. Goroutine 创建
var a int
go func() {
    // 创建 goroutine 之前的修改对新 goroutine 可见
    _ = a
}()

// 3. Channel 操作
ch := make(chan int)
a = 1
ch <- 0  // 发送 happens-before 接收
<-ch
// a == 1 保证可见

// 4. 锁操作
var mu sync.Mutex
a = 1
mu.Lock()
mu.Unlock()  // Unlock happens-before 下一次 Lock
mu.Lock()
// a == 1 保证可见

// 5. Once
var once sync.Once
once.Do(func() {
    a = 1  // Do 内部执行 happens-before Do 返回
})
// a == 1 保证可见
```

### 常见错误

```go
// 错误：无同步访问
var a int
var done bool

go func() {
    a = 1
    done = true
}()

for !done {
}
fmt.Println(a)  // 可能输出 0！

// 正确：使用 channel 同步
var a int
done := make(chan bool)

go func() {
    a = 1
    done <- true
}()

<-done
fmt.Println(a)  // 保证输出 1
```

## 内存统计

```go
import "runtime"

func printMemStats() {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    
    fmt.Printf("Alloc: %d MB\n", m.Alloc/1024/1024)
    fmt.Printf("TotalAlloc: %d MB\n", m.TotalAlloc/1024/1024)
    fmt.Printf("Sys: %d MB\n", m.Sys/1024/1024)
    fmt.Printf("NumGC: %d\n", m.NumGC)
    fmt.Printf("HeapAlloc: %d MB\n", m.HeapAlloc/1024/1024)
    fmt.Printf("HeapSys: %d MB\n", m.HeapSys/1024/1024)
    fmt.Printf("HeapIdle: %d MB\n", m.HeapIdle/1024/1024)
    fmt.Printf("HeapInuse: %d MB\n", m.HeapInuse/1024/1024)
}
```

| 字段       | 说明                 |
| :--------- | :------------------- |
| Alloc      | 当前堆上对象总字节数 |
| TotalAlloc | 累计分配的字节数     |
| Sys        | 从系统获取的总内存   |
| NumGC      | GC 执行次数          |
| HeapAlloc  | 堆上分配的字节数     |
| HeapSys    | 从系统获取的堆内存   |
| HeapIdle   | 空闲的堆内存         |
| HeapInuse  | 使用中的堆内存       |
