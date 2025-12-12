---
order: 5
---

# Go - 复合类型

## 数组

数组是固定长度的同类型元素序列。

### 声明和初始化

```go
// 声明
var arr1 [5]int  // [0 0 0 0 0]

// 声明并初始化
var arr2 = [5]int{1, 2, 3, 4, 5}

// 简写
arr3 := [5]int{1, 2, 3, 4, 5}

// 部分初始化
arr4 := [5]int{1, 2, 3}  // [1 2 3 0 0]

// 指定索引初始化
arr5 := [5]int{0: 1, 4: 5}  // [1 0 0 0 5]

// 自动推断长度
arr6 := [...]int{1, 2, 3, 4, 5}  // 长度为 5
```

### 数组操作

```go
arr := [5]int{1, 2, 3, 4, 5}

// 访问元素
fmt.Println(arr[0])  // 1

// 修改元素
arr[0] = 10

// 获取长度
len(arr)  // 5

// 遍历
for i := 0; i < len(arr); i++ {
    fmt.Println(arr[i])
}

for index, value := range arr {
    fmt.Println(index, value)
}
```

### 多维数组

```go
// 二维数组
var matrix [3][4]int

matrix := [3][4]int{
    {1, 2, 3, 4},
    {5, 6, 7, 8},
    {9, 10, 11, 12},
}

// 访问
matrix[0][1]  // 2
```

::: warning 注意
数组是值类型，赋值和传参会复制整个数组。长度是数组类型的一部分，`[3]int` 和 `[5]int` 是不同类型。
:::

## 切片

切片是对数组的引用，是动态长度的序列。

### 创建切片

```go
// 从数组创建
arr := [5]int{1, 2, 3, 4, 5}
s1 := arr[1:4]  // [2 3 4]，索引 1 到 3

// 直接声明
var s2 []int  // nil 切片

// 使用字面量
s3 := []int{1, 2, 3, 4, 5}

// 使用 make
s4 := make([]int, 5)      // 长度 5，容量 5
s5 := make([]int, 5, 10)  // 长度 5，容量 10
```

### 切片操作

```go
s := []int{1, 2, 3, 4, 5}

// 长度和容量
len(s)  // 5
cap(s)  // 5

// 切片表达式
s[1:3]   // [2 3]
s[:3]    // [1 2 3]
s[2:]    // [3 4 5]
s[:]     // [1 2 3 4 5]

// 追加元素
s = append(s, 6)        // [1 2 3 4 5 6]
s = append(s, 7, 8, 9)  // 追加多个元素

// 追加切片
s2 := []int{10, 11}
s = append(s, s2...)  // 注意 ... 展开

// 复制切片
src := []int{1, 2, 3}
dst := make([]int, len(src))
copy(dst, src)
```

### 切片扩容

```go
// 当容量不足时，append 会创建新的底层数组
s := make([]int, 0, 4)
fmt.Printf("len=%d cap=%d\n", len(s), cap(s))  // len=0 cap=4

for i := 0; i < 10; i++ {
    s = append(s, i)
    fmt.Printf("len=%d cap=%d\n", len(s), cap(s))
}
// 容量增长：4 -> 8 -> 16
```

### 删除元素

```go
s := []int{1, 2, 3, 4, 5}

// 删除索引 2 的元素
s = append(s[:2], s[3:]...)  // [1 2 4 5]

// 删除第一个元素
s = s[1:]

// 删除最后一个元素
s = s[:len(s)-1]
```

## Map

Map 是键值对的无序集合。

### 创建 Map

```go
// 使用 make
m1 := make(map[string]int)

// 字面量
m2 := map[string]int{
    "apple":  1,
    "banana": 2,
    "cherry": 3,
}

// 空 map
m3 := map[string]int{}
```

### Map 操作

```go
m := make(map[string]int)

// 添加/修改
m["apple"] = 1
m["banana"] = 2

// 获取值
value := m["apple"]  // 1

// 检查键是否存在
value, ok := m["cherry"]
if ok {
    fmt.Println("存在:", value)
} else {
    fmt.Println("不存在")
}

// 删除
delete(m, "apple")

// 获取长度
len(m)

// 遍历
for key, value := range m {
    fmt.Printf("%s: %d\n", key, value)
}
```

### Map 注意事项

```go
// nil map 不能写入
var m map[string]int
m["key"] = 1  // panic!

// Map 是引用类型
m1 := map[string]int{"a": 1}
m2 := m1
m2["b"] = 2
fmt.Println(m1)  // map[a:1 b:2]

// Map 不是并发安全的
// 并发读写需要加锁或使用 sync.Map
```

## 结构体

### 定义结构体

```go
type Person struct {
    Name string
    Age  int
    City string
}

// 嵌套结构体
type Employee struct {
    Person    // 匿名嵌入
    Company string
    Salary  float64
}
```

### 创建实例

```go
// 方式一：零值
var p1 Person  // {"" 0 ""}

// 方式二：字面量
p2 := Person{"张三", 25, "北京"}

// 方式三：字段名初始化
p3 := Person{
    Name: "李四",
    Age:  30,
    City: "上海",
}

// 方式四：new 函数
p4 := new(Person)  // 返回指针

// 方式五：取地址
p5 := &Person{Name: "王五", Age: 28}
```

### 访问字段

```go
p := Person{Name: "张三", Age: 25}

// 访问
fmt.Println(p.Name)

// 修改
p.Age = 26

// 指针访问（自动解引用）
ptr := &p
fmt.Println(ptr.Name)  // 等同于 (*ptr).Name
ptr.Age = 27
```

### 匿名结构体

```go
// 临时使用
person := struct {
    Name string
    Age  int
}{
    Name: "张三",
    Age:  25,
}
```

### 结构体标签

```go
type User struct {
    ID       int    `json:"id" db:"user_id"`
    Username string `json:"username" db:"user_name"`
    Email    string `json:"email,omitempty"`
    Password string `json:"-"`  // 忽略
}

// 读取标签
t := reflect.TypeOf(User{})
field, _ := t.FieldByName("Username")
fmt.Println(field.Tag.Get("json"))  // username
```

### 结构体比较

```go
// 所有字段都可比较时，结构体可以比较
p1 := Person{Name: "张三", Age: 25}
p2 := Person{Name: "张三", Age: 25}
fmt.Println(p1 == p2)  // true

// 包含不可比较字段（slice, map, func）时不能比较
type Data struct {
    Values []int
}
// d1 == d2  // 编译错误
```

## 类型别名和自定义类型

```go
// 类型别名（完全相同的类型）
type MyInt = int

// 自定义类型（新类型）
type Age int

var a Age = 25
var b int = 25
// a = b  // 错误，类型不同
a = Age(b)  // 需要转换
```
