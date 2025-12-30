---
order : 13
---

# encoding/csv


在 Go 语言中，`encoding/csv` 包提供了对 CSV（逗号分隔值）文件进行读写的功能。以下是一些常用的 `encoding/csv` 包的 API 及其详细说明：


## 1. 读取 CSV 文件

### `csv.NewReader`
创建一个 CSV 读取器。
```go
package main

import (
    "encoding/csv"
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("data.csv")
    if err != nil {
        fmt.Println("Error opening file:", err)
        return
    }
    defer file.Close()

    reader := csv.NewReader(file)
    records, err := reader.ReadAll()
    if err != nil {
        fmt.Println("Error reading CSV:", err)
        return
    }

    for _, record := range records {
        fmt.Println(record)
    }
}
```

### `Read`
逐行读取 CSV 文件。
```go
package main

import (
    "encoding/csv"
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("data.csv")
    if err != nil {
        fmt.Println("Error opening file:", err)
        return
    }
    defer file.Close()

    reader := csv.NewReader(file)
    for {
        record, err := reader.Read()
        if err != nil {
            if err.Error() == "EOF" {
                break
            }
            fmt.Println("Error reading CSV:", err)
            return
        }
        fmt.Println(record)
    }
}
```

## 2. 写入 CSV 文件

### `csv.NewWriter`
创建一个 CSV 写入器。
```go
package main

import (
    "encoding/csv"
    "os"
)

func main() {
    file, err := os.Create("output.csv")
    if err != nil {
        fmt.Println("Error creating file:", err)
        return
    }
    defer file.Close()

    writer := csv.NewWriter(file)
    defer writer.Flush()

    data := [][]string{
        {"Name", "Age", "City"},
        {"Alice", "30", "New York"},
        {"Bob", "25", "Los Angeles"},
    }

    for _, record := range data {
        err := writer.Write(record)
        if err != nil {
            fmt.Println("Error writing CSV:", err)
            return
        }
    }
}
```

### `WriteAll`
一次性写入所有记录。
```go
package main

import (
    "encoding/csv"
    "os"
)

func main() {
    file, err := os.Create("output.csv")
    if err != nil {
        fmt.Println("Error creating file:", err)
        return
    }
    defer file.Close()

    writer := csv.NewWriter(file)
    defer writer.Flush()

    data := [][]string{
        {"Name", "Age", "City"},
        {"Alice", "30", "New York"},
        {"Bob", "25", "Los Angeles"},
    }

    err = writer.WriteAll(data)
    if err != nil {
        fmt.Println("Error writing CSV:", err)
    }
}
```

## 3. 自定义分隔符

### `Comma`
更改默认的分隔符（默认为逗号）。
```go
package main

import (
    "encoding/csv"
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("data.tsv")
    if err != nil {
        fmt.Println("Error opening file:", err)
        return
    }
    defer file.Close()

    reader := csv.NewReader(file)
    reader.Comma = '\t' // 使用制表符作为分隔符
    records, err := reader.ReadAll()
    if err != nil {
        fmt.Println("Error reading CSV:", err)
        return
    }

    for _, record := range records {
        fmt.Println(record)
    }
}
```

## 4. 处理大文件

### 逐行读取和处理
对于大文件，可以逐行读取和处理记录以节省内存。
```go
package main

import (
    "encoding/csv"
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("large_data.csv")
    if err != nil {
        fmt.Println("Error opening file:", err)
        return
    }
    defer file.Close()

    reader := csv.NewReader(file)
    for {
        record, err := reader.Read()
        if err != nil {
            if err.Error() == "EOF" {
                break
            }
            fmt.Println("Error reading CSV:", err)
            return
        }
        fmt.Println(record)
    }
}
```

## 5. 处理错误

### 自定义错误处理
在读取和写入过程中处理错误。
```go
package main

import (
    "encoding/csv"
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("data.csv")
    if err != nil {
        fmt.Println("Error opening file:", err)
        return
    }
    defer file.Close()

    reader := csv.NewReader(file)
    for {
        record, err := reader.Read()
        if err != nil {
            if err.Error() == "EOF" {
                break
            }
            fmt.Printf("Error reading record: %v\n", err)
            continue
        }
        fmt.Println(record)
    }
}
```

## 6. CSV 数据解析到结构体

### 使用结构体标签
将 CSV 数据解析为结构体。
```go
package main

import (
    "encoding/csv"
    "fmt"
    "os"
    "reflect"
    "strconv"
)

type Person struct {
    Name string
    Age  int
    City string
}

func main() {
    file, err := os.Open("data.csv")
    if err != nil {
        fmt.Println("Error opening file:", err)
        return
    }
    defer file.Close()

    reader := csv.NewReader(file)
    records, err := reader.ReadAll()
    if err != nil {
        fmt.Println("Error reading CSV:", err)
        return
    }

    var people []Person
    for _, record := range records[1:] { // 跳过标题行
        age, _ := strconv.Atoi(record[1])
        person := Person{
            Name: record[0],
            Age:  age,
            City: record[2],
        }
        people = append(people, person)
    }

    for _, person := range people {
        fmt.Printf("%+v\n", person)
    }
}
```

通过以上这些 `encoding/csv` 包中的基本 API，你可以方便地在 Go 程序中处理 CSV 数据。无论是简单的数据读写，还是复杂的自定义处理，都可以通过这些 API 进行高效的操作。