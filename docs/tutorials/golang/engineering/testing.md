---
order: 1
---

# Go - 单元测试

Go 内置了强大的测试框架，掌握测试是编写高质量代码的基础。

## 基础测试

### 测试文件

测试文件以 `_test.go` 结尾，与被测试文件在同一目录：

```
myproject/
├── user.go
└── user_test.go
```

### 编写测试

```go
// user.go
package user

func Add(a, b int) int {
    return a + b
}

func Divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("除数不能为零")
    }
    return a / b, nil
}
```

```go
// user_test.go
package user

import "testing"

func TestAdd(t *testing.T) {
    result := Add(1, 2)
    if result != 3 {
        t.Errorf("Add(1, 2) = %d; want 3", result)
    }
}

func TestDivide(t *testing.T) {
    result, err := Divide(10, 2)
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if result != 5 {
        t.Errorf("Divide(10, 2) = %d; want 5", result)
    }
}

func TestDivideByZero(t *testing.T) {
    _, err := Divide(10, 0)
    if err == nil {
        t.Error("expected error, got nil")
    }
}
```

### 运行测试

```bash
# 运行当前目录测试
go test

# 运行所有测试
go test ./...

# 显示详细输出
go test -v

# 运行特定测试
go test -run TestAdd

# 运行匹配的测试
go test -run "TestDivide.*"
```

## 表驱动测试

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"正数相加", 1, 2, 3},
        {"负数相加", -1, -2, -3},
        {"零相加", 0, 0, 0},
        {"正负相加", 1, -1, 0},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d",
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

## 测试辅助方法

### t.Helper()

```go
func assertEqual(t *testing.T, got, want int) {
    t.Helper()  // 标记为辅助函数，错误行号会指向调用处
    if got != want {
        t.Errorf("got %d; want %d", got, want)
    }
}

func TestAdd(t *testing.T) {
    assertEqual(t, Add(1, 2), 3)
    assertEqual(t, Add(2, 3), 5)
}
```

### t.Cleanup()

```go
func TestWithCleanup(t *testing.T) {
    // 创建临时资源
    file, err := os.CreateTemp("", "test")
    if err != nil {
        t.Fatal(err)
    }
    
    // 注册清理函数
    t.Cleanup(func() {
        os.Remove(file.Name())
    })
    
    // 测试逻辑...
}
```

### t.Parallel()

```go
func TestParallel(t *testing.T) {
    tests := []struct {
        name string
        // ...
    }{
        {"test1"},
        {"test2"},
        {"test3"},
    }
    
    for _, tt := range tests {
        tt := tt  // 捕获变量
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()  // 并行执行
            // 测试逻辑...
        })
    }
}
```

## Mock

### 接口 Mock

```go
// 定义接口
type UserRepository interface {
    GetByID(id int) (*User, error)
    Save(user *User) error
}

// Mock 实现
type MockUserRepository struct {
    GetByIDFunc func(id int) (*User, error)
    SaveFunc    func(user *User) error
}

func (m *MockUserRepository) GetByID(id int) (*User, error) {
    if m.GetByIDFunc != nil {
        return m.GetByIDFunc(id)
    }
    return nil, nil
}

func (m *MockUserRepository) Save(user *User) error {
    if m.SaveFunc != nil {
        return m.SaveFunc(user)
    }
    return nil
}

// 使用 Mock 测试
func TestUserService_GetUser(t *testing.T) {
    mockRepo := &MockUserRepository{
        GetByIDFunc: func(id int) (*User, error) {
            if id == 1 {
                return &User{ID: 1, Name: "张三"}, nil
            }
            return nil, errors.New("not found")
        },
    }
    
    service := NewUserService(mockRepo)
    
    user, err := service.GetUser(1)
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if user.Name != "张三" {
        t.Errorf("got %s; want 张三", user.Name)
    }
}
```

### 使用 gomock

```bash
go install github.com/golang/mock/mockgen@latest
```

```go
// 生成 mock
//go:generate mockgen -source=repository.go -destination=mock_repository.go -package=user

// 使用
func TestUserService(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()
    
    mockRepo := NewMockUserRepository(ctrl)
    
    // 设置期望
    mockRepo.EXPECT().
        GetByID(1).
        Return(&User{ID: 1, Name: "张三"}, nil).
        Times(1)
    
    service := NewUserService(mockRepo)
    user, _ := service.GetUser(1)
    
    if user.Name != "张三" {
        t.Error("unexpected name")
    }
}
```

