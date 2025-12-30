---
order : 17
---
# log

在 Go 语言中，`log` 包提供了简单的日志记录功能。以下是一些常用的 `log` 包的 API 及其详细说明：


## 1. 基本日志记录

### `log.Print`
记录一条日志。
```go
package main

import (
    "log"
)

func main() {
    log.Print("This is a log message")
}
```

### `log.Println`
记录一条日志，并添加换行符。
```go
package main

import (
    "log"
)

func main() {
    log.Println("This is a log message with a newline")
}
```

### `log.Printf`
记录一条格式化的日志。
```go
package main

import (
    "log"
)

func main() {
    name := "Alice"
    age := 30
    log.Printf("Name: %s, Age: %d", name, age)
}
```

## 2. 日志级别

### `log.Fatal`
记录一条日志并调用 `os.Exit(1)` 退出程序。
```go
package main

import (
    "log"
)

func main() {
    log.Fatal("This is a fatal log message")
}
```

### `log.Fatalf`
记录一条格式化的日志并调用 `os.Exit(1)` 退出程序。
```go
package main

import (
    "log"
)

func main() {
    name := "Alice"
    age := 30
    log.Fatalf("Fatal: Name: %s, Age: %d", name, age)
}
```

### `log.Panic`
记录一条日志并调用 `panic`。
```go
package main

import (
    "log"
)

func main() {
    log.Panic("This is a panic log message")
}
```

### `log.Panicf`
记录一条格式化的日志并调用 `panic`。
```go
package main

import (
    "log"
)

func main() {
    name := "Alice"
    age := 30
    log.Panicf("Panic: Name: %s, Age: %d", name, age)
}
```

## 3. 自定义日志记录器

### `log.New`
创建一个自定义的日志记录器。
```go
package main

import (
    "log"
    "os"
)

func main() {
    file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
    if err != nil {
        log.Fatal(err)
    }
    logger := log.New(file, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
    logger.Println("This is a custom log message")
}
```

## 4. 日志格式和标志

### `log.SetFlags`
设置日志记录的标志。
```go
package main

import (
    "log"
)

func main() {
    log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
    log.Println("This is a log message with date, time, and file info")
}
```

### `log.SetPrefix`
设置日志记录的前缀。
```go
package main

import (
    "log"
)

func main() {
    log.SetPrefix("DEBUG: ")
    log.Println("This is a log message with a prefix")
}
```

## 5. 输出到不同的目标

### `log.SetOutput`
设置日志记录的输出目标。
```go
package main

import (
    "log"
    "os"
)

func main() {
    file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
    if err != nil {
        log.Fatal(err)
    }
    log.SetOutput(file)
    log.Println("This is a log message written to a file")
}
```

## 6. 日志记录器方法

### `Logger.Output`
记录一条日志。
```go
package main

import (
    "log"
    "os"
)

func main() {
    logger := log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
    logger.Output(2, "This is a log message using Output method")
}
```

通过以上这些 `log` 包中的基本 API，你可以方便地在 Go 程序中进行日志记录。无论是基本的日志记录、不同日志级别、自定义日志记录器、设置日志格式和输出目标，都可以通过这些 API 实现。