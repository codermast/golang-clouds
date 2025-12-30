---
order: 4
---

# GORM - 高级查询

## 选择字段

```go
// 选择特定字段
db.Select("name", "email").Find(&users)
db.Select("name, email").Find(&users)

// 排除字段
db.Omit("password").Find(&users)
```

## 排序

```go
db.Order("age desc, name asc").Find(&users)
db.Order("age desc").Order("name").Find(&users)
```

## 分页

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

## 分组和聚合

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

## 原生 SQL

```go
// 原生查询
var users []User
db.Raw("SELECT * FROM users WHERE age > ?", 18).Scan(&users)

// 原生执行
db.Exec("UPDATE users SET age = ? WHERE name = ?", 25, "张三")

// 命名参数
db.Raw("SELECT * FROM users WHERE name = @name", sql.Named("name", "张三")).Scan(&users)
```

## 子查询

```go
// 子查询
db.Where("age > (?)", db.Model(&User{}).Select("AVG(age)")).Find(&users)

// From 子查询
db.Table("(?) as u", db.Model(&User{}).Select("name, age")).
    Where("age > ?", 18).
    Find(&results)
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

// 使用 Scope
db.Scopes(ActiveUsers).Find(&users)
db.Scopes(ActiveUsers, AgeGreaterThan(18)).Find(&users)
```
