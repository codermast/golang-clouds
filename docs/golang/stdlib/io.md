---
order : 9
---
# io

在 Go 语言中，`io` 包提供了基本的输入输出功能。以下是一些常用的 `io` 包的 API 及其详细说明：

## 1. 读取数据

### `io.Reader`
`io.Reader` 是一个基本的接口，用于表示数据的读取。它只有一个方法 `Read`。
```go
type Reader interface {
    Read(p []byte) (n int, err error)
}
```

### `io.ReadFull`
从 `io.Reader` 中精确读取 `len(buf)` 字节的数据。
```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    reader := strings.NewReader("Hello, World!")
    buf := make([]byte, 5)
    n, err := io.ReadFull(reader, buf)
    if err != nil {
        fmt.Println(err)
    }
    fmt.Printf("Read %d bytes: %s\n", n, string(buf))
}
```

### `io.Copy`
将数据从一个 `io.Reader` 拷贝到一个 `io.Writer`。
```go
package main

import (
    "io"
    "os"
)

func main() {
    src := strings.NewReader("Hello, World!")
    dst := os.Stdout
    n, err := io.Copy(dst, src)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("\nCopied %d bytes\n", n)
}
```

## 2. 写入数据

### `io.Writer`
`io.Writer` 是一个基本的接口，用于表示数据的写入。它只有一个方法 `Write`。
```go
type Writer interface {
    Write(p []byte) (n int, err error)
}
```

### `io.WriteString`
向 `io.Writer` 写入字符串。
```go
package main

import (
    "io"
    "os"
)

func main() {
    _, err := io.WriteString(os.Stdout, "Hello, World!\n")
    if err != nil {
        log.Fatal(err)
    }
}
```

## 3. 缓冲读写

### `io.BufferedReader`
使用 `bufio.NewReader` 创建一个带缓冲的读取器。
```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    reader := bufio.NewReader(strings.NewReader("Hello, World!"))
    line, err := reader.ReadString('\n')
    if err != nil {
        fmt.Println(err)
    }
    fmt.Println(line)
}
```

### `io.BufferedWriter`
使用 `bufio.NewWriter` 创建一个带缓冲的写入器。
```go
package main

import (
    "bufio"
    "os"
)

func main() {
    writer := bufio.NewWriter(os.Stdout)
    _, err := writer.WriteString("Hello, World!\n")
    if err != nil {
        log.Fatal(err)
    }
    writer.Flush()
}
```

## 4. 管道

### `io.Pipe`
创建一个同步的内存管道，用于连接两个 goroutine。
```go
package main

import (
    "io"
    "log"
    "os"
)

func main() {
    r, w := io.Pipe()

    go func() {
        defer w.Close()
        _, err := w.Write([]byte("Hello, World!\n"))
        if err != nil {
            log.Fatal(err)
        }
    }()

    _, err := io.Copy(os.Stdout, r)
    if err != nil {
        log.Fatal(err)
    }
}
```

## 5. 多路复用

### `io.MultiReader`
创建一个 `io.Reader`，从多个 `io.Reader` 顺序读取。
```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    r1 := strings.NewReader("Hello, ")
    r2 := strings.NewReader("World!")
    reader := io.MultiReader(r1, r2)
    buf := new(strings.Builder)
    _, err := io.Copy(buf, reader)
    if err != nil {
        fmt.Println(err)
    }
    fmt.Println(buf.String())
}
```

### `io.MultiWriter`
创建一个 `io.Writer`，将数据写入多个 `io.Writer`。
```go
package main

import (
    "io"
    "os"
)

func main() {
    file, err := os.Create("output.txt")
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    writer := io.MultiWriter(os.Stdout, file)
    _, err = writer.Write([]byte("Hello, World!\n"))
    if err != nil {
        log.Fatal(err)
    }
}
```

## 6. 限制读取

### `io.LimitReader`
创建一个 `io.Reader`，从原始 `io.Reader` 中读取指定字节数。
```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    reader := strings.NewReader("Hello, World!")
    limitedReader := io.LimitReader(reader, 5)
    buf := new(strings.Builder)
    _, err := io.Copy(buf, limitedReader)
    if err != nil {
        fmt.Println(err)
    }
    fmt.Println(buf.String()) // 输出: Hello
}
```

## 7. 计数读取

### `io.TeeReader`
创建一个 `io.Reader`，从 `io.Reader` 读取并将读取的数据写入 `io.Writer`。
```go
package main

import (
    "fmt"
    "io"
    "os"
    "strings"
)

func main() {
    src := strings.NewReader("Hello, World!")
    dst := os.Stdout
    teeReader := io.TeeReader(src, dst)
    buf := new(strings.Builder)
    _, err := io.Copy(buf, teeReader)
    if err != nil {
        fmt.Println(err)
    }
    fmt.Println("\nRead data:", buf.String()) // 输出: Hello, World!
}
```

通过以上这些 `io` 包中的基本 API，你可以方便地处理各种输入输出操作。根据具体需求，还可以结合 `bufio` 包和 `os` 包实现更复杂的读写逻辑。