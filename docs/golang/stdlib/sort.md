---
order : 5
---

# order 

在 Go 语言中，`sort` 包提供了对切片和用户定义的集合进行排序的函数。它实现了常见的排序算法，如快速排序（Quicksort）和堆排序（Heapsort），并且为自定义集合提供了接口，使得用户可以根据特定的需求进行排序。

以下是 `sort` 包中常用的函数和接口：

## 1. 排序函数

- **`sort.Ints`**: 对整数类型的切片进行升序排序。
  ```go
  import "sort"

  func main() {
      ints := []int{3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5}
      sort.Ints(ints)
      fmt.Println(ints) // 输出: [1 1 2 3 3 4 5 5 5 6 9]
  }
  ```

- **`sort.Float64s`**: 对浮点数类型的切片进行升序排序。
- **`sort.Strings`**: 对字符串类型的切片进行升序排序。

## 2. 自定义排序

通过实现 `sort.Interface` 接口，可以对用户定义的集合进行排序。该接口包括 `Len()`、`Less(i, j int)` 和 `Swap(i, j int)` 方法，用于描述集合的长度、比较元素大小的规则以及交换元素的位置。

```go
type Person struct {
    Name string
    Age  int
}

type ByAge []Person

func (a ByAge) Len() int           { return len(a) }
func (a ByAge) Less(i, j int) bool { return a[i].Age < a[j].Age }
func (a ByAge) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

func main() {
    people := []Person{
        {"Alice", 25},
        {"Bob", 30},
        {"Charlie", 20},
    }

    sort.Sort(ByAge(people))

    fmt.Println("Sorted by age:")
    for _, p := range people {
        fmt.Printf("%s (%d)\n", p.Name, p.Age)
    }
}
```

## 3. 排序稳定性

Go 语言的排序函数是稳定的，即相等元素的相对顺序在排序后保持不变。

## 4. 其他排序函数

- **`sort.Sort`**: 对实现了 `sort.Interface` 接口的集合进行排序。
- **`sort.Search`**: 在已排序的集合中搜索元素。

**示例**

以下是一个结合了自定义排序和使用 `sort.Sort` 的例子：

```go
package main

import (
    "fmt"
    "sort"
)

type Person struct {
    Name string
    Age  int
}

type ByName []Person

func (a ByName) Len() int           { return len(a) }
func (a ByName) Less(i, j int) bool { return a[i].Name < a[j].Name }
func (a ByName) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

func main() {
    people := []Person{
        {"Alice", 25},
        {"Bob", 30},
        {"Charlie", 20},
    }

    sort.Sort(ByName(people))

    fmt.Println("Sorted by name:")
    for _, p := range people {
        fmt.Printf("%s (%d)\n", p.Name, p.Age)
    }
}
```

在这个示例中，我们定义了 `Person` 结构体和 `ByName` 类型来实现按照姓名排序的需求。通过 `sort.Sort(ByName(people))` 对 `people` 切片按照姓名进行排序，然后打印出排序后的结果。

通过 `sort` 包，Go 语言提供了强大且简洁的排序功能，可以方便地对各种类型的数据进行排序操作。