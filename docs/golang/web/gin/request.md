---
order: 3
---

# Gin - 请求处理

## 获取查询参数

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

## 获取表单参数

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

## 获取 JSON 参数

```go
type LoginRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

r.POST("/login", func(c *gin.Context) {
    var req LoginRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, gin.H{
        "username": req.Username,
    })
})
```

## 获取请求头

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
