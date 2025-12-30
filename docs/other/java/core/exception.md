---
order: 4
---

# Java核心 - 异常处理

## 异常概述

异常是程序执行过程中发生的意外事件，会中断正常的程序流程。Java 提供了完善的异常处理机制来处理这些情况。

## 异常体系结构

```
Throwable（所有异常的根类）
├── Error（错误，程序无法处理）
│   ├── OutOfMemoryError（内存溢出）
│   ├── StackOverflowError（栈溢出）
│   └── VirtualMachineError（虚拟机错误）
│
└── Exception（异常，程序可以处理）
    ├── RuntimeException（运行时异常，非受检异常）
    │   ├── NullPointerException（空指针）
    │   ├── ArrayIndexOutOfBoundsException（数组越界）
    │   ├── ClassCastException（类型转换异常）
    │   ├── ArithmeticException（算术异常）
    │   ├── IllegalArgumentException（非法参数）
    │   └── NumberFormatException（数字格式异常）
    │
    └── 其他 Exception（编译时异常，受检异常）
        ├── IOException（IO 异常）
        ├── SQLException（SQL 异常）
        ├── ClassNotFoundException（类未找到）
        └── FileNotFoundException（文件未找到）
```

## 异常分类

### Error（错误）

Error 表示严重的系统级错误，程序通常无法处理，也不应该尝试捕获。

```java
// OutOfMemoryError
int[] arr = new int[Integer.MAX_VALUE];  // 内存溢出

// StackOverflowError
public void recursive() {
    recursive();  // 无限递归导致栈溢出
}
```

### 受检异常（Checked Exception）

编译时异常，必须显式处理（try-catch 或 throws），否则编译不通过。

```java
// FileNotFoundException 是受检异常
public void readFile() throws FileNotFoundException {
    FileInputStream fis = new FileInputStream("file.txt");
}
```

### 非受检异常（Unchecked Exception）

运行时异常，编译时不强制处理，但运行时可能抛出。

```java
// NullPointerException 是非受检异常
String str = null;
str.length();  // 运行时抛出 NullPointerException
```

### 受检异常 vs 非受检异常

| 特性     | 受检异常     | 非受检异常           |
| :------- | :----------- | :------------------- |
| 父类     | Exception    | RuntimeException     |
| 编译检查 | 必须处理     | 不强制处理           |
| 典型场景 | 外部资源操作 | 程序逻辑错误         |
| 示例     | IOException  | NullPointerException |

## 异常处理

### try-catch

```java
try {
    // 可能抛出异常的代码
    int result = 10 / 0;
} catch (ArithmeticException e) {
    // 处理特定异常
    System.out.println("除数不能为0");
} catch (Exception e) {
    // 处理其他异常
    System.out.println("发生异常：" + e.getMessage());
}
```

### 多异常捕获

```java
// 方式一：多个 catch 块
try {
    // ...
} catch (FileNotFoundException e) {
    // 处理文件未找到
} catch (IOException e) {
    // 处理 IO 异常
}

// 方式二：合并捕获（Java 7+）
try {
    // ...
} catch (FileNotFoundException | SQLException e) {
    // 同时处理多种异常
    System.out.println("异常：" + e.getMessage());
}
```

::: warning 捕获顺序
多个 catch 块时，子类异常必须在父类异常之前，否则编译错误。
:::

### try-catch-finally

```java
FileInputStream fis = null;
try {
    fis = new FileInputStream("file.txt");
    // 读取文件
} catch (IOException e) {
    System.out.println("读取失败");
} finally {
    // 无论是否发生异常，finally 块都会执行
    if (fis != null) {
        try {
            fis.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### try-with-resources（Java 7+）

自动关闭实现了 `AutoCloseable` 接口的资源。

```java
// 推荐方式
try (FileInputStream fis = new FileInputStream("file.txt");
     BufferedReader reader = new BufferedReader(new InputStreamReader(fis))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    System.out.println("读取失败");
}
// 资源自动关闭，无需 finally
```

::: tip try-with-resources 优点
1. 代码更简洁
2. 自动关闭资源，不会遗漏
3. 如果 close() 抛出异常，会被抑制（Suppressed）
:::

## 异常抛出

### throw 抛出异常

```java
public void setAge(int age) {
    if (age < 0 || age > 150) {
        throw new IllegalArgumentException("年龄必须在 0-150 之间");
    }
    this.age = age;
}
```

### throws 声明异常

```java
// 声明方法可能抛出的异常
public void readFile(String path) throws FileNotFoundException, IOException {
    FileInputStream fis = new FileInputStream(path);
    // ...
}
```

### throw vs throws

| 关键字 | 位置     | 作用                   |
| :----- | :------- | :--------------------- |
| throw  | 方法体内 | 抛出一个异常实例       |
| throws | 方法签名 | 声明可能抛出的异常类型 |

## 自定义异常

```java
// 自定义受检异常
public class BusinessException extends Exception {
    private int errorCode;
    
