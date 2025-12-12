---
order : 2
---

# 类加载机制

类加载机制是 JVM 将 `.class` 文件加载到内存，并对数据进行校验、转换解析和初始化，最终形成可被 JVM 直接使用的 Java 类型的过程。

## 类的生命周期

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  加载   │ → │  验证   │ → │  准备   │ → │  解析   │ → │  初始化  │
│ Loading │   │Verifying│   │Preparing│   │Resolving│   │Initializ│
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
                    ↓─────────────────────────────↓
                              连接（Linking）
                                    ↓
                            ┌─────────────┐
                            │    使用     │
                            │   Using     │
                            └─────────────┘
                                    ↓
                            ┌─────────────┐
                            │    卸载     │
                            │  Unloading  │
                            └─────────────┘
```

## 加载（Loading）

加载是类加载的第一个阶段。

### 加载过程

1. 通过类的全限定名获取定义此类的二进制字节流
2. 将字节流所代表的静态存储结构转化为方法区的运行时数据结构
3. 在内存中生成一个代表这个类的 `java.lang.Class` 对象

### 类的来源

- 本地文件系统的 `.class` 文件
- JAR、WAR 包中的类
- 网络下载的类
- 运行时动态生成的类（动态代理）
- 其他文件生成（JSP 编译后的类）

## 验证（Verification）

确保 Class 文件的字节流符合 JVM 规范，不会危害虚拟机。

### 验证阶段

| 阶段         | 说明                                 |
| ------------ | ------------------------------------ |
| 文件格式验证 | 魔数、版本号、常量池等               |
| 元数据验证   | 语义分析，如是否有父类               |
| 字节码验证   | 数据流和控制流分析                   |
| 符号引用验证 | 符号引用能否找到对应的类、方法、字段 |

### 魔数验证

```java
// Class 文件以魔数开头：0xCAFEBABE
// 可以使用 xxd 命令查看
// $ xxd Test.class | head -1
// 00000000: cafe babe 0000 0034 0022 ...
```

## 准备（Preparation）

为类变量（static 变量）分配内存并设置初始值。

### 初始值规则

```java
public class PrepareDemo {
    // 准备阶段：value = 0（不是 123）
    // 初始化阶段：value = 123
    public static int value = 123;
    
    // 准备阶段：直接赋值 123（final 常量）
    public static final int CONST = 123;
}
```

### 各类型初始值

| 数据类型  | 初始值    |
| --------- | --------- |
| int       | 0         |
| long      | 0L        |
| short     | (short) 0 |
| char      | '\u0000'  |
| byte      | (byte) 0  |
| boolean   | false     |
| float     | 0.0f      |
| double    | 0.0d      |
| reference | null      |

## 解析（Resolution）

将常量池中的符号引用替换为直接引用。

### 符号引用 vs 直接引用

| 类型     | 说明                               |
| -------- | ---------------------------------- |
| 符号引用 | 用一组符号描述目标，如类名、方法名 |
| 直接引用 | 直接指向目标的指针、偏移量或句柄   |

### 解析类型

- 类或接口的解析
- 字段解析
- 类方法解析
- 接口方法解析

## 初始化（Initialization）

执行类构造器 `<clinit>()` 方法的过程。

### `<clinit>()` 方法

```java
public class InitDemo {
    static int a = 1;                 // ①
    static int b;
    
    static {                          // ②
        b = 2;
        System.out.println("静态代码块执行");
    }
    
    // <clinit>() 方法由编译器收集 ① 和 ② 合并生成
}
```

### 初始化时机

以下情况会触发类的初始化：

1. **new 实例化对象**
2. **访问类的静态变量**（非 final 常量）
3. **调用类的静态方法**
4. **反射调用**（如 `Class.forName()`）
5. **初始化子类时，父类先初始化**
6. **main 方法所在的类**

### 不会触发初始化的情况

```java
public class Parent {
    static {
        System.out.println("Parent 初始化");
    }
    public static int value = 123;
}

public class Child extends Parent {
    static {
        System.out.println("Child 初始化");
    }
}

