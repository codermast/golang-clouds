---
order: 4
---

# Go - 函数

## 函数定义

```go
// 基本形式
func 函数名(参数列表) 返回值类型 {
    函数体
}

// 无参无返回值
func sayHello() {
    fmt.Println("Hello")
}

// 有参有返回值
func add(a int, b int) int {
    return a + b
}

// 相同类型参数简写
func add(a, b int) int {
    return a + b
}

// 多返回值
func divide(a, b int) (int, int) {
    return a / b, a % b
}

// 命名返回值
func divide(a, b int) (quotient, remainder int) {
    quotient = a / b
    remainder = a % b
    return  // 裸返回
}
```

## 参数传递

### 值传递

Go 的函数参数都是值传递，传递的是参数的副本。

```go
func modify(x int) {
    x = 100  // 修改的是副本
}

a := 10
modify(a)
fmt.Println(a)  // 10，原值不变
```

### 指针传递

通过指针可以修改原始值：

```go
func modify(x *int) {
    *x = 100
}

a := 10
modify(&a)
fmt.Println(a)  // 100，原值被修改
```

### 切片和 Map

切片和 Map 包含指向底层数据的指针，所以修改会影响原数据：

```go
func modifySlice(s []int) {
    s[0] = 100
}

arr := []int{1, 2, 3}
modifySlice(arr)
fmt.Println(arr)  // [100 2 3]
```

## 可变参数

```go
// 可变参数
func sum(nums ...int) int {
    total := 0
    for _, num := range nums {
        total += num
    }
    return total
}

// 调用
sum(1, 2, 3)        // 6
sum(1, 2, 3, 4, 5)  // 15

// 传入切片
arr := []int{1, 2, 3}
sum(arr...)  // 使用 ... 展开切片

// 可变参数必须是最后一个参数
func format(prefix string, values ...int) {
    // ...
}
```

## 匿名函数

```go
// 匿名函数
add := func(a, b int) int {
    return a + b
}
result := add(1, 2)

// 立即执行
func(msg string) {
    fmt.Println(msg)
}("Hello")

// 作为参数传递
func execute(f func(int, int) int, a, b int) int {
    return f(a, b)
}

result := execute(func(a, b int) int {
    return a + b
}, 1, 2)
```

## 闭包

闭包是引用了外部变量的匿名函数。

```go
// 计数器闭包
func counter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}

c := counter()
fmt.Println(c())  // 1
fmt.Println(c())  // 2
fmt.Println(c())  // 3

// 带参数的闭包
func adder(base int) func(int) int {
    return func(x int) int {
        return base + x
    }
}

add5 := adder(5)
fmt.Println(add5(10))  // 15
fmt.Println(add5(20))  // 25
```

### 闭包陷阱

```go
// 错误示例：循环中的闭包
funcs := make([]func(), 3)
for i := 0; i < 3; i++ {
    funcs[i] = func() {
        fmt.Println(i)  // 捕获的是变量 i，不是值
    }
}
for _, f := range funcs {
    f()  // 输出: 3 3 3
}

// 正确方式：通过参数传递
for i := 0; i < 3; i++ {
    funcs[i] = func(n int) func() {
        return func() {
            fmt.Println(n)
        }
    }(i)
}
for _, f := range funcs {
    f()  // 输出: 0 1 2
}
```

## 函数类型

```go
// 定义函数类型
type Operation func(int, int) int

// 使用函数类型
func calculate(a, b int, op Operation) int {
    return op(a, b)
}

add := func(a, b int) int { return a + b }
sub := func(a, b int) int { return a - b }

calculate(10, 5, add)  // 15
calculate(10, 5, sub)  // 5
```

## 高阶函数

### 函数作为参数

```go
// 遍历并处理
func forEach(arr []int, handler func(int)) {
    for _, v := range arr {
        handler(v)
    }
}

forEach([]int{1, 2, 3}, func(n int) {
    fmt.Println(n * 2)
})

// 过滤
func filter(arr []int, predicate func(int) bool) []int {
    result := []int{}
    for _, v := range arr {
        if predicate(v) {
            result = append(result, v)
        }
    }
    return result
}

evens := filter([]int{1, 2, 3, 4, 5}, func(n int) bool {
    return n%2 == 0
})
// evens: [2 4]
```

### 函数作为返回值

```go
// 工厂函数
func multiplier(factor int) func(int) int {
    return func(x int) int {
        return x * factor
    }
}

double := multiplier(2)
triple := multiplier(3)

double(5)  // 10
triple(5)  // 15
```

## init 函数

init 函数在包初始化时自动执行，无法手动调用。

```go
package main

import "fmt"

var value int

func init() {
    value = 100
    fmt.Println("init 1")
}

func init() {
    fmt.Println("init 2")
}

func main() {
    fmt.Println("main, value =", value)
}

// 输出:
// init 1
// init 2
// main, value = 100
```

### 初始化顺序

```
1. 导入的包
2. 包级别变量
3. init 函数（可以有多个，按声明顺序执行）
4. main 函数
```

## 方法

方法是绑定到特定类型的函数。

```go
type Rectangle struct {
    Width, Height float64
}

// 值接收者
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// 指针接收者
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

rect := Rectangle{10, 5}
fmt.Println(rect.Area())  // 50

rect.Scale(2)
fmt.Println(rect.Area())  // 200
```

### 值接收者 vs 指针接收者

| 接收者类型 | 能否修改接收者 | 性能               |
| :--------- | :------------- | :----------------- |
| 值接收者   | 不能           | 复制整个结构体     |
| 指针接收者 | 能             | 只传递指针，更高效 |

**选择建议：**
- 需要修改接收者：使用指针接收者
- 结构体较大：使用指针接收者
- 需要保持一致性：如果某些方法使用指针接收者，其他方法也使用指针接收者
