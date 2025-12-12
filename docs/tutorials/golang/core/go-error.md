---
order: 8
---

# Go - 错误处理

Go 使用显式的错误返回值来处理错误，而不是异常机制。

## error 接口

```go
type error interface {
    Error() string
}
```

## 创建错误

```go
import (
    "errors"
    "fmt"
)

// 方式一：errors.New
err := errors.New("发生错误")

// 方式二：fmt.Errorf
err := fmt.Errorf("用户 %d 不存在", userId)

// 方式三：自定义错误类型
type MyError struct {
    Code    int
    Message string
}

func (e *MyError) Error() string {
    return fmt.Sprintf("错误码: %d, 信息: %s", e.Code, e.Message)
}
```

## 错误处理模式

### 基本模式

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("除数不能为零")
    }
    return a / b, nil
}

result, err := divide(10, 0)
if err != nil {
    fmt.Println("错误:", err)
    return
}
fmt.Println("结果:", result)
```

### 错误包装（Go 1.13+）

```go
// 包装错误
originalErr := errors.New("原始错误")
wrappedErr := fmt.Errorf("操作失败: %w", originalErr)

// 解包错误
fmt.Println(errors.Unwrap(wrappedErr))  // 原始错误

// 检查错误链
if errors.Is(wrappedErr, originalErr) {
    fmt.Println("包含原始错误")
}

// 类型断言
var myErr *MyError
if errors.As(wrappedErr, &myErr) {
    fmt.Println("错误码:", myErr.Code)
}
```

### 哨兵错误

```go
// 定义哨兵错误
var (
    ErrNotFound     = errors.New("未找到")
    ErrUnauthorized = errors.New("未授权")
    ErrForbidden    = errors.New("禁止访问")
)

func getUser(id int) (*User, error) {
    user := db.Find(id)
    if user == nil {
        return nil, ErrNotFound
    }
    return user, nil
}

// 使用
user, err := getUser(1)
if errors.Is(err, ErrNotFound) {
    fmt.Println("用户不存在")
}
```

## 自定义错误类型

```go
// 业务错误
type BusinessError struct {
    Code    int
    Message string
    Cause   error
}

func (e *BusinessError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Cause)
    }
    return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func (e *BusinessError) Unwrap() error {
    return e.Cause
}

// 使用
func validateUser(user *User) error {
    if user.Name == "" {
        return &BusinessError{
            Code:    400,
            Message: "用户名不能为空",
        }
    }
    return nil
}

// 错误码常量
const (
    ErrCodeNotFound    = 404
    ErrCodeBadRequest  = 400
    ErrCodeServerError = 500
)

func NewNotFoundError(msg string) error {
    return &BusinessError{Code: ErrCodeNotFound, Message: msg}
}
```

## panic 和 recover

### panic

panic 用于不可恢复的错误，会导致程序崩溃。

```go
func mustPositive(n int) {
    if n <= 0 {
        panic("数字必须为正数")
    }
}

// panic 会展开调用栈，执行 defer
func example() {
    defer fmt.Println("defer 执行")
    panic("发生 panic")
    fmt.Println("不会执行")
}
```

### recover

recover 用于捕获 panic，阻止程序崩溃。

```go
func safeCall() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("捕获 panic:", r)
        }
    }()
    
    panic("发生错误")
}

func main() {
    safeCall()
    fmt.Println("程序继续运行")
}
```

### 实际应用

```go
// HTTP 服务器中捕获 panic
func RecoverMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("panic: %v\n%s", err, debug.Stack())
                http.Error(w, "Internal Server Error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

## 错误处理最佳实践

### 1. 错误应该被处理

```go
// 不好：忽略错误
file, _ := os.Open("file.txt")

// 好：处理错误
file, err := os.Open("file.txt")
if err != nil {
    return fmt.Errorf("打开文件失败: %w", err)
}
```

### 2. 添加上下文信息

```go
// 不好：直接返回
return err

// 好：添加上下文
return fmt.Errorf("处理用户 %d 时出错: %w", userId, err)
```

### 3. 只在顶层打印日志

```go
// 底层函数：只返回错误
func getUser(id int) (*User, error) {
    user, err := db.Query(id)
    if err != nil {
        return nil, fmt.Errorf("查询用户失败: %w", err)
    }
    return user, nil
}

// 顶层函数：打印日志
func handleRequest() {
    user, err := getUser(1)
    if err != nil {
        log.Printf("请求处理失败: %v", err)
        // 返回错误响应
    }
}
```

### 4. 使用错误类型区分处理

```go
func handleError(err error) {
    var bizErr *BusinessError
    if errors.As(err, &bizErr) {
        switch bizErr.Code {
        case 400:
            // 客户端错误
        case 500:
            // 服务器错误
        }
        return
    }
    
    if errors.Is(err, context.Canceled) {
        // 请求被取消
        return
    }
    
    // 未知错误
    log.Printf("未知错误: %v", err)
}
```

### 5. Must 函数

```go
// 用于初始化阶段，失败则 panic
func MustCompile(pattern string) *regexp.Regexp {
    re, err := regexp.Compile(pattern)
    if err != nil {
        panic(err)
    }
    return re
}

// 使用
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
```

## 错误处理库

### github.com/pkg/errors

```go
import "github.com/pkg/errors"

// 包装错误（带堆栈）
err := errors.Wrap(originalErr, "操作失败")

// 获取堆栈
fmt.Printf("%+v\n", err)

// 获取原因
cause := errors.Cause(err)
```
