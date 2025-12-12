---
order: 1
---

# Go 面试 - 基础篇

Go 语言基础面试高频题目。

## 数据类型

### Q1: Go 有哪些基本数据类型？

**答案：**

| 分类   | 类型                                         |
| :----- | :------------------------------------------- |
| 布尔   | bool                                         |
| 整型   | int, int8, int16, int32, int64               |
| 无符号 | uint, uint8, uint16, uint32, uint64, uintptr |
| 浮点   | float32, float64                             |
| 复数   | complex64, complex128                        |
| 字符串 | string                                       |
| 字符   | byte (uint8), rune (int32)                   |

**追问：int 和 int64 有什么区别？**

int 的大小取决于操作系统：
- 32 位系统：int = int32
- 64 位系统：int = int64

建议：在需要明确大小的场景（如协议、序列化）使用 int64。

---

### Q2: string 的底层结构是什么？

**答案：**

```go
type stringStruct struct {
    str unsafe.Pointer  // 指向底层字节数组
    len int             // 字符串长度
}
```

**关键点：**
1. string 是**不可变**的，修改会创建新字符串
2. string 底层是 byte 数组，不是 rune 数组
3. `len(s)` 返回的是字节数，不是字符数

```go
s := "hello中国"
len(s)                        // 11（5 + 3*2）
utf8.RuneCountInString(s)     // 7（字符数）
```

**追问：字符串拼接有哪些方式？性能如何？**

| 方式              | 性能 | 场景             |
| :---------------- | :--- | :--------------- |
| `+`               | 低   | 少量拼接         |
| `fmt.Sprintf`     | 低   | 格式化           |
| `strings.Builder` | 高   | 大量拼接（推荐） |
| `bytes.Buffer`    | 高   | 大量拼接         |

---

## 切片 Slice

### Q3: slice 和 array 的区别？

**答案：**

| 特性 | Array                  | Slice            |
| :--- | :--------------------- | :--------------- |
| 长度 | 固定，编译时确定       | 动态，运行时可变 |
| 类型 | 长度是类型的一部分     | 只与元素类型有关 |
| 传参 | 值传递（复制整个数组） | 引用传递         |
| 内存 | 栈上分配               | 底层数组在堆上   |

```go
var arr [3]int      // 数组，长度是类型的一部分
var s []int         // 切片

// [3]int 和 [4]int 是不同类型
func foo(a [3]int) {}  // 只能接收 [3]int
```

---

### Q4: slice 的底层结构是什么？

**答案：**

```go
type slice struct {
    array unsafe.Pointer  // 指向底层数组
    len   int             // 当前长度
    cap   int             // 容量
}
```

**图示：**

```
slice: [ptr, len=3, cap=5]
         │
         ▼
array: [1][2][3][ ][ ]
        └─len─┘└cap─┘
```

---

### Q5: slice 的扩容机制？

**答案：**

Go 1.18 之前：
- cap < 1024：翻倍扩容
- cap >= 1024：扩容 1.25 倍

Go 1.18 之后：
- cap < 256：翻倍扩容
- cap >= 256：`newcap = oldcap + (oldcap + 3*256) / 4`

**扩容示例：**

```go
s := make([]int, 0)
for i := 0; i < 10; i++ {
    s = append(s, i)
    fmt.Printf("len=%d, cap=%d\n", len(s), cap(s))
}
// 输出：
// len=1, cap=1
// len=2, cap=2
// len=3, cap=4
// len=4, cap=4
// len=5, cap=8
// ...
```

**追问：扩容后底层数组地址会变吗？**

会变！扩容时会分配新数组，复制数据。所以 append 后要用返回值。

```go
s1 := []int{1, 2, 3}
s2 := s1
s1 = append(s1, 4)  // 可能触发扩容
// s1 和 s2 可能指向不同的底层数组
```

---

### Q6: 切片作为参数传递会发生什么？

**答案：**

切片是**值传递**，但传递的是 slice header（ptr, len, cap），底层数组是共享的。

