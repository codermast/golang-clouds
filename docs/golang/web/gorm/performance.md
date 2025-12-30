---
order: 7
---

# GORM - 日志与性能

## 日志级别

```go
import "gorm.io/gorm/logger"

db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
    Logger: logger.Default.LogMode(logger.Info),
})

// 日志级别
// logger.Silent - 不输出
// logger.Error  - 只输出错误
// logger.Warn   - 输出错误和警告
// logger.Info   - 输出所有 SQL
```

## 自定义日志

```go
import (
    "log"
    "os"
    "time"
    "gorm.io/gorm/logger"
)

newLogger := logger.New(
    log.New(os.Stdout, "\r\n", log.LstdFlags),
    logger.Config{
        SlowThreshold:             time.Second,   // 慢查询阈值
        LogLevel:                  logger.Info,   // 日志级别
        IgnoreRecordNotFoundError: true,          // 忽略 ErrRecordNotFound
        Colorful:                  true,          // 彩色输出
    },
)

db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
    Logger: newLogger,
})
```

## Debug 模式

```go
// 单次查询开启 Debug
db.Debug().Where("name = ?", "张三").First(&user)

// 全局开启
db = db.Debug()
```

## 批量操作

```go
// 批量插入
users := []User{{Name: "张三"}, {Name: "李四"}, {Name: "王五"}}
db.CreateInBatches(users, 100)  // 每批 100 条

// 批量更新
db.Model(&User{}).Where("status = ?", "pending").Updates(map[string]interface{}{"status": "active"})
```

## 避免 N+1 问题

```go
// 错误：N+1 问题
var users []User
db.Find(&users)
for _, user := range users {
    db.Model(&user).Association("Articles").Find(&user.Articles)
}

// 正确：使用预加载
var users []User
db.Preload("Articles").Find(&users)
```

## 选择必要字段

```go
// 只查询必要字段
db.Select("id", "name").Find(&users)

// 避免 SELECT *
type UserBasic struct {
    ID   uint
    Name string
}
db.Model(&User{}).Find(&userBasics)
```

## 使用索引

```go
type User struct {
    ID    uint   `gorm:"primaryKey"`
    Name  string `gorm:"index"`
    Email string `gorm:"uniqueIndex"`
    Age   int    `gorm:"index:idx_age_status"`
    Status string `gorm:"index:idx_age_status"`
}

// 复合索引
type User struct {
    ID     uint
    Name   string
    Age    int
    Status string `gorm:"index:idx_status_age,priority:1"`
}
```
