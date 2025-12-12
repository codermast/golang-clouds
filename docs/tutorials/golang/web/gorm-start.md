---
order: 3
---

# Go - GORM 入门

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

## 模型定义

### 基本模型

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

### 使用 gorm.Model

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

### 常用标签

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

### 自动迁移

```go
// 自动创建/更新表结构
db.AutoMigrate(&User{}, &Product{}, &Order{})
```

## CRUD 操作

### 创建

```go
// 创建单条记录
user := User{Name: "张三", Email: "zhangsan@example.com", Age: 25}
result := db.Create(&user)

fmt.Println(user.ID)           // 获取自增 ID
fmt.Println(result.Error)      // 错误信息
fmt.Println(result.RowsAffected) // 影响行数

// 批量创建
users := []User{
    {Name: "张三", Email: "zhangsan@example.com"},
    {Name: "李四", Email: "lisi@example.com"},
}
db.Create(&users)

// 指定字段创建
db.Select("Name", "Email").Create(&user)

// 忽略字段创建
db.Omit("Age").Create(&user)
```

### 查询

```go
// 查询单条
var user User
db.First(&user)                   // 主键升序第一条
db.First(&user, 10)               // 主键为 10 的记录
db.First(&user, "id = ?", 10)     // 条件查询
db.Last(&user)                    // 主键降序第一条
db.Take(&user)                    // 不排序，取一条

// 查询多条
var users []User
db.Find(&users)                   // 所有记录
db.Find(&users, []int{1, 2, 3})   // 主键在列表中

// 条件查询
db.Where("name = ?", "张三").First(&user)
db.Where("name = ? AND age >= ?", "张三", 18).Find(&users)
db.Where("name IN ?", []string{"张三", "李四"}).Find(&users)
db.Where("name LIKE ?", "%张%").Find(&users)
db.Where("created_at > ?", time.Now().AddDate(0, 0, -7)).Find(&users)

// 结构体条件（零值会被忽略）
db.Where(&User{Name: "张三", Age: 0}).Find(&users)  // 只匹配 name

// Map 条件
db.Where(map[string]interface{}{"name": "张三", "age": 0}).Find(&users)

// 内联条件
db.Find(&users, "name = ?", "张三")
db.Find(&users, User{Name: "张三"})

// Or 条件
db.Where("name = ?", "张三").Or("name = ?", "李四").Find(&users)

// Not 条件
db.Not("name = ?", "张三").Find(&users)
```

### 更新

```go
// 更新单个字段
db.Model(&user).Update("name", "王五")

// 更新多个字段
db.Model(&user).Updates(User{Name: "王五", Age: 30})  // 零值不更新
db.Model(&user).Updates(map[string]interface{}{"name": "王五", "age": 0})  // 零值也更新

// 条件更新
db.Model(&User{}).Where("age > ?", 18).Update("status", "adult")

// Select 指定字段更新
db.Model(&user).Select("Name", "Age").Updates(User{Name: "王五", Age: 30})

// Omit 排除字段更新
db.Model(&user).Omit("Age").Updates(User{Name: "王五", Age: 30})

// 表达式更新
db.Model(&user).Update("age", gorm.Expr("age + ?", 1))
```

### 删除

```go
// 删除单条
db.Delete(&user)
db.Delete(&user, 10)  // 主键为 10

// 条件删除
db.Where("name = ?", "张三").Delete(&User{})
db.Delete(&User{}, "name = ?", "张三")

// 批量删除
db.Delete(&User{}, []int{1, 2, 3})

// 软删除（需要 DeletedAt 字段）
// 默认使用软删除，记录不会真正删除
db.Delete(&user)  // UPDATE users SET deleted_at = NOW() WHERE id = 1

// 查询包含软删除的记录
db.Unscoped().Find(&users)

// 永久删除
db.Unscoped().Delete(&user)
```

## 高级查询

### 选择字段

```go
// 选择特定字段
db.Select("name", "email").Find(&users)
db.Select("name, email").Find(&users)

// 排除字段
db.Omit("password").Find(&users)
```

### 排序

```go
db.Order("age desc, name asc").Find(&users)
db.Order("age desc").Order("name").Find(&users)
```

### 分页

```go
db.Limit(10).Offset(0).Find(&users)   // 第 1 页
db.Limit(10).Offset(10).Find(&users)  // 第 2 页

// 分页封装
func Paginate(page, pageSize int) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        offset := (page - 1) * pageSize
        return db.Offset(offset).Limit(pageSize)
    }
}

db.Scopes(Paginate(1, 10)).Find(&users)
```

### 分组和聚合

```go
type Result struct {
    Age   int
    Count int
}

var results []Result
db.Model(&User{}).
    Select("age, count(*) as count").
    Group("age").
    Having("count > ?", 1).
    Find(&results)
```

### 原生 SQL

```go
// 原生查询
var users []User
db.Raw("SELECT * FROM users WHERE age > ?", 18).Scan(&users)

// 原生执行
db.Exec("UPDATE users SET age = ? WHERE name = ?", 25, "张三")

// 命名参数
db.Raw("SELECT * FROM users WHERE name = @name", sql.Named("name", "张三")).Scan(&users)
```

### 子查询

```go
// 子查询
db.Where("age > (?)", db.Model(&User{}).Select("AVG(age)")).Find(&users)

// From 子查询
db.Table("(?) as u", db.Model(&User{}).Select("name, age")).
    Where("age > ?", 18).
    Find(&results)
```
