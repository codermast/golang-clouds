---
order: 6
---

# Go - 接口

## 接口定义

接口是方法签名的集合，定义了一组行为。

```go
// 定义接口
type Animal interface {
    Speak() string
    Move() string
}

// 多个方法的接口
type ReadWriter interface {
    Read(p []byte) (n int, err error)
    Write(p []byte) (n int, err error)
}
```

## 接口实现

Go 的接口是隐式实现的，不需要 implements 关键字。

```go
type Animal interface {
    Speak() string
}

// Dog 实现 Animal 接口
type Dog struct {
    Name string
}

func (d Dog) Speak() string {
    return "汪汪汪"
}

// Cat 实现 Animal 接口
type Cat struct {
    Name string
}

func (c Cat) Speak() string {
    return "喵喵喵"
}

// 使用接口
func MakeSound(a Animal) {
    fmt.Println(a.Speak())
}

dog := Dog{Name: "旺财"}
cat := Cat{Name: "咪咪"}

MakeSound(dog)  // 汪汪汪
MakeSound(cat)  // 喵喵喵
```

## 空接口

空接口 `interface{}` 可以保存任意类型的值。

```go
// 空接口
var any interface{}

any = 42
any = "hello"
any = true
any = []int{1, 2, 3}

// 函数接收任意类型
func PrintValue(v interface{}) {
    fmt.Println(v)
}

// Go 1.18+ 可以使用 any 作为 interface{} 的别名
var value any = "hello"
```

## 类型断言

```go
var i interface{} = "hello"

// 类型断言
s := i.(string)
fmt.Println(s)  // hello

// 带检查的类型断言
s, ok := i.(string)
if ok {
    fmt.Println("是字符串:", s)
}

// 断言失败会 panic
// n := i.(int)  // panic!

// 安全的方式
if n, ok := i.(int); ok {
    fmt.Println("是整数:", n)
} else {
    fmt.Println("不是整数")
}
```

## 类型选择

```go
func describe(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("整数: %d\n", v)
    case string:
        fmt.Printf("字符串: %s\n", v)
    case bool:
        fmt.Printf("布尔: %t\n", v)
    case []int:
        fmt.Printf("整数切片: %v\n", v)
    default:
        fmt.Printf("未知类型: %T\n", v)
    }
}

describe(42)        // 整数: 42
describe("hello")   // 字符串: hello
describe(true)      // 布尔: true
describe([]int{1})  // 整数切片: [1]
```

## 接口组合

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// 组合接口
type ReadWriter interface {
    Reader
    Writer
}

// 等价于
type ReadWriter interface {
    Read(p []byte) (n int, err error)
    Write(p []byte) (n int, err error)
}
```

## 常用接口

### Stringer 接口

```go
type Stringer interface {
    String() string
}

type Person struct {
    Name string
    Age  int
}

func (p Person) String() string {
    return fmt.Sprintf("%s (%d岁)", p.Name, p.Age)
}

p := Person{Name: "张三", Age: 25}
fmt.Println(p)  // 张三 (25岁)
```

### error 接口

```go
type error interface {
    Error() string
}

// 自定义错误
type MyError struct {
    Code    int
    Message string
}

func (e *MyError) Error() string {
    return fmt.Sprintf("错误码: %d, 信息: %s", e.Code, e.Message)
}

func doSomething() error {
    return &MyError{Code: 500, Message: "内部错误"}
}
```

### io.Reader 和 io.Writer

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// 实现 Reader
type MyReader struct {
    data []byte
    pos  int
}

func (r *MyReader) Read(p []byte) (n int, err error) {
    if r.pos >= len(r.data) {
        return 0, io.EOF
    }
    n = copy(p, r.data[r.pos:])
    r.pos += n
    return n, nil
}
```

## 接口值

接口值由两部分组成：动态类型和动态值。

```go
var a Animal

fmt.Printf("类型: %T, 值: %v\n", a, a)
// 类型: <nil>, 值: <nil>

a = Dog{Name: "旺财"}
fmt.Printf("类型: %T, 值: %v\n", a, a)
// 类型: main.Dog, 值: {旺财}
```

### nil 接口值

```go
var a Animal  // nil 接口

// nil 接口调用方法会 panic
// a.Speak()  // panic!

if a != nil {
    a.Speak()
}
```

### 包含 nil 值的接口

```go
var d *Dog = nil
var a Animal = d

// a 不是 nil（类型不为空）
fmt.Println(a == nil)  // false

// 但调用方法时 d 是 nil
// a.Speak()  // 方法内部需要处理 nil
```

## 接口最佳实践

### 接口设计原则

1. **小接口优于大接口**

```go
// 好的设计：小接口
type Reader interface {
    Read(p []byte) (n int, err error)
}

// 避免：大而全的接口
type File interface {
    Read(p []byte) (n int, err error)
    Write(p []byte) (n int, err error)
    Close() error
    Seek(offset int64, whence int) (int64, error)
    // ... 更多方法
}
```

2. **在使用方定义接口**

```go
// 使用方定义需要的接口
type UserStore interface {
    GetUser(id int) (*User, error)
}

// 服务层只依赖接口
type UserService struct {
    store UserStore
}

func (s *UserService) GetUserName(id int) (string, error) {
    user, err := s.store.GetUser(id)
    if err != nil {
        return "", err
    }
    return user.Name, nil
}
```

3. **返回具体类型，接受接口**

```go
// 好的做法
func NewServer() *Server {
    return &Server{}
}

func Process(r io.Reader) error {
    // ...
}
```
