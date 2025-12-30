---
order: 5
---

# Gin - 文件处理

## 文件上传

### 单文件上传

```go
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
```

### 多文件上传

```go
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

## 静态文件服务

```go
// 单个文件
r.StaticFile("/favicon.ico", "./assets/favicon.ico")

// 目录
r.Static("/assets", "./assets")
r.StaticFS("/files", http.Dir("./files"))
```
