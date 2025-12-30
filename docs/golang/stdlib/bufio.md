---
order : 10
---

# bufio

在 Go 语言中，`bufio` 包提供了带缓冲的 I/O 操作，能够提高读写性能。以下是一些常用的 `bufio` 包 API 及其详细说明：

## 1. 读取操作

### `bufio.NewReader`
创建一个带缓冲的读取器。
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
        fmt.Println("Error reading:", err)
        return
    }
    fmt.Println(line)
}
```

### `ReadString`
读取直到指定的分隔符，并返回包含分隔符的字符串。
```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    reader := bufio.NewReader(strings.NewReader("Hello, World!\nWelcome to Go!"))
    line, err := reader.ReadString('\n')
    if err != nil {
        fmt.Println("Error reading:", err)
        return
    }
    fmt.Println(line)
}
```

### `ReadBytes`
读取直到指定的分隔符，并返回包含分隔符的字节切片。
```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    reader := bufio.NewReader(strings.NewReader("Hello, World!\nWelcome to Go!"))
    bytes, err := reader.ReadBytes('\n')
    if err != nil {
        fmt.Println("Error reading:", err)
        return
    }
    fmt.Println(string(bytes))
}
```

### `ReadLine`
逐行读取文本，不包含换行符。
```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    reader := bufio.NewReader(strings.NewReader("Hello, World!\nWelcome to Go!"))
    line, _, err := reader.ReadLine()
    if err != nil {
        fmt.Println("Error reading:", err)
        return
    }
    fmt.Println(string(line))
}
```

## 2. 写入操作

### `bufio.NewWriter`
创建一个带缓冲的写入器。
```go
package main

import (
    "bufio"
    "os"
)

func main() {
    writer := bufio.NewWriter(os.Stdout)
    writer.WriteString("Hello, World!\n")
    writer.Flush()
}
```

### `WriteString`
写入一个字符串。
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
        fmt.Println("Error writing:", err)
        return
    }
    writer.Flush()
}
```

### `Write`
写入一个字节切片。
```go
package main

import (
    "bufio"
    "os"
)

func main() {
    writer := bufio.NewWriter(os.Stdout)
    _, err := writer.Write([]byte("Hello, World!\n"))
    if err != nil {
        fmt.Println("Error writing:", err)
        return
    }
    writer.Flush()
}
```

## 3. Scanner

### `bufio.NewScanner`
创建一个用于读取输入的扫描器。
```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    scanner := bufio.NewScanner(strings.NewReader("Hello, World!\nWelcome to Go!"))
    for scanner.Scan() {
        fmt.Println(scanner.Text())
    }
    if err := scanner.Err(); err != nil {
        fmt.Println("Error scanning:", err)
    }
}
```

### 自定义分隔符
使用 `bufio.Scanner.Split` 自定义扫描器的分隔函数。
```go
package main

import (
    "bufio"
    "bytes"
    "fmt"
)

func main() {
    data := []byte("Hello, World! Welcome to Go!")
    scanner := bufio.NewScanner(bytes.NewReader(data))
    scanner.Split(bufio.ScanWords)
    for scanner.Scan() {
        fmt.Println(scanner.Text())
    }
    if err := scanner.Err(); err != nil {
        fmt.Println("Error scanning:", err)
    }
}
```

## 4. ReadWriter

### `bufio.NewReadWriter`
组合 `bufio.Reader` 和 `bufio.Writer`，用于同时进行缓冲读写。
```go
package main

import (
    "bufio"
    "fmt"
    "strings"
)

func main() {
    var buffer strings.Builder
    rw := bufio.NewReadWriter(bufio.NewReader(strings.NewReader("Hello, World!")), bufio.NewWriter(&buffer))

    // 读取数据
    line, _ := rw.Reader.ReadString('\n')
    fmt.Println("Read:", line)

    // 写入数据
    rw.Writer.WriteString("Welcome to Go!\n")
    rw.Writer.Flush()
    fmt.Println("Written:", buffer.String())
}
```

通过以上这些 `bufio` 包中的基本 API，你可以方便地进行高效的缓冲输入输出操作。结合 `io` 包和 `os` 包，可以实现更加复杂的 I/O 处理逻辑。