---
order: 4
---

# Go - 垃圾回收

理解 Go 的垃圾回收机制，掌握 GC 调优方法。

## GC 算法演进

| 版本    | 算法         | 特点                       |
| :------ | :----------- | :------------------------- |
| Go 1.0  | STW          | 全程暂停，延迟高           |
| Go 1.3  | Mark STW     | 标记阶段 STW               |
| Go 1.5  | 三色标记     | 并发标记，STW 时间大幅降低 |
| Go 1.8  | 混合写屏障   | 进一步降低 STW             |
| Go 1.12 | 优化内存分配 | 减少内存碎片               |

## 三色标记法

### 三种颜色

```
┌─────────────────────────────────────────────────────────┐
│                    三色标记                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   白色 (White)                                          │
│   ├── 初始状态，所有对象都是白色                         │
│   └── GC 结束后，白色对象会被回收                        │
│                                                         │
│   灰色 (Gray)                                           │
│   ├── 已被扫描，但其引用的对象还未扫描                   │
│   └── 中间状态，待处理                                   │
│                                                         │
│   黑色 (Black)                                          │
│   ├── 已被扫描，其引用的对象也已扫描                     │
│   └── 存活对象，不会被回收                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 标记流程

```go
// 伪代码
func markPhase() {
    // 1. 初始化：所有对象标记为白色
    
    // 2. 根对象标记为灰色
    //    - 栈上变量
    //    - 全局变量
    //    - 寄存器
    
    // 3. 遍历灰色对象
    for len(grayObjects) > 0 {
        obj := grayObjects.pop()
        
        // 将引用的白色对象标记为灰色
        for _, ref := range obj.references() {
            if ref.color == white {
                ref.color = gray
                grayObjects.push(ref)
            }
        }
        
        // 将当前对象标记为黑色
        obj.color = black
    }
    
    // 4. 清除阶段：回收所有白色对象
}
```

### 并发标记问题

并发执行时可能出现对象丢失：

```
初始状态：
A(黑) ──→ B(灰) ──→ C(白)

并发修改后：
A(黑) ──→ C(白)  // A 直接引用 C
B(灰) ──✕ C      // B 不再引用 C

问题：C 永远不会被扫描到，被错误回收！
```

## 写屏障

### 插入写屏障（Dijkstra）

```go
// 插入写屏障：当黑色对象引用白色对象时，将白色对象标记为灰色
func writePointer(slot *unsafe.Pointer, ptr unsafe.Pointer) {
    shade(ptr)  // 将 ptr 标记为灰色
    *slot = ptr
}

// 问题：不适用于栈上对象
// 栈上对象不使用写屏障（性能考虑）
// 需要在标记结束时 STW 重新扫描栈
```

### 删除写屏障（Yuasa）

```go
// 删除写屏障：当删除引用时，将被删除的对象标记为灰色
func writePointer(slot *unsafe.Pointer, ptr unsafe.Pointer) {
    old := *slot
    shade(old)  // 将旧值标记为灰色
    *slot = ptr
}

// 问题：会导致一些垃圾延迟回收
```

### 混合写屏障（Go 1.8+）

```go
// 混合写屏障：结合两种写屏障的优点
func writePointer(slot *unsafe.Pointer, ptr unsafe.Pointer) {
    shade(*slot)  // 将旧值标记为灰色
    if current stack is gray {
        shade(ptr)  // 将新值标记为灰色
    }
    *slot = ptr
}

// 优点：
// 1. 不需要重新扫描栈
// 2. STW 时间极短
```

## GC 流程

### 完整 GC 流程

```
┌─────────────────────────────────────────────────────────┐
│                      GC 流程                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Mark Setup (STW)                                    │
│     ├── 开启写屏障                                       │
│     ├── 将根对象入队                                     │
│     └── 时间：约 10-30 微秒                              │
│                                                         │
│  2. Marking (并发)                                       │
│     ├── 后台 mark worker 扫描                            │
│     ├── 与用户程序并发执行                               │
│     └── 占用约 25% CPU                                   │
│                                                         │
│  3. Mark Termination (STW)                              │
│     ├── 关闭写屏障                                       │
│     ├── 清理处理器缓存                                   │
│     └── 时间：约 60-90 微秒                              │
│                                                         │
│  4. Sweeping (并发)                                      │
│     ├── 清理白色对象                                     │
│     └── 与用户程序并发执行                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### GC 触发条件

