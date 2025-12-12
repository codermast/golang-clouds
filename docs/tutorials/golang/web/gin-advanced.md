---
order: 2
---

# Go - Gin 进阶

掌握 Gin 的中间件、参数校验、错误处理等进阶功能。

## 中间件

### 中间件原理

```go
// 中间件本质是一个 HandlerFunc
type HandlerFunc func(*Context)

// 中间件通过 Next() 调用下一个处理函数
func MyMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 请求前
        fmt.Println("Before request")
        
        c.Next()  // 调用后续处理函数
        
        // 请求后
        fmt.Println("After request")
    }
}
```

### 全局中间件

```go
r := gin.New()

// 注册全局中间件
r.Use(gin.Logger())
r.Use(gin.Recovery())
r.Use(MyMiddleware())
```

### 路由组中间件

```go
// 路由组使用中间件
api := r.Group("/api")
api.Use(AuthMiddleware())
{
    api.GET("/users", getUsers)
    api.POST("/users", createUser)
}

// 单个路由使用中间件
r.GET("/admin", AuthMiddleware(), AdminMiddleware(), adminHandler)
```

### 常用中间件示例

```go
// 1. 日志中间件
func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        
        c.Next()
        
        latency := time.Since(start)
        status := c.Writer.Status()
        
        log.Printf("[%d] %s %s %v",
            status, c.Request.Method, path, latency)
    }
}

// 2. 认证中间件
func Auth() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        
        if token == "" {
            c.AbortWithStatusJSON(401, gin.H{
                "code":    401,
                "message": "未授权",
            })
            return
        }
        
        // 验证 token
        userID, err := validateToken(token)
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{
                "code":    401,
                "message": "token 无效",
            })
            return
        }
        
        // 设置用户信息
        c.Set("user_id", userID)
        c.Next()
    }
}

// 3. 跨域中间件
func CORS() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    }
}

// 4. 请求 ID 中间件
func RequestID() gin.HandlerFunc {
    return func(c *gin.Context) {
        requestID := c.GetHeader("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }
        
        c.Set("request_id", requestID)
        c.Header("X-Request-ID", requestID)
        c.Next()
    }
}

// 5. 限流中间件
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
    limiter := rate.NewLimiter(rate.Every(window/time.Duration(limit)), limit)
    
    return func(c *gin.Context) {
        if !limiter.Allow() {
            c.AbortWithStatusJSON(429, gin.H{
                "code":    429,
                "message": "请求过于频繁",
            })
            return
        }
        c.Next()
    }
}
```

### 中间件控制

```go
// Abort：终止后续处理
c.Abort()

// AbortWithStatus：终止并返回状态码
c.AbortWithStatus(401)

// AbortWithStatusJSON：终止并返回 JSON
c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})

// Next：调用下一个处理函数
c.Next()

// 判断是否已终止
if c.IsAborted() {
    return
}
```

## 参数校验

### validator 标签

```go
type User struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"gte=0,lte=150"`
    Phone    string `json:"phone" binding:"required,len=11"`
    Password string `json:"password" binding:"required,min=6,max=20"`
    Role     string `json:"role" binding:"oneof=admin user guest"`
    Website  string `json:"website" binding:"omitempty,url"`
}
```

### 常用验证规则

| 标签            | 说明                 |
| :-------------- | :------------------- |
| required        | 必填                 |
| omitempty       | 可选（空值跳过验证） |
| min=n           | 最小长度/值          |
| max=n           | 最大长度/值          |
| len=n           | 固定长度             |
| eq=n            | 等于                 |
| ne=n            | 不等于               |
| gt=n            | 大于                 |
| gte=n           | 大于等于             |
| lt=n            | 小于                 |
| lte=n           | 小于等于             |
| oneof=a b c     | 枚举值               |
| email           | 邮箱格式             |
| url             | URL 格式             |
| uuid            | UUID 格式            |
| datetime=layout | 日期时间格式         |
| contains=s      | 包含字符串           |
| excludes=s      | 不包含字符串         |
| startswith=s    | 以...开头            |
| endswith=s      | 以...结尾            |

### 自定义验证器

```go
import "github.com/go-playground/validator/v10"

// 自定义验证函数
func validatePhone(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    matched, _ := regexp.MatchString(`^1[3-9]\d{9}$`, phone)
    return matched
}

// 注册自定义验证器
func init() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("phone", validatePhone)
    }
}

