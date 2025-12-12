---
order: 1
icon: logos:go
---

# Golang 面试题

Go 语言面试高频考点，覆盖基础、并发、内存、GC、项目实战。

## 基础篇

### Q1: Go 有哪些基本数据类型？

| 分类   | 类型                                         |
| :----- | :------------------------------------------- |
| 布尔   | bool                                         |
| 整型   | int, int8, int16, int32, int64               |
| 无符号 | uint, uint8, uint16, uint32, uint64, uintptr |
| 浮点   | float32, float64                             |
| 复数   | complex64, complex128                        |
| 字符串 | string                                       |
| 字符   | byte (uint8), rune (int32)                   |

**注意**：int 的大小取决于操作系统（32位系统是int32，64位是int64）。

---

### Q2: string 底层是什么结构？

```go
type stringStruct struct {
    str unsafe.Pointer  // 指向底层字节数组
    len int             // 字符串长度
}
```

**特点：**
- string 是**不可变**的
- `len(s)` 返回字节数，不是字符数
- 使用 `utf8.RuneCountInString(s)` 获取字符数

**字符串拼接性能：**

| 方式              | 性能 | 场景             |
| :---------------- | :--- | :--------------- |
| `+`               | 低   | 少量拼接         |
| `fmt.Sprintf`     | 低   | 格式化           |
| `strings.Builder` | 高   | 大量拼接（推荐） |

---

### Q3: slice 和 array 的区别？

| 特性 | Array                  | Slice            |
| :--- | :--------------------- | :--------------- |
| 长度 | 固定，编译时确定       | 动态，运行时可变 |
| 类型 | 长度是类型的一部分     | 只与元素类型有关 |
| 传参 | 值传递（复制整个数组） | 传递 header      |

---

### Q4: slice 的底层结构？

```go
type slice struct {
    array unsafe.Pointer  // 指向底层数组
    len   int             // 当前长度
    cap   int             // 容量
}
```

**扩容机制（Go 1.18+）：**
- cap < 256：翻倍
- cap >= 256：`newcap = oldcap + (oldcap + 3*256) / 4`

---

### Q5: slice 作为参数传递会发生什么？

slice 是**值传递**，但传递的是 header（ptr, len, cap），底层数组共享。

```go
func modify(s []int) {
    s[0] = 100  // ✅ 会修改原切片
    s = append(s, 4)  // ❌ 不会影响原切片的 len
}
```

如果要修改原切片的长度，需要传指针 `*[]int`。

---

### Q6: map 的底层实现？

Go 的 map 使用**哈希表**实现：

```go
type hmap struct {
    count     int            // 元素个数
    B         uint8          // bucket 数量 = 2^B
    buckets   unsafe.Pointer // bucket 数组
    oldbuckets unsafe.Pointer // 扩容时的旧 bucket
}
```

**查找过程：**
1. 计算 key 的哈希值
2. 用哈希值低 B 位确定 bucket
3. 用哈希值高 8 位在 bucket 中查找

---

### Q7: map 为什么是无序的？

1. 哈希分布：key 按哈希值分布，不是按插入顺序
2. 扩容迁移：扩容时数据会重新分布
3. 故意随机化：Go 在遍历时故意加入随机起始位置

---

### Q8: 并发读写 map 会怎样？

会 **panic**！map 不是并发安全的。

**解决方案：**
1. `sync.Mutex`
2. `sync.RWMutex`（读多写少）
3. `sync.Map`

```go
var m sync.Map
m.Store(key, value)
value, ok := m.Load(key)
```

---

### Q9: interface 的底层结构？

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

### Q10: nil interface 和 interface with nil value 的区别？

```go
var err *MyError = nil
var e error = err
fmt.Println(e == nil)  // false！
```

接口只有在 type 和 value **都为 nil** 时才等于 nil。

---

### Q11: defer 的执行顺序？

**后进先出（LIFO）**，栈结构。

```go
defer fmt.Println("1")
defer fmt.Println("2")
defer fmt.Println("3")
// 输出：3 2 1
```

**defer 遇到 panic**：仍然会执行

**defer 参数求值**：声明时求值，不是执行时

```go
i := 0
defer fmt.Println(i)  // 输出 0
i++
```

---

### Q12: new 和 make 的区别？