```go
func modify(s []int) {
    s[0] = 100  // 会修改原切片
    s = append(s, 4)  // 不会影响原切片的 len
}

s := []int{1, 2, 3}
modify(s)
fmt.Println(s)  // [100 2 3]，长度还是 3
```

**如果要修改原切片的长度，需要传指针：**

```go
func modify(s *[]int) {
    *s = append(*s, 4)
}
```

---

## Map

### Q7: map 的底层实现？

**答案：**

Go 的 map 使用**哈希表**实现，结构如下：

```go
type hmap struct {
    count     int    // 元素个数
    B         uint8  // bucket 数量 = 2^B
    buckets   unsafe.Pointer  // bucket 数组
    oldbuckets unsafe.Pointer // 扩容时的旧 bucket
    // ...
}

type bmap struct {  // bucket 结构
    tophash [8]uint8  // 高 8 位哈希值
    // 紧跟 8 个 key 和 8 个 value
    // overflow *bmap  // 溢出桶
}
```

**查找过程：**
1. 计算 key 的哈希值
2. 用哈希值低 B 位确定 bucket
3. 用哈希值高 8 位在 bucket 中查找

---

### Q8: map 为什么是无序的？

**答案：**

1. **哈希分布**：key 按哈希值分布在不同 bucket，不是按插入顺序
2. **扩容迁移**：扩容时数据会重新分布
3. **故意随机化**：Go 在遍历时故意加入随机起始位置，避免依赖顺序

```go
m := map[string]int{"a": 1, "b": 2, "c": 3}
for k, v := range m {
    fmt.Println(k, v)  // 每次运行顺序可能不同
}
```

---

### Q9: map 的扩容机制？

**答案：**

两种触发条件：
1. **负载因子 > 6.5**（元素数量 / bucket 数量）→ **翻倍扩容**
2. **溢出桶过多**（B <= 15 且溢出桶 >= 2^B）→ **等量扩容**

**渐进式扩容：**
- 不会一次性迁移所有数据
- 每次读写操作迁移 1-2 个 bucket
- 避免一次性扩容导致的延迟

---

### Q10: 并发读写 map 会怎样？

**答案：**

会 panic！map 不是并发安全的。

```go
m := make(map[int]int)

go func() {
    for {
        m[1] = 1  // 写
    }
}()

go func() {
    for {
        _ = m[1]  // 读
    }
}()

// fatal error: concurrent map read and map write
```

**解决方案：**

1. **sync.Mutex**

```go
var mu sync.Mutex
mu.Lock()
m[key] = value
mu.Unlock()
```

2. **sync.RWMutex**（读多写少场景）

```go
var rw sync.RWMutex
rw.RLock()  // 读锁
_ = m[key]
rw.RUnlock()
```

3. **sync.Map**

```go
var m sync.Map
m.Store(key, value)
value, ok := m.Load(key)
```

---

## 接口 Interface

### Q11: interface 的底层结构？

**答案：**

Go 有两种接口：

**1. 空接口 `interface{}`（eface）：**

```go
type eface struct {
    _type *_type         // 类型信息
    data  unsafe.Pointer // 数据指针
}
```

**2. 非空接口（iface）：**

```go
type iface struct {
    tab  *itab           // 类型和方法表
    data unsafe.Pointer  // 数据指针
}

type itab struct {
    inter *interfacetype // 接口类型
    _type *_type         // 实际类型
    fun   [1]uintptr     // 方法表
}
```

---

### Q12: nil interface 和 interface with nil value 的区别？

**答案：**

这是一个经典陷阱！

```go
type MyError struct{}
func (e *MyError) Error() string { return "error" }

func returnsError() error {
    var err *MyError = nil
    return err  // 返回的不是 nil！
}

func main() {
    err := returnsError()
    fmt.Println(err == nil)  // false！
}
```

