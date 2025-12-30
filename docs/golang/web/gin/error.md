---
order: 8
---

# Gin - 错误处理

## 统一响应格式

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
```

## 业务错误

```go
// 自定义业务错误
type BizError struct {
    Code    int
    Message string
}

func (e *BizError) Error() string {
    return e.Message
}

// 预定义错误
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
            } else {
                c.JSON(500, Response{
                    Code:    500,
                    Message: "服务器内部错误",
                })
            }
        }
    }
}
```

## 自定义 Recovery

```go
func CustomRecovery() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                // 记录错误日志
                log.Printf("Panic: %v\n%s", err, debug.Stack())
                
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

## 优雅关闭

```go
func main() {
    r := gin.Default()
    
    // 配置路由...
    
    srv := &http.Server{
        Addr:    ":8080",
        Handler: r,
    }
    
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("listen: %s\n", err)
        }
    }()
    
    // 等待中断信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("Shutdown Server ...")
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    log.Println("Server exiting")
}
```
