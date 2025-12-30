---
order: 2
---

# SpringBoot - 配置详解

## 配置文件

Spring Boot 支持两种配置文件格式：

| 格式       | 文件名                 | 特点               |
| :--------- | :--------------------- | :----------------- |
| Properties | application.properties | 简单，键值对形式   |
| YAML       | application.yml        | 层次清晰，支持列表 |

### Properties 格式

```properties
# 服务器配置
server.port=8080
server.servlet.context-path=/api

# 数据源配置
spring.datasource.url=jdbc:mysql://localhost:3306/test
spring.datasource.username=root
spring.datasource.password=123456

# 日志配置
logging.level.root=info
logging.level.com.example=debug
```

### YAML 格式（推荐）

```yaml
# 服务器配置
server:
  port: 8080
  servlet:
    context-path: /api

# 数据源配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/test
    username: root
    password: 123456

# 日志配置
logging:
  level:
    root: info
    com.example: debug
```

### YAML 语法

```yaml
# 基本类型
name: John
age: 25
active: true

# 对象
person:
  name: John
  age: 25

# 行内对象
person: {name: John, age: 25}

# 数组/列表
hobbies:
  - reading
  - gaming
  - coding

# 行内数组
hobbies: [reading, gaming, coding]

# 多行文本
description: |
  This is line 1.
  This is line 2.

# 引用
defaults: &defaults
  adapter: postgres
  host: localhost

development:
  <<: *defaults
  database: dev_db
```

## 配置绑定

### @Value 注入

```java
@Component
public class MyConfig {
    
    @Value("${server.port}")
    private int port;
    
    @Value("${app.name:默认值}")  // 带默认值
    private String appName;
    
    @Value("${app.list}")
    private List<String> list;
    
    @Value("#{${app.map}}")  // SpEL 表达式
    private Map<String, String> map;
}
```

```yaml
app:
  name: MyApp
  list: item1,item2,item3
  map: "{key1: 'value1', key2: 'value2'}"
```

### @ConfigurationProperties 绑定

```java
@Component
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {
    private String name;
    private String version;
    private Security security;
    private List<String> servers;
    
    @Data
    public static class Security {
        private String username;
        private String password;
    }
}
```

```yaml
app:
  name: MyApp
  version: 1.0.0
  security:
    username: admin
    password: 123456
  servers:
    - server1.example.com
    - server2.example.com
```

### 启用配置绑定

```java
// 方式一：在配置类上使用 @EnableConfigurationProperties
@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class AppConfig {
}

// 方式二：在属性类上使用 @Component
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
}
```

### 配置校验

```java
@ConfigurationProperties(prefix = "app")
@Validated
@Data
public class AppProperties {
    
    @NotEmpty
    private String name;
    
    @Min(1)
    @Max(65535)
    private Integer port;
    
    @Valid
    private Security security;
    
    @Data
    public static class Security {
        @NotEmpty
        private String username;
        
        @Size(min = 6, max = 20)
        private String password;
    }
}
```

## 多环境配置

### 方式一：多文件

```
resources/
├── application.yml          # 公共配置
├── application-dev.yml      # 开发环境
├── application-test.yml     # 测试环境
└── application-prod.yml     # 生产环境
```

```yaml
# application.yml
spring:
  profiles:
    active: dev  # 激活开发环境
```

```yaml
# application-dev.yml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dev_db
```

```yaml
# application-prod.yml
server:
  port: 80
spring:
  datasource:
    url: jdbc:mysql://prod-server:3306/prod_db
```

### 方式二：单文件多文档

```yaml
# 公共配置
spring:
  profiles:
    active: dev

---
# 开发环境
spring:
  config:
    activate:
      on-profile: dev
server:
  port: 8080

---
# 生产环境
spring:
  config:
    activate:
      on-profile: prod
server:
  port: 80
```

### 激活环境

```bash
# 方式一：配置文件
spring.profiles.active=prod

# 方式二：命令行参数
java -jar app.jar --spring.profiles.active=prod

# 方式三：环境变量
export SPRING_PROFILES_ACTIVE=prod

# 方式四：JVM 参数
java -Dspring.profiles.active=prod -jar app.jar
```

### @Profile 注解

```java
@Configuration
@Profile("dev")
public class DevConfig {
    @Bean
    public DataSource dataSource() {
        // 开发环境数据源
    }
}

@Configuration
@Profile("prod")
public class ProdConfig {
    @Bean
    public DataSource dataSource() {
        // 生产环境数据源
    }
}
```

## 配置加载顺序

Spring Boot 按以下顺序加载配置（后面的覆盖前面的）：

1. `classpath:/application.yml`
2. `classpath:/config/application.yml`
3. `file:./application.yml`（项目根目录）
4. `file:./config/application.yml`
5. 命令行参数

## 外部化配置

### 命令行参数

```bash
java -jar app.jar --server.port=9090 --spring.datasource.url=jdbc:mysql://...
```

### 环境变量

```bash
# 环境变量命名规则：大写，点号换成下划线
export SERVER_PORT=9090
export SPRING_DATASOURCE_URL=jdbc:mysql://...
```

### 配置文件优先级

```yaml
# 可以指定配置文件位置
java -jar app.jar --spring.config.location=file:/path/to/config/

# 可以指定配置文件名
java -jar app.jar --spring.config.name=myapp
```

## 配置加密

### 使用 Jasypt

1. 添加依赖

```xml
<dependency>
    <groupId>com.github.ulisesbocchio</groupId>
    <artifactId>jasypt-spring-boot-starter</artifactId>
    <version>3.0.5</version>
</dependency>
```

2. 配置加密密钥

```yaml
jasypt:
  encryptor:
    password: ${JASYPT_PASSWORD:mySecretKey}
```

3. 使用加密值

```yaml
spring:
  datasource:
    password: ENC(encrypted_password)
```

4. 生成加密值

```bash
java -cp jasypt-1.9.3.jar org.jasypt.intf.cli.JasyptPBEStringEncryptionCLI \
  input="myPassword" password="mySecretKey" algorithm=PBEWithMD5AndDES
```

## 常用配置项

### 服务器配置

```yaml
server:
  port: 8080
  servlet:
    context-path: /api
  tomcat:
    max-threads: 200
    uri-encoding: UTF-8
```

### 数据源配置

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/test?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
```

### Redis 配置

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: 
      database: 0
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
```

### 日志配置

```yaml
logging:
  level:
    root: info
    com.example: debug
  file:
    name: logs/app.log
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```
