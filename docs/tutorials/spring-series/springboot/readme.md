---
index: false
icon: simple-icons:springboot
dir:
    order: 3
    link: true
---

# SpringBoot

Spring Boot 是基于 Spring 框架的快速开发框架，通过"约定优于配置"的理念，简化了 Spring 应用的搭建和开发过程。

## 目录

<Catalog hideHeading='false'/>

## 学习路线

### 基础入门

1. [快速入门](./springboot-quickstart.md) - 创建项目、核心概念、自动配置
2. [配置详解](./springboot-config.md) - 配置文件、多环境、外部化配置
3. [Web 开发](./springboot-web.md) - RESTful API、静态资源、参数校验

### 核心功能

4. [数据访问](./springboot-data.md) - JDBC、MyBatis、MyBatis-Plus、事务

## Spring Boot 特点

| 特点         | 说明                                    |
| :----------- | :-------------------------------------- |
| 快速创建项目 | 使用 Spring Initializr 快速生成项目结构 |
| 内嵌服务器   | 内置 Tomcat/Jetty，无需部署 WAR         |
| 自动配置     | 根据依赖自动配置 Spring 和第三方库      |
| 起步依赖     | 简化 Maven/Gradle 配置                  |
| 无代码生成   | 不生成代码，不需要 XML 配置             |
| 生产就绪特性 | 指标、健康检查、外部化配置等            |

## Spring Boot 与 Spring 的关系

```
Spring Boot ≠ Spring 的替代品
Spring Boot = Spring 的增强版

Spring Boot 底层仍然是 Spring Framework，只是：
- 简化了配置
- 提供了自动配置
- 内嵌了服务器
- 提供了 Starter 依赖
```

## 版本选择

| Spring Boot 版本 | Spring 版本 | JDK 最低版本 | 说明       |
| :--------------- | :---------- | :----------- | :--------- |
| 2.7.x            | 5.3.x       | Java 8       | 维护中     |
| 3.0.x            | 6.0.x       | Java 17      | 最新稳定版 |
| 3.1.x            | 6.0.x       | Java 17      | 最新版本   |

::: warning 注意
Spring Boot 3.x 需要 Java 17+，并且包名从 `javax.*` 改为 `jakarta.*`。
:::

## 参考资料

::: info 官方文档
- Spring Boot 官方文档：https://docs.spring.io/spring-boot/docs/current/reference/html/
- Spring Initializr：https://start.spring.io/
:::

::: info 视频教程
- 尚硅谷 SpringBoot3：https://www.bilibili.com/video/BV1Es4y1q7Bf/
- 黑马程序员 SpringBoot：https://www.bilibili.com/video/BV1Lq4y1J77x
:::