    public BusinessException(String message) {
        super(message);
    }
    
    public BusinessException(String message, int errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public int getErrorCode() {
        return errorCode;
    }
}

// 自定义非受检异常
public class ServiceException extends RuntimeException {
    public ServiceException(String message) {
        super(message);
    }
    
    public ServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

### 使用自定义异常

```java
public class UserService {
    public User findById(Long id) throws BusinessException {
        if (id == null || id <= 0) {
            throw new BusinessException("用户ID无效", 400);
        }
        
        User user = userDao.findById(id);
        if (user == null) {
            throw new BusinessException("用户不存在", 404);
        }
        
        return user;
    }
}
```

## 异常链

保留原始异常信息，便于追踪问题根源。

```java
public void processData() throws ServiceException {
    try {
        readFile();
    } catch (IOException e) {
        // 将原始异常作为 cause 传递
        throw new ServiceException("数据处理失败", e);
    }
}
```

## 常见异常及处理

| 异常                            | 原因               | 处理建议             |
| :------------------------------ | :----------------- | :------------------- |
| NullPointerException            | 空指针             | 判空或使用 Optional  |
| ArrayIndexOutOfBoundsException  | 数组越界           | 检查索引范围         |
| ClassCastException              | 类型转换失败       | 使用 instanceof 检查 |
| NumberFormatException           | 数字格式错误       | 校验输入格式         |
| ArithmeticException             | 算术错误（如除零） | 检查除数             |
| IllegalArgumentException        | 非法参数           | 参数校验             |
| ConcurrentModificationException | 并发修改           | 使用并发安全集合     |
| FileNotFoundException           | 文件不存在         | 检查文件路径         |

## 异常处理最佳实践

### 1. 只捕获能处理的异常

```java
// 不好：捕获了但没有正确处理
try {
    // ...
} catch (Exception e) {
    // 空的 catch 块
}

// 好：有意义的处理
try {
    // ...
} catch (IOException e) {
    logger.error("文件操作失败", e);
    throw new ServiceException("操作失败，请重试", e);
}
```

### 2. 使用具体的异常类型

```java
// 不好：捕获过于宽泛
try {
    // ...
} catch (Exception e) {
    // ...
}

// 好：捕获具体异常
try {
    // ...
} catch (FileNotFoundException e) {
    // 处理文件不存在
} catch (IOException e) {
    // 处理其他 IO 异常
}
```

### 3. 不要忽略异常

```java
// 不好：吞掉异常
try {
    // ...
} catch (Exception e) {
    e.printStackTrace();  // 仅打印，容易被忽略
}

// 好：记录日志或重新抛出
try {
    // ...
} catch (Exception e) {
    logger.error("操作失败", e);
    throw e;  // 或抛出自定义异常
}
```

### 4. 尽早失败

```java
public void process(String data) {
    // 在方法开始时进行参数校验
    if (data == null || data.isEmpty()) {
        throw new IllegalArgumentException("数据不能为空");
    }
    
    // 正常业务逻辑
}
```

### 5. 使用 try-with-resources

```java
// 不好：手动关闭资源
FileInputStream fis = null;
try {
    fis = new FileInputStream("file.txt");
    // ...
} finally {
    if (fis != null) {
        try { fis.close(); } catch (IOException e) { }
    }
}

// 好：自动关闭资源
try (FileInputStream fis = new FileInputStream("file.txt")) {
    // ...
}
```

### 6. 异常信息要有意义

```java
// 不好：信息不明确
throw new IllegalArgumentException("参数错误");

// 好：包含具体信息
throw new IllegalArgumentException("用户名长度必须在3-20之间，当前长度：" + name.length());
```

## finally 执行时机

```java
public int test() {
    try {
        return 1;
    } finally {
        System.out.println("finally 执行");  // 会执行
    }
}

// finally 不执行的情况：
// 1. System.exit() 退出 JVM
// 2. 线程被强制终止
// 3. 程序崩溃
```

::: warning 注意
如果 try 和 finally 都有 return，finally 的 return 会覆盖 try 的 return。不推荐在 finally 中使用 return。
:::
