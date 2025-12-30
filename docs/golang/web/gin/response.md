---
order: 4
---

# Gin - 响应处理

## JSON 响应

```go
// 使用 gin.H
c.JSON(200, gin.H{
    "code":    0,
    "message": "success",
    "data":    nil,
})

// 使用结构体
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data"`
}

c.JSON(200, Response{
    Code:    0,
    Message: "success",
    Data:    user,
})

// 格式化 JSON（带缩进）
c.IndentedJSON(200, data)

// 安全 JSON（防止 JSON 劫持）
c.SecureJSON(200, data)

// JSONP
c.JSONP(200, data)
```

## 其他响应格式

```go
// 字符串
c.String(200, "Hello %s", name)

// XML
c.XML(200, gin.H{"message": "success"})

// YAML
c.YAML(200, gin.H{"message": "success"})

// HTML
c.HTML(200, "index.html", gin.H{"title": "首页"})

// 文件
c.File("./files/logo.png")
c.FileAttachment("./files/report.pdf", "report.pdf")

// 重定向
c.Redirect(302, "/login")
```

## 设置响应头

```go
c.Header("X-Request-Id", "12345")
c.Header("Cache-Control", "no-cache")

// 设置 Cookie
c.SetCookie("token", "xxx", 3600, "/", "localhost", false, true)
```

## Context 上下文

### 存取值

```go
// 设置值
c.Set("user_id", 123)
c.Set("username", "admin")

// 获取值
userID, exists := c.Get("user_id")
if exists {
    fmt.Println(userID.(int))
}

// 获取指定类型
userID := c.GetInt("user_id")
username := c.GetString("username")
```

### 请求信息

```go
// 获取请求信息
c.Request.Method      // 请求方法
c.Request.URL.Path    // 请求路径
c.Request.Host        // 主机
c.ClientIP()          // 客户端 IP
c.FullPath()          // 路由路径（如 /user/:id）
```
