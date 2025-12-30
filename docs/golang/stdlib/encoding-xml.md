---
order : 12
---

# encoding/xml


在 Go 语言中，`encoding/xml` 包提供了对 XML 数据进行编码和解码的功能。以下是一些常用的 `encoding/xml` 包的 API 及其详细说明：


## 1. XML 编码

### `xml.Marshal`
将 Go 对象转换为 XML 格式的字节切片。
```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Person struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age"`
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    data, err := xml.Marshal(p)
    if err != nil {
        fmt.Println("Error marshalling:", err)
        return
    }
    fmt.Println(string(data))
}
```

### `xml.MarshalIndent`
将 Go 对象转换为带缩进格式的 XML 字节切片。
```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Person struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age"`
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    data, err := xml.MarshalIndent(p, "", "  ")
    if err != nil {
        fmt.Println("Error marshalling:", err)
        return
    }
    fmt.Println(string(data))
}
```

## 2. XML 解码

### `xml.Unmarshal`
将 XML 字节切片解码为 Go 对象。
```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Person struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age"`
}

func main() {
    data := []byte(`<person><name>Alice</name><age>30</age></person>`)
    var p Person
    err := xml.Unmarshal(data, &p)
    if err != nil {
        fmt.Println("Error unmarshalling:", err)
        return
    }
    fmt.Printf("%+v\n", p)
}
```

## 3. 使用 `xml.Decoder` 和 `xml.Encoder`

### `xml.NewDecoder`
创建一个 XML 解码器，可以逐步从 `io.Reader` 读取 XML 数据。
```go
package main

import (
    "encoding/xml"
    "fmt"
    "strings"
)

type Person struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age"`
}

func main() {
    data := `<person><name>Alice</name><age>30</age></person>`
    reader := strings.NewReader(data)
    decoder := xml.NewDecoder(reader)

    var p Person
    err := decoder.Decode(&p)
    if err != nil {
        fmt.Println("Error decoding:", err)
        return
    }
    fmt.Printf("%+v\n", p)
}
```

### `xml.NewEncoder`
创建一个 XML 编码器，可以逐步向 `io.Writer` 写入 XML 数据。
```go
package main

import (
    "encoding/xml"
    "fmt"
    "os"
)

type Person struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age"`
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    encoder := xml.NewEncoder(os.Stdout)
    err := encoder.Encode(p)
    if err != nil {
        fmt.Println("Error encoding:", err)
    }
}
```

## 4. 自定义 XML 编码和解码

### 自定义标签名称
通过结构体标签自定义 XML 元素名称。
```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Person struct {
    XMLName xml.Name `xml:"person"`
    FullName string   `xml:"name"`
    Age      int      `xml:"age"`
}

func main() {
    p := Person{FullName: "Alice", Age: 30}
    data, err := xml.MarshalIndent(p, "", "  ")
    if err != nil {
        fmt.Println("Error marshalling:", err)
        return
    }
    fmt.Println(string(data))
}
```

### 嵌套结构的编码和解码
```go
package main

import (
    "encoding/xml"
    "fmt"
)

type Address struct {
    Street string `xml:"street"`
    City   string `xml:"city"`
}

type Person struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age"`
    Address Address  `xml:"address"`
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

    data, err := xml.MarshalIndent(p, "", "  ")
    if err != nil {
        fmt.Println("Error marshalling:", err)
        return
    }
    fmt.Println(string(data))

    var p2 Person
    err = xml.Unmarshal(data, &p2)
    if err != nil {
        fmt.Println("Error unmarshalling:", err)
        return
    }
    fmt.Printf("%+v\n", p2)
}
```

## 5. 处理复杂结构

### 使用 `xml.RawToken`
逐步处理 XML 令牌。
```go
package main

import (
    "encoding/xml"
    "fmt"
    "strings"
)

func main() {
    data := `<person><name>Alice</name><age>30</age></person>`
    reader := strings.NewReader(data)
    decoder := xml.NewDecoder(reader)

    for {
        token, err := decoder.RawToken()
        if err != nil {
            if err.Error() == "EOF" {
                break
            }
            fmt.Println("Error decoding:", err)
            return
        }
        fmt.Printf("%T: %v\n", token, token)
    }
}
```

### 使用 `xml.StartElement` 和 `xml.EndElement`
处理嵌套的 XML 元素。
```go
package main

import (
    "encoding/xml"
    "fmt"
    "strings"
)

type Person struct {
    Name string `xml:"name"`
    Age  int    `xml:"age"`
}

func main() {
    data := `<people><person><name>Alice</name><age>30</age></person><person><name>Bob</name><age>25</age></person></people>`
    reader := strings.NewReader(data)
    decoder := xml.NewDecoder(reader)

    var people []Person
    var person Person

    for {
        token, err := decoder.Token()
        if err != nil {
            if err.Error() == "EOF" {
                break
            }
            fmt.Println("Error decoding:", err)
            return
        }

        switch se := token.(type) {
        case xml.StartElement:
            if se.Name.Local == "person" {
                err := decoder.DecodeElement(&person, &se)
                if err != nil {
                    fmt.Println("Error decoding element:", err)
                    return
                }
                people = append(people, person)
            }
        }
    }

    for _, p := range people {
        fmt.Printf("%+v\n", p)
    }
}
```

通过以上这些 `encoding/xml` 包中的基本 API，你可以方便地在 Go 程序中处理 XML 数据。无论是简单的数据结构还是复杂的嵌套对象，都可以通过这些 API 进行高效的编码和解码操作。