public class Test {
    public static void main(String[] args) {
        // 1. 通过子类引用父类的静态变量，不会初始化子类
        System.out.println(Child.value);
        // 输出：Parent 初始化
        //       123
        
        // 2. 通过数组定义，不会触发初始化
        Parent[] arr = new Parent[10];
        
        // 3. 引用常量不会触发初始化（常量在编译期放入常量池）
        System.out.println(Parent.CONST);
    }
}
```

## 类加载器

### 类加载器类型

```
┌─────────────────────────────────────────────────────────────┐
│              Bootstrap ClassLoader                          │
│              启动类加载器（C++ 实现）                         │
│              加载 JAVA_HOME/lib 下的类                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Extension ClassLoader                          │
│              扩展类加载器                                    │
│              加载 JAVA_HOME/lib/ext 下的类                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Application ClassLoader                        │
│              应用程序类加载器                                │
│              加载用户类路径（classpath）下的类               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Custom ClassLoader                             │
│              自定义类加载器                                  │
└─────────────────────────────────────────────────────────────┘
```

### 获取类加载器

```java
public class ClassLoaderDemo {
    public static void main(String[] args) {
        // 应用程序类加载器
        ClassLoader appLoader = ClassLoaderDemo.class.getClassLoader();
        System.out.println(appLoader);
        // sun.misc.Launcher$AppClassLoader
        
        // 扩展类加载器
        ClassLoader extLoader = appLoader.getParent();
        System.out.println(extLoader);
        // sun.misc.Launcher$ExtClassLoader
        
        // 启动类加载器（C++ 实现，返回 null）
        ClassLoader bootstrapLoader = extLoader.getParent();
        System.out.println(bootstrapLoader);
        // null
        
        // String 类由启动类加载器加载
        System.out.println(String.class.getClassLoader());
        // null
    }
}
```

## 双亲委派模型

### 工作原理

```
加载请求
    ↓
Application ClassLoader → 委托给 Extension ClassLoader
                                    ↓
              Extension ClassLoader → 委托给 Bootstrap ClassLoader
                                              ↓
                              Bootstrap 尝试加载
                              （成功则返回，失败则下传）
                                              ↓
                              Extension 尝试加载
                              （成功则返回，失败则下传）
                                              ↓
                              Application 尝试加载
```

### 源码分析

```java
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    synchronized (getClassLoadingLock(name)) {
        // 1. 检查类是否已加载
        Class<?> c = findLoadedClass(name);
        if (c == null) {
            try {
                // 2. 委托给父加载器
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    // 3. 父加载器为空，使用启动类加载器
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // 父加载器无法加载
            }

            if (c == null) {
                // 4. 父加载器无法加载，自己尝试加载
                c = findClass(name);
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

### 双亲委派的优点

1. **避免类的重复加载**
2. **保证核心类的安全**：防止用户自定义类覆盖核心类

```java
// 即使自定义 java.lang.String，也不会加载
// 因为会委托给 Bootstrap ClassLoader，它会加载 rt.jar 中的 String
package java.lang;
public class String {
    // 这个类不会被加载
}
```

## 自定义类加载器

### 实现方式

继承 `ClassLoader` 并重写 `findClass` 方法。

```java
public class MyClassLoader extends ClassLoader {
    private String classPath;
    
    public MyClassLoader(String classPath) {
        this.classPath = classPath;
    }
    
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            // 读取 class 文件
            byte[] bytes = loadClassBytes(name);
            // 定义类
            return defineClass(name, bytes, 0, bytes.length);
        } catch (IOException e) {
            throw new ClassNotFoundException(name, e);
        }
    }
    
    private byte[] loadClassBytes(String name) throws IOException {
        String path = classPath + "/" + name.replace('.', '/') + ".class";
        try (InputStream is = new FileInputStream(path);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = is.read(buffer)) != -1) {
                baos.write(buffer, 0, len);
            }
            return baos.toByteArray();
        }
    }
}
```

### 使用示例

```java
public class CustomLoaderTest {
    public static void main(String[] args) throws Exception {
        MyClassLoader loader = new MyClassLoader("/path/to/classes");
        Class<?> clazz = loader.loadClass("com.example.MyClass");
        Object instance = clazz.newInstance();
        System.out.println(instance.getClass().getClassLoader());
    }
}
```

## 打破双亲委派

### 常见场景

1. **JNDI、JDBC**：核心类需要加载 SPI 实现类
2. **热部署**：如 Tomcat 的 WebAppClassLoader
3. **模块化**：OSGi

### 线程上下文类加载器

```java
// 获取线程上下文类加载器
ClassLoader contextLoader = Thread.currentThread().getContextClassLoader();

// 设置线程上下文类加载器
Thread.currentThread().setContextClassLoader(customLoader);
```

### Tomcat 类加载器

```
      Bootstrap
          ↓
       System
          ↓
       Common
      ↙    ↘
 Webapp1   Webapp2
```

- 每个 Web 应用有独立的类加载器
- 优先加载 Web 应用自己的类
- 实现应用隔离

## 小结

- **类加载过程**：加载 → 验证 → 准备 → 解析 → 初始化
- **准备阶段**：静态变量赋初始值（零值），final 常量直接赋值
- **初始化阶段**：执行 `<clinit>()` 方法
- **双亲委派**：优先委托父加载器加载，保证类加载的唯一性和安全性
- **打破双亲委派**：热部署、SPI、模块化等场景
