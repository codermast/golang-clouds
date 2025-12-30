---
order : 11
---

# encoding/json

在 Go 语言中，`encoding/json` 包提供了对 JSON 数据进行编码和解码的功能。以下是一些常用的 `encoding/json` 包的 API 及其详细说明：


## 1. JSON 编码

### `json.Marshal`
将 Go 对象转换为 JSON 格式的字节切片。
```go
package main

import (
    "encoding/json"
    "fmt"
)

type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    data, err := json.Marshal(p)
    if err != nil {
        fmt.Println("Error marshalling:", err)
        return
    }
    fmt.Println(string(data))
}
```

### `json.MarshalIndent`
将 Go 对象转换为带缩进格式的 JSON 字节切片。
```go
package main

import (
    "encoding/json"
    "fmt"
)

type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    data, err := json.MarshalIndent(p, "", "  ")
    if err != nil {
        fmt.Println("Error marshalling:", err)
        return
    }
    fmt.Println(string(data))
}
```

## 2. JSON 解码

### `json.Unmarshal`
将 JSON 字节切片解码为 Go 对象。
```go
package main

import (
    "encoding/json"
    "fmt"
)

type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

func main() {
    data := []byte(`{"name":"Alice","age":30}`)
    var p Person
    err := json.Unmarshal(data, &p)
    if err != nil {
        fmt.Println("Error unmarshalling:", err)
        return
    }
    fmt.Printf("%+v\n", p)
}
```

## 3. 使用 `json.Decoder` 和 `json.Encoder`

### `json.NewDecoder`
创建一个 JSON 解码器，可以逐步从 `io.Reader` 读取 JSON 数据。
```go
package main

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

func main() {
    data := `{"name":"Alice","age":30}`
    reader := strings.NewReader(data)
    decoder := json.NewDecoder(reader)

    var p Person
    err := decoder.Decode(&p)
    if err != nil {
        fmt.Println("Error decoding:", err)
        return
    }
    fmt.Printf("%+v\n", p)
}
```

### `json.NewEncoder`
创建一个 JSON 编码器，可以逐步向 `io.Writer` 写入 JSON 数据。
```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    encoder := json.NewEncoder(os.Stdout)
    err := encoder.Encode(p)
    if err != nil {
        fmt.Println("Error encoding:", err)
    }
}
```

## 4. 自定义 JSON 编码和解码

### 实现 `json.Marshaler` 接口
自定义类型的 JSON 编码。
```go
package main

import (
    "encoding/json"
    "fmt"
)

type Person struct {
    Name string
    Age  int
}

func (p Person) MarshalJSON() ([]byte, error) {
    return json.Marshal(map[string]interface{}{
        "name": p.Name,
        "age":  p.Age,
    })
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    data, err := json.Marshal(p)
    if err != nil {
        fmt.Println("Error marshalling:", err)
        return
    }
    fmt.Println(string(data))
}
```

### 实现 `json.Unmarshaler` 接口
自定义类型的 JSON 解码。
```go
package main

import (
    "encoding/json"
    "fmt"
)

type Person struct {
    Name string
    Age  int
}

func (p *Person) UnmarshalJSON(data []byte) error {
    var aux struct {
        Name string `json:"name"`
        Age  int    `json:"age"`
    }
    if err := json.Unmarshal(data, &aux); err != nil {
        return err
    }
    p.Name = aux.Name
    p.Age = aux.Age
    return nil
}

func main() {
    data := []byte(`{"name":"Alice","age":30}`)
    var p Person
    err := json.Unmarshal(data, &p)
    if err != nil {
        fmt.Println("Error unmarshalling:", err)
        return
    }
    fmt.Printf("%+v\n", p)
}
```

## 5. 处理嵌套和复杂结构

### 嵌套结构的编码和解码
```go
package main

import (
    "encoding/json"
    "fmt"
)

type Address struct {
    Street string `json:"street"`
    City   string `json:"city"`
}

type Person struct {
    Name    string  `json:"name"`
    Age     int     `json:"age"`
    Address Address `json:"address"`
}

func main() {
    p := Person{
        Name: "Alice",
        Age:  30,
        Address: Address{
            Street: "123 Main St",
            City:   "Metropolis",
        },
    }

    data, err := json.MarshalIndent(p, "", "  ")
    if err != nil {
        fmt.Println("Error marshalling:", err)
        return
    }
    fmt.Println(string(data))

    var p2 Person
    err = json.Unmarshal(data, &p2)
    if err != nil {
        fmt.Println("Error unmarshalling:", err)
        return
    }
    fmt.Printf("%+v\n", p2)
}
```

通过以上这些 `encoding/json` 包中的基本 API，你可以方便地在 Go 程序中处理 JSON 数据。无论是简单的数据结构还是复杂的嵌套对象，都可以通过这些 API 进行高效的编码和解码操作。