| 特性     | new           | make                |
| :------- | :------------ | :------------------ |
| 返回类型 | 返回指针 `*T` | 返回值 `T`          |
| 初始化   | 零值          | 初始化内部结构      |
| 适用类型 | 所有类型      | slice、map、channel |

---

## 并发篇

### Q13: Goroutine 和线程的区别？

| 特性     | Goroutine            | OS Thread      |
| :------- | :------------------- | :------------- |
| 内存占用 | 初始 2KB，可动态增长 | 固定 1-8MB     |
| 创建销毁 | 用户态，开销小       | 内核态，开销大 |
| 切换成本 | ~200ns               | ~1-2μs         |
| 调度     | Go runtime 调度      | 操作系统调度   |
| 数量     | 可创建百万级         | 通常数千个     |

---

### Q14: 如何控制 Goroutine 的并发数量？

**1. 带缓冲的 Channel（信号量）**

```go
sem := make(chan struct{}, 10)  // 最多 10 个并发

for i := 0; i < 100; i++ {
    sem <- struct{}{}  // 获取
    go func() {
        defer func() { <-sem }()  // 释放
        // 工作...
    }()
}
```

**2. Worker Pool**

```go
jobs := make(chan int, 100)
for w := 0; w < 10; w++ {  // 10 个 worker
    go func() {
        for job := range jobs {
            process(job)
        }
    }()
}
```

---

### Q15: Channel 的底层实现？

```go
type hchan struct {
    qcount   uint           // 元素数量
    dataqsiz uint           // 缓冲区大小
    buf      unsafe.Pointer // 环形队列
    sendx    uint           // 发送索引
    recvx    uint           // 接收索引
    recvq    waitq          // 接收等待队列
    sendq    waitq          // 发送等待队列
    lock     mutex
}
```

---

### Q16: 有缓冲和无缓冲 Channel 的区别？

| 特性     | 无缓冲         | 有缓冲            |
| :------- | :------------- | :---------------- |
| 创建     | `make(chan T)` | `make(chan T, n)` |
| 发送阻塞 | 直到有接收者   | 直到缓冲区满      |
| 接收阻塞 | 直到有发送者   | 直到缓冲区空      |
| 同步性   | 同步通信       | 异步通信          |

---

### Q17: Channel 操作的各种情况？

| 操作 | nil channel | 已关闭 channel     | 正常 channel |
| :--- | :---------- | :----------------- | :----------- |
| 发送 | 永久阻塞    | **panic**          | 阻塞或成功   |
| 接收 | 永久阻塞    | 返回零值，ok=false | 阻塞或成功   |
| 关闭 | **panic**   | **panic**          | 成功         |

---

### Q18: GMP 是什么？

| 组件 | 说明                               |
| :--- | :--------------------------------- |
| G    | Goroutine，协程                    |
| M    | Machine，操作系统线程              |
| P    | Processor，逻辑处理器，连接 G 和 M |

**关系：**
- G 需要绑定 P 才能在 M 上执行
- P 的数量 = GOMAXPROCS（默认 CPU 核数）
- M 的数量可以超过 P

---

### Q19: GMP 调度流程？

1. P 从本地队列取 G
2. 本地队列空，从全局队列取
3. 全局队列空，从其他 P 偷取（Work Stealing）
4. 都没有，M 休眠

**抢占式调度：**
- Go 1.14+ 基于信号的抢占
- 即使没有函数调用也能被抢占

---

### Q20: sync.Mutex 和 sync.RWMutex 的区别？

| 特性      | Mutex               | RWMutex               |
| :-------- | :------------------ | :-------------------- |
| 读锁      | 不支持              | `RLock()`/`RUnlock()` |
| 写锁      | `Lock()`/`Unlock()` | `Lock()`/`Unlock()`   |
| 读读      | 互斥                | 共享                  |
| 读写/写写 | 互斥                | 互斥                  |
| 适用场景  | 读写都多            | 读多写少              |

---

### Q21: sync.Once 的实现原理？

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

## 内存篇

### Q22: Go 的内存分配机制？

采用 TCMalloc 的多级缓存：

```
mcache（每个 P 一个，无锁）
    ↓
mcentral（每个 size class 一个，有锁）
    ↓
mheap（全局唯一，管理所有 span）
```

