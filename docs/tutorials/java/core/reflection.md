---
order: 5
---

# Java核心 - 反射

## 概述

反射（Reflection）是 Java 的一种机制，允许程序在运行时动态地获取类的信息并操作类的成员（属性、方法、构造器）。反射是框架设计的灵魂，Spring、MyBatis 等框架都大量使用了反射。

### 反射的功能

- 在运行时判断任意对象所属的类
- 在运行时构造任意类的对象
- 在运行时获取任意类的成员变量和方法
- 在运行时调用任意对象的方法
- 生成动态代理

## 获取 Class 对象

Class 对象是反射的入口，获取 Class 对象有三种方式：

```java
// 方式一：通过类名.class
Class<String> clazz1 = String.class;

// 方式二：通过对象.getClass()
String str = "Hello";
Class<?> clazz2 = str.getClass();

// 方式三：通过 Class.forName()（最常用）
Class<?> clazz3 = Class.forName("java.lang.String");

// 三种方式获取的是同一个 Class 对象
System.out.println(clazz1 == clazz2);  // true
System.out.println(clazz2 == clazz3);  // true
```

::: tip Class 对象的唯一性
每个类在 JVM 中只有一个 Class 对象，无论通过哪种方式获取，得到的都是同一个对象。
:::

## 示例类

以下示例都基于这个类：

```java
public class User {
    // 字段
    public String name;
    private int age;
    protected String email;
    
    // 构造方法
    public User() {
    }
    
    private User(String name) {
        this.name = name;
    }
    
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // 方法
    public void sayHello() {
        System.out.println("Hello, I'm " + name);
    }
    
    private String getInfo() {
        return "User{name='" + name + "', age=" + age + "}";
    }
    
    public static void staticMethod() {
        System.out.println("Static method");
    }
    
    // Getter/Setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
}
```

## 获取构造方法

```java
Class<User> clazz = User.class;

// 获取所有 public 构造方法
Constructor<?>[] constructors = clazz.getConstructors();

// 获取所有构造方法（包括私有）
Constructor<?>[] allConstructors = clazz.getDeclaredConstructors();

// 获取指定参数的 public 构造方法
Constructor<User> constructor1 = clazz.getConstructor();  // 无参
Constructor<User> constructor2 = clazz.getConstructor(String.class, int.class);

// 获取指定参数的构造方法（包括私有）
Constructor<User> constructor3 = clazz.getDeclaredConstructor(String.class);
```

### 通过构造方法创建对象

```java
// 使用无参构造
Constructor<User> constructor = clazz.getConstructor();
User user1 = constructor.newInstance();

// 使用有参构造
Constructor<User> constructor2 = clazz.getConstructor(String.class, int.class);
User user2 = constructor2.newInstance("张三", 25);

// 使用私有构造方法
Constructor<User> privateConstructor = clazz.getDeclaredConstructor(String.class);
privateConstructor.setAccessible(true);  // 取消访问检查
User user3 = privateConstructor.newInstance("李四");
```

## 获取字段

```java
Class<User> clazz = User.class;

// 获取所有 public 字段（包括父类）
Field[] fields = clazz.getFields();

// 获取所有字段（不包括父类）
Field[] allFields = clazz.getDeclaredFields();

// 获取指定名称的 public 字段
Field nameField = clazz.getField("name");

// 获取指定名称的字段（包括私有）
Field ageField = clazz.getDeclaredField("age");
```

### 操作字段

```java
User user = new User("张三", 25);
Class<User> clazz = User.class;

// 获取并修改 public 字段
Field nameField = clazz.getField("name");
String name = (String) nameField.get(user);  // 获取值
nameField.set(user, "李四");                  // 设置值

// 获取并修改 private 字段
Field ageField = clazz.getDeclaredField("age");
ageField.setAccessible(true);  // 取消访问检查
int age = ageField.getInt(user);
ageField.set(user, 30);

// 获取字段信息
System.out.println("字段名：" + nameField.getName());
System.out.println("字段类型：" + nameField.getType());
System.out.println("修饰符：" + Modifier.toString(nameField.getModifiers()));
```

## 获取方法

```java
Class<User> clazz = User.class;

// 获取所有 public 方法（包括父类）
Method[] methods = clazz.getMethods();

// 获取所有方法（不包括父类）
Method[] allMethods = clazz.getDeclaredMethods();

// 获取指定方法
Method sayHello = clazz.getMethod("sayHello");  // 无参方法
Method setName = clazz.getMethod("setName", String.class);  // 有参方法

// 获取私有方法
Method getInfo = clazz.getDeclaredMethod("getInfo");
```

### 调用方法

```java
User user = new User("张三", 25);
Class<User> clazz = User.class;

// 调用 public 方法
Method sayHello = clazz.getMethod("sayHello");
sayHello.invoke(user);  // 输出：Hello, I'm 张三

// 调用有参方法
Method setName = clazz.getMethod("setName", String.class);
setName.invoke(user, "李四");

// 调用私有方法
Method getInfo = clazz.getDeclaredMethod("getInfo");
getInfo.setAccessible(true);
String info = (String) getInfo.invoke(user);
System.out.println(info);

// 调用静态方法
Method staticMethod = clazz.getMethod("staticMethod");
staticMethod.invoke(null);  // 静态方法传 null

// 获取方法信息
System.out.println("方法名：" + sayHello.getName());
System.out.println("返回类型：" + sayHello.getReturnType());
System.out.println("参数类型：" + Arrays.toString(setName.getParameterTypes()));
```

## 获取类信息

