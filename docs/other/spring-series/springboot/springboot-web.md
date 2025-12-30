---
order: 3
---

# SpringBoot - Web 开发

## Web 开发基础

Spring Boot 集成了 Spring MVC，提供了开箱即用的 Web 开发支持。

### 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### RESTful API 开发

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    // GET /api/users
    @GetMapping
    public List<User> list() {
        return userService.findAll();
    }
    
    // GET /api/users/1
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    // POST /api/users
    @PostMapping
    public User create(@RequestBody @Valid User user) {
        return userService.save(user);
    }
    
    // PUT /api/users/1
    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody @Valid User user) {
        user.setId(id);
        return userService.update(user);
    }
    
    // DELETE /api/users/1
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        userService.deleteById(id);
    }
}
```

## 参数校验

### 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### 常用校验注解

| 注解          | 说明                         |
| :------------ | :--------------------------- |
| @NotNull      | 不能为 null                  |
| @NotEmpty     | 不能为 null 且不能为空       |
| @NotBlank     | 不能为 null 且去空格后不为空 |
| @Size         | 长度/大小范围                |
| @Min/@Max     | 数值最小/最大值              |
| @Email        | 邮箱格式                     |
| @Pattern      | 正则匹配                     |
| @Past/@Future | 过去/将来的日期              |

### 使用示例

```java
@Data
public class UserDTO {
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 20, message = "用户名长度必须在2-20之间")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度必须在6-20之间")
    private String password;
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 0, message = "年龄不能小于0")
    @Max(value = 150, message = "年龄不能大于150")
    private Integer age;
}

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @PostMapping
    public Result<User> create(@RequestBody @Valid UserDTO dto) {
        // 校验通过后执行
        return Result.success(userService.save(dto));
    }
}
```

### 分组校验

```java
// 定义分组
public interface Create {}
public interface Update {}

@Data
public class UserDTO {
    
    @Null(groups = Create.class, message = "创建时ID必须为空")
    @NotNull(groups = Update.class, message = "更新时ID不能为空")
    private Long id;
    
    @NotBlank(groups = {Create.class, Update.class})
    private String username;
}

@RestController
public class UserController {
    
    @PostMapping
    public Result create(@RequestBody @Validated(Create.class) UserDTO dto) {
        return Result.success();
    }
    
    @PutMapping
    public Result update(@RequestBody @Validated(Update.class) UserDTO dto) {
        return Result.success();
    }
}
```

## 统一响应格式

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    public static <T> Result<T> success() {
        return new Result<>(200, "success", null);
    }
    
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message, null);
    }
}
```

## 全局异常处理

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    // 业务异常
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException e) {
        log.warn("业务异常: {}", e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }
    
    // 参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return Result.error(400, message);
    }
    
    // 其他异常
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(500, "系统异常");
    }
}
```

## 跨域配置

### 方式一：注解配置

```java
@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    // ...
}
```

### 方式二：全局配置

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
```

### 方式三：Filter 配置

```java
@Bean
public CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.addAllowedOrigin("*");
    config.addAllowedMethod("*");
    config.addAllowedHeader("*");
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    
    return new CorsFilter(source);
}
```

## 静态资源

### 默认静态资源目录

Spring Boot 默认的静态资源目录（按优先级）：

1. `classpath:/META-INF/resources/`
2. `classpath:/resources/`
3. `classpath:/static/`
4. `classpath:/public/`

### 自定义静态资源

```yaml
spring:
  web:
    resources:
      static-locations: classpath:/static/,classpath:/public/,file:/path/to/files/
  mvc:
    static-path-pattern: /static/**
```

## 拦截器

```java
@Component
public class AuthInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        String token = request.getHeader("Authorization");
        if (token == null) {
            response.setStatus(401);
            return false;
        }
        return true;
    }
}

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private AuthInterceptor authInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/login", "/api/register");
    }
}
```

## 文件上传

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 100MB
```

```java
@RestController
@RequestMapping("/api/files")
public class FileController {
    
    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return Result.error(400, "文件为空");
        }
        
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path path = Paths.get("uploads", fileName);
        Files.createDirectories(path.getParent());
        file.transferTo(path);
        
        return Result.success(fileName);
    }
    
    @PostMapping("/uploads")
    public Result<List<String>> uploads(@RequestParam("files") MultipartFile[] files) throws IOException {
        List<String> fileNames = new ArrayList<>();
        for (MultipartFile file : files) {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path path = Paths.get("uploads", fileName);
            file.transferTo(path);
            fileNames.add(fileName);
        }
        return Result.success(fileNames);
    }
}
```

## Swagger 文档

### 添加依赖

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.1.0</version>
</dependency>
```

### 配置

```yaml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
```

### 使用注解

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理", description = "用户相关接口")
public class UserController {
    
    @Operation(summary = "获取用户列表", description = "分页获取用户列表")
    @GetMapping
    public Result<List<User>> list(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(userService.findPage(page, size));
    }
    
    @Operation(summary = "创建用户")
    @PostMapping
    public Result<User> create(@RequestBody @Valid UserDTO dto) {
        return Result.success(userService.save(dto));
    }
}
```

访问 http://localhost:8080/swagger-ui.html 查看文档
