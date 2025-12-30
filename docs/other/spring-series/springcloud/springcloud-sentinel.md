---
order: 5
---

# SpringCloud - 服务保护

## Sentinel 简介

Sentinel 是阿里巴巴开源的分布式系统流量控制组件，以流量为切入点，提供流量控制、熔断降级、系统负载保护等功能。

### 核心功能

| 功能     | 说明                              |
| :------- | :-------------------------------- |
| 流量控制 | 根据 QPS、并发线程数等限制流量    |
| 熔断降级 | 当资源不稳定时，暂时切断调用      |
| 系统保护 | 根据系统负载（CPU、内存）保护系统 |
| 热点防护 | 对热点参数进行限流                |
| 授权规则 | 根据调用来源进行访问控制          |

## 快速开始

### 添加依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

### 配置

```yaml
spring:
  cloud:
    sentinel:
      transport:
        dashboard: localhost:8080  # Sentinel 控制台地址
        port: 8719                 # 与控制台通信的端口
      eager: true                  # 启动时立即连接控制台
```

### 定义资源

```java
@RestController
@RequestMapping("/users")
public class UserController {
    
    // 方式一：注解方式
    @GetMapping("/{id}")
    @SentinelResource(
        value = "getUser",
        blockHandler = "getUserBlockHandler",
        fallback = "getUserFallback"
    )
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    // 限流降级处理
    public User getUserBlockHandler(Long id, BlockException ex) {
        return new User(id, "限流用户");
    }
    
    // 异常降级处理
    public User getUserFallback(Long id, Throwable ex) {
        return new User(id, "异常用户");
    }
}
```

## 流量控制

### 流控规则

| 属性            | 说明                           |
| :-------------- | :----------------------------- |
| resource        | 资源名                         |
| grade           | 阈值类型（QPS/并发线程数）     |
| count           | 阈值                           |
| strategy        | 流控模式（直接/关联/链路）     |
| controlBehavior | 流控效果（快速失败/预热/排队） |

### 代码配置流控规则

```java
@Configuration
public class SentinelConfig {
    
    @PostConstruct
    public void initFlowRules() {
        List<FlowRule> rules = new ArrayList<>();
        
        FlowRule rule = new FlowRule();
        rule.setResource("getUser");
        rule.setGrade(RuleConstant.FLOW_GRADE_QPS);  // QPS 模式
        rule.setCount(10);  // 阈值 10
        rule.setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_DEFAULT);  // 快速失败
        
        rules.add(rule);
        FlowRuleManager.loadRules(rules);
    }
}
```

### 流控模式

**1. 直接模式**

直接限制资源本身的请求。

**2. 关联模式**

当关联资源达到阈值时，限制本资源。

```java
// 当写操作达到阈值时，限制读操作
FlowRule rule = new FlowRule();
rule.setResource("read");
rule.setRefResource("write");  // 关联资源
rule.setStrategy(RuleConstant.STRATEGY_RELATE);
rule.setCount(10);
```

**3. 链路模式**

只统计从指定链路入口进来的流量。

```java
FlowRule rule = new FlowRule();
rule.setResource("getUser");
rule.setRefResource("entrance1");  // 入口资源
rule.setStrategy(RuleConstant.STRATEGY_CHAIN);
rule.setCount(10);
```

### 流控效果

| 效果     | 说明                     |
| :------- | :----------------------- |
| 快速失败 | 直接抛出异常             |
| Warm Up  | 预热，逐渐增加阈值       |
| 排队等待 | 匀速排队，让请求匀速通过 |

```java
// 预热模式
FlowRule rule = new FlowRule();
rule.setResource("getUser");
rule.setCount(100);
rule.setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_WARM_UP);
rule.setWarmUpPeriodSec(10);  // 预热时间 10 秒

// 排队等待模式
FlowRule rule2 = new FlowRule();
rule2.setResource("getUser");
rule2.setCount(10);
rule2.setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_RATE_LIMITER);
rule2.setMaxQueueingTimeMs(5000);  // 最大等待时间
```

## 熔断降级

当资源不稳定时（响应慢或异常比例高），暂时切断对该资源的调用。

### 熔断策略

| 策略       | 说明                       |
| :--------- | :------------------------- |
| 慢调用比例 | 响应时间超过阈值的请求比例 |
| 异常比例   | 异常请求的比例             |
| 异常数     | 异常请求的数量             |

### 熔断状态

```
         ┌─────────────────────────────────────────┐
         │                                         │
         ▼                                         │
    ┌─────────┐     触发熔断     ┌─────────┐      │
    │  关闭   │ ───────────────► │  打开   │      │
    │ (正常)  │                  │ (熔断)  │      │
    └────┬────┘                  └────┬────┘      │
         │                            │           │
         │                            │ 熔断时间结束
         │                            ▼           │
         │                      ┌─────────┐      │
         │                      │ 半开放  │      │
         │                      └────┬────┘      │
         │                           │           │
         │     请求成功               │ 请求失败  │
         └───────────────────────────┴───────────┘
```

