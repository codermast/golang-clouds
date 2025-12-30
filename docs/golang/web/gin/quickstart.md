---
order: 1
---

# Gin - 快速开始

Gin 是目前最流行的 Go Web 框架，以高性能和简洁 API 著称。

## 安装

```bash
go get -u github.com/gin-gonic/gin
```

## Hello World

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
