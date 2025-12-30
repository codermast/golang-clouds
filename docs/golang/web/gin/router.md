---
order: 2
---

# Gin - 路由

## 基本路由

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

## 路由参数

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

## 路由分组

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
