---
index: false
icon: logos:go
dir:
    order: 2
    link: true
---

# Golang

Go（又称 Golang）是 Google 开发的一种静态类型、编译型编程语言，以简洁、高效和强大的并发支持著称。

## 目录

<Catalog hideHeading='false'/>

## 学习体系

```
┌─────────────────────────────────────────────────────────────┐
│                    Go 学习路线图                             │
├─────────────────────────────────────────────────────────────┤
│  第一阶段：Go 基础语法                                        │
│  ├── 环境搭建、变量常量、数据类型                             │
│  ├── 流程控制、函数、复合类型                                 │
│  └── 接口、错误处理、包管理                                   │
├─────────────────────────────────────────────────────────────┤
│  第二阶段：Go 并发与底层                                      │
│  ├── Goroutine 深入、Channel 高级用法                        │
│  ├── GMP 调度模型、内存模型                                   │
│  └── 垃圾回收、性能分析                                       │
├─────────────────────────────────────────────────────────────┤
│  第三阶段：Go Web 开发                                        │
│  ├── Gin 框架、路由中间件                                     │
│  ├── GORM 数据库操作                                          │
│  └── RESTful API、项目架构                                    │
├─────────────────────────────────────────────────────────────┤
│  第四阶段：Go 分布式                                          │
│  ├── Redis、消息队列                                          │
│  ├── gRPC、微服务                                             │
│  └── 分布式系统设计                                           │
├─────────────────────────────────────────────────────────────┤
│  第五阶段：Go 工程化                                          │
│  ├── 单元测试、性能测试                                       │
│  ├── 日志、配置管理                                           │
│  └── Docker、Kubernetes 部署                                  │
└─────────────────────────────────────────────────────────────┘
```

## 学习路线

### 第一阶段：Go 基础语法

> 目标：能够使用 Go 编写基本程序

| 序号 | 主题     | 内容                               | 链接                               |
| :--- | :------- | :--------------------------------- | :--------------------------------- |
| 1    | 环境搭建 | 安装配置、开发工具、第一个程序     | [进入学习](./core/go-install.md)   |
| 2    | 基础语法 | 变量、常量、数据类型、运算符       | [进入学习](./core/go-basic.md)     |
| 3    | 流程控制 | 条件判断、循环、switch、defer      | [进入学习](./core/go-control.md)   |
| 4    | 函数     | 函数定义、多返回值、匿名函数、闭包 | [进入学习](./core/go-function.md)  |
| 5    | 复合类型 | 数组、切片、Map、结构体            | [进入学习](./core/go-composite.md) |
| 6    | 接口     | 接口定义、实现、类型断言           | [进入学习](./core/go-interface.md) |
| 7    | 错误处理 | error、panic、recover              | [进入学习](./core/go-error.md)     |
| 8    | 包管理   | Go Modules、依赖管理               | [进入学习](./core/go-module.md)    |
| 9    | 标准库   | fmt、strings、time、net/http 等    | [进入学习](./core/go-stdlib.md)    |

### 第二阶段：Go 并发与底层

> 目标：深入理解 Go 并发模型和运行时机制

| 序号 | 主题     | 内容                               | 链接                                  |
| :--- | :------- | :--------------------------------- | :------------------------------------ |
| 1    | 并发基础 | Goroutine、Channel、sync 包        | [进入学习](./advanced/concurrency.md) |
| 2    | GMP 调度 | G、M、P 概念、调度流程、抢占式调度 | [进入学习](./advanced/gmp.md)         |
| 3    | 内存模型 | 内存分配、逃逸分析、内存对齐       | [进入学习](./advanced/memory.md)      |
| 4    | 垃圾回收 | 三色标记、写屏障、GC 调优          | [进入学习](./advanced/gc.md)          |
| 5    | 性能分析 | pprof、trace、benchmark            | [进入学习](./advanced/profiling.md)   |

### 第三阶段：Go Web 开发

> 目标：能够使用 Go 开发完整的 Web 应用

