---
order: 7
---

# Java核心 - 注解

## 概述

注解（Annotation）是 JDK 5 引入的一种元数据形式，用于为代码添加描述信息。注解本身不影响程序执行，但可以被编译器、开发工具或运行时框架读取和处理。

### 注解的作用

1. **编译检查**：让编译器进行语法检查（如 `@Override`）
2. **生成文档**：通过注解生成 API 文档
3. **代码分析**：通过反射读取注解信息
4. **框架配置**：替代 XML 配置（如 Spring、MyBatis）

## 内置注解

### @Override

标记方法重写父类方法，如果方法签名不匹配会编译报错。

```java
public class Child extends Parent {
    @Override
    public void method() {  // 如果父类没有此方法，编译报错
        // ...
    }
}
```

### @Deprecated

标记元素已过时，使用时编译器会发出警告。

```java
@Deprecated
public void oldMethod() {
    // 已过时的方法
}

// Java 9+ 可以添加更多信息
@Deprecated(since = "1.5", forRemoval = true)
public void legacyMethod() { }
```

### @SuppressWarnings

抑制编译器警告。

```java
@SuppressWarnings("unchecked")      // 抑制未检查的类型转换警告
@SuppressWarnings("deprecation")    // 抑制使用过时方法的警告
@SuppressWarnings("rawtypes")       // 抑制使用原始类型的警告
@SuppressWarnings({"unchecked", "deprecation"})  // 抑制多个警告
@SuppressWarnings("all")            // 抑制所有警告
```

常用警告类型：

| 参数        | 说明                            |
| :---------- | :------------------------------ |
| all         | 抑制所有警告                    |
| unchecked   | 未检查的类型转换                |
| deprecation | 使用过时的类或方法              |
| rawtypes    | 使用原始类型                    |
| unused      | 未使用的变量                    |
| serial      | 可序列化类缺少 serialVersionUID |

### @FunctionalInterface

标记函数式接口（只有一个抽象方法的接口）。

```java
@FunctionalInterface
public interface MyFunction {
    void apply();
    
    // 可以有默认方法和静态方法
    default void defaultMethod() { }
    static void staticMethod() { }
}
```

### @SafeVarargs

抑制可变参数带来的警告（Java 7+）。

```java
@SafeVarargs
public static <T> List<T> asList(T... elements) {
    return Arrays.asList(elements);
}
```

## 元注解

元注解是用于注解其他注解的注解。

### @Target

指定注解可以应用的位置。

```java
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface MyAnnotation { }
```

ElementType 取值：

| 值              | 说明                |
| :-------------- | :------------------ |
| TYPE            | 类、接口、枚举      |
| FIELD           | 字段                |
| METHOD          | 方法                |
| PARAMETER       | 方法参数            |
| CONSTRUCTOR     | 构造方法            |
| LOCAL_VARIABLE  | 局部变量            |
| ANNOTATION_TYPE | 注解类型            |
| PACKAGE         | 包                  |
| TYPE_PARAMETER  | 类型参数（Java 8+） |
| TYPE_USE        | 类型使用（Java 8+） |

### @Retention

指定注解的保留策略。

```java
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation { }
```

RetentionPolicy 取值：

| 值      | 说明                                  |
| :------ | :------------------------------------ |
| SOURCE  | 只在源码中保留，编译时丢弃            |
| CLASS   | 保留到 class 文件，运行时丢弃（默认） |
| RUNTIME | 运行时保留，可通过反射读取            |

### @Documented

表示注解应该被包含在 JavaDoc 中。

```java
@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation { }
```

### @Inherited

表示注解可以被子类继承。

```java
@Inherited
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation { }

@MyAnnotation
public class Parent { }

// Child 自动拥有 @MyAnnotation
public class Child extends Parent { }
```

### @Repeatable（Java 8+）

允许同一个注解在同一位置使用多次。

```java
// 定义容器注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Roles {
    Role[] value();
}

// 定义可重复注解
@Repeatable(Roles.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Role {
    String value();
}

// 使用
@Role("admin")
@Role("user")
public class User { }
```

## 自定义注解

### 基本语法

```java
public @interface 注解名 {
    // 属性（看起来像方法）
    类型 属性名() default 默认值;
}
```

### 属性类型

注解属性支持的类型：

- 基本数据类型
- String
- Class
- 枚举
- 注解
- 以上类型的数组

```java
public @interface MyAnnotation {
    // 基本类型
    int id() default 0;
    
    // String
    String name() default "";
    
    // Class
    Class<?> clazz() default Object.class;
    
    // 枚举
    Color color() default Color.RED;
    
    // 注解
    Author author() default @Author(name = "unknown");
    
    // 数组
    String[] tags() default {};
}
```

### 完整示例

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Api {
    String value() default "";
    String description() default "";
    boolean deprecated() default false;
}
```

### 使用注解

```java
// 使用所有属性
@Api(value = "/users", description = "用户接口", deprecated = false)
public class UserController { }

// 只有 value 时可以省略属性名
@Api("/users")
public class UserController { }

// 使用默认值
@Api
public class UserController { }
```

## 注解解析

### 通过反射获取注解

```java
@Api(value = "/users", description = "用户接口")
public class UserController {
    
    @Api("/getUser")
    public void getUser() { }
}

// 获取类上的注解
Class<UserController> clazz = UserController.class;
if (clazz.isAnnotationPresent(Api.class)) {
    Api api = clazz.getAnnotation(Api.class);
    System.out.println("value: " + api.value());
    System.out.println("description: " + api.description());
}

