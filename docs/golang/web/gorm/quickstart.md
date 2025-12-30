---
order: 1
---

# GORM - 快速开始

GORM 是 Go 语言最流行的 ORM 库，功能强大，使用简单。

## 安装

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql    # MySQL 驱动
go get -u gorm.io/driver/postgres # PostgreSQL 驱动
go get -u gorm.io/driver/sqlite   # SQLite 驱动
```

## 连接数据库

### MySQL

```go
import (
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

func initDB() *gorm.DB {
    dsn := "user:password@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
    
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("failed to connect database")
    }
    
    return db
}
```

### PostgreSQL

```go
import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func initDB() *gorm.DB {
    dsn := "host=localhost user=postgres password=password dbname=test port=5432 sslmode=disable"
    
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("failed to connect database")
    }
    
    return db
}
```

### 连接池配置

```go
db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

sqlDB, _ := db.DB()

// 连接池配置
sqlDB.SetMaxIdleConns(10)           // 最大空闲连接数
sqlDB.SetMaxOpenConns(100)          // 最大打开连接数
sqlDB.SetConnMaxLifetime(time.Hour) // 连接最大生命周期
```