// 使用
type User struct {
    Phone string `json:"phone" binding:"required,phone"`
}
```

### 自定义错误消息

```go
import (
    "github.com/go-playground/validator/v10"
    "github.com/gin-gonic/gin/binding"
)

// 翻译错误消息
func translateError(err error) string {
    if errs, ok := err.(validator.ValidationErrors); ok {
        var messages []string
        for _, e := range errs {
            switch e.Tag() {
            case "required":
                messages = append(messages, fmt.Sprintf("%s 不能为空", e.Field()))
            case "min":
                messages = append(messages, fmt.Sprintf("%s 最小长度为 %s", e.Field(), e.Param()))
            case "max":
                messages = append(messages, fmt.Sprintf("%s 最大长度为 %s", e.Field(), e.Param()))
            case "email":
                messages = append(messages, fmt.Sprintf("%s 格式不正确", e.Field()))
            default:
                messages = append(messages, fmt.Sprintf("%s 验证失败", e.Field()))
            }
        }
        return strings.Join(messages, "; ")
    }
    return err.Error()
}

// 使用
r.POST("/users", func(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{
            "code":    400,
            "message": translateError(err),
        })
        return
    }
    // ...
})
```

## 错误处理

### 统一响应格式

```go
// 响应结构
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

// 成功响应
func Success(c *gin.Context, data interface{}) {
    c.JSON(200, Response{
        Code:    0,
        Message: "success",
        Data:    data,
    })
}

// 错误响应
func Error(c *gin.Context, code int, message string) {
    c.JSON(200, Response{
        Code:    code,
        Message: message,
    })
}

// 使用
r.GET("/users/:id", func(c *gin.Context) {
    user, err := getUser(c.Param("id"))
    if err != nil {
        Error(c, 404, "用户不存在")
        return
    }
    Success(c, user)
})
```

### 自定义错误

```go
// 业务错误
type BizError struct {
    Code    int
    Message string
}

func (e *BizError) Error() string {
    return e.Message
}

// 常见错误
var (
    ErrNotFound     = &BizError{404, "资源不存在"}
    ErrUnauthorized = &BizError{401, "未授权"}
    ErrForbidden    = &BizError{403, "禁止访问"}
    ErrBadRequest   = &BizError{400, "请求参数错误"}
)

// 错误处理中间件
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        // 获取错误
        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err
            
            if bizErr, ok := err.(*BizError); ok {
                c.JSON(200, Response{
                    Code:    bizErr.Code,
                    Message: bizErr.Message,
                })
                return
            }
            
            // 未知错误
            c.JSON(500, Response{
                Code:    500,
                Message: "服务器内部错误",
            })
        }
    }
}

// 使用
r.Use(ErrorHandler())

r.GET("/users/:id", func(c *gin.Context) {
    user, err := getUser(c.Param("id"))
    if err != nil {
        c.Error(ErrNotFound)  // 记录错误
        return
    }
    Success(c, user)
})
```

### Panic Recovery

```go
// 自定义 Recovery
func CustomRecovery() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                // 记录日志
                log.Printf("Panic: %v\n%s", err, debug.Stack())
                
                // 返回错误
                c.JSON(500, Response{
                    Code:    500,
                    Message: "服务器内部错误",
                })
                c.Abort()
            }
        }()
        c.Next()
    }
}

r.Use(CustomRecovery())
```

## HTML 模板

### 加载模板

```go
// 加载模板文件
r.LoadHTMLGlob("templates/*")
// 或
r.LoadHTMLFiles("templates/index.html", "templates/user.html")

// 渲染模板
r.GET("/", func(c *gin.Context) {
    c.HTML(200, "index.html", gin.H{
        "title": "首页",
        "users": users,
    })
})
```

### 自定义模板函数

```go
import "html/template"

r.SetFuncMap(template.FuncMap{
    "formatDate": func(t time.Time) string {
        return t.Format("2006-01-02 15:04:05")
    },
    "upper": strings.ToUpper,
})

r.LoadHTMLGlob("templates/*")

// 在模板中使用
// {{ formatDate .CreatedAt }}
// {{ upper .Name }}
```

## 优雅关闭

```go
func main() {
    r := gin.Default()
    
    // 路由配置...
    
    srv := &http.Server{
        Addr:    ":8080",
        Handler: r,
    }
    
    // 启动服务
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("listen: %s\n", err)
        }
    }()
    
    // 等待中断信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("Shutting down server...")
    
    // 优雅关闭
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    log.Println("Server exiting")
}
```
