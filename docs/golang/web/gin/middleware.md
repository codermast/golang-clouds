---
order: 6
---

# Gin - 中间件

## 中间件原理

```go
// 中间件本质是一个 HandlerFunc
type HandlerFunc func(*Context)

// 使用中间件
r := gin.New()
r.Use(middleware1, middleware2)

// 分组使用
admin := r.Group("/admin")
admin.Use(Auth())
```

## 常用中间件示例

### 日志中间件

```go
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
```

### 认证中间件

```go
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
        
        // 验证 token...
        c.Set("user_id", 123)
        c.Next()
    }
}
```

### CORS 中间件

```go
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
```

### 请求 ID 中间件

```go
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
```

## 控制流程

```go
// Abort：终止后续处理
c.Abort()

// AbortWithStatus：终止并设置状态码
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
