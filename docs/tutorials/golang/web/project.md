---
order: 5
---

# Go - 项目实战

学习 Go Web 项目的架构设计和最佳实践。

## 项目结构

### 推荐结构

```
myproject/
├── cmd/                    # 应用入口
│   └── server/
│       └── main.go
├── internal/               # 私有代码
│   ├── config/            # 配置
│   ├── handler/           # HTTP 处理器
│   ├── middleware/        # 中间件
│   ├── model/             # 数据模型
│   ├── repository/        # 数据访问层
│   ├── service/           # 业务逻辑层
│   └── pkg/               # 内部工具包
├── pkg/                    # 公共库
│   └── utils/
├── api/                    # API 定义
│   └── openapi.yaml
├── configs/                # 配置文件
│   ├── config.yaml
│   └── config.dev.yaml
├── scripts/                # 脚本
├── docs/                   # 文档
├── test/                   # 测试
├── go.mod
├── go.sum
├── Makefile
├── Dockerfile
└── README.md
```

### 分层架构

```
┌─────────────────────────────────────────┐
│              Handler 层                  │
│         (HTTP 处理，参数校验)             │
├─────────────────────────────────────────┤
│              Service 层                  │
│           (业务逻辑处理)                  │
├─────────────────────────────────────────┤
│            Repository 层                 │
│           (数据访问，CRUD)                │
├─────────────────────────────────────────┤
│              Model 层                    │
│            (数据模型定义)                 │
└─────────────────────────────────────────┘
```

## 代码示例

### 配置管理

```go
// internal/config/config.go
package config

import (
    "github.com/spf13/viper"
)

type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
    Redis    RedisConfig    `mapstructure:"redis"`
    JWT      JWTConfig      `mapstructure:"jwt"`
}

type ServerConfig struct {
    Port string `mapstructure:"port"`
    Mode string `mapstructure:"mode"`
}

type DatabaseConfig struct {
    Host     string `mapstructure:"host"`
    Port     int    `mapstructure:"port"`
    User     string `mapstructure:"user"`
    Password string `mapstructure:"password"`
    DBName   string `mapstructure:"dbname"`
}

var Cfg *Config

func Init(configPath string) error {
    viper.SetConfigFile(configPath)
    
    if err := viper.ReadInConfig(); err != nil {
        return err
    }
    
    Cfg = &Config{}
    if err := viper.Unmarshal(Cfg); err != nil {
        return err
    }
    
    return nil
}
```

### 模型定义

```go
// internal/model/user.go
package model

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    Username  string         `gorm:"size:50;uniqueIndex;not null" json:"username"`
    Password  string         `gorm:"size:100;not null" json:"-"`
    Email     string         `gorm:"size:100;uniqueIndex" json:"email"`
    Nickname  string         `gorm:"size:50" json:"nickname"`
    Avatar    string         `gorm:"size:200" json:"avatar"`
    Status    int            `gorm:"default:1" json:"status"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
    return "users"
}
```

### Repository 层

```go
// internal/repository/user_repo.go
package repository

import (
    "context"
    "myproject/internal/model"
    "gorm.io/gorm"
)

type UserRepository interface {
    Create(ctx context.Context, user *model.User) error
    GetByID(ctx context.Context, id uint) (*model.User, error)
    GetByUsername(ctx context.Context, username string) (*model.User, error)
    Update(ctx context.Context, user *model.User) error
    Delete(ctx context.Context, id uint) error
    List(ctx context.Context, page, pageSize int) ([]model.User, int64, error)
}

type userRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *model.User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uint) (*model.User, error) {
    var user model.User
    err := r.db.WithContext(ctx).First(&user, id).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*model.User, error) {
    var user model.User
    err := r.db.WithContext(ctx).Where("username = ?", username).First(&user).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *model.User) error {
    return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uint) error {
    return r.db.WithContext(ctx).Delete(&model.User{}, id).Error
}

func (r *userRepository) List(ctx context.Context, page, pageSize int) ([]model.User, int64, error) {
    var users []model.User
    var total int64
    
    db := r.db.WithContext(ctx).Model(&model.User{})
    
    if err := db.Count(&total).Error; err != nil {
        return nil, 0, err
    }
    
    offset := (page - 1) * pageSize
    if err := db.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
        return nil, 0, err
    }
    
    return users, total, nil
}
```

### Service 层

```go
// internal/service/user_service.go
package service

import (
    "context"
    "errors"
    "myproject/internal/model"
    "myproject/internal/repository"
    "golang.org/x/crypto/bcrypt"
)

type UserService interface {
    Register(ctx context.Context, req *RegisterRequest) (*model.User, error)
    Login(ctx context.Context, req *LoginRequest) (string, error)
    GetUserInfo(ctx context.Context, userID uint) (*model.User, error)
    UpdateUser(ctx context.Context, userID uint, req *UpdateUserRequest) error
}

type RegisterRequest struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Password string `json:"password" binding:"required,min=6"`
    Email    string `json:"email" binding:"required,email"`
}

type LoginRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

type UpdateUserRequest struct {
    Nickname string `json:"nickname"`
    Avatar   string `json:"avatar"`
}

type userService struct {
    userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
    return &userService{userRepo: userRepo}
}

func (s *userService) Register(ctx context.Context, req *RegisterRequest) (*model.User, error) {
    // 检查用户名是否存在
    existing, _ := s.userRepo.GetByUsername(ctx, req.Username)
    if existing != nil {
        return nil, errors.New("用户名已存在")
    }
    
    // 密码加密
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }
    
    user := &model.User{
        Username: req.Username,
        Password: string(hashedPassword),
        Email:    req.Email,
    }
    
    if err := s.userRepo.Create(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}

func (s *userService) Login(ctx context.Context, req *LoginRequest) (string, error) {
    user, err := s.userRepo.GetByUsername(ctx, req.Username)
    if err != nil {
        return "", errors.New("用户不存在")
    }
    
    // 验证密码
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
        return "", errors.New("密码错误")
    }
    
    // 生成 JWT
    token, err := generateToken(user.ID)
    if err != nil {
        return "", err
    }
    
    return token, nil
}

func (s *userService) GetUserInfo(ctx context.Context, userID uint) (*model.User, error) {
    return s.userRepo.GetByID(ctx, userID)
}

func (s *userService) UpdateUser(ctx context.Context, userID uint, req *UpdateUserRequest) error {
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return err
    }
    
    if req.Nickname != "" {
        user.Nickname = req.Nickname
    }
    if req.Avatar != "" {
        user.Avatar = req.Avatar
    }
    
    return s.userRepo.Update(ctx, user)
}
```

### Handler 层

```go
// internal/handler/user_handler.go
package handler

import (
    "myproject/internal/service"
    "github.com/gin-gonic/gin"
)

type UserHandler struct {
    userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
    return &UserHandler{userService: userService}
}

func (h *UserHandler) Register(c *gin.Context) {
    var req service.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"code": 400, "message": err.Error()})
        return
    }
    
    user, err := h.userService.Register(c.Request.Context(), &req)
    if err != nil {
        c.JSON(400, gin.H{"code": 400, "message": err.Error()})
        return
    }
    
    c.JSON(200, gin.H{"code": 0, "message": "注册成功", "data": user})
}

func (h *UserHandler) Login(c *gin.Context) {
    var req service.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"code": 400, "message": err.Error()})
        return
    }
    
    token, err := h.userService.Login(c.Request.Context(), &req)
    if err != nil {
        c.JSON(400, gin.H{"code": 400, "message": err.Error()})
        return
    }
    
    c.JSON(200, gin.H{"code": 0, "message": "登录成功", "data": gin.H{"token": token}})
}

func (h *UserHandler) GetUserInfo(c *gin.Context) {
    userID := c.GetUint("user_id")
    
    user, err := h.userService.GetUserInfo(c.Request.Context(), userID)
    if err != nil {
        c.JSON(404, gin.H{"code": 404, "message": "用户不存在"})
        return
    }
    
    c.JSON(200, gin.H{"code": 0, "data": user})
}
```

### 路由注册

```go
// internal/handler/router.go
package handler

import (
    "myproject/internal/middleware"
    "github.com/gin-gonic/gin"
)

func SetupRouter(
    userHandler *UserHandler,
) *gin.Engine {
    r := gin.Default()
    
    // 全局中间件
    r.Use(middleware.CORS())
    r.Use(middleware.RequestID())
    
    // 健康检查
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })
    
    // API 路由
    api := r.Group("/api/v1")
    {
        // 公开路由
        api.POST("/register", userHandler.Register)
        api.POST("/login", userHandler.Login)
        
        // 需要认证的路由
        auth := api.Group("/")
        auth.Use(middleware.Auth())
        {
            auth.GET("/user/info", userHandler.GetUserInfo)
            auth.PUT("/user/info", userHandler.UpdateUser)
        }
    }
    
    return r
}
```

### 依赖注入

```go
// cmd/server/main.go
package main

import (
    "log"
    "myproject/internal/config"
    "myproject/internal/handler"
    "myproject/internal/repository"
    "myproject/internal/service"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

func main() {
    // 加载配置
    if err := config.Init("configs/config.yaml"); err != nil {
        log.Fatal(err)
    }
    
    // 初始化数据库
    db, err := initDB()
    if err != nil {
        log.Fatal(err)
    }
    
    // 依赖注入
    userRepo := repository.NewUserRepository(db)
    userService := service.NewUserService(userRepo)
    userHandler := handler.NewUserHandler(userService)
    
    // 启动服务
    r := handler.SetupRouter(userHandler)
    r.Run(config.Cfg.Server.Port)
}

func initDB() (*gorm.DB, error) {
    cfg := config.Cfg.Database
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName)
    
    return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}
```

## 最佳实践

### 错误处理

```go
// 定义业务错误码
const (
    CodeSuccess       = 0
    CodeBadRequest    = 400
    CodeUnauthorized  = 401
    CodeForbidden     = 403
    CodeNotFound      = 404
    CodeInternalError = 500
)

// 统一响应结构
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
    c.JSON(200, Response{Code: CodeSuccess, Message: "success", Data: data})
}

func Error(c *gin.Context, code int, message string) {
    c.JSON(200, Response{Code: code, Message: message})
}
```

### 日志规范

```go
import "go.uber.org/zap"

var logger *zap.Logger

func InitLogger() {
    logger, _ = zap.NewProduction()
}

// 使用
logger.Info("user registered",
    zap.Uint("user_id", user.ID),
    zap.String("username", user.Username),
)

logger.Error("failed to create user",
    zap.Error(err),
)
```

### 接口文档

使用 Swagger 自动生成 API 文档：

```go
// 安装
// go install github.com/swaggo/swag/cmd/swag@latest

// 添加注释
// @Summary 用户注册
// @Description 创建新用户账号
// @Tags 用户
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "注册信息"
// @Success 200 {object} Response{data=User}
// @Router /api/v1/register [post]
func (h *UserHandler) Register(c *gin.Context) {
    // ...
}

// 生成文档
// swag init -g cmd/server/main.go
```
