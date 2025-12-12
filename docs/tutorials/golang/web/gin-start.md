---
order: 1
---

# Go - Gin 入门

Gin 是目前最流行的 Go Web 框架，以高性能和简洁 API 著称。

## 安装

```bash
go get -u github.com/gin-gonic/gin
```

## 快速开始

```go
package main

import "github.com/gin-gonic/gin"

func main() {
    // 创建默认引擎（包含 Logger 和 Recovery 中间件）
    r := gin.Default()
    
    // 定义路由
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "pong",
        })
    })
    
    // 启动服务
    r.Run(":8080")  // 默认监听 0.0.0.0:8080
}
```

## 路由

### 基本路由

```go
r := gin.Default()

// HTTP 方法
r.GET("/get", handler)
r.POST("/post", handler)
r.PUT("/put", handler)
r.DELETE("/delete", handler)
r.PATCH("/patch", handler)
r.HEAD("/head", handler)
r.OPTIONS("/options", handler)

// 匹配所有方法
r.Any("/any", handler)

// 匹配多个方法
r.Match([]string{"GET", "POST"}, "/match", handler)
```

### 路由参数

```go
// 路径参数
r.GET("/user/:id", func(c *gin.Context) {
    id := c.Param("id")
    c.String(200, "User ID: %s", id)
})

// 通配符参数
r.GET("/files/*filepath", func(c *gin.Context) {
    filepath := c.Param("filepath")
    c.String(200, "File: %s", filepath)
})

// /user/123 -> id = "123"
// /files/images/logo.png -> filepath = "/images/logo.png"
```

### 路由分组

```go
// API v1 分组
v1 := r.Group("/api/v1")
{
    v1.GET("/users", getUsers)
    v1.POST("/users", createUser)
    v1.GET("/users/:id", getUser)
}

// API v2 分组
v2 := r.Group("/api/v2")
{
    v2.GET("/users", getUsersV2)
}

// 嵌套分组
admin := r.Group("/admin")
{
    users := admin.Group("/users")
    {
        users.GET("/", listUsers)
        users.POST("/", createUser)
    }
}
```

## 请求处理

### 获取查询参数

```go
// GET /search?keyword=golang&page=1
r.GET("/search", func(c *gin.Context) {
    keyword := c.Query("keyword")           // "golang"
    page := c.DefaultQuery("page", "1")     // "1"
    size := c.DefaultQuery("size", "10")    // "10"（默认值）
    
    c.JSON(200, gin.H{
        "keyword": keyword,
        "page":    page,
        "size":    size,
    })
})
```

### 获取表单参数

```go
// POST /login (application/x-www-form-urlencoded)
r.POST("/login", func(c *gin.Context) {
    username := c.PostForm("username")
    password := c.PostForm("password")
    remember := c.DefaultPostForm("remember", "false")
    
    c.JSON(200, gin.H{
        "username": username,
        "remember": remember,
    })
})
```

### 获取 JSON 参数

```go
type LoginRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

r.POST("/login", func(c *gin.Context) {
    var req LoginRequest
    
    // 绑定 JSON
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, gin.H{
        "username": req.Username,
    })
})
```

### 获取请求头

```go
r.GET("/headers", func(c *gin.Context) {
    token := c.GetHeader("Authorization")
    contentType := c.ContentType()
    userAgent := c.GetHeader("User-Agent")
    
    c.JSON(200, gin.H{
        "token":       token,
        "contentType": contentType,
        "userAgent":   userAgent,
    })
})
```

## 响应处理

### JSON 响应

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

### 其他响应格式

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

### 设置响应头

```go
c.Header("X-Request-Id", "12345")
c.Header("Cache-Control", "no-cache")

// 设置 Cookie
c.SetCookie("token", "xxx", 3600, "/", "localhost", false, true)
```

## 参数绑定

### 绑定标签

```go
type User struct {
    ID       int    `uri:"id"`                              // 路径参数
    Name     string `form:"name" json:"name"`               // 查询/表单/JSON
    Email    string `form:"email" json:"email"`             // 查询/表单/JSON
    Password string `json:"password"`                       // 仅 JSON
    Token    string `header:"Authorization"`                // 请求头
}
```

### 绑定方法

```go
// 自动绑定（根据 Content-Type）
c.ShouldBind(&obj)

// 绑定 JSON
c.ShouldBindJSON(&obj)

// 绑定查询参数
c.ShouldBindQuery(&obj)

// 绑定路径参数
c.ShouldBindUri(&obj)

// 绑定请求头
c.ShouldBindHeader(&obj)

// Must 版本（失败时自动返回 400）
c.MustBind(&obj)
c.MustBindJSON(&obj)
```

### 绑定示例

```go
type CreateUserRequest struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=6"`
    Age      int    `json:"age" binding:"gte=0,lte=150"`
}

r.POST("/users", func(c *gin.Context) {
    var req CreateUserRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{
            "code":    400,
            "message": "参数错误",
            "error":   err.Error(),
        })
        return
    }
    
    // 创建用户...
    c.JSON(200, gin.H{
        "code":    0,
        "message": "创建成功",
    })
})
```

## 文件处理

### 文件上传

```go
// 单文件上传
r.POST("/upload", func(c *gin.Context) {
    file, err := c.FormFile("file")
    if err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // 保存文件
    dst := "./uploads/" + file.Filename
    if err := c.SaveUploadedFile(file, dst); err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, gin.H{
        "filename": file.Filename,
        "size":     file.Size,
    })
})

// 多文件上传
r.POST("/uploads", func(c *gin.Context) {
    form, _ := c.MultipartForm()
    files := form.File["files"]
    
    for _, file := range files {
        dst := "./uploads/" + file.Filename
        c.SaveUploadedFile(file, dst)
    }
    
    c.JSON(200, gin.H{
        "count": len(files),
    })
})

// 限制上传大小
r.MaxMultipartMemory = 8 << 20  // 8 MB
```

### 静态文件服务

```go
// 单个文件
r.StaticFile("/favicon.ico", "./assets/favicon.ico")

// 目录
r.Static("/assets", "./assets")
r.StaticFS("/files", http.Dir("./files"))
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

## 运行模式

```go
// 设置运行模式
gin.SetMode(gin.ReleaseMode)  // 生产模式
gin.SetMode(gin.DebugMode)    // 开发模式（默认）
gin.SetMode(gin.TestMode)     // 测试模式

// 或通过环境变量
// GIN_MODE=release ./app

// 创建不带默认中间件的引擎
r := gin.New()
r.Use(gin.Logger())
r.Use(gin.Recovery())
```