```java
Class<User> clazz = User.class;

// 类名
System.out.println("全限定名：" + clazz.getName());       // com.example.User
System.out.println("简单类名：" + clazz.getSimpleName()); // User

// 父类
Class<?> superClass = clazz.getSuperclass();
System.out.println("父类：" + superClass.getName());

// 接口
Class<?>[] interfaces = clazz.getInterfaces();

// 修饰符
int modifiers = clazz.getModifiers();
System.out.println("是否是 public：" + Modifier.isPublic(modifiers));
System.out.println("是否是抽象类：" + Modifier.isAbstract(modifiers));

// 包信息
Package pkg = clazz.getPackage();
System.out.println("包名：" + pkg.getName());

// 注解
Annotation[] annotations = clazz.getAnnotations();

// 判断类型
System.out.println("是否是接口：" + clazz.isInterface());
System.out.println("是否是数组：" + clazz.isArray());
System.out.println("是否是枚举：" + clazz.isEnum());
System.out.println("是否是注解：" + clazz.isAnnotation());
```

## 反射与泛型

```java
// 获取父类的泛型参数
public class UserDao extends BaseDao<User> { }

Class<UserDao> clazz = UserDao.class;
Type genericSuperclass = clazz.getGenericSuperclass();

if (genericSuperclass instanceof ParameterizedType) {
    ParameterizedType pt = (ParameterizedType) genericSuperclass;
    Type[] typeArguments = pt.getActualTypeArguments();
    Class<?> entityClass = (Class<?>) typeArguments[0];
    System.out.println("泛型参数：" + entityClass.getName());  // User
}
```

## 反射与注解

```java
// 获取类上的注解
if (clazz.isAnnotationPresent(MyAnnotation.class)) {
    MyAnnotation annotation = clazz.getAnnotation(MyAnnotation.class);
    System.out.println(annotation.value());
}

// 获取方法上的注解
Method method = clazz.getMethod("sayHello");
Annotation[] methodAnnotations = method.getAnnotations();

// 获取字段上的注解
Field field = clazz.getDeclaredField("name");
Annotation[] fieldAnnotations = field.getAnnotations();
```

## 反射的应用场景

### 1. 框架开发

Spring 框架通过反射实现依赖注入：

```java
// 简化版 IoC 容器
public class SimpleContainer {
    public static <T> T createBean(Class<T> clazz) throws Exception {
        T instance = clazz.getDeclaredConstructor().newInstance();
        
        // 注入依赖
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Autowired.class)) {
                field.setAccessible(true);
                Object dependency = createBean(field.getType());
                field.set(instance, dependency);
            }
        }
        
        return instance;
    }
}
```

### 2. 通用工具类

```java
// 对象转 Map
public static Map<String, Object> objectToMap(Object obj) throws Exception {
    Map<String, Object> map = new HashMap<>();
    Class<?> clazz = obj.getClass();
    
    for (Field field : clazz.getDeclaredFields()) {
        field.setAccessible(true);
        map.put(field.getName(), field.get(obj));
    }
    
    return map;
}

// 复制对象属性
public static void copyProperties(Object source, Object target) throws Exception {
    Class<?> sourceClass = source.getClass();
    Class<?> targetClass = target.getClass();
    
    for (Field sourceField : sourceClass.getDeclaredFields()) {
        try {
            Field targetField = targetClass.getDeclaredField(sourceField.getName());
            sourceField.setAccessible(true);
            targetField.setAccessible(true);
            targetField.set(target, sourceField.get(source));
        } catch (NoSuchFieldException ignored) {
        }
    }
}
```

### 3. 动态代理

```java
public class LogProxy implements InvocationHandler {
    private Object target;
    
    public LogProxy(Object target) {
        this.target = target;
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("方法调用前：" + method.getName());
        Object result = method.invoke(target, args);
        System.out.println("方法调用后：" + method.getName());
        return result;
    }
    
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target) {
        return (T) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            new LogProxy(target)
        );
    }
}
```

## 反射的优缺点

| 优点                 | 缺点               |
| :------------------- | :----------------- |
| 灵活，可以动态操作类 | 性能较差           |
| 是框架的基础         | 破坏封装性         |
| 可以访问私有成员     | 代码可读性差       |
| 运行时确定类型       | 编译期无法检查类型 |

## 反射性能优化

```java
// 1. 缓存 Class 对象
private static final Map<String, Class<?>> classCache = new ConcurrentHashMap<>();

public static Class<?> getClass(String className) throws ClassNotFoundException {
    return classCache.computeIfAbsent(className, name -> {
        try {
            return Class.forName(name);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
    });
}

// 2. 缓存 Method 对象
private static final Map<String, Method> methodCache = new ConcurrentHashMap<>();

// 3. setAccessible(true) 可以提升性能
method.setAccessible(true);

// 4. 使用 MethodHandle（Java 7+）
MethodHandles.Lookup lookup = MethodHandles.lookup();
MethodHandle handle = lookup.findVirtual(User.class, "sayHello", MethodType.methodType(void.class));
handle.invoke(user);
```

## 常用 API 总结

| 类/方法                   | 作用             |
| :------------------------ | :--------------- |
| Class.forName()           | 获取 Class 对象  |
| getConstructors()         | 获取公共构造方法 |
| getDeclaredConstructors() | 获取所有构造方法 |
| getFields()               | 获取公共字段     |
| getDeclaredFields()       | 获取所有字段     |
| getMethods()              | 获取公共方法     |
| getDeclaredMethods()      | 获取所有方法     |
| newInstance()             | 创建实例         |
| invoke()                  | 调用方法         |
| get() / set()             | 获取/设置字段值  |
| setAccessible(true)       | 取消访问检查     |

::: warning 安全注意
反射可以访问私有成员，破坏了封装性。在模块化系统（Java 9+）中，反射访问可能会受到限制。
:::