### 代码配置熔断规则

```java
@Configuration
public class SentinelConfig {
    
    @PostConstruct
    public void initDegradeRules() {
        List<DegradeRule> rules = new ArrayList<>();
        
        // 慢调用比例
        DegradeRule rule = new DegradeRule();
        rule.setResource("getUser");
        rule.setGrade(CircuitBreakerStrategy.SLOW_REQUEST_RATIO.getType());
        rule.setCount(0.5);  // 比例阈值 50%
        rule.setSlowRatioThreshold(0.5);
        rule.setTimeWindow(10);  // 熔断时间 10 秒
        rule.setMinRequestAmount(5);  // 最小请求数
        rule.setStatIntervalMs(1000);  // 统计时间窗口
        
        // 异常比例
        DegradeRule rule2 = new DegradeRule();
        rule2.setResource("getUser");
        rule2.setGrade(CircuitBreakerStrategy.ERROR_RATIO.getType());
        rule2.setCount(0.5);  // 异常比例 50%
        rule2.setTimeWindow(10);
        rule2.setMinRequestAmount(5);
        
        rules.add(rule);
        rules.add(rule2);
        DegradeRuleManager.loadRules(rules);
    }
}
```

## 热点参数限流

对热点参数进行限流，例如限制某个用户 ID 的访问频率。

```java
@GetMapping("/goods/{id}")
@SentinelResource(value = "getGoods", blockHandler = "getGoodsBlockHandler")
public Goods getGoods(@PathVariable Long id) {
    return goodsService.findById(id);
}

public Goods getGoodsBlockHandler(Long id, BlockException ex) {
    return new Goods(id, "热点商品");
}
```

```java
// 热点参数规则
ParamFlowRule rule = new ParamFlowRule();
rule.setResource("getGoods");
rule.setParamIdx(0);  // 参数索引
rule.setCount(5);  // 阈值

// 特定参数值设置不同阈值
ParamFlowItem item = new ParamFlowItem();
item.setObject("100");  // 商品 ID = 100
item.setCount(10);  // 特殊阈值
item.setClassType(Long.class.getName());
rule.setParamFlowItemList(Collections.singletonList(item));

ParamFlowRuleManager.loadRules(Collections.singletonList(rule));
```

## 系统保护

根据系统的整体负载情况进行保护。

| 指标       | 说明                       |
| :--------- | :------------------------- |
| Load       | 系统负载（Linux）          |
| RT         | 所有入口流量的平均响应时间 |
| 入口 QPS   | 所有入口流量的 QPS         |
| 并发线程数 | 所有入口流量的并发线程数   |
| CPU 使用率 | 系统 CPU 使用率            |

```java
SystemRule rule = new SystemRule();
rule.setHighestSystemLoad(3.0);
rule.setHighestCpuUsage(0.6);
rule.setAvgRt(100);
rule.setQps(1000);
rule.setMaxThread(200);

SystemRuleManager.loadRules(Collections.singletonList(rule));
```

## 规则持久化

默认规则存储在内存中，重启后丢失。可以持久化到 Nacos、Redis 等。

### Nacos 持久化

```xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
</dependency>
```

```yaml
spring:
  cloud:
    sentinel:
      datasource:
        flow:
          nacos:
            server-addr: localhost:8848
            data-id: ${spring.application.name}-flow-rules
            group-id: SENTINEL_GROUP
            data-type: json
            rule-type: flow
        degrade:
          nacos:
            server-addr: localhost:8848
            data-id: ${spring.application.name}-degrade-rules
            group-id: SENTINEL_GROUP
            data-type: json
            rule-type: degrade
```

在 Nacos 中配置规则（JSON 格式）：

```json
[
  {
    "resource": "getUser",
    "limitApp": "default",
    "grade": 1,
    "count": 10,
    "strategy": 0,
    "controlBehavior": 0,
    "clusterMode": false
  }
]
```

## 全局异常处理

```java
@Component
public class SentinelBlockExceptionHandler implements BlockExceptionHandler {
    
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, 
                      BlockException e) throws Exception {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_TOO_MANY_REQUESTS);
        
        Result result;
        if (e instanceof FlowException) {
            result = Result.error(429, "请求过于频繁，请稍后再试");
        } else if (e instanceof DegradeException) {
            result = Result.error(503, "服务暂时不可用，请稍后再试");
        } else if (e instanceof ParamFlowException) {
            result = Result.error(429, "热点参数限流");
        } else if (e instanceof SystemBlockException) {
            result = Result.error(503, "系统繁忙，请稍后再试");
        } else if (e instanceof AuthorityException) {
            result = Result.error(403, "无权访问");
        } else {
            result = Result.error(500, "未知异常");
        }
        
        response.getWriter().write(new ObjectMapper().writeValueAsString(result));
    }
}
```
