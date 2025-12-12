---
order: 8
---

# Java核心 - String 字符串

## 概述

String 是 Java 中最常用的类之一，用于表示字符串。String 对象是不可变的（immutable），一旦创建就不能被修改。

## 创建字符串

```java
// 方式一：字面量（推荐）
String str1 = "Hello";

// 方式二：构造方法
String str2 = new String("Hello");

// 方式三：字符数组
char[] chars = {'H', 'e', 'l', 'l', 'o'};
String str3 = new String(chars);

// 方式四：字节数组
byte[] bytes = {72, 101, 108, 108, 111};
String str4 = new String(bytes);
String str5 = new String(bytes, StandardCharsets.UTF_8);
```

## 字符串常量池

Java 为了节省内存，维护了一个字符串常量池。字面量创建的字符串会放入常量池，相同内容共享同一个对象。

```java
String s1 = "Hello";
String s2 = "Hello";
String s3 = new String("Hello");

System.out.println(s1 == s2);      // true（同一对象）
System.out.println(s1 == s3);      // false（不同对象）
System.out.println(s1.equals(s3)); // true（内容相同）

// intern() 方法：将字符串加入常量池
String s4 = s3.intern();
System.out.println(s1 == s4);      // true
```

::: warning 字符串比较
- `==` 比较的是内存地址
- `equals()` 比较的是内容
- 比较字符串内容应该始终使用 `equals()` 方法
:::

## 常用方法

### 基本操作

```java
String str = "Hello World";

// 长度
int length = str.length();  // 11

// 判空
boolean empty = str.isEmpty();  // false
boolean blank = str.isBlank();  // false（Java 11+，检查空白字符）

// 获取字符
char ch = str.charAt(0);  // 'H'

// 转换为字符数组
char[] chars = str.toCharArray();

// 转换为字节数组
byte[] bytes = str.getBytes(StandardCharsets.UTF_8);
```

### 查找与判断

```java
String str = "Hello World";

// 查找位置
int index1 = str.indexOf("o");       // 4（第一次出现）
int index2 = str.lastIndexOf("o");   // 7（最后一次出现）
int index3 = str.indexOf("xyz");     // -1（不存在）

// 判断包含
boolean contains = str.contains("World");  // true

// 判断开头和结尾
boolean startsWith = str.startsWith("Hello");  // true
boolean endsWith = str.endsWith("World");      // true

// 判断相等（忽略大小写）
boolean equalsIgnore = str.equalsIgnoreCase("hello world");  // true
```

### 截取与替换

```java
String str = "Hello World";

// 截取
String sub1 = str.substring(6);      // "World"
String sub2 = str.substring(0, 5);   // "Hello"

// 替换
String replaced1 = str.replace("World", "Java");   // "Hello Java"
String replaced2 = str.replaceAll("\\s+", "-");    // "Hello-World"（正则）
String replaced3 = str.replaceFirst("o", "0");     // "Hell0 World"

// 大小写转换
String upper = str.toUpperCase();  // "HELLO WORLD"
String lower = str.toLowerCase();  // "hello world"

// 去除空白
String trimmed = "  Hello  ".trim();  // "Hello"
String stripped = "  Hello  ".strip();  // "Hello"（Java 11+，支持 Unicode 空白）
```

### 分割与连接

```java
// 分割
String str = "a,b,c,d";
String[] parts = str.split(",");  // ["a", "b", "c", "d"]

// 限制分割次数
String[] parts2 = str.split(",", 2);  // ["a", "b,c,d"]

// 连接
String joined = String.join("-", "a", "b", "c");  // "a-b-c"
String joined2 = String.join(",", Arrays.asList("x", "y", "z"));  // "x,y,z"
```

### 格式化

```java
// format 方法
String formatted = String.format("Name: %s, Age: %d", "张三", 25);

// 常用格式化符号
// %s - 字符串
// %d - 整数
// %f - 浮点数
// %.2f - 保留2位小数
// %n - 换行
// %% - 百分号

String result = String.format("价格: %.2f 元", 99.5);  // "价格: 99.50 元"

// Java 15+ formatted 方法
String msg = "Hello %s".formatted("World");
```

### 比较

```java
String s1 = "apple";
String s2 = "banana";

// 字典序比较
int cmp = s1.compareTo(s2);  // 负数（s1 < s2）
int cmpIgnore = s1.compareToIgnoreCase("APPLE");  // 0（相等）
```

## 字符串不可变性

String 对象一旦创建就不能被修改，所有"修改"操作都会创建新对象。

```java
String str = "Hello";
str.concat(" World");  // 创建新对象，但 str 不变
System.out.println(str);  // "Hello"

str = str.concat(" World");  // str 指向新对象
System.out.println(str);  // "Hello World"
```

### 为什么 String 不可变

