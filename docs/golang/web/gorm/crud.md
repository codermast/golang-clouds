---
order: 3
---

# GORM - CRUD 操作

## 创建

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

## 查询

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

// Or 条件
db.Where("name = ?", "张三").Or("name = ?", "李四").Find(&users)

// Not 条件
db.Not("name = ?", "张三").Find(&users)
```

## 更新

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

## 删除

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
