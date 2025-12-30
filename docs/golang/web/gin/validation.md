---
order: 7
---

# Gin - 参数校验

## validator 标签

```go
type User struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"gte=0,lte=150"`
    Password string `json:"password" binding:"required,min=6"`
    Phone    string `json:"phone" binding:"required,len=11"`
}
```

## 常用验证规则

| 标签            | 说明                 |
| :-------------- | :------------------- |
| required        | 必填                 |
| min=n           | 最小长度/值          |
| max=n           | 最大长度/值          |
| len=n           | 长度等于             |
| eq=n            | 等于                 |
| ne=n            | 不等于               |
| gt=n            | 大于                 |
| gte=n           | 大于等于             |
| lt=n            | 小于                 |
| lte=n           | 小于等于             |
| oneof=a b c     | 枚举值               |
| email           | 邮箱格式             |
| url             | URL 格式             |
| uuid            | UUID 格式            |
| datetime=layout | 日期时间格式         |
| contains=s      | 包含字符串           |
| excludes=s      | 不包含字符串         |
| startswith=s    | 以...开头            |
| endswith=s      | 以...结尾            |

## 自定义验证器

```go
import "github.com/go-playground/validator/v10"

// 自定义验证函数
func validatePhone(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    matched, _ := regexp.MatchString(`^1[3-9]\d{9}$`, phone)
    return matched
}

// 注册验证器
if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
    v.RegisterValidation("phone", validatePhone)
}

// 使用
type User struct {
    Phone string `json:"phone" binding:"required,phone"`
}
```

## 自定义错误消息

```go
import (
    "github.com/go-playground/validator/v10"
    "github.com/gin-gonic/gin/binding"
)

// 翻译错误消息
func translateError(err error) string {
    if errs, ok := err.(validator.ValidationErrors); ok {
        var messages []string
        for _, e := range errs {
            switch e.Tag() {
            case "required":
                messages = append(messages, fmt.Sprintf("%s 不能为空", e.Field()))
            case "email":
                messages = append(messages, fmt.Sprintf("%s 格式不正确", e.Field()))
            case "min":
                messages = append(messages, fmt.Sprintf("%s 长度不能小于 %s", e.Field(), e.Param()))
            default:
                messages = append(messages, fmt.Sprintf("%s 验证失败", e.Field()))
            }
        }
        return strings.Join(messages, "; ")
    }
    return err.Error()
}

// 使用
r.POST("/users", func(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": translateError(err)})
        return
    }
    // ...
})
```
