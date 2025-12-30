---
order : 6
---

# strconv

在 Go 语言中，`strconv` 包提供了字符串和基本数据类型之间的转换函数，例如将整数转换为字符串、字符串转换为整数，以及其他类型之间的转换。这些功能非常有用，特别是在处理用户输入或从外部数据源读取数据时。

以下是 `strconv` 包中常用的函数和用法示例：

## 1. 将字符串转换为基本数据类型

- **`Atoi`**: 将字符串转换为整数类型。
  
  ```go
  package main

  import (
      "fmt"
      "strconv"
  )

  func main() {
      str := "123"
      num, err := strconv.Atoi(str)
      if err != nil {
          fmt.Println("Error:", err)
          return
      }
      fmt.Printf("Converted integer: %d\n", num) // 输出: Converted integer: 123
  }
  ```

- **`ParseFloat`**: 将字符串转换为浮点数类型。

  ```go
  package main

  import (
      "fmt"
      "strconv"
  )

  func main() {
      str := "3.14"
      num, err := strconv.ParseFloat(str, 64)
      if err != nil {
          fmt.Println("Error:", err)
          return
      }
      fmt.Printf("Converted float: %f\n", num) // 输出: Converted float: 3.140000
  }
  ```

## 2. 将基本数据类型转换为字符串

- **`Itoa`**: 将整数转换为字符串类型。

  ```go
  package main

  import (
      "fmt"
      "strconv"
  )

  func main() {
      num := 42
      str := strconv.Itoa(num)
      fmt.Printf("Converted string: %s\n", str) // 输出: Converted string: 42
  }
  ```

- **`FormatFloat`**: 将浮点数转换为字符串类型。

  ```go
  package main

  import (
      "fmt"
      "strconv"
  )

  func main() {
      num := 3.14
      str := strconv.FormatFloat(num, 'f', -1, 64)
      fmt.Printf("Converted string: %s\n", str) // 输出: Converted string: 3.14
  }
  ```

## 3. 其他常用功能

- **错误处理**: 在使用 `Atoi`、`ParseFloat` 等函数时，如果转换失败会返回一个错误。
  
  ```go
  package main

  import (
      "fmt"
      "strconv"
  )

  func main() {
      str := "hello"
      _, err := strconv.Atoi(str)
      if err != nil {
          fmt.Println("Error:", err) // 输出: Error: strconv.Atoi: parsing "hello": invalid syntax
      }
  }
  ```

- **基数转换**: 可以指定进制进行字符串和整数之间的转换。

  ```go
  package main

  import (
      "fmt"
      "strconv"
  )

  func main() {
      str := "1A"
      num, err := strconv.ParseInt(str, 16, 32)
      if err != nil {
          fmt.Println("Error:", err)
          return
      }
      fmt.Printf("Converted integer (base 16): %d\n", num) // 输出: Converted integer (base 16): 26
  }
  ```

## 总结

`strconv` 包是处理字符串和基本数据类型之间转换的重要工具，它提供了丰富的功能和灵活的选项，能够满足各种类型转换的需求。在编写需要处理用户输入、配置文件解析或者网络通信的程序时，经常会用到 `strconv` 包来处理数据类型的转换和格式化。