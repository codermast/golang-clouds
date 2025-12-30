---
order: 2
---

# GORM - 模型定义

## 基本模型

```go
type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"size:100;not null"`
    Email     string    `gorm:"size:100;uniqueIndex"`
    Age       int       `gorm:"default:0"`
    Birthday  time.Time
    CreatedAt time.Time
    UpdatedAt time.Time
}

// 自定义表名
func (User) TableName() string {
    return "users"
}
```

## 使用 gorm.Model

```go
// gorm.Model 包含 ID、CreatedAt、UpdatedAt、DeletedAt
type User struct {
    gorm.Model        // 嵌入
    Name   string
    Email  string
}

// 等价于
type User struct {
    ID        uint           `gorm:"primaryKey"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
    Name      string
    Email     string
}
```

## 常用标签

| 标签           | 说明               |
| :------------- | :----------------- |
| column         | 指定列名           |
| type           | 指定列类型         |
| size           | 指定大小           |
| primaryKey     | 主键               |
| unique         | 唯一               |
| uniqueIndex    | 唯一索引           |
| index          | 普通索引           |
| not null       | 非空               |
| default        | 默认值             |
| autoIncrement  | 自增               |
| embedded       | 嵌入结构体         |
| embeddedPrefix | 嵌入结构体字段前缀 |
| -              | 忽略字段           |

```go
type User struct {
    ID        uint   `gorm:"primaryKey;autoIncrement"`
    Name      string `gorm:"column:user_name;size:100;not null"`
    Email     string `gorm:"type:varchar(100);uniqueIndex"`
    Age       int    `gorm:"default:18"`
    Ignore    string `gorm:"-"`  // 忽略
    CreatedAt time.Time
}
```

## 自动迁移

```go
// 自动创建/更新表结构
db.AutoMigrate(&User{}, &Product{}, &Order{})
```