```go
// 1. 堆内存达到阈值
// 默认：堆大小达到上次 GC 后的 2 倍（GOGC=100）

// 2. 定时触发
// 2 分钟没有 GC，强制触发

// 3. 手动触发
runtime.GC()

// 4. 系统内存压力
// 当系统内存不足时
```

## GC 调优

### GOGC 参数

```bash
# GOGC 控制 GC 触发阈值
# 默认值 100，表示堆增长 100% 时触发 GC
GOGC=100 ./myapp

# GOGC=50：更频繁 GC，内存占用低，CPU 开销高
# GOGC=200：更少 GC，内存占用高，CPU 开销低
# GOGC=off：禁用 GC（危险！）
```

### GOMEMLIMIT（Go 1.19+）

```bash
# 设置内存软限制
GOMEMLIMIT=1GiB ./myapp

# 当内存接近限制时，更积极地触发 GC
# 适合容器环境
```

### 代码层面优化

```go
// 1. 复用对象
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func process(data []byte) {
    buf := bufferPool.Get().([]byte)
    defer bufferPool.Put(buf)
    // 使用 buf...
}

// 2. 预分配
// Bad
var s []int
for i := 0; i < 10000; i++ {
    s = append(s, i)
}

// Good
s := make([]int, 0, 10000)
for i := 0; i < 10000; i++ {
    s = append(s, i)
}

// 3. 避免逃逸
// Bad
func newBuffer() *bytes.Buffer {
    return &bytes.Buffer{}  // 逃逸到堆
}

// Good（如果可能）
func processWithBuffer(buf *bytes.Buffer) {
    // 由调用者管理 buffer
}

// 4. 使用值类型
// Bad
type Point struct{ X, Y float64 }
func (p *Point) Distance() float64 { ... }  // 可能导致逃逸

// Good
func (p Point) Distance() float64 { ... }  // 值拷贝，在栈上
```

### 监控 GC

```go
// 1. 运行时监控
import "runtime/debug"

func monitorGC() {
    // 获取 GC 统计
    var stats debug.GCStats
    debug.ReadGCStats(&stats)
    
    fmt.Printf("GC 次数: %d\n", stats.NumGC)
    fmt.Printf("最近 GC 暂停: %v\n", stats.Pause[0])
    fmt.Printf("总暂停时间: %v\n", stats.PauseTotal)
}

// 2. 环境变量
// GODEBUG=gctrace=1 ./myapp
// 输出示例：
// gc 1 @0.012s 2%: 0.010+1.2+0.021 ms clock, 0.041+0.12/1.1/0+0.085 ms cpu, 4->4->0 MB, 5 MB goal, 4 P

// 解释：
// gc 1: 第 1 次 GC
// @0.012s: 程序启动后 0.012 秒
// 2%: GC 占用 CPU 时间百分比
// 0.010+1.2+0.021 ms: STW1 + 并发标记 + STW2 时间
// 4->4->0 MB: GC 前堆大小 -> GC 后堆大小 -> 存活对象大小
// 5 MB goal: 触发 GC 的堆大小目标
```

## 常见问题

### GC 压力大

```go
// 症状：CPU 使用率高，GC 频繁

// 排查：
// 1. 查看 GC 日志
// GODEBUG=gctrace=1 ./myapp

// 2. pprof 分析
go tool pprof http://localhost:6060/debug/pprof/heap

// 优化：
// 1. 增大 GOGC
// 2. 使用对象池
// 3. 减少小对象分配
```

### 内存泄漏

```go
// 常见原因：
// 1. goroutine 泄漏
func leak() {
    ch := make(chan int)
    go func() {
        <-ch  // 永久阻塞
    }()
    // ch 永远不会发送数据
}

// 2. 全局变量持有引用
var cache = make(map[string]*Data)  // 只增不减

// 3. time.Ticker 未关闭
ticker := time.NewTicker(time.Second)
// 使用后要 ticker.Stop()

// 排查：
// 1. pprof heap 分析
// 2. goroutine 数量监控
// 3. top 命令查看内存增长
```