### 使用 testify

```bash
go get github.com/stretchr/testify
```

```go
import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/stretchr/testify/mock"
)

// 断言
func TestWithAssert(t *testing.T) {
    assert.Equal(t, 3, Add(1, 2))
    assert.NotNil(t, user)
    assert.True(t, ok)
    assert.Contains(t, "hello world", "world")
    assert.Error(t, err)
    assert.NoError(t, err)
}

// require（失败立即停止）
func TestWithRequire(t *testing.T) {
    user, err := GetUser(1)
    require.NoError(t, err)
    require.NotNil(t, user)
    assert.Equal(t, "张三", user.Name)
}

// Mock
type MockRepository struct {
    mock.Mock
}

func (m *MockRepository) GetByID(id int) (*User, error) {
    args := m.Called(id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*User), args.Error(1)
}

func TestWithMock(t *testing.T) {
    mockRepo := new(MockRepository)
    mockRepo.On("GetByID", 1).Return(&User{ID: 1, Name: "张三"}, nil)
    
    service := NewUserService(mockRepo)
    user, _ := service.GetUser(1)
    
    assert.Equal(t, "张三", user.Name)
    mockRepo.AssertExpectations(t)
}
```

## HTTP 测试

```go
import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestHandler(t *testing.T) {
    // 创建请求
    req := httptest.NewRequest("GET", "/users/1", nil)
    
    // 创建响应记录器
    rr := httptest.NewRecorder()
    
    // 调用处理函数
    handler := http.HandlerFunc(GetUserHandler)
    handler.ServeHTTP(rr, req)
    
    // 检查响应
    if rr.Code != http.StatusOK {
        t.Errorf("got status %d; want %d", rr.Code, http.StatusOK)
    }
    
    // 检查响应体
    expected := `{"id":1,"name":"张三"}`
    if rr.Body.String() != expected {
        t.Errorf("got body %s; want %s", rr.Body.String(), expected)
    }
}

// 测试 HTTP 服务器
func TestHTTPServer(t *testing.T) {
    // 创建测试服务器
    server := httptest.NewServer(http.HandlerFunc(GetUserHandler))
    defer server.Close()
    
    // 发送请求
    resp, err := http.Get(server.URL + "/users/1")
    if err != nil {
        t.Fatal(err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        t.Errorf("got status %d; want %d", resp.StatusCode, http.StatusOK)
    }
}
```

## 测试覆盖率

```bash
# 生成覆盖率报告
go test -cover

# 生成覆盖率文件
go test -coverprofile=coverage.out

# 查看 HTML 报告
go tool cover -html=coverage.out

# 按函数查看覆盖率
go tool cover -func=coverage.out

# 设置覆盖率模式
go test -covermode=atomic  # 原子模式，适合并发测试
go test -covermode=count   # 计数模式，显示执行次数
```

## 测试最佳实践

### 1. 测试命名

```go
// 格式：Test<函数名>_<场景>
func TestAdd_PositiveNumbers(t *testing.T) {}
func TestAdd_NegativeNumbers(t *testing.T) {}
func TestDivide_ByZero(t *testing.T) {}
```

### 2. 测试独立性

```go
// 每个测试应该独立，不依赖其他测试
func TestCreateUser(t *testing.T) {
    // 设置
    db := setupTestDB(t)
    defer db.Close()
    
    // 测试
    user := CreateUser(db, "张三")
    
    // 验证
    assert.NotZero(t, user.ID)
}
```

### 3. 测试数据准备

```go
// 使用 TestMain 进行全局设置
func TestMain(m *testing.M) {
    // 设置
    setup()
    
    // 运行测试
    code := m.Run()
    
    // 清理
    teardown()
    
    os.Exit(code)
}
```

### 4. Golden 文件测试

```go
func TestRender(t *testing.T) {
    result := Render(data)
    
    golden := filepath.Join("testdata", "expected.golden")
    
    if *update {
        // 更新 golden 文件
        os.WriteFile(golden, []byte(result), 0644)
    }
    
    expected, _ := os.ReadFile(golden)
    if result != string(expected) {
        t.Errorf("got:\n%s\nwant:\n%s", result, expected)
    }
}
```
