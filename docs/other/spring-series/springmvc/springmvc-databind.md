---
order: 6
---

# SpringMVC - 数据绑定与转换

## 数据绑定概述

Spring MVC 的数据绑定机制自动将请求参数转换为 Java 对象。

### 数据绑定流程

```
HTTP 请求参数 → 类型转换 → 数据格式化 → 数据校验 → 绑定到目标对象
```

## 类型转换

### 内置转换器

Spring MVC 内置了常用类型的转换器：

| 源类型 | 目标类型                         |
| :----- | :------------------------------- |
| String | Integer, Long, Double, Boolean   |
| String | Date, LocalDate, LocalDateTime   |
| String | Enum                             |
| String | 数组, 集合                       |

### 自定义转换器

```java
// 实现 Converter 接口
public class StringToDateConverter implements Converter<String, Date> {
    
    private SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
    
    @Override
    public Date convert(String source) {
        try {
            return dateFormat.parse(source);
        } catch (ParseException e) {
            throw new IllegalArgumentException("日期格式错误");
        }
    }
}

// 注册转换器
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToDateConverter());
    }
}
```

## 数据格式化

### @DateTimeFormat

```java
public class User {
    private String name;
    
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date birthday;
    
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
```

### @NumberFormat

```java
public class Product {
    private String name;
    
    @NumberFormat(pattern = "#,###.##")
    private Double price;
    
    @NumberFormat(style = NumberFormat.Style.PERCENT)
    private Double discount;
}
```

## 数据校验

### 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### 常用校验注解

| 注解        | 说明                 |
| :---------- | :------------------- |
| @NotNull    | 不能为 null          |
| @NotEmpty   | 不能为空             |
| @NotBlank   | 不能为空白           |
| @Size       | 长度范围             |
| @Min / @Max | 数值范围             |
| @Email      | 邮箱格式             |
| @Pattern    | 正则匹配             |
| @Past       | 必须是过去的日期     |
| @Future     | 必须是将来的日期     |

### 使用示例

```java
public class UserDTO {
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 20, message = "用户名长度2-20")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度6-20")
    private String password;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 0, message = "年龄不能小于0")
    @Max(value = 150, message = "年龄不能大于150")
    private Integer age;
}

@RestController
public class UserController {
    
    @PostMapping("/user")
    public Result createUser(@RequestBody @Valid UserDTO dto, BindingResult result) {
        if (result.hasErrors()) {
            String message = result.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.joining(", "));
            return Result.error(400, message);
        }
        return Result.success();
    }
}
```

### 分组校验

```java
// 定义分组
public interface Create {}
public interface Update {}

public class UserDTO {
    
    @Null(groups = Create.class)
    @NotNull(groups = Update.class)
    private Long id;
    
    @NotBlank(groups = {Create.class, Update.class})
    private String username;
}

@RestController
public class UserController {
    
    @PostMapping("/user")
    public Result create(@RequestBody @Validated(Create.class) UserDTO dto) {
        return Result.success();
    }
    
    @PutMapping("/user")
    public Result update(@RequestBody @Validated(Update.class) UserDTO dto) {
        return Result.success();
    }
}
```

### 自定义校验注解

```java
// 定义注解
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneValidator.class)
public @interface Phone {
    String message() default "手机号格式不正确";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 实现校验器
public class PhoneValidator implements ConstraintValidator<Phone, String> {
    
    private static final Pattern PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        return PATTERN.matcher(value).matches();
    }
}

// 使用
public class UserDTO {
    @Phone
    private String phone;
}
```

## @InitBinder

`@InitBinder` 用于初始化数据绑定器，可以进行类型转换、格式化等。

```java
@Controller
public class UserController {
    
    @InitBinder
    public void initBinder(WebDataBinder binder) {
        // 日期格式化
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        binder.registerCustomEditor(Date.class, new CustomDateEditor(dateFormat, true));
        
        // 禁止绑定某些字段
        binder.setDisallowedFields("id", "createTime");
    }
}
```

## @ModelAttribute

`@ModelAttribute` 用于在请求处理前预处理数据。

```java
@Controller
public class UserController {
    
    // 每次请求前执行
    @ModelAttribute
    public void addCommonAttributes(Model model) {
        model.addAttribute("appName", "MyApp");
    }
    
    // 从数据库获取对象
    @ModelAttribute("user")
    public User getUser(@RequestParam(required = false) Long id) {
        if (id != null) {
            return userService.findById(id);
        }
        return new User();
    }
    
    @PostMapping("/user")
    public String saveUser(@ModelAttribute("user") User user) {
        userService.save(user);
        return "success";
    }
}
```