1. **安全性**：String 常用于网络连接、文件路径、类名等，不可变可以防止被意外修改
2. **线程安全**：不可变对象天然线程安全
3. **缓存优化**：可以缓存 hashCode，提高 HashMap 等集合的性能
4. **字符串常量池**：只有不可变才能安全地共享字符串对象

## StringBuilder 与 StringBuffer

当需要频繁修改字符串时，应使用 StringBuilder 或 StringBuffer。

### StringBuilder

```java
StringBuilder sb = new StringBuilder();

// 追加
sb.append("Hello");
sb.append(" ");
sb.append("World");

// 插入
sb.insert(5, ",");  // "Hello, World"

// 删除
sb.delete(5, 6);    // "Hello World"

// 替换
sb.replace(6, 11, "Java");  // "Hello Java"

// 反转
sb.reverse();  // "avaJ olleH"

// 转为 String
String result = sb.toString();

// 链式调用
String str = new StringBuilder()
    .append("Hello")
    .append(" ")
    .append("World")
    .toString();
```

### StringBuilder vs StringBuffer

| 特性     | StringBuilder | StringBuffer             |
| :------- | :------------ | :----------------------- |
| 线程安全 | 非线程安全    | 线程安全（synchronized） |
| 性能     | 较高          | 较低                     |
| JDK 版本 | 1.5+          | 1.0+                     |
| 使用场景 | 单线程环境    | 多线程环境               |

::: tip 选择建议
- 单线程：使用 StringBuilder（性能更好）
- 多线程：使用 StringBuffer（线程安全）
- 简单拼接：直接使用 + 或 concat（编译器会优化）
:::

## 字符串拼接性能

```java
// 方式一：+ 运算符（简单场景可用）
String s1 = "Hello" + " " + "World";  // 编译器优化为一个字符串

// 方式二：循环中使用 + （不推荐）
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i;  // 每次循环创建新对象，性能差
}

// 方式三：StringBuilder（推荐）
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);
}
String result = sb.toString();

// 方式四：String.join（数组/集合）
String joined = String.join(",", list);

// 方式五：Stream（Java 8+）
String collected = list.stream().collect(Collectors.joining(","));
```

## 正则表达式

String 类提供了正则表达式相关方法。

```java
String str = "Hello123World456";

// 匹配
boolean matches = str.matches(".*\\d+.*");  // true

// 分割
String[] parts = str.split("\\d+");  // ["Hello", "World"]

// 替换
String replaced = str.replaceAll("\\d+", "-");  // "Hello-World-"

// 使用 Pattern（性能更好，可复用）
Pattern pattern = Pattern.compile("\\d+");
Matcher matcher = pattern.matcher(str);
while (matcher.find()) {
    System.out.println(matcher.group());  // 123, 456
}
```

### 常用正则表达式

| 模式    | 说明               |
| :------ | :----------------- |
| `.`     | 任意字符           |
| `\d`    | 数字               |
| `\w`    | 字母、数字、下划线 |
| `\s`    | 空白字符           |
| `*`     | 0 次或多次         |
| `+`     | 1 次或多次         |
| `?`     | 0 次或 1 次        |
| `{n}`   | 恰好 n 次          |
| `{n,m}` | n 到 m 次          |
| `[]`    | 字符类             |
| `^`     | 开头               |
| `$`     | 结尾               |

## Java 11+ 新方法

```java
// isBlank() - 判断空白
"   ".isBlank();  // true

// strip() - 去除空白（支持 Unicode）
" Hello ".strip();  // "Hello"
" Hello ".stripLeading();   // "Hello "
" Hello ".stripTrailing();  // " Hello"

// repeat() - 重复字符串
"ab".repeat(3);  // "ababab"

// lines() - 按行分割
"a\nb\nc".lines().forEach(System.out::println);
```

## Java 15+ 文本块

```java
// 传统方式
String json = "{\n" +
    "  \"name\": \"张三\",\n" +
    "  \"age\": 25\n" +
    "}";

// 文本块（Java 15+）
String json = """
    {
      "name": "张三",
      "age": 25
    }
    """;

// 文本块中使用变量
String name = "张三";
String template = """
    Hello, %s!
    Welcome to Java.
    """.formatted(name);
```

## 常见问题

### 空指针处理

```java
String str = null;

// 错误写法
// str.equals("Hello");  // NullPointerException

// 正确写法
"Hello".equals(str);  // false，不会抛异常

// 使用 Objects.equals
Objects.equals(str, "Hello");  // false

// 使用 Optional
Optional.ofNullable(str).orElse("default");
```

### 编码问题

```java
// 获取字节时指定编码
byte[] bytes = str.getBytes(StandardCharsets.UTF_8);

// 从字节创建字符串时指定编码
String str = new String(bytes, StandardCharsets.UTF_8);
```
