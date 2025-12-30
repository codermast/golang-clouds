---
order: 1
---

# SpringMVC - 简介与环境搭建

## 概述

Spring MVC 是 Spring Framework 的一部分，是基于 Java 实现 MVC 设计模式的轻量级 Web 框架。

### 核心组件

| 组件               | 说明                              |
| :----------------- | :-------------------------------- |
| DispatcherServlet  | 前端控制器，统一处理请求和响应    |
| HandlerMapping     | 处理器映射器，根据 URL 找到处理器 |
| HandlerAdapter     | 处理器适配器，执行处理器          |
| ViewResolver       | 视图解析器，解析视图              |
| Handler/Controller | 处理器/控制器，处理业务逻辑       |

### 执行流程

```
1. 用户发送请求
      │
      ▼
2. DispatcherServlet（前端控制器）
      │
      ├──▶ 3. HandlerMapping（处理器映射器）
      │         找到对应的 Handler
      │
      ├──▶ 4. HandlerAdapter（处理器适配器）
      │         执行 Handler
      │
      ├──▶ 5. Handler（控制器）
      │         处理业务，返回 ModelAndView
      │
      ├──▶ 6. ViewResolver（视图解析器）
      │         解析视图名称
      │
      └──▶ 7. View（视图）
               渲染数据，返回响应
```

## 环境搭建

### Maven 依赖

```xml
<dependencies>
    <!-- Spring MVC -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-webmvc</artifactId>
        <version>6.1.0</version>
    </dependency>
    
    <!-- Servlet API -->
    <dependency>
        <groupId>jakarta.servlet</groupId>
        <artifactId>jakarta.servlet-api</artifactId>
        <version>6.0.0</version>
        <scope>provided</scope>
    </dependency>
    
    <!-- JSON 处理 -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.15.0</version>
    </dependency>
    
    <!-- Thymeleaf（可选） -->
    <dependency>
        <groupId>org.thymeleaf</groupId>
        <artifactId>thymeleaf-spring6</artifactId>
        <version>3.1.0.RELEASE</version>
    </dependency>
</dependencies>
```

### 配置 web.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee 
         https://jakarta.ee/xml/ns/jakartaee/web-app_6_0.xsd"
         version="6.0">
    
    <!-- 配置 DispatcherServlet -->
    <servlet>
        <servlet-name>springmvc</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <!-- 指定配置文件位置 -->
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>classpath:springmvc.xml</param-value>
        </init-param>
        <!-- 启动时加载 -->
        <load-on-startup>1</load-on-startup>
    </servlet>
    
    <servlet-mapping>
        <servlet-name>springmvc</servlet-name>
        <!-- 拦截所有请求 -->
        <url-pattern>/</url-pattern>
    </servlet-mapping>
    
    <!-- 字符编码过滤器 -->
    <filter>
        <filter-name>characterEncodingFilter</filter-name>
        <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
        <init-param>
            <param-name>encoding</param-name>
            <param-value>UTF-8</param-value>
        </init-param>
        <init-param>
            <param-name>forceEncoding</param-name>
            <param-value>true</param-value>
        </init-param>
    </filter>
    <filter-mapping>
        <filter-name>characterEncodingFilter</filter-name>
        <url-pattern>/*</url-pattern>
    </filter-mapping>
</web-app>
```

### Spring MVC 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/context
       http://www.springframework.org/schema/context/spring-context.xsd
       http://www.springframework.org/schema/mvc
       http://www.springframework.org/schema/mvc/spring-mvc.xsd">
    
    <!-- 组件扫描 -->
    <context:component-scan base-package="com.example.controller"/>
    
    <!-- 开启注解驱动 -->
    <mvc:annotation-driven/>
    
    <!-- 视图解析器 -->
    <bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/WEB-INF/views/"/>
        <property name="suffix" value=".jsp"/>
    </bean>
    
    <!-- 静态资源处理 -->
    <mvc:resources mapping="/static/**" location="/static/"/>
    
    <!-- 默认 Servlet 处理 -->
    <mvc:default-servlet-handler/>
</beans>
```

### Java 配置方式

```java
// 配置类
@Configuration
@EnableWebMvc
@ComponentScan("com.example")
public class WebConfig implements WebMvcConfigurer {
    
    // 视图解析器
    @Bean
    public ViewResolver viewResolver() {
        InternalResourceViewResolver resolver = new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/views/");
        resolver.setSuffix(".jsp");
        return resolver;
    }
    
    // 静态资源处理
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/static/**")
                .addResourceLocations("/static/");
    }
    
    // 默认 Servlet 处理
    @Override
    public void configureDefaultServletHandling(DefaultServletHandlerConfigurer configurer) {
        configurer.enable();
    }
}

// Web 应用初始化器
public class WebAppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {
    
    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class[]{RootConfig.class};
    }
    
    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class[]{WebConfig.class};
    }
    
    @Override
    protected String[] getServletMappings() {
        return new String[]{"/"};
    }
    
    @Override
    protected Filter[] getServletFilters() {
        CharacterEncodingFilter filter = new CharacterEncodingFilter();
        filter.setEncoding("UTF-8");
        filter.setForceEncoding(true);
        return new Filter[]{filter};
    }
}
```

## 第一个 Controller

```java
@Controller
public class HelloController {
    
    // 返回视图
    @RequestMapping("/hello")
    public String hello(Model model) {
        model.addAttribute("message", "Hello, Spring MVC!");
        return "hello";  // 返回视图名，由视图解析器解析
    }
    
    // 返回 JSON
    @RequestMapping("/api/hello")
    @ResponseBody
    public Map<String, String> helloJson() {
        Map<String, String> result = new HashMap<>();
        result.put("message", "Hello, Spring MVC!");
        return result;
    }
}
```

## @Controller vs @RestController

| 注解            | 说明                                  |
| :-------------- | :------------------------------------ |
| @Controller     | 标识控制器，方法返回视图名            |
| @RestController | @Controller + @ResponseBody，返回数据 |

```java
// @Controller - 返回视图
@Controller
public class ViewController {
    @RequestMapping("/page")
    public String page() {
        return "page";  // 返回视图名
    }
    
    @RequestMapping("/data")
    @ResponseBody
    public User data() {
        return new User();  // 返回 JSON
    }
}

// @RestController - 返回 JSON
@RestController
public class ApiController {
    @RequestMapping("/api/user")
    public User getUser() {
        return new User();  // 自动转为 JSON
    }
}
```
