---
order: 1
---

# Go - 环境搭建

## Go 简介

Go（又称 Golang）是 Google 于 2009 年发布的开源编程语言，由 Robert Griesemer、Rob Pike 和 Ken Thompson 设计。

### 特点

| 特点     | 说明                          |
| :------- | :---------------------------- |
| 静态类型 | 编译时进行类型检查            |
| 编译型   | 直接编译为机器码，执行效率高  |
| 并发支持 | 原生支持 Goroutine 和 Channel |
| 垃圾回收 | 自动内存管理                  |
| 简洁     | 只有 25 个关键字              |
| 跨平台   | 支持 Windows、Linux、macOS    |

## 下载安装

### 下载地址

- 官方下载：https://go.dev/dl/
- 国内镜像：https://golang.google.cn/dl/

### Windows 安装

1. 下载 `.msi` 安装包
2. 双击运行，按提示安装
3. 默认安装路径：`C:\Go`

### macOS 安装

**方式一：官方安装包**

1. 下载 `.pkg` 安装包
2. 双击运行安装

**方式二：Homebrew**

```bash
brew install go
```

### Linux 安装

```bash
# 下载
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz

# 解压到 /usr/local
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# 配置环境变量（添加到 ~/.bashrc 或 ~/.zshrc）
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# 使配置生效
source ~/.bashrc
```

## 环境变量

### 重要环境变量

| 变量        | 说明        | 示例                      |
| :---------- | :---------- | :------------------------ |
| GOROOT      | Go 安装目录 | /usr/local/go             |
| GOPATH      | 工作目录    | ~/go                      |
| GOPROXY     | 模块代理    | https://goproxy.cn,direct |
| GO111MODULE | 模块模式    | on                        |

### 配置国内代理

```bash
# 设置代理（推荐）
go env -w GOPROXY=https://goproxy.cn,direct

# 或使用阿里云
go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct

# 私有仓库不走代理
go env -w GOPRIVATE=*.corp.example.com
```

### 查看配置

```bash
# 查看所有环境变量
go env

# 查看特定变量
go env GOPATH
go env GOPROXY
```

## 验证安装

```bash
# 查看版本
go version
# 输出：go version go1.21.0 darwin/amd64

# 查看环境信息
go env
```

## 开发工具

### VS Code（推荐）

1. 安装 VS Code
2. 安装 Go 扩展（由 Go Team at Google 提供）
3. 打开命令面板（Ctrl+Shift+P），运行 `Go: Install/Update Tools`
4. 选择全部工具并安装

### GoLand

JetBrains 出品的专业 Go IDE：
- 官网：https://www.jetbrains.com/go/
- 功能强大，开箱即用
- 付费软件，学生可申请免费

### Vim/Neovim

安装 vim-go 插件：

```vim
" 使用 vim-plug
Plug 'fatih/vim-go', { 'do': ':GoUpdateBinaries' }
```

## 第一个程序

### 创建项目

```bash
# 创建项目目录
mkdir hello && cd hello

# 初始化模块
go mod init hello
```

### 编写代码

创建 `main.go`：

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
```

### 运行程序

```bash
# 方式一：直接运行
go run main.go

# 方式二：编译后运行
go build -o hello
./hello
```

## 常用命令

| 命令        | 说明                |
| :---------- | :------------------ |
| go run      | 编译并运行          |
| go build    | 编译生成可执行文件  |
| go install  | 编译并安装到 GOPATH |
| go get      | 下载并安装依赖      |
| go mod init | 初始化模块          |
| go mod tidy | 整理依赖            |
| go fmt      | 格式化代码          |
| go vet      | 静态检查            |
| go test     | 运行测试            |
| go doc      | 查看文档            |

## 项目结构

### 推荐的项目结构

```
project/
├── go.mod              # 模块定义
├── go.sum              # 依赖校验
├── main.go             # 程序入口
├── cmd/                # 命令行工具
│   └── myapp/
│       └── main.go
├── internal/           # 私有代码
│   └── service/
├── pkg/                # 公共库
│   └── utils/
├── api/                # API 定义
├── configs/            # 配置文件
├── scripts/            # 脚本文件
├── docs/               # 文档
└── test/               # 测试文件
```

### go.mod 文件

```go
module github.com/username/project

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    gorm.io/gorm v1.25.0
)
```
