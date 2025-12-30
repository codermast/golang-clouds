---
order: 3
---

# SpringCloud - 服务网关

## 概述

API 网关是微服务架构的入口，负责请求路由、负载均衡、鉴权、限流等功能。

### 网关的作用

```
                     ┌────────────────────────────────────┐
     客户端请求 ───►  │          API 网关 (Gateway)         │
                     │                                    │
                     │  ✓ 路由转发    ✓ 负载均衡          │
                     │  ✓ 身份认证    ✓ 权限校验          │
                     │  ✓ 限流熔断    ✓ 日志记录          │
                     │  ✓ 请求改写    ✓ 响应改写          │
                     └──────────────┬─────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │  用户服务   │          │  订单服务   │          │  商品服务   │
    └─────────────┘          └─────────────┘          └─────────────┘
```

## Spring Cloud Gateway

Spring Cloud Gateway 是 Spring Cloud 官方推出的网关组件，基于 WebFlux 响应式编程。

### 添加依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

::: warning 注意
Spring Cloud Gateway 基于 WebFlux，不能和 spring-boot-starter-web 一起使用。
:::

### 基本配置

```yaml
server:
  port: 8080

spring:
  application:
    name: gateway
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
    gateway:
      routes:
        - id: user-service           # 路由ID，唯一
          uri: lb://user-service     # 目标地址，lb:// 表示负载均衡
          predicates:                # 断言（路由条件）
            - Path=/api/users/**
          filters:                   # 过滤器
            - StripPrefix=1          # 去掉前缀
            
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
```

### 路由配置方式

**方式一：配置文件**

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-route
          uri: lb://user-service
          predicates:
            - Path=/users/**
```

**方式二：Java 代码**

```java
@Configuration
public class GatewayConfig {
    
    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("user-route", r -> r
                .path("/users/**")
                .uri("lb://user-service"))
            .route("order-route", r -> r
                .path("/orders/**")
                .filters(f -> f.stripPrefix(1))
                .uri("lb://order-service"))
            .build();
    }
}
```

## 断言工厂（Predicate）

断言用于匹配请求，满足条件的请求才会被路由。

### 常用断言

| 断言       | 说明      | 示例                               |
| :--------- | :-------- | :--------------------------------- |
| Path       | 路径匹配  | `Path=/api/**`                     |
| Method     | 请求方法  | `Method=GET,POST`                  |
| Header     | 请求头    | `Header=X-Token, \d+`              |
| Query      | 查询参数  | `Query=name`                       |
| Host       | 主机名    | `Host=**.example.com`              |
| Cookie     | Cookie    | `Cookie=token, \d+`                |
| After      | 时间之后  | `After=2024-01-01T00:00:00+08:00`  |
| Before     | 时间之前  | `Before=2024-12-31T23:59:59+08:00` |
| Between    | 时间区间  | `Between=时间1,时间2`              |
| RemoteAddr | 客户端 IP | `RemoteAddr=192.168.1.0/24`        |

### 示例

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: complex-route
          uri: lb://service
          predicates:
            - Path=/api/**
            - Method=GET,POST
            - Header=Authorization
            - Query=token
            - After=2024-01-01T00:00:00+08:00[Asia/Shanghai]
```

## 过滤器（Filter）

过滤器可以在请求被路由前后进行处理。

### 内置过滤器

| 过滤器             | 说明           |
| :----------------- | :------------- |
| StripPrefix        | 去掉路径前缀   |
| AddRequestHeader   | 添加请求头     |
| AddResponseHeader  | 添加响应头     |
| SetPath            | 设置路径       |
| RewritePath        | 重写路径       |
| SetStatus          | 设置响应状态码 |
| Retry              | 重试           |
| RequestRateLimiter | 限流           |

### 过滤器示例

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: filter-route
          uri: lb://service
          predicates:
            - Path=/api/**
          filters:
            - StripPrefix=1
            - AddRequestHeader=X-Request-Id, ${random.uuid}
            - AddResponseHeader=X-Response-Time, ${timestamp}
            - RewritePath=/api/(?<segment>.*), /$\{segment}
```

### 全局过滤器

```yaml
spring:
  cloud:
    gateway:
      default-filters:
        - AddRequestHeader=X-Gateway, true
```

## 自定义过滤器

### 自定义 GatewayFilter

```java
@Component
public class AuthGatewayFilterFactory extends AbstractGatewayFilterFactory<AuthGatewayFilterFactory.Config> {
    
    public AuthGatewayFilterFactory() {
        super(Config.class);
    }
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            
            // 获取 token
            String token = request.getHeaders().getFirst("Authorization");
            
            if (token == null || !validateToken(token)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            
            return chain.filter(exchange);
        };
    }
    
    private boolean validateToken(String token) {
        // 验证 token 逻辑
        return true;
    }
    
    @Data
    public static class Config {
        private boolean enabled = true;
    }
}
```

### 自定义全局过滤器

```java
@Component
@Order(-1)  // 数值越小，优先级越高
public class AuthGlobalFilter implements GlobalFilter {
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();
        
        // 白名单路径
        if (isWhitePath(path)) {
            return chain.filter(exchange);
        }
        
        // 验证 token
        String token = request.getHeaders().getFirst("Authorization");
        if (token == null || !validateToken(token)) {
            return unauthorized(exchange);
        }
        
        return chain.filter(exchange);
    }
    
    private boolean isWhitePath(String path) {
        return path.contains("/login") || path.contains("/register");
    }
    
    private boolean validateToken(String token) {
        // 验证逻辑
        return true;
    }
    
    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        
        String body = "{\"code\":401,\"message\":\"未授权\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        
        return response.writeWith(Mono.just(buffer));
    }
}
```

## 跨域配置

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "*"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders: "*"
            maxAge: 3600
```

## 限流配置

### 基于 Redis 的限流

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
</dependency>
```

```java
@Configuration
public class RateLimiterConfig {
    
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
        );
    }
    
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest().getHeaders().getFirst("X-User-Id")
        );
    }
}
```

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: rate-limit-route
          uri: lb://service
          predicates:
            - Path=/api/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10   # 每秒允许请求数
                redis-rate-limiter.burstCapacity: 20   # 令牌桶容量
                key-resolver: "#{@ipKeyResolver}"
```

## 整合 Sentinel

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-alibaba-sentinel-gateway</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-spring-cloud-gateway-adapter</artifactId>
</dependency>
```

```yaml
spring:
  cloud:
    sentinel:
      transport:
        dashboard: localhost:8080
```
