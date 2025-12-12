---
order: 4
---

# Go - GORM 进阶

掌握 GORM 的关联查询、事务、Hook 等高级功能。

## 关联关系

### 一对一（Has One）

```go
// User 拥有一个 Profile
type User struct {
    gorm.Model
    Name    string
    Profile Profile  // Has One
}

type Profile struct {
    gorm.Model
    UserID   uint    // 外键
    Bio      string
    Avatar   string
}

// 创建
user := User{
    Name: "张三",
    Profile: Profile{Bio: "Go 开发者", Avatar: "avatar.png"},
}
db.Create(&user)

// 查询（预加载）
var user User
db.Preload("Profile").First(&user, 1)

// 关联创建
db.Model(&user).Association("Profile").Append(&Profile{Bio: "新简介"})

// 关联替换
db.Model(&user).Association("Profile").Replace(&Profile{Bio: "替换简介"})

// 关联删除
db.Model(&user).Association("Profile").Delete(&profile)

// 关联清空
db.Model(&user).Association("Profile").Clear()
```

### 一对多（Has Many）

```go
// User 拥有多篇 Article
type User struct {
    gorm.Model
    Name     string
    Articles []Article  // Has Many
}

type Article struct {
    gorm.Model
    UserID  uint    // 外键
    Title   string
    Content string
}

// 创建
user := User{
    Name: "张三",
    Articles: []Article{
        {Title: "文章1", Content: "内容1"},
        {Title: "文章2", Content: "内容2"},
    },
}
db.Create(&user)

// 查询
var user User
db.Preload("Articles").First(&user, 1)

// 条件预加载
db.Preload("Articles", "status = ?", "published").First(&user, 1)

// 自定义预加载
db.Preload("Articles", func(db *gorm.DB) *gorm.DB {
    return db.Order("created_at DESC").Limit(5)
}).First(&user, 1)

// 关联追加
db.Model(&user).Association("Articles").Append(&Article{Title: "新文章"})

// 查询关联数量
count := db.Model(&user).Association("Articles").Count()
```

### 多对多（Many To Many）

```go
// User 和 Role 多对多
type User struct {
    gorm.Model
    Name  string
    Roles []Role `gorm:"many2many:user_roles;"`
}

type Role struct {
    gorm.Model
    Name  string
    Users []User `gorm:"many2many:user_roles;"`
}

// 创建
user := User{
    Name: "张三",
    Roles: []Role{
        {Name: "admin"},
        {Name: "editor"},
    },
}
db.Create(&user)

// 查询
var user User
db.Preload("Roles").First(&user, 1)

// 关联追加
db.Model(&user).Association("Roles").Append(&Role{Name: "viewer"})

// 关联替换
db.Model(&user).Association("Roles").Replace([]Role{{Name: "user"}})

// 关联删除
db.Model(&user).Association("Roles").Delete(&role)
```

### Belongs To

```go
// Article 属于 User
type Article struct {
    gorm.Model
    Title   string
    UserID  uint
    User    User  // Belongs To
}

type User struct {
    gorm.Model
    Name string
}

// 查询
var article Article
db.Preload("User").First(&article, 1)
```

### 预加载

```go
// 单层预加载
db.Preload("Profile").Find(&users)

// 多层预加载
db.Preload("Articles.Comments").Find(&users)

// 多个关联
db.Preload("Profile").Preload("Articles").Find(&users)

// 条件预加载
db.Preload("Articles", "status = ?", "published").Find(&users)

// 嵌套预加载
db.Preload("Articles", func(db *gorm.DB) *gorm.DB {
    return db.Preload("Comments")
}).Find(&users)

// Joins 预加载（更高效，单次查询）
db.Joins("Profile").Find(&users)
db.Joins("Profile", db.Where(&Profile{Avatar: "avatar.png"})).Find(&users)
```

## 事务

### 自动事务

```go
// 使用 Transaction 方法
err := db.Transaction(func(tx *gorm.DB) error {
    // 在事务中执行操作
    if err := tx.Create(&user).Error; err != nil {
        return err  // 返回错误会回滚
    }
    
    if err := tx.Create(&article).Error; err != nil {
        return err
    }
    
    return nil  // 返回 nil 会提交
})
```

### 手动事务

```go
// 开始事务
tx := db.Begin()

// 执行操作
if err := tx.Create(&user).Error; err != nil {
    tx.Rollback()
    return err
}

if err := tx.Create(&article).Error; err != nil {
    tx.Rollback()
    return err
}

// 提交事务
tx.Commit()
```

### 嵌套事务

```go
db.Transaction(func(tx *gorm.DB) error {
    tx.Create(&user1)
    
    tx.Transaction(func(tx2 *gorm.DB) error {
        tx2.Create(&user2)
        return nil
    })
    
    return nil
})
```

### SavePoint

```go
tx := db.Begin()
tx.Create(&user1)

tx.SavePoint("sp1")
tx.Create(&user2)
tx.RollbackTo("sp1")  // 回滚到 sp1，user2 不会保存

tx.Commit()  // 只保存 user1
```

## Hook

### 创建 Hook

```go
type User struct {
    gorm.Model
    Name     string
    Password string
}

// 创建前
func (u *User) BeforeCreate(tx *gorm.DB) error {
    // 密码加密
    u.Password = hashPassword(u.Password)
    return nil
}

// 创建后
func (u *User) AfterCreate(tx *gorm.DB) error {
    // 发送欢迎邮件
    sendWelcomeEmail(u.Email)
    return nil
}
```

### 更新 Hook

```go
// 更新前
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    if tx.Statement.Changed("Password") {
        u.Password = hashPassword(u.Password)
    }
    return nil
}

// 更新后
func (u *User) AfterUpdate(tx *gorm.DB) error {
    // 清除缓存
    clearCache(u.ID)
    return nil
}
```

### 删除 Hook

```go
// 删除前
func (u *User) BeforeDelete(tx *gorm.DB) error {
    // 检查是否可删除
    if u.Role == "admin" {
        return errors.New("不能删除管理员")
    }
    return nil
}

// 删除后
func (u *User) AfterDelete(tx *gorm.DB) error {
    // 清理关联数据
    return nil
}
```

### 查询 Hook

```go
// 查询后
func (u *User) AfterFind(tx *gorm.DB) error {
    // 解密敏感字段
    return nil
}
```

## Scope

```go
// 定义 Scope
func ActiveUsers(db *gorm.DB) *gorm.DB {
    return db.Where("status = ?", "active")
}

func AgeGreaterThan(age int) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("age > ?", age)
    }
}

func Paginate(page, pageSize int) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        offset := (page - 1) * pageSize
        return db.Offset(offset).Limit(pageSize)
    }
}

// 使用 Scope
db.Scopes(ActiveUsers).Find(&users)
db.Scopes(ActiveUsers, AgeGreaterThan(18)).Find(&users)
db.Scopes(Paginate(1, 10)).Find(&users)
```

## 日志和调试

### 日志级别

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

### 自定义日志

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

### Debug 模式

```go
// 单次查询开启 Debug
db.Debug().Where("name = ?", "张三").First(&user)

// 全局开启
db = db.Debug()
```

## 性能优化

### 批量操作

```go
// 批量插入
users := []User{{Name: "张三"}, {Name: "李四"}, {Name: "王五"}}
db.CreateInBatches(users, 100)  // 每批 100 条

// 批量更新
db.Model(&User{}).Where("status = ?", "pending").Updates(map[string]interface{}{"status": "active"})
```

### 避免 N+1 问题

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

### 选择必要字段

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

### 使用索引

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
