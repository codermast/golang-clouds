---
order: 5
---

# Go - 性能分析

掌握 Go 的性能分析工具：pprof、trace、benchmark。

## pprof

pprof 是 Go 内置的性能分析工具。

### 集成 pprof

```go
import (
    "net/http"
    _ "net/http/pprof"  // 自动注册路由
)

func main() {
    // 启动 pprof HTTP 服务
    go func() {
        http.ListenAndServe(":6060", nil)
    }()
    
    // 主程序逻辑...
}
```

### 访问端点

| 端点                   | 说明                   |
| :--------------------- | :--------------------- |
| /debug/pprof/          | 索引页面               |
| /debug/pprof/heap      | 堆内存分析             |
| /debug/pprof/goroutine | Goroutine 分析         |
| /debug/pprof/profile   | CPU 分析（需指定时长） |
| /debug/pprof/block     | 阻塞分析               |
| /debug/pprof/mutex     | 互斥锁分析             |
| /debug/pprof/trace     | 执行追踪               |

### CPU 分析

```bash
# 采集 30 秒 CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 交互式命令
(pprof) top          # 查看 CPU 占用最高的函数
(pprof) top10        # 查看前 10
(pprof) list funcName # 查看函数代码
(pprof) web          # 在浏览器中查看调用图
(pprof) svg          # 生成 SVG 图片

# 直接生成火焰图
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile?seconds=30
```

### 内存分析

```bash
# 采集堆内存 profile
go tool pprof http://localhost:6060/debug/pprof/heap

# 常用命令
(pprof) top          # 查看内存分配最多的函数
(pprof) inuse_space  # 当前使用的内存
(pprof) alloc_space  # 累计分配的内存
(pprof) inuse_objects # 当前对象数量
(pprof) alloc_objects # 累计分配的对象数量

# 比较两次采样
go tool pprof -base=heap1.prof heap2.prof
```

### Goroutine 分析

```bash
# 查看 goroutine 堆栈
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 或直接访问
curl http://localhost:6060/debug/pprof/goroutine?debug=2
```

### 代码中使用

```go
import (
    "os"
    "runtime/pprof"
)

func main() {
    // CPU profile
    f, _ := os.Create("cpu.prof")
    pprof.StartCPUProfile(f)
    defer pprof.StopCPUProfile()
    
    // 执行程序...
    
    // 内存 profile
    f2, _ := os.Create("mem.prof")
    defer f2.Close()
    pprof.WriteHeapProfile(f2)
}

// 分析
// go tool pprof cpu.prof
// go tool pprof mem.prof
```

## Trace

trace 提供更详细的执行追踪。

### 采集 trace

```go
import (
    "os"
    "runtime/trace"
)

func main() {
    f, _ := os.Create("trace.out")
    defer f.Close()
    
    trace.Start(f)
    defer trace.Stop()
    
    // 程序逻辑...
}

// 或通过 HTTP
// curl http://localhost:6060/debug/pprof/trace?seconds=5 > trace.out
```

### 分析 trace

```bash
go tool trace trace.out
# 会启动一个 Web 服务器，打开浏览器查看

# 可以看到：
# - Goroutine 调度
# - 网络阻塞
# - 系统调用
# - GC 事件
# - 处理器利用率
```

### Trace 界面

| 视图               | 说明             |
| :----------------- | :--------------- |
| View trace         | 时间线视图       |
| Goroutine analysis | Goroutine 分析   |
| Network blocking   | 网络阻塞分析     |
| Sync blocking      | 同步阻塞分析     |
| Syscall blocking   | 系统调用阻塞分析 |
| Scheduler latency  | 调度延迟分析     |
| User-defined tasks | 自定义任务       |

## Benchmark

### 编写 benchmark

```go
// xxx_test.go
package main

import "testing"

func BenchmarkFib(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Fib(20)
    }
}

func BenchmarkFibParallel(b *testing.B) {
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            Fib(20)
        }
    })
}
```

### 运行 benchmark

```bash
# 运行所有 benchmark
go test -bench=.

# 运行特定 benchmark
go test -bench=BenchmarkFib

# 指定运行时间
go test -bench=. -benchtime=10s

# 指定运行次数
go test -bench=. -benchtime=1000x

# 包含内存分配统计
go test -bench=. -benchmem

# 输出示例：
# BenchmarkFib-8      1000000    1234 ns/op    128 B/op    3 allocs/op
# - 8: CPU 核数
# - 1000000: 运行次数
# - 1234 ns/op: 每次操作耗时
# - 128 B/op: 每次操作分配的内存
# - 3 allocs/op: 每次操作的分配次数
```

### 比较 benchmark

```bash
# 安装 benchstat
go install golang.org/x/perf/cmd/benchstat@latest

# 运行并保存结果
go test -bench=. -count=10 > old.txt
# 修改代码后
go test -bench=. -count=10 > new.txt

# 比较
benchstat old.txt new.txt

# 输出示例：
# name     old time/op  new time/op  delta
# Fib-8    1.23µs ± 2%  0.89µs ± 1%  -27.64%  (p=0.000 n=10+10)
```

### Benchmark 技巧

```go
// 1. 避免编译器优化
var result int
func BenchmarkFib(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = Fib(20)
    }
    result = r  // 防止编译器优化掉 Fib 调用
}

// 2. 子测试
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

// 3. 重置计时器
func BenchmarkBigSetup(b *testing.B) {
    // 耗时的初始化
    setup()
    
    b.ResetTimer()  // 重置计时器
    
    for i := 0; i < b.N; i++ {
        // 实际要测试的代码
    }
}

// 4. 停止/启动计时
func BenchmarkWithPause(b *testing.B) {
    for i := 0; i < b.N; i++ {
        b.StopTimer()
        setup()  // 不计入时间
        b.StartTimer()
        
        doWork()  // 只计这部分时间
    }
}
```

## 实践案例

### 找出性能瓶颈

```go
// 示例程序
func processRequests() {
    for i := 0; i < 1000; i++ {
        data := fetchData()        // 可能是瓶颈
        result := processData(data) // 可能是瓶颈
        saveResult(result)          // 可能是瓶颈
    }
}

// 1. 采集 CPU profile
// go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

// 2. 查看 top
// (pprof) top
// 50%  fetchData
// 30%  processData
// 10%  saveResult

// 3. 优化 fetchData
// 使用连接池、缓存等
```

### 内存优化

```go
// 1. 采集 heap profile
// go tool pprof http://localhost:6060/debug/pprof/heap

// 2. 查看分配最多的函数
// (pprof) top -inuse_space

// 3. 常见优化
// - 使用 sync.Pool
// - 预分配切片
// - 减少字符串拼接
// - 使用值类型而非指针
```

### Goroutine 泄漏检测

```go
import "runtime"

func monitorGoroutines() {
    ticker := time.NewTicker(time.Second)
    for range ticker.C {
        num := runtime.NumGoroutine()
        fmt.Printf("Goroutine 数量: %d\n", num)
        
        if num > 10000 {
            // 告警：可能有泄漏
            // 采集 goroutine profile 分析
        }
    }
}

// 或使用 goleak 测试
import "go.uber.org/goleak"

func TestMain(m *testing.M) {
    goleak.VerifyTestMain(m)
}
```