// 获取方法上的注解
Method method = clazz.getMethod("getUser");
Api methodApi = method.getAnnotation(Api.class);
System.out.println("Method API: " + methodApi.value());

// 获取所有注解
Annotation[] annotations = clazz.getAnnotations();
for (Annotation annotation : annotations) {
    System.out.println(annotation);
}
```

### AnnotatedElement 接口

所有可以被注解的元素（Class、Method、Field 等）都实现了此接口。

| 方法                        | 说明                             |
| :-------------------------- | :------------------------------- |
| isAnnotationPresent(Class)  | 判断是否存在指定注解             |
| getAnnotation(Class)        | 获取指定类型的注解               |
| getAnnotations()            | 获取所有注解                     |
| getDeclaredAnnotations()    | 获取直接声明的注解               |
| getAnnotationsByType(Class) | 获取指定类型的所有注解（含重复） |

## 注解实战

### 参数校验注解

```java
// 定义注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface NotNull {
    String message() default "字段不能为空";
}

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Length {
    int min() default 0;
    int max() default Integer.MAX_VALUE;
    String message() default "长度不符合要求";
}

// 使用注解
public class User {
    @NotNull(message = "用户名不能为空")
    @Length(min = 2, max = 20, message = "用户名长度必须在2-20之间")
    private String username;
    
    @NotNull
    private String password;
}

// 校验工具类
public class Validator {
    public static List<String> validate(Object obj) throws Exception {
        List<String> errors = new ArrayList<>();
        Class<?> clazz = obj.getClass();
        
        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(obj);
            
            // 校验 @NotNull
            if (field.isAnnotationPresent(NotNull.class)) {
                NotNull notNull = field.getAnnotation(NotNull.class);
                if (value == null) {
                    errors.add(notNull.message());
                }
            }
            
            // 校验 @Length
            if (field.isAnnotationPresent(Length.class) && value instanceof String) {
                Length length = field.getAnnotation(Length.class);
                String str = (String) value;
                if (str.length() < length.min() || str.length() > length.max()) {
                    errors.add(length.message());
                }
            }
        }
        
        return errors;
    }
}
```

### 简易 ORM 注解

```java
// 表名注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Table {
    String value();
}

// 列名注解
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Column {
    String value() default "";
    boolean primaryKey() default false;
}

// 使用
@Table("t_user")
public class User {
    @Column(value = "id", primaryKey = true)
    private Long id;
    
    @Column("username")
    private String username;
    
    @Column("email")
    private String email;
}

// SQL 生成器
public class SqlGenerator {
    public static String generateInsert(Object obj) throws Exception {
        Class<?> clazz = obj.getClass();
        
        // 获取表名
        Table table = clazz.getAnnotation(Table.class);
        String tableName = table.value();
        
        // 获取列名和值
        List<String> columns = new ArrayList<>();
        List<String> values = new ArrayList<>();
        
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Column.class)) {
                Column column = field.getAnnotation(Column.class);
                String columnName = column.value().isEmpty() 
                    ? field.getName() : column.value();
                
                field.setAccessible(true);
                Object value = field.get(obj);
                
                columns.add(columnName);
                values.add("'" + value + "'");
            }
        }
        
        return String.format("INSERT INTO %s (%s) VALUES (%s)",
            tableName,
            String.join(", ", columns),
            String.join(", ", values)
        );
    }
}
```

### 简易权限控制

```java
// 权限注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    String[] value();
}

// 使用注解
public class UserService {
    @RequireRole({"admin"})
    public void deleteUser(Long id) {
        // 删除用户
    }
    
    @RequireRole({"admin", "manager"})
    public void updateUser(User user) {
        // 更新用户
    }
}

// 权限检查（通过 AOP 或代理实现）
public class PermissionChecker {
    public static void checkPermission(Method method, String[] userRoles) {
        if (method.isAnnotationPresent(RequireRole.class)) {
            RequireRole requireRole = method.getAnnotation(RequireRole.class);
            String[] requiredRoles = requireRole.value();
            
            boolean hasPermission = false;
            for (String required : requiredRoles) {
                for (String userRole : userRoles) {
                    if (required.equals(userRole)) {
                        hasPermission = true;
                        break;
                    }
                }
            }
            
            if (!hasPermission) {
                throw new SecurityException("没有权限执行此操作");
            }
        }
    }
}
```

## 注解与框架

### Spring 常用注解

```java
@Component      // 组件
@Service        // 服务层
@Repository     // 数据访问层
@Controller     // 控制层
@Autowired      // 自动注入
@Value          // 注入配置值
@Configuration  // 配置类
@Bean           // 定义 Bean
@RequestMapping // 请求映射
```

### JPA 常用注解

```java
@Entity         // 实体类
@Table          // 表名
@Id             // 主键
@GeneratedValue // 主键生成策略
@Column         // 列名
@OneToMany      // 一对多
@ManyToOne      // 多对一
```

### Lombok 常用注解

```java
@Data           // Getter + Setter + toString + equals + hashCode
@Getter         // Getter 方法
@Setter         // Setter 方法
@NoArgsConstructor  // 无参构造
@AllArgsConstructor // 全参构造
@Builder        // 建造者模式
@Slf4j          // 日志
```

::: tip 注解本质
注解本质是一个继承了 `Annotation` 接口的接口。使用 `@注解` 实际上是创建了一个实现该接口的匿名类实例。
:::