**原因：**
- `err` 的类型是 `error`（接口）
- 接口只有在 `type` 和 `value` 都为 nil 时才等于 nil
- `returnsError()` 返回的接口 type=`*MyError`，value=nil

**正确写法：**

```go
func returnsError() error {
    var err *MyError = nil
    if err == nil {
        return nil  // 直接返回 nil
    }
    return err
}
```

---

### Q13: 类型断言和类型选择？

**答案：**

**类型断言：**

```go
var i interface{} = "hello"

// 不安全，失败会 panic
s := i.(string)

// 安全写法
s, ok := i.(string)
if ok {
    fmt.Println(s)
}
```

**类型选择：**

```go
switch v := i.(type) {
case string:
    fmt.Println("string:", v)
case int:
    fmt.Println("int:", v)
default:
    fmt.Println("unknown type")
}
```

---

## defer

### Q14: defer 的执行顺序？

**答案：**

defer 是**后进先出（LIFO）**，栈结构。

```go
func main() {
    defer fmt.Println("1")
    defer fmt.Println("2")
    defer fmt.Println("3")
}
// 输出：3 2 1
```

---

### Q15: defer 遇到 panic 会执行吗？

**答案：**

会！defer 在 panic 后仍然会执行。

```go
func main() {
    defer fmt.Println("defer 1")
    defer fmt.Println("defer 2")
    panic("panic")
    defer fmt.Println("defer 3")  // 不会执行
}
// 输出：
// defer 2
// defer 1
// panic: panic
```

---

### Q16: defer 的参数什么时候求值？

**答案：**

defer 的参数在**声明时求值**，不是执行时。

```go
func main() {
    i := 0
    defer fmt.Println(i)  // 此时 i=0 就确定了
    i++
}
// 输出：0
```

**如果要用执行时的值，用闭包：**

```go
func main() {
    i := 0
    defer func() {
        fmt.Println(i)  // 闭包引用 i
    }()
    i++
}
// 输出：1
```

---

### Q17: defer 可以修改返回值吗？

**答案：**

可以！但只能修改**命名返回值**。

```go
// 可以修改
func f1() (result int) {
    defer func() {
        result++
    }()
    return 0
}
// 返回 1

// 不能修改
func f2() int {
    result := 0
    defer func() {
        result++  // 修改的是局部变量
    }()
    return result
}
// 返回 0
```

---

## 其他高频题

### Q18: new 和 make 的区别？

**答案：**

| 特性     | new           | make                |
| :------- | :------------ | :------------------ |
| 返回类型 | 返回指针 `*T` | 返回值 `T`          |
| 初始化   | 零值          | 初始化内部结构      |
| 适用类型 | 所有类型      | slice、map、channel |

```go
// new
p := new(int)     // *int，值为 0
s := new([]int)   // *[]int，值为 nil（不能直接用）

// make
s := make([]int, 0, 10)   // []int，已初始化
m := make(map[string]int) // map[string]int，已初始化
ch := make(chan int)      // chan int，已初始化
```

---

### Q19: 值传递和引用传递？

**答案：**

Go 只有**值传递**！

- 基本类型：传递值的副本
- 切片、map、channel：传递的是 header/指针的副本，但底层数据共享
- 指针：传递的是指针的副本

```go
func modify(s []int) {
    s[0] = 100  // 底层数组共享，会修改
    s = append(s, 4)  // s 是副本，不影响外部
}
```

---

### Q20: 闭包是什么？有什么陷阱？

**答案：**

闭包是引用了外部变量的匿名函数。

**陷阱：循环中的闭包**

```go
// 错误
for i := 0; i < 3; i++ {
    go func() {
        fmt.Println(i)  // 都是 3
    }()
}

// 正确 1：参数传递
for i := 0; i < 3; i++ {
    go func(n int) {
        fmt.Println(n)
    }(i)
}

// 正确 2：局部变量
for i := 0; i < 3; i++ {
    i := i  // 创建新变量
    go func() {
        fmt.Println(i)
    }()
}
```
