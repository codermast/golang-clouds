---
order : 1
---

# fmt

在 Go 语言的标准库中，`fmt` 包是非常重要的，它提供了处理格式化输入和输出的基本工具。以下是一些 fmt 包内常用的API：

## 1. 格式化输出

Go语言中最基本的输出函数是 `fmt.Print`、`fmt.Println` 和 `fmt.Printf`。它们用于将数据输出到控制台或其他输出设备。

- **`fmt.Print`**: 输出参数，不添加换行符。
  ```go
  fmt.Print("Hello, ")
  fmt.Print("World!")
  // 输出: Hello, World!
  ```

- **`fmt.Println`**: 输出参数并添加换行符。
  ```go
  fmt.Println("Hello,")
  fmt.Println("World!")
  // 输出:
  // Hello,
  // World!
  ```

- **`fmt.Printf`**: 根据指定格式输出参数。
  ```go
  name := "Alice"
  age := 30
  fmt.Printf("Name: %s, Age: %d\n", name, age)
  // 输出: Name: Alice, Age: 30
  ```

## 2. 格式化占位符

在 `Printf` 函数中，可以使用各种格式化占位符来指定输出的格式。

- `%v`: 默认格式。
- `%+v`: 对结构体输出字段名。
- `%#v`: 输出 Go 语法表示。
- `%T`: 输出变量类型。
- `%d`, `%f`, `%s`, `%t`, `%p` 等: 分别用于整数、浮点数、字符串、布尔值、指针等类型的格式化输出。

```go
name := "Bob"
age := 25
fmt.Printf("Name: %s, Age: %d\n", name, age)
// 输出: Name: Bob, Age: 25
```

## 3. 输入

使用 `fmt.Scan` 可以从标准输入中读取数据。

```go
var name string
fmt.Print("Enter your name: ")
fmt.Scan(&name)
fmt.Printf("Hello, %s!\n", name)
```

## 4. 自定义格式化输出

通过实现 `String()` 方法可以自定义类型的字符串表示方式。

```go
type Person struct {
    Name string
    Age  int
}

func (p Person) String() string {
    return fmt.Sprintf("%s (%d years)", p.Name, p.Age)
}

func main() {
    p := Person{"Alice", 30}
    fmt.Println(p) // 输出: Alice (30 years)
}
```

## 5. 错误输出

使用 `fmt.Errorf` 可以生成格式化的错误信息。

```go
import "fmt"

func someFunction() error {
    return fmt.Errorf("Something went wrong")
}

func main() {
    err := someFunction()
    if err != nil {
        fmt.Println("Error:", err)
    }
}
```

## 6. 更多高级用法

- 格式化输出的宽度和精度控制。
- `fmt.Sprintf` 函数用于返回格式化后的字符串。
- `fmt.Fprint`, `fmt.Fprintf`, `fmt.Fprintln` 用于格式化输出到文件或其他 `io.Writer` 接口。

## 总结

`fmt` 包提供了丰富的工具来处理格式化的输入和输出，是Go语言中常用的标准库之一。通过掌握这些基本的函数和格式化占位符，可以很好地满足大部分的格式化输出需求，并能够处理简单的输入操作和错误信息的格式化输出。