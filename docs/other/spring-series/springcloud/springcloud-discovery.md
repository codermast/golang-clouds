---
order: 2
---

# SpringCloud - 服务注册与发现

## 概述

服务注册与发现是微服务架构的核心组件，解决了服务之间如何相互找到的问题。

### 工作原理

```
┌─────────────────────────────────────────────────────────┐
│                    注册中心 (Nacos)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │           服务注册表                              │   │
│  │  user-service: [192.168.1.10:8081,              │   │
│  │                 192.168.1.11:8081]              │   │
│  │  order-service: [192.168.1.20:8082]             │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────┬──────────────────┘
                    │                 │
         ① 注册     │                 │  ② 拉取服务列表
         ④ 心跳     │                 │
                    │                 │
              ┌─────┴─────┐     ┌─────┴─────┐
              │用户服务    │     │订单服务    │
              │8081       │◄────│8082       │
              └───────────┘  ③  └───────────┘
                           调用
```

1. **服务注册**：服务启动时向注册中心注册自己的信息
2. **服务发现**：消费者从注册中心获取服务列表
3. **服务调用**：消费者根据服务列表调用服务
4. **心跳检测**：服务定期发送心跳，注册中心检测服务健康状态

## Nacos

Nacos（Dynamic Naming and Configuration Service）是阿里巴巴开源的服务发现和配置管理平台。

### 添加依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

### 配置

```yaml
spring:
  application:
    name: user-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        namespace: public          # 命名空间
        group: DEFAULT_GROUP       # 分组
        cluster-name: DEFAULT      # 集群名
        weight: 1                  # 权重
        metadata:                  # 元数据
          version: 1.0.0
```

### 启用服务发现

```java
@SpringBootApplication
@EnableDiscoveryClient  // 启用服务发现
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

### Nacos 服务分级模型

```
Nacos
├── Namespace（命名空间）    # 环境隔离：dev、test、prod
│   ├── Group（分组）        # 业务隔离
│   │   ├── Service（服务）  # 服务名
│   │   │   ├── Cluster（集群）  # 地域隔离
│   │   │   │   └── Instance（实例）  # 服务实例
```

### 临时实例 vs 永久实例

| 类型     | 心跳     | 下线处理               | 适用场景         |
| :------- | :------- | :--------------------- | :--------------- |
| 临时实例 | 需要心跳 | 心跳停止则移除         | 一般服务         |
| 永久实例 | 不需要   | 主动注销或健康检查失败 | 数据库等基础设施 |

```yaml
spring:
  cloud:
    nacos:
      discovery:
        ephemeral: true  # true: 临时实例（默认），false: 永久实例
```

## Eureka

Eureka 是 Netflix 开源的服务注册中心。

### Eureka Server

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```

```yaml
server:
  port: 8761

eureka:
  instance:
    hostname: localhost
  client:
    register-with-eureka: false
    fetch-registry: false
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
```

```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

### Eureka Client

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

## 服务调用

### RestTemplate

```java
@Configuration
public class RestTemplateConfig {
    
    @Bean
    @LoadBalanced  // 启用负载均衡
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

@Service
public class OrderService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    public User getUser(Long userId) {
        // 使用服务名替代 IP:端口
        String url = "http://user-service/users/" + userId;
        return restTemplate.getForObject(url, User.class);
    }
}
```

### OpenFeign（推荐）

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

```java
@SpringBootApplication
@EnableFeignClients
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

// 定义 Feign 客户端
@FeignClient(name = "user-service")
public interface UserClient {
    
    @GetMapping("/users/{id}")
    User getUser(@PathVariable("id") Long id);
    
    @PostMapping("/users")
    User createUser(@RequestBody User user);
}

// 使用
@Service
public class OrderService {
    
    @Autowired
    private UserClient userClient;
    
    public Order getOrder(Long orderId) {
        Order order = orderMapper.selectById(orderId);
        User user = userClient.getUser(order.getUserId());
        order.setUser(user);
        return order;
    }
}
```

## 负载均衡

### LoadBalancer

Spring Cloud LoadBalancer 是 Spring Cloud 官方的负载均衡器，替代了 Ribbon。

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

### 负载均衡策略

| 策略       | 说明         |
| :--------- | :----------- |
| RoundRobin | 轮询（默认） |
| Random     | 随机         |

### 自定义负载均衡

```java
public class CustomLoadBalancer implements ReactorServiceInstanceLoadBalancer {
    
    private final String serviceId;
    private final ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider;
    
    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        return serviceInstanceListSupplierProvider.getIfAvailable()
            .get(request)
            .next()
            .map(instances -> {
                // 自定义选择逻辑
                ServiceInstance instance = instances.get(0);
                return new DefaultResponse(instance);
            });
    }
}

@Configuration
public class LoadBalancerConfig {
    
    @Bean
    public ReactorLoadBalancer<ServiceInstance> reactorServiceInstanceLoadBalancer(
            Environment environment,
            LoadBalancerClientFactory loadBalancerClientFactory) {
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        return new CustomLoadBalancer(name, 
            loadBalancerClientFactory.getLazyProvider(name, ServiceInstanceListSupplier.class));
    }
}
```

### 基于 Nacos 权重的负载均衡

```java
public class NacosWeightLoadBalancer implements ReactorServiceInstanceLoadBalancer {
    
    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        return serviceInstanceListSupplierProvider.getIfAvailable()
            .get(request)
            .next()
            .map(instances -> {
                // 根据权重选择实例
                Instance instance = NacosBalancer.getHostByRandomWeight(
                    instances.stream()
                        .map(this::toNacosInstance)
                        .collect(Collectors.toList())
                );
                return new DefaultResponse(toServiceInstance(instance));
            });
    }
}
```

## 健康检查

### Nacos 健康检查

```yaml
spring:
  cloud:
    nacos:
      discovery:
        heart-beat-interval: 5000       # 心跳间隔，毫秒
        heart-beat-timeout: 15000       # 心跳超时时间
        ip-delete-timeout: 30000        # IP 删除超时时间
```

### 自定义健康检查

```java
@Component
public class CustomHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        // 检查逻辑
        boolean healthy = checkHealth();
        
        if (healthy) {
            return Health.up().withDetail("status", "OK").build();
        }
        return Health.down().withDetail("status", "Error").build();
    }
    
    private boolean checkHealth() {
        // 自定义健康检查逻辑
        return true;
    }
}
```
