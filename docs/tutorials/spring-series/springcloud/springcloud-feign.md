---
order: 4
---

# SpringCloud - 服务调用

## OpenFeign 简介

OpenFeign 是一个声明式的 HTTP 客户端，使得服务间的 HTTP 调用更加简单。只需要创建一个接口并添加注解，即可实现服务调用。

### 特点

- 声明式调用，接口定义清晰
- 集成负载均衡
- 支持熔断降级
- 支持请求/响应压缩
- 支持日志记录

## 基本使用

### 添加依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

### 启用 Feign

```java
@SpringBootApplication
@EnableFeignClients  // 启用 Feign 客户端
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

### 定义 Feign 客户端

```java
@FeignClient(name = "user-service")  // 服务名
public interface UserClient {
    
    @GetMapping("/users/{id}")
    User getUser(@PathVariable("id") Long id);
    
    @GetMapping("/users")
    List<User> listUsers();
    
    @GetMapping("/users/search")
    List<User> searchUsers(@RequestParam("name") String name, 
                          @RequestParam("age") Integer age);
    
    @PostMapping("/users")
    User createUser(@RequestBody User user);
    
    @PutMapping("/users/{id}")
    User updateUser(@PathVariable("id") Long id, @RequestBody User user);
    
    @DeleteMapping("/users/{id}")
    void deleteUser(@PathVariable("id") Long id);
}
```

### 使用 Feign 客户端

```java
@Service
public class OrderService {
    
    @Autowired
    private UserClient userClient;
    
    public Order getOrder(Long orderId) {
        Order order = orderMapper.selectById(orderId);
        
        // 调用用户服务
        User user = userClient.getUser(order.getUserId());
        order.setUser(user);
        
        return order;
    }
}
```

## 配置

### 日志配置

```java
@Configuration
public class FeignConfig {
    
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
}
```

| 日志级别 | 说明                                      |
| :------- | :---------------------------------------- |
| NONE     | 不记录日志（默认）                        |
| BASIC    | 仅记录请求方法、URL、响应状态码和执行时间 |
| HEADERS  | BASIC + 请求和响应头                      |
| FULL     | 记录完整的请求和响应                      |

```yaml
logging:
  level:
    com.example.client: debug  # Feign 客户端所在包
```

### 超时配置

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:  # 全局配置
            connect-timeout: 5000
            read-timeout: 5000
          user-service:  # 指定服务配置
            connect-timeout: 3000
            read-timeout: 3000
```

### 请求压缩

```yaml
spring:
  cloud:
    openfeign:
      compression:
        request:
          enabled: true
          mime-types: text/xml,application/xml,application/json
          min-request-size: 2048
        response:
          enabled: true
```

## 熔断降级

### 整合 Sentinel

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

```yaml
feign:
  sentinel:
    enabled: true
```

### 定义降级类

```java
@FeignClient(name = "user-service", fallback = UserClientFallback.class)
public interface UserClient {
    
    @GetMapping("/users/{id}")
    User getUser(@PathVariable("id") Long id);
}

@Component
public class UserClientFallback implements UserClient {
    
    @Override
    public User getUser(Long id) {
        // 降级逻辑
        User user = new User();
        user.setId(id);
        user.setName("默认用户");
        return user;
    }
}
```

### 获取异常信息

```java
@FeignClient(name = "user-service", fallbackFactory = UserClientFallbackFactory.class)
public interface UserClient {
    
    @GetMapping("/users/{id}")
    User getUser(@PathVariable("id") Long id);
}

@Component
public class UserClientFallbackFactory implements FallbackFactory<UserClient> {
    
    @Override
    public UserClient create(Throwable cause) {
        return new UserClient() {
            @Override
            public User getUser(Long id) {
                // 可以记录异常
                log.error("调用用户服务失败: {}", cause.getMessage());
                
                User user = new User();
                user.setId(id);
                user.setName("降级用户");
                return user;
            }
        };
    }
}
```

## 拦截器

### 自定义请求拦截器

```java
@Component
public class FeignRequestInterceptor implements RequestInterceptor {
    
    @Override
    public void apply(RequestTemplate template) {
        // 获取当前请求
        ServletRequestAttributes attributes = (ServletRequestAttributes) 
            RequestContextHolder.getRequestAttributes();
        
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            
            // 传递请求头
            String token = request.getHeader("Authorization");
            if (token != null) {
                template.header("Authorization", token);
            }
            
            // 传递用户信息
            String userId = request.getHeader("X-User-Id");
            if (userId != null) {
                template.header("X-User-Id", userId);
            }
        }
        
        // 添加自定义请求头
        template.header("X-Request-Id", UUID.randomUUID().toString());
    }
}
```

## 最佳实践

### 抽取 Feign 接口到公共模块

```
project
├── user-api/                # 用户服务 API 模块
│   ├── src/
│   │   └── main/java
│   │       └── com.example.user.api
│   │           ├── client/
│   │           │   └── UserClient.java
│   │           ├── dto/
│   │           │   └── UserDTO.java
│   │           └── fallback/
│   │               └── UserClientFallback.java
│   └── pom.xml
│
├── user-service/            # 用户服务实现
│   └── ...
│
└── order-service/           # 订单服务（调用 user-api）
    └── pom.xml
```

**user-api/pom.xml:**

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
</dependencies>
```

**order-service/pom.xml:**

```xml
<dependencies>
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>user-api</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

**启动类配置:**

```java
@SpringBootApplication
@EnableFeignClients(basePackages = "com.example.user.api.client")
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

### 继承方式定义接口

```java
// 公共接口定义
public interface UserApi {
    
    @GetMapping("/users/{id}")
    User getUser(@PathVariable("id") Long id);
    
    @PostMapping("/users")
    User createUser(@RequestBody User user);
}

// Feign 客户端继承
@FeignClient(name = "user-service")
public interface UserClient extends UserApi {
}

// Controller 实现
@RestController
public class UserController implements UserApi {
    
    @Autowired
    private UserService userService;
    
    @Override
    public User getUser(Long id) {
        return userService.findById(id);
    }
    
    @Override
    public User createUser(User user) {
        return userService.save(user);
    }
}
```

## 性能优化

### 连接池配置

默认 Feign 使用 URLConnection，可以替换为 OkHttp 或 Apache HttpClient。

```xml
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-okhttp</artifactId>
</dependency>
```

```yaml
spring:
  cloud:
    openfeign:
      okhttp:
        enabled: true
```

```java
@Configuration
public class FeignOkHttpConfig {
    
    @Bean
    public OkHttpClient okHttpClient() {
        return new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .connectionPool(new ConnectionPool(100, 5, TimeUnit.MINUTES))
            .build();
    }
}
```
