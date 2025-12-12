---
index: false
icon: fluent:cloud-flow-20-filled
dir:
    order: 2
    link: true
---

# Spring MVC

Spring MVC 是 Spring 框架的一个模块，用于构建 Web 应用程序。它基于 MVC（Model-View-Controller）设计模式，提供了一套完整的 Web 开发解决方案。

## 目录

<Catalog hideHeading='false'/>

## 学习路线

### 基础入门

1. [简介与环境搭建](./springmvc-introduction.md) - MVC 模式、Spring MVC 特点、环境配置
2. [请求处理](./springmvc-request.md) - @RequestMapping、参数绑定、RESTful
3. [响应处理](./springmvc-response.md) - 视图解析、JSON 响应、文件下载

### 核心功能

4. [拦截器](./springmvc-interceptor.md) - 拦截器原理、登录验证、日志记录
5. [异常处理](./springmvc-exception.md) - 全局异常处理、统一响应格式
6. [数据绑定与转换](./springmvc-databind.md) - 类型转换、格式化、数据校验

## 什么是 MVC？

MVC 是一种软件架构设计模式，将应用程序分为三个核心部分：

```
┌─────────────────────────────────────────────────────────┐
│                      用户请求                            │
└─────────────────────────┬───────────────────────────────┘
                          ▼
              ┌───────────────────────┐
              │     Controller        │
              │    （控制器层）         │
              │  处理请求、调用服务     │
              └───────────┬───────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│       Model         │       │        View         │
│    （模型层）         │       │     （视图层）       │
│  业务逻辑、数据处理   │       │    页面展示、渲染    │
└─────────────────────┘       └─────────────────────┘
```

| 组件       | 职责                            |
| :--------- | :------------------------------ |
| Model      | 业务数据和业务逻辑              |
| View       | 数据的展示                      |
| Controller | 接收请求、调用 Model、返回 View |

## Spring MVC 特点

- **与 Spring 无缝集成**：可以使用 Spring 的所有功能（IoC、AOP）
- **约定优于配置**：减少配置，提高开发效率
- **支持 RESTful**：原生支持 REST 风格的 URL
- **灵活的视图技术**：支持 JSP、Thymeleaf、FreeMarker 等
- **强大的数据绑定**：自动将请求参数绑定到 Java 对象
- **便捷的异常处理**：统一的异常处理机制

## 参考资料

::: info 视频教程
- 尚硅谷 SpringMVC：https://www.bilibili.com/video/BV1Ry4y1574R
- 黑马程序员 SpringMVC：https://www.bilibili.com/video/BV1WZ4y1P7Bp
:::
