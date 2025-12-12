---
order: 6
---

# SpringCloud - 配置中心

## 概述

在微服务架构中，配置管理面临以下问题：

- 配置分散：每个服务都有自己的配置文件
- 配置修改需要重启：修改配置后需要重启服务
- 配置无法追溯：配置变更历史无法追踪

配置中心可以解决这些问题，实现配置的集中管理和动态刷新。

## Nacos Config

Nacos 不仅提供服务发现功能，还提供配置管理功能。

### 添加依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<!-- Spring Cloud 2020 之后需要添加 -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
```

### 配置

创建 `bootstrap.yml`（优先于 `application.yml` 加载）：

```yaml
spring:
  application:
    name: user-service
  profiles:
    active: dev
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        file-extension: yaml
        namespace: public
        group: DEFAULT_GROUP
```

### 配置文件命名规则

Nacos 配置文件的 Data ID 格式：

```
${spring.application.name}-${spring.profiles.active}.${file-extension}
```

示例：
- `user-service.yaml` - 默认配置
- `user-service-dev.yaml` - 开发环境
- `user-service-prod.yaml` - 生产环境

### 在 Nacos 中创建配置

1. 登录 Nacos 控制台
2. 配置管理 → 配置列表 → 创建配置
3. 填写配置：
   - Data ID: `user-service-dev.yaml`
   - Group: `DEFAULT_GROUP`
   - 配置格式: `YAML`
   - 配置内容:

```yaml
server:
  port: 8081

custom:
  config:
    name: 用户服务
    version: 1.0.0
```

### 读取配置

```java
@RestController
@RequestMapping("/config")
public class ConfigController {
    
    @Value("${custom.config.name}")
    private String configName;
    
    @Value("${custom.config.version}")
    private String configVersion;
    
    @GetMapping
    public Map<String, String> getConfig() {
        Map<String, String> map = new HashMap<>();
        map.put("name", configName);
        map.put("version", configVersion);
        return map;
    }
}
```

## 配置动态刷新

### @RefreshScope

使用 `@RefreshScope` 注解实现配置动态刷新：

```java
@RestController
@RequestMapping("/config")
@RefreshScope  // 配置刷新时重新创建 Bean
public class ConfigController {
    
    @Value("${custom.config.name}")
    private String configName;
    
    @GetMapping
    public String getConfig() {
        return configName;
    }
}
```

### @ConfigurationProperties

使用 `@ConfigurationProperties` 自动支持动态刷新：

```java
@Component
@ConfigurationProperties(prefix = "custom.config")
@Data
public class CustomConfig {
    private String name;
    private String version;
}

@RestController
@RequestMapping("/config")
public class ConfigController {
    
    @Autowired
    private CustomConfig customConfig;
    
    @GetMapping
    public CustomConfig getConfig() {
        return customConfig;  // 自动获取最新配置
    }
}
```

## 多环境配置

### 命名空间（Namespace）

用于隔离不同环境的配置：

```yaml
spring:
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        namespace: dev-namespace-id  # 命名空间 ID
```

### 分组（Group）

用于区分不同项目的配置：

```yaml
spring:
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        group: PROJECT_A  # 分组名
```

### 共享配置

多个服务共用的配置：

```yaml
spring:
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        shared-configs:
          - data-id: common.yaml
            group: DEFAULT_GROUP
            refresh: true
          - data-id: database.yaml
            group: DEFAULT_GROUP
            refresh: true
        extension-configs:
          - data-id: redis.yaml
            group: DEFAULT_GROUP
            refresh: true
```

配置加载顺序（后加载的覆盖前面的）：
1. `shared-configs`
2. `extension-configs`
3. `${spring.application.name}-${profile}.${file-extension}`

## 配置监听

### 监听配置变化

```java
@Component
@Slf4j
public class ConfigChangeListener implements ApplicationListener<RefreshScopeRefreshedEvent> {
    
    @Override
    public void onApplicationEvent(RefreshScopeRefreshedEvent event) {
        log.info("配置已刷新");
    }
}
```

### 使用 Nacos 监听器

```java
@Component
public class NacosConfigListener {
    
    @NacosConfigListener(dataId = "user-service-dev.yaml", groupId = "DEFAULT_GROUP")
    public void onConfigChange(String config) {
        System.out.println("配置已变更: " + config);
        // 处理配置变更逻辑
    }
}
```

## 配置加密

### 使用 Jasypt 加密

```xml
<dependency>
    <groupId>com.github.ulisesbocchio</groupId>
    <artifactId>jasypt-spring-boot-starter</artifactId>
    <version>3.0.5</version>
</dependency>
```

```yaml
# bootstrap.yml
jasypt:
  encryptor:
    password: ${JASYPT_PASSWORD:mySecretKey}
    algorithm: PBEWithMD5AndDES
```

```yaml
# Nacos 配置
spring:
  datasource:
    password: ENC(加密后的密码)
```

## 完整示例

### bootstrap.yml

```yaml
spring:
  application:
    name: user-service
  profiles:
    active: dev
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
      config:
        server-addr: localhost:8848
        file-extension: yaml
        namespace: ${NACOS_NAMESPACE:public}
        group: ${NACOS_GROUP:DEFAULT_GROUP}
        shared-configs:
          - data-id: common.yaml
            group: DEFAULT_GROUP
            refresh: true
```

### Nacos 配置 - common.yaml

```yaml
# 公共配置
logging:
  level:
    root: info
    com.example: debug

spring:
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
```

### Nacos 配置 - user-service-dev.yaml

```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/user_db
    username: root
    password: 123456

custom:
  config:
    name: 用户服务
    version: 1.0.0
    features:
      - feature1
      - feature2
```

### 配置类

```java
@Component
@ConfigurationProperties(prefix = "custom.config")
@Data
public class CustomConfig {
    private String name;
    private String version;
    private List<String> features;
}
```

### 控制器

```java
@RestController
@RequestMapping("/config")
public class ConfigController {
    
    @Autowired
    private CustomConfig customConfig;
    
    @GetMapping
    public CustomConfig getConfig() {
        return customConfig;
    }
}
```

## 配置管理最佳实践

1. **命名空间隔离环境**：dev、test、prod 使用不同命名空间
2. **分组隔离项目**：不同项目使用不同分组
3. **共享通用配置**：数据库、Redis 等通用配置提取为共享配置
4. **敏感信息加密**：密码等敏感信息使用加密存储
5. **配置版本控制**：重要配置变更前备份，利用 Nacos 的历史版本功能
6. **监控配置变更**：监听配置变化，记录日志
