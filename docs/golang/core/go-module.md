---
order: 9
---

# Go - 包管理

Go Modules 是 Go 1.11 引入的官方依赖管理方案，Go 1.16 后成为默认模式。

## 模块基础

### 初始化模块

```bash
# 创建项目目录
mkdir myproject && cd myproject

# 初始化模块
go mod init github.com/username/myproject
```

### go.mod 文件

```go
module github.com/username/myproject

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    gorm.io/gorm v1.25.0
)

require (
    // 间接依赖
    github.com/bytedance/sonic v1.9.1 // indirect
)

exclude (
    // 排除特定版本
    github.com/some/lib v1.0.0
)

replace (
    // 替换依赖
    github.com/old/lib => github.com/new/lib v1.0.0
    // 本地替换
    github.com/mylib => ../mylib
)
```

### go.sum 文件

go.sum 记录依赖的校验和，确保依赖完整性：

```
github.com/gin-gonic/gin v1.9.1 h1:4idEAncQnU5cB7BeOkPtxjfCSye0AAm1R0RVIqFPSI8=
github.com/gin-gonic/gin v1.9.1/go.mod h1:hPrL...
```

## 常用命令

### 依赖管理

```bash
# 添加依赖
go get github.com/gin-gonic/gin

# 添加指定版本
go get github.com/gin-gonic/gin@v1.9.1

# 添加最新版本
go get github.com/gin-gonic/gin@latest

# 更新依赖
go get -u github.com/gin-gonic/gin

# 更新所有依赖
go get -u ./...

# 降级依赖
go get github.com/gin-gonic/gin@v1.8.0

# 移除未使用的依赖
go mod tidy

# 下载依赖到本地缓存
go mod download

# 将依赖复制到 vendor 目录
go mod vendor

# 验证依赖
go mod verify
```

### 查看依赖

```bash
# 查看所有依赖
go list -m all

# 查看依赖关系图
go mod graph

# 查看特定包的版本
go list -m -versions github.com/gin-gonic/gin

# 查看为什么需要某个依赖
go mod why github.com/some/lib
```

## 版本规则

### 语义化版本

Go Modules 使用语义化版本（Semantic Versioning）：

```
v主版本.次版本.修订版本
v1.2.3
```

| 版本号 | 含义               |
| :----- | :----------------- |
| 主版本 | 不兼容的 API 变更  |
| 次版本 | 向下兼容的功能新增 |
| 修订版 | 向下兼容的问题修复 |

### 版本选择

```bash
# 最新版本
go get github.com/lib@latest

# 指定版本
go get github.com/lib@v1.2.3

# 指定 commit
go get github.com/lib@abc1234

# 指定分支
go get github.com/lib@master

# 版本范围
# 使用最新的 v1.x.x
go get github.com/lib@v1
```

### v2+ 版本

主版本 v2 及以上需要在模块路径中包含版本号：

```go
// go.mod
module github.com/username/mylib/v2

// 导入
import "github.com/username/mylib/v2"
```

## 私有模块

### 配置私有仓库

```bash
# 设置私有仓库（不走代理）
go env -w GOPRIVATE=github.com/mycompany/*,gitlab.company.com/*

# 设置不验证校验和
go env -w GONOSUMDB=github.com/mycompany/*
```

### SSH 认证

```bash
# 配置 Git 使用 SSH
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

## 工作区（Go 1.18+）

工作区允许同时开发多个模块。

### 创建工作区

```bash
# 初始化工作区
go work init

# 添加模块
go work use ./module1
go work use ./module2

# 或一次性添加多个
go work init ./module1 ./module2
```

### go.work 文件

```go
go 1.21

use (
    ./module1
    ./module2
)

replace github.com/old/lib => github.com/new/lib v1.0.0
```

### 使用场景

```
workspace/
├── go.work
├── api/
│   ├── go.mod
│   └── ...
├── common/
│   ├── go.mod
│   └── ...
└── service/
    ├── go.mod
    └── ...
```

## 代理配置

### 公共代理

```bash
# 官方代理
go env -w GOPROXY=https://proxy.golang.org,direct

# 国内代理
go env -w GOPROXY=https://goproxy.cn,direct

# 多个代理
go env -w GOPROXY=https://goproxy.cn,https://goproxy.io,direct
```

### 私有仓库配置

```bash
# 私有仓库不走代理
go env -w GOPRIVATE=*.corp.example.com,github.com/company/*

# 或使用 GONOPROXY
go env -w GONOPROXY=*.corp.example.com
```

## 包结构

### 包的组织

```
myproject/
├── go.mod
├── go.sum
├── main.go           # 主包
├── cmd/              # 命令行工具
│   └── myapp/
│       └── main.go
├── internal/         # 私有包（不能被外部导入）
│   ├── config/
│   └── service/
├── pkg/              # 公共包（可以被外部导入）
│   └── utils/
└── api/              # API 定义
```

### 导入路径

```go
// 标准库
import "fmt"
import "net/http"

// 第三方包
import "github.com/gin-gonic/gin"

// 项目内部包
import "github.com/username/myproject/internal/config"
import "github.com/username/myproject/pkg/utils"

// 别名导入
import (
    "fmt"
    myfmt "github.com/myproject/fmt"
)

// 匿名导入（只执行 init）
import _ "github.com/go-sql-driver/mysql"

// 点导入（不推荐）
import . "fmt"
```

## 最佳实践

### 1. 明确版本

```bash
# 使用确定版本而非 latest
go get github.com/lib@v1.2.3
```

### 2. 定期更新

```bash
# 定期执行
go get -u ./...
go mod tidy
```

### 3. 使用 vendor（可选）

```bash
# 生成 vendor 目录
go mod vendor

# 使用 vendor 构建
go build -mod=vendor ./...
```

### 4. 检查安全漏洞

```bash
# 使用 govulncheck
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
```
