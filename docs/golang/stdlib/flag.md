---
order : 3
---

# flag

在Go语言中，`flag` 包是用于处理命令行参数的标准库，它提供了一种简单而直接的方式来解析和使用命令行参数。下面是关于 `flag` 包的一些基本介绍和常用功能：

## 1. 解析命令行参数

使用 `flag` 包可以轻松地解析命令行参数，并将它们赋值给相应的变量。

- **基本用法**

```go
package main

import (
    "flag"
    "fmt"
)

func main() {
    // 定义命令行参数
    var name string
    var age int

    // 解析命令行参数
    flag.StringVar(&name, "name", "Guest", "Your name")
    flag.IntVar(&age, "age", 20, "Your age")

    // 必须调用 Parse 函数
    flag.Parse()

    // 输出解析后的参数
    fmt.Println("Name:", name)
    fmt.Println("Age:", age)
}
```

在上述例子中，`flag.StringVar` 和 `flag.IntVar` 分别用于定义一个字符串类型和整数类型的命令行参数。`flag.Parse()` 函数用于解析命令行参数，并将其赋值给相应的变量。通过命令行运行程序时，可以使用 `-name` 和 `-age` 参数指定对应的值。

例如，运行程序时可以这样使用：

```bash
go run main.go -name Alice -age 30
```

## 2. 默认值和帮助信息

在使用 `flag.StringVar` 和 `flag.IntVar` 定义命令行参数时，可以指定默认值和参数的帮助信息。

```go
flag.StringVar(&name, "name", "Guest", "Your name")
flag.IntVar(&age, "age", 20, "Your age")
```

这里 `"name"` 和 `"age"` 是命令行参数的名称，`"Guest"` 和 `20` 是默认值，帮助信息 `"Your name"` 和 `"Your age"` 会在用户请求帮助时显示出来。

## 3. 非命令行参数

除了使用 `-name` 和 `-age` 这种形式的命令行参数外，`flag` 包还支持解析非命令行参数（位置参数）。这些参数可以通过 `flag.Args()` 函数来获取。

```go
package main

import (
    "flag"
    "fmt"
)

func main() {
    // 解析命令行参数
    flag.Parse()

    // 获取非命令行参数
    args := flag.Args()
    fmt.Println("Non-flag arguments:", args)
}
```

## 4. 自定义使用说明

使用 `flag.Usage` 函数可以自定义程序的使用说明。默认情况下，当用户提供无效的参数或者请求帮助时，会输出默认的使用说明信息。

```go
flag.Usage = func() {
    fmt.Fprintf(os.Stderr, "Usage of %s:\n", os.Args[0])
    fmt.Fprintf(os.Stderr, "  -name string\n")
    fmt.Fprintf(os.Stderr, "        Your name (default \"Guest\")\n")
    fmt.Fprintf(os.Stderr, "  -age int\n")
    fmt.Fprintf(os.Stderr, "        Your age (default 20)\n")
}
```

这样定义后，当用户使用 `-h` 或者提供无效参数时，会显示自定义的使用说明信息。

## 总结

`flag` 包提供了一个简单而强大的方法来处理命令行参数，它使得你可以轻松定义、解析和使用命令行参数，包括可选参数、必选参数、默认值和帮助信息等。这使得编写命令行工具或者控制台程序时，处理用户输入变得非常方便和直观。