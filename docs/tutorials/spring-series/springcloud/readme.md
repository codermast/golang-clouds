---
index: false
icon: clarity:data-cluster-solid
dir:
    order: 4
    link: true
---

# Spring Cloud

Spring Cloud 是一套微服务解决方案，基于 Spring Boot 构建，提供了服务发现、配置管理、负载均衡、熔断降级、网关路由等微服务核心功能。

## 目录

<Catalog hideHeading='false'/>

## 学习路线

### 基础入门

1. [微服务概述](./springcloud-introduction.md) - 微服务架构、Spring Cloud 组件
2. [服务注册与发现](./springcloud-discovery.md) - Nacos、Eureka、负载均衡

### 核心组件

3. [服务网关](./springcloud-gateway.md) - Spring Cloud Gateway、路由配置、过滤器
4. [服务调用](./springcloud-feign.md) - OpenFeign、声明式客户端、熔断降级
5. [服务保护](./springcloud-sentinel.md) - Sentinel、限流、熔断、降级
6. [配置中心](./springcloud-config.md) - Nacos Config、配置动态刷新

## 微服务架构

```
                           ┌─────────────────┐
                           │    API 网关      │
                           │  (Gateway)      │
                           └────────┬────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│   用户服务      │        │   订单服务      │        │   商品服务      │
│  (User)        │◄──────►│  (Order)       │◄──────►│  (Product)     │
└───────┬────────┘        └───────┬────────┘        └───────┬────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
              ┌──────┴──────┐          ┌──────┴──────┐
              │ 注册中心     │          │ 配置中心     │
              │ (Nacos)     │          │ (Nacos)     │
              └─────────────┘          └─────────────┘
```

## Spring Cloud 版本

Spring Cloud 采用英文单词命名版本（以伦敦地铁站命名），后改为年份命名。

| Spring Cloud | Spring Boot | 说明     |
| :----------- | :---------- | :------- |
| 2022.0.x     | 3.0.x       | 最新版本 |
| 2021.0.x     | 2.6.x/2.7.x | 稳定版本 |
| 2020.0.x     | 2.4.x/2.5.x |          |
| Hoxton       | 2.2.x/2.3.x |          |
| Greenwich    | 2.1.x       |          |

## 核心组件

| 组件    | 功能     | 替代方案                 |
| :------ | :------- | :----------------------- |
| Eureka  | 服务发现 | Nacos、Consul、Zookeeper |
| Ribbon  | 负载均衡 | LoadBalancer             |
| Feign   | 服务调用 | OpenFeign                |
| Hystrix | 熔断降级 | Sentinel、Resilience4j   |
| Zuul    | 服务网关 | Spring Cloud Gateway     |
| Config  | 配置中心 | Nacos Config、Apollo     |
| Bus     | 消息总线 | Nacos                    |
| Sleuth  | 链路追踪 | SkyWalking               |

## Spring Cloud Alibaba

Spring Cloud Alibaba 是阿里巴巴提供的 Spring Cloud 实现，包含：

| 组件     | 功能                |
| :------- | :------------------ |
| Nacos    | 服务发现 + 配置中心 |
| Sentinel | 流量控制、熔断降级  |
| Seata    | 分布式事务          |
| RocketMQ | 消息队列            |
| Dubbo    | RPC 框架            |

```xml
<!-- Spring Cloud Alibaba 依赖管理 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2022.0.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 参考资料

::: info 官方文档
- Spring Cloud 官方文档：https://spring.io/projects/spring-cloud
- Spring Cloud Alibaba：https://spring-cloud-alibaba-group.github.io/github-pages/2022/zh-cn/
- Nacos 官网：https://nacos.io/
:::

::: info 视频教程
- 尚硅谷 Spring Cloud：https://www.bilibili.com/video/BV18E411x7eT
- 黑马程序员 Spring Cloud：https://www.bilibili.com/video/BV1LQ4y127n4
:::
