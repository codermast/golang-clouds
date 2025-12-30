---
order: 6
---

# GORM - 事务与 Hook

## 自动事务

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

## 手动事务

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

## 嵌套事务

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

## SavePoint

```go
tx := db.Begin()
tx.Create(&user1)

tx.SavePoint("sp1")
tx.Create(&user2)
tx.RollbackTo("sp1")  // 回滚到 sp1，user2 不会保存

tx.Commit()  // 只保存 user1
```

## 创建 Hook

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

## 更新 Hook

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

## 删除 Hook

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

## 查询 Hook

```go
// 查询后
func (u *User) AfterFind(tx *gorm.DB) error {
    // 解密敏感字段
    return nil
}
```