| 序号 | 主题      | 内容                         | 链接                               |
| :--- | :-------- | :--------------------------- | :--------------------------------- |
| 1    | Gin 入门  | 路由、请求处理、响应         | [进入学习](./web/gin-start.md)     |
| 2    | Gin 进阶  | 中间件、参数校验、错误处理   | [进入学习](./web/gin-advanced.md)  |
| 3    | GORM 入门 | 连接、模型定义、CRUD 操作    | [进入学习](./web/gorm-start.md)    |
| 4    | GORM 进阶 | 关联查询、事务、Hook         | [进入学习](./web/gorm-advanced.md) |
| 5    | 项目实战  | 项目结构、分层架构、最佳实践 | [进入学习](./web/project.md)       |

### 第四阶段：Go 分布式

> 目标：掌握分布式系统开发的核心技术

| 序号 | 主题     | 内容                         | 链接                                      |
| :--- | :------- | :--------------------------- | :---------------------------------------- |
| 1    | Redis    | go-redis、缓存、分布式锁     | [进入学习](./distributed/redis.md)        |
| 2    | 消息队列 | Kafka、RabbitMQ、消息模式    | [进入学习](./distributed/mq.md)           |
| 3    | gRPC     | Protobuf、服务定义、流式传输 | [进入学习](./distributed/grpc.md)         |
| 4    | 微服务   | 服务发现、负载均衡、熔断降级 | [进入学习](./distributed/microservice.md) |

### 第五阶段：Go 工程化

> 目标：掌握生产级 Go 项目的工程实践

| 序号 | 主题     | 内容                         | 链接                                    |
| :--- | :------- | :--------------------------- | :-------------------------------------- |
| 1    | 单元测试 | testing、mock、覆盖率        | [进入学习](./engineering/testing.md)    |
| 2    | 日志系统 | zap、logrus、结构化日志      | [进入学习](./engineering/logging.md)    |
| 3    | 配置管理 | viper、环境变量、配置中心    | [进入学习](./engineering/config.md)     |
| 4    | 容器部署 | Dockerfile、多阶段构建、优化 | [进入学习](./engineering/docker.md)     |
| 5    | 云原生   | Kubernetes 部署、Helm、监控  | [进入学习](./engineering/kubernetes.md) |

### 面试突击

> 目标：掌握 Go 面试高频考点

| 序号 | 主题   | 内容                             | 链接                                   |
| :--- | :----- | :------------------------------- | :------------------------------------- |
| 1    | 基础篇 | 数据类型、切片、Map、接口、defer | [进入学习](./interview/basic.md)       |
| 2    | 并发篇 | Goroutine、Channel、GMP、锁      | [进入学习](./interview/concurrency.md) |
| 3    | 内存篇 | 内存分配、逃逸分析、GC、性能优化 | [进入学习](./interview/memory.md)      |
| 4    | 项目篇 | 框架、中间件、微服务、场景设计   | [进入学习](./interview/project.md)     |

## 为什么学 Go？

| 特点       | 说明                                |
| :--------- | :---------------------------------- |
| 简洁易学   | 语法简单，关键字少，学习曲线平缓    |
| 编译速度快 | 编译成原生机器码，无需虚拟机        |
| 并发支持   | 原生支持协程（Goroutine），轻量高效 |
| 静态类型   | 编译时类型检查，减少运行时错误      |
| 垃圾回收   | 自动内存管理，无需手动释放          |
| 跨平台     | 支持多平台编译                      |
| 云原生首选 | Docker、Kubernetes 均用 Go 编写     |

## Go 适用场景

| 场景       | 说明                           |
| :--------- | :----------------------------- |
| 云原生     | 容器编排、服务网格、云基础设施 |
| 微服务     | 高性能 API、gRPC 服务          |
| 命令行工具 | CLI 工具、DevOps 工具          |
| 中间件     | 消息队列、缓存、代理           |
| 区块链     | 以太坊、Hyperledger Fabric     |

## 参考资料

::: info 官方文档
- Go 官网：https://go.dev/
- Go 语言规范：https://go.dev/ref/spec
- Go 标准库：https://pkg.go.dev/std
:::

::: info 推荐教程
- Go 语言之旅：https://tour.go-zh.org/
- Go by Example：https://gobyexample.com/
- Effective Go：https://go.dev/doc/effective_go
:::

::: info 优秀开源项目
- Gin：https://github.com/gin-gonic/gin
- GORM：https://github.com/go-gorm/gorm
- go-zero：https://github.com/zeromicro/go-zero
- Kratos：https://github.com/go-kratos/kratos
:::
