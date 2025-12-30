---
order: 5
---

# GORM - 关联关系

## 一对一（Has One）

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

// 关联操作
db.Model(&user).Association("Profile").Append(&Profile{Bio: "新简介"})
db.Model(&user).Association("Profile").Replace(&Profile{Bio: "替换简介"})
db.Model(&user).Association("Profile").Delete(&profile)
db.Model(&user).Association("Profile").Clear()
```

## 一对多（Has Many）

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

## 多对多（Many To Many）

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

// 关联操作
db.Model(&user).Association("Roles").Append(&Role{Name: "viewer"})
db.Model(&user).Association("Roles").Replace([]Role{{Name: "user"}})
db.Model(&user).Association("Roles").Delete(&role)
```

## Belongs To

```go
// Article 属于 User
type Article struct {
    gorm.Model
    Title   string
    UserID  uint
    User    User  // Belongs To
}

// 查询
var article Article
db.Preload("User").First(&article, 1)
```

## 预加载

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
