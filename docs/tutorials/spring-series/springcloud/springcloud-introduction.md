---
order: 1
---

# SpringCloud - 微服务概述

## 什么是微服务？

微服务是一种架构风格，将单一应用程序划分为一组小型服务，每个服务运行在独立的进程中，服务之间通过轻量级通信机制（如 HTTP RESTful API）进行交互。

### 单体架构 vs 微服务架构

| 特点     | 单体架构         | 微服务架构     |
| :------- | :--------------- | :------------- |
| 部署     | 整体部署         | 独立部署       |
| 技术栈   | 统一技术栈       | 技术异构       |
| 扩展性   | 整体扩展         | 按需扩展       |
| 开发效率 | 初期快，后期慢   | 初期慢，后期快 |
| 维护成本 | 低（单一代码库） | 高（多个服务） |
| 故障影响 | 全局             | 局部           |

### 微服务的优缺点

**优点：**
- 服务独立开发、部署、扩展
- 技术栈灵活，可以选择最适合的技术
- 故障隔离，单个服务故障不影响全局
- 按需扩展，资源利用率高

**缺点：**
- 分布式系统复杂性（网络延迟、容错、数据一致性）
- 运维成本高（监控、部署、日志）
- 服务间通信开销
- 分布式事务处理困难

## Spring Cloud 简介

Spring Cloud 是基于 Spring Boot 的微服务框架，提供了一整套微服务解决方案。

### 核心组件

```
┌──────────────────────────────────────────────────────────────┐
│                     Spring Cloud 生态                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 服务注册发现 │  │  配置中心    │  │  服务网关   │          │
│  │   Nacos     │  │ Nacos Config│  │  Gateway    │          │
│  │   Eureka    │  │   Apollo    │  │   Zuul      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  服务调用   │  │  负载均衡   │  │  服务保护   │          │
│  │  OpenFeign  │  │LoadBalancer │  │  Sentinel   │          │
│  │RestTemplate │  │   Ribbon    │  │   Hystrix   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 分布式事务  │  │  链路追踪   │  │  消息总线   │          │
│  │   Seata     │  │   Sleuth    │  │    Bus      │          │
│  │             │  │   Zipkin    │  │  Stream     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 组件功能说明

| 组件         | 功能说明                           |
| :----------- | :--------------------------------- |
| 服务注册发现 | 服务自动注册，其他服务可发现并调用 |
| 配置中心     | 集中管理配置，支持动态刷新         |
| 服务网关     | 统一入口，路由转发、鉴权、限流     |
| 服务调用     | 服务间 HTTP 调用，声明式客户端     |
| 负载均衡     | 请求分发到多个服务实例             |
| 服务保护     | 限流、熔断、降级，保护系统稳定     |
| 分布式事务   | 跨服务的事务一致性                 |
| 链路追踪     | 请求链路跟踪，问题定位             |
| 消息总线     | 事件广播，配置刷新                 |

## 微服务项目结构

### 典型项目结构

```
microservice-demo/
├── demo-parent/                 # 父工程，统一依赖管理
│   └── pom.xml
├── demo-common/                 # 公共模块
│   ├── src/
│   └── pom.xml
├── demo-gateway/                # 网关服务
│   ├── src/
│   └── pom.xml
├── demo-user/                   # 用户服务
│   ├── demo-user-api/           # 用户服务接口
│   └── demo-user-service/       # 用户服务实现
├── demo-order/                  # 订单服务
│   ├── demo-order-api/
│   └── demo-order-service/
├── demo-product/                # 商品服务
│   ├── demo-product-api/
│   └── demo-product-service/
└── pom.xml
```

### 父工程 POM

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>microservice-demo</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    
    <modules>
        <module>demo-common</module>
        <module>demo-gateway</module>
        <module>demo-user</module>
        <module>demo-order</module>
        <module>demo-product</module>
    </modules>
    
    <properties>
        <java.version>17</java.version>
        <spring-boot.version>3.1.0</spring-boot.version>
        <spring-cloud.version>2022.0.3</spring-cloud.version>
        <spring-cloud-alibaba.version>2022.0.0.0</spring-cloud-alibaba.version>
    </properties>
    
    <dependencyManagement>
        <dependencies>
            <!-- Spring Boot -->
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            
            <!-- Spring Cloud -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            
            <!-- Spring Cloud Alibaba -->
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring-cloud-alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

## 环境准备

### Nacos 安装

Nacos 是阿里巴巴开源的服务发现和配置管理平台。

**Docker 安装：**

```bash
# 拉取镜像
docker pull nacos/nacos-server:v2.2.3

# 单机模式运行
docker run -d \
  --name nacos \
  -e MODE=standalone \
  -p 8848:8848 \
  -p 9848:9848 \
  nacos/nacos-server:v2.2.3
```

**访问控制台：**
- 地址：http://localhost:8848/nacos
- 默认账号：nacos / nacos

### Sentinel 安装

Sentinel 是阿里巴巴开源的流量控制组件。

```bash
# 下载
wget https://github.com/alibaba/Sentinel/releases/download/1.8.6/sentinel-dashboard-1.8.6.jar

# 运行
java -Dserver.port=8080 -jar sentinel-dashboard-1.8.6.jar
```

**访问控制台：**
- 地址：http://localhost:8080
- 默认账号：sentinel / sentinel

## 第一个微服务

### 服务提供者

```xml
<!-- pom.xml -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
</dependencies>
```

```yaml
# application.yml
server:
  port: 8081

spring:
  application:
    name: user-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
```

```java
@SpringBootApplication
@EnableDiscoveryClient
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}

@RestController
@RequestMapping("/users")
public class UserController {
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return new User(id, "用户" + id);
    }
}
```

### 服务消费者

```xml
<!-- pom.xml -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-loadbalancer</artifactId>
    </dependency>
</dependencies>
```

```yaml
# application.yml
server:
  port: 8082

spring:
  application:
    name: order-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
```

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

// Feign 客户端
@FeignClient(name = "user-service")
public interface UserClient {
    
    @GetMapping("/users/{id}")
    User getUser(@PathVariable Long id);
}

@RestController
@RequestMapping("/orders")
public class OrderController {
    
    @Autowired
    private UserClient userClient;
    
    @GetMapping("/{id}")
    public Order getOrder(@PathVariable Long id) {
        Order order = new Order(id, "订单" + id, 1L);
        // 调用用户服务
        User user = userClient.getUser(order.getUserId());
        order.setUser(user);
        return order;
    }
}
```