| 对象大小   | 分配方式          |
| :--------- | :---------------- |
| < 16B      | tiny allocator    |
| 16B ~ 32KB | mcache → mcentral |
| > 32KB     | 直接从 mheap      |

---

### Q23: 什么是逃逸分析？

决定变量分配在**栈**还是**堆**。

**常见逃逸场景：**
1. 返回局部变量指针
2. 闭包引用
3. interface{} 参数
4. 切片扩容
5. 动态大小（make([]int, n)）

```bash
# 查看逃逸分析
go build -gcflags="-m" main.go
```

---

### Q24: Go GC 使用什么算法？

**三色标记 + 混合写屏障**

三色：
- **白色**：未扫描，可能是垃圾
- **灰色**：已扫描，但引用的对象未扫描
- **黑色**：已扫描完成

**GC 触发条件：**
1. 堆内存达到阈值（GOGC=100，增长 100%）
2. 2 分钟没有 GC
3. 手动 `runtime.GC()`

---

### Q25: GC 过程中的 STW？

两次短暂的 STW：

```
Mark Setup (STW 1)    ~10-30μs   开启写屏障
Concurrent Mark                   后台标记
Mark Termination (STW 2) ~60-90μs 关闭写屏障
Concurrent Sweep                  清理
```

总 STW 时间通常 < 1ms。

---

### Q26: 如何优化 GC？

1. **调整 GOGC**：`GOGC=200` 减少 GC 频率
2. **使用 GOMEMLIMIT**（Go 1.19+）
3. **复用对象**：`sync.Pool`
4. **预分配切片**
5. **减少逃逸**

---

## 项目篇

### Q27: Gin 中间件的实现原理？

洋葱模型，基于责任链：

```go
func Middleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 前置处理
        c.Next()  // 调用后续 handler
        // 后置处理
    }
}
```

---

### Q28: 如何实现分布式锁？

**Redis 分布式锁：**

```go
// 加锁
ok := rdb.SetNX(ctx, key, value, ttl).Val()

// 解锁（Lua 保证原子性）
script := `
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
else
    return 0
end
`
```

---

### Q29: 缓存穿透、击穿、雪崩如何解决？

| 问题     | 原因              | 解决方案                    |
| :------- | :---------------- | :-------------------------- |
| 缓存穿透 | 查询不存在的数据  | 布隆过滤器、缓存空值        |
| 缓存击穿 | 热点 key 过期     | 互斥锁、永不过期 + 异步更新 |
| 缓存雪崩 | 大量 key 同时过期 | 随机过期时间、多级缓存      |

---

### Q30: gRPC 和 HTTP 的区别？

| 特性     | gRPC               | HTTP/REST          |
| :------- | :----------------- | :----------------- |
| 协议     | HTTP/2             | HTTP/1.1 或 HTTP/2 |
| 序列化   | Protobuf（二进制） | JSON（文本）       |
| 性能     | 高                 | 相对较低           |
| 流式传输 | 原生支持           | 需要 WebSocket     |
| 浏览器   | 需要 grpc-web      | 原生支持           |

---

### Q31: 如何设计高并发系统？

1. **缓存**：多级缓存（本地 + Redis）
2. **异步**：消息队列解耦
3. **限流**：令牌桶、滑动窗口
4. **熔断**：gobreaker
5. **负载均衡**：轮询、加权、一致性哈希

---

### Q32: 如何保证消息不丢失？

1. **生产者确认**：等待 Broker ACK
2. **Broker 持久化**：Kafka acks=all
3. **消费者手动确认**：处理完再 ACK
4. **幂等性**：消息去重

---

## 高频考点清单

### 必考

- [ ] slice 底层结构、扩容机制
- [ ] map 实现原理、并发安全
- [ ] interface 底层结构、nil 陷阱
- [ ] Goroutine vs 线程
- [ ] Channel 底层实现
- [ ] GMP 调度模型
- [ ] GC 三色标记、写屏障
- [ ] 逃逸分析

### 常考

- [ ] defer 执行顺序
- [ ] select 用法
- [ ] sync.Mutex vs sync.RWMutex
- [ ] sync.Pool 原理
- [ ] context 使用场景
- [ ] pprof 性能分析

### 项目相关

- [ ] Gin 中间件原理
- [ ] GORM N+1 问题
- [ ] 分布式锁实现
- [ ] 缓存一致性
- [ ] 消息队列使用
