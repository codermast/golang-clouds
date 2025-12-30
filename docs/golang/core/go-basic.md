---
order: 2
---

# Go - 基础语法

## 程序结构

```go
// 包声明
package main

// 导入包
import (
    "fmt"
    "math"
)

// 常量
const PI = 3.14159

// 变量
var globalVar = "全局变量"

// 主函数
func main() {
    fmt.Println("Hello, Go!")
}
```

## 变量

### 变量声明

```go
// 方式一：var 声明
var name string
var age int = 25
var height float64 = 1.75

// 方式二：类型推断
var city = "北京"

// 方式三：短变量声明（只能在函数内使用）
country := "中国"

// 多变量声明
var a, b, c int
var x, y = 1, "hello"
m, n := 10, 20

// 声明块
var (
    username string = "admin"
    password string = "123456"
    port     int    = 8080
)
```

### 变量默认值

| 类型             | 默认值 |
| :--------------- | :----- |
| int, float       | 0      |
| bool             | false  |
| string           | ""     |
| 指针, slice, map | nil    |

### 匿名变量

```go
// 使用 _ 忽略不需要的值
a, _ := getValue()  // 忽略第二个返回值

func getValue() (int, string) {
    return 1, "hello"
}
```

## 常量

```go
// 单个常量
const PI = 3.14159

// 常量块
const (
    StatusOK    = 200
    StatusError = 500
)

// iota 枚举
const (
    Sunday = iota  // 0
    Monday         // 1
    Tuesday        // 2
    Wednesday      // 3
    Thursday       // 4
    Friday         // 5
    Saturday       // 6
)

// iota 跳值
const (
    _  = iota             // 0（忽略）
    KB = 1 << (10 * iota) // 1 << 10 = 1024
    MB                    // 1 << 20
    GB                    // 1 << 30
    TB                    // 1 << 40
)
```

## 数据类型

### 基本类型

| 类型       | 说明                 | 示例         |
| :--------- | :------------------- | :----------- |
| bool       | 布尔                 | true, false  |
| int        | 整数（平台相关）     | -100, 0, 100 |
| int8       | 8位整数              | -128 ~ 127   |
| int16      | 16位整数             |              |
| int32      | 32位整数             |              |
| int64      | 64位整数             |              |
| uint       | 无符号整数           | 0, 100       |
| uint8      | 无符号8位（byte）    | 0 ~ 255      |
| float32    | 32位浮点数           | 3.14         |
| float64    | 64位浮点数           | 3.141592653  |
| complex64  | 复数                 | 1 + 2i       |
| complex128 | 复数                 |              |
| string     | 字符串               | "hello"      |
| rune       | Unicode字符（int32） | 'A', '中'    |

### 类型转换

Go 没有隐式类型转换，必须显式转换：

```go
var a int = 10
var b float64 = float64(a)  // int -> float64
var c int = int(b)          // float64 -> int

// 字符串转换
import "strconv"

// 字符串 <-> 整数
str := strconv.Itoa(100)         // int -> string: "100"
num, _ := strconv.Atoi("100")    // string -> int: 100

// 字符串 <-> 浮点数
str := strconv.FormatFloat(3.14, 'f', 2, 64)  // "3.14"
f, _ := strconv.ParseFloat("3.14", 64)        // 3.14

// 字符串 <-> 布尔
str := strconv.FormatBool(true)  // "true"
b, _ := strconv.ParseBool("true") // true
```

## 字符串

### 字符串基础

```go
// 字符串声明
s1 := "Hello"
s2 := `多行
字符串`

// 字符串是不可变的
s := "hello"
// s[0] = 'H'  // 错误！不能修改

// 获取长度
len(s)  // 字节长度
utf8.RuneCountInString(s)  // 字符长度

// 遍历字符串
for i, ch := range "hello中国" {
    fmt.Printf("%d: %c\n", i, ch)
}
```

### 字符串操作

```go
import "strings"

s := "Hello, World!"

// 常用函数
strings.Contains(s, "World")     // 是否包含
strings.HasPrefix(s, "Hello")    // 前缀
strings.HasSuffix(s, "!")        // 后缀
strings.Index(s, "W")            // 位置
strings.ToUpper(s)               // 大写
strings.ToLower(s)               // 小写
strings.TrimSpace("  hello  ")   // 去空格
strings.Split(s, ",")            // 分割
strings.Join([]string{"a", "b"}, "-")  // 连接
strings.Replace(s, "o", "0", -1) // 替换
```

### 字符串拼接

```go
// + 拼接（少量）
s := "Hello" + " " + "World"

// fmt.Sprintf
s := fmt.Sprintf("%s %s", "Hello", "World")

// strings.Builder（推荐，高性能）
var builder strings.Builder
builder.WriteString("Hello")
builder.WriteString(" ")
builder.WriteString("World")
s := builder.String()

// bytes.Buffer
var buffer bytes.Buffer
buffer.WriteString("Hello")
buffer.WriteString(" World")
s := buffer.String()
```

## 运算符

### 算术运算符

| 运算符 | 说明 | 示例       |
| :----- | :--- | :--------- |
| +      | 加   | 5 + 3 = 8  |
| -      | 减   | 5 - 3 = 2  |
| *      | 乘   | 5 * 3 = 15 |
| /      | 除   | 5 / 3 = 1  |
| %      | 取模 | 5 % 3 = 2  |
| ++     | 自增 | a++        |
| --     | 自减 | a--        |

::: warning 注意
Go 的 `++` 和 `--` 是语句，不是表达式，不能用于赋值：
```go
a++      // 正确
b = a++  // 错误！
```
:::

### 比较运算符

| 运算符 | 说明     |
| :----- | :------- |
| ==     | 等于     |
| !=     | 不等于   |
| >      | 大于     |
| <      | 小于     |
| >=     | 大于等于 |
| <=     | 小于等于 |

### 逻辑运算符

| 运算符 | 说明 |
| :----- | :--- |
| &&     | 与   |
| \|\|   | 或   |
| !      | 非   |

### 位运算符

| 运算符 | 说明   |
| :----- | :----- |
| &      | 按位与 |
| \|     | 按位或 |
| ^      | 异或   |
| <<     | 左移   |
| >>     | 右移   |
| &^     | 位清除 |

## 指针

Go 支持指针，但不支持指针运算。

```go
// 声明指针
var p *int

// 获取地址
a := 10
p = &a

// 获取值
fmt.Println(*p)  // 10

// 修改值
*p = 20
fmt.Println(a)  // 20

// new 函数分配内存
ptr := new(int)
*ptr = 100
```

### 指针作为函数参数

```go
func swap(a, b *int) {
    *a, *b = *b, *a
}

x, y := 1, 2
swap(&x, &y)
fmt.Println(x, y)  // 2 1
```
