---
order: 1
---

# SpringBoot - 快速入门

## 创建项目

### 方式一：Spring Initializr（推荐）

1. 访问 https://start.spring.io/
2. 选择项目配置：
   - Project：Maven
   - Language：Java
   - Spring Boot：3.x.x
   - Packaging：Jar
   - Java：17
3. 添加依赖：Spring Web
4. 点击 Generate 下载项目

### 方式二：IDEA 创建

1. File → New → Project → Spring Initializr
2. 填写项目信息
3. 选择依赖
4. 创建项目

### 方式三：Maven 手动创建

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <!-- 继承 Spring Boot 父项目 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.0</version>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <!-- Web Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- 测试 Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

## 项目结构

```
project
├── src
│   ├── main
│   │   ├── java
│   │   │   └── com.example.demo
│   │   │       ├── DemoApplication.java      # 启动类
│   │   │       ├── controller/               # 控制器
│   │   │       ├── service/                  # 服务层
│   │   │       ├── mapper/                   # 数据访问层
│   │   │       └── entity/                   # 实体类
│   │   └── resources
│   │       ├── application.yml               # 配置文件
│   │       ├── static/                       # 静态资源
│   │       └── templates/                    # 模板文件
│   └── test
│       └── java                              # 测试代码
└── pom.xml
```

## 启动类

```java
@SpringBootApplication
public class DemoApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### @SpringBootApplication 解析

`@SpringBootApplication` 是一个组合注解，包含：

```java
@SpringBootConfiguration    // 配置类，等同于 @Configuration
@EnableAutoConfiguration    // 启用自动配置
@ComponentScan              // 组件扫描
public @interface SpringBootApplication {
}
```

| 注解                     | 作用                     |
| :----------------------- | :----------------------- |
| @SpringBootConfiguration | 标识为配置类             |
| @EnableAutoConfiguration | 启用自动配置机制         |
| @ComponentScan           | 扫描当前包及子包下的组件 |

## 第一个接口

```java
@RestController
public class HelloController {
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }
    
    @GetMapping("/hello/{name}")
    public String hello(@PathVariable String name) {
        return "Hello, " + name + "!";
    }
}
```

启动应用，访问 http://localhost:8080/hello

## 常用 Starter

Starter 是 Spring Boot 提供的一组依赖集合，简化依赖管理。

| Starter                        | 说明         |
| :----------------------------- | :----------- |
| spring-boot-starter-web        | Web 开发     |
| spring-boot-starter-data-jpa   | JPA 数据访问 |
| spring-boot-starter-data-redis | Redis        |
| spring-boot-starter-security   | 安全认证     |
| spring-boot-starter-validation | 参数校验     |
| spring-boot-starter-test       | 测试         |
| spring-boot-starter-actuator   | 监控         |
| spring-boot-starter-aop        | AOP          |
| spring-boot-starter-cache      | 缓存         |
| spring-boot-starter-mail       | 邮件         |

## 自动配置原理

Spring Boot 自动配置的核心流程：

```
1. @EnableAutoConfiguration 启用自动配置
          ↓
2. 加载 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
          ↓
3. 读取所有自动配置类
          ↓
4. 根据条件注解（@Conditional）判断是否生效
          ↓
5. 注册 Bean 到容器
```

### 条件注解

| 注解                         | 条件                  |
| :--------------------------- | :-------------------- |
| @ConditionalOnClass          | 类路径存在指定类      |
| @ConditionalOnMissingClass   | 类路径不存在指定类    |
| @ConditionalOnBean           | 容器中存在指定 Bean   |
| @ConditionalOnMissingBean    | 容器中不存在指定 Bean |
| @ConditionalOnProperty       | 配置属性满足条件      |
| @ConditionalOnWebApplication | Web 应用环境          |

### 自动配置示例

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)
@ConditionalOnProperty(name = "spring.datasource.url")
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public DataSource dataSource(DataSourceProperties properties) {
        return DataSourceBuilder.create()
                .url(properties.getUrl())
                .username(properties.getUsername())
                .password(properties.getPassword())
                .build();
    }
}
```

## 热部署

添加 devtools 依赖实现热部署：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

IDEA 配置：
1. Settings → Build → Compiler → Build project automatically
2. Settings → Advanced Settings → Allow auto-make to start

## 打包部署

### 打包为 JAR

```bash
# 打包
mvn clean package

# 运行
java -jar target/demo-1.0.0.jar

# 指定配置
java -jar demo.jar --spring.profiles.active=prod
java -jar demo.jar --server.port=9090
```

### 打包为 WAR

1. 修改 pom.xml

```xml
<packaging>war</packaging>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-tomcat</artifactId>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

2. 修改启动类

```java
@SpringBootApplication
public class DemoApplication extends SpringBootServletInitializer {
    
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(DemoApplication.class);
    }
    
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

3. 部署到 Tomcat
