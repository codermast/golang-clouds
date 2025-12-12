---
index: false
icon: mdi:server-network
dir:
    order: 4
    link: true
---

# Go 分布式

掌握分布式系统开发的核心技术：缓存、消息队列、RPC。

## 目录

<Catalog hideHeading='false'/>

## 学习路线

| 序号 | 主题     | 内容                         |
| :--- | :------- | :--------------------------- |
| 1    | Redis    | go-redis、缓存、分布式锁     |
| 2    | 消息队列 | Kafka、RabbitMQ、消息模式    |
| 3    | gRPC     | Protobuf、服务定义、流式传输 |
| 4    | 微服务   | 服务发现、负载均衡、熔断降级 |

## 技术栈

| 组件       | 推荐方案              | 说明            |
| :--------- | :-------------------- | :-------------- |
| 缓存       | Redis                 | go-redis 客户端 |
| 消息队列   | Kafka / RabbitMQ      | 根据场景选择    |
| RPC 框架   | gRPC                  | 高性能、跨语言  |
| 服务发现   | Consul / etcd / Nacos | 配合框架选择    |
| 微服务框架 | go-zero / Kratos      | 一站式解决方案  |
