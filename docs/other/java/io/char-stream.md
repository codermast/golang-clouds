---
order : 4
---

# Java IO - 字符流

字符流以字符为单位进行读写，专门用于处理文本文件。相比字节流，字符流能够正确处理字符编码，避免中文乱码问题。

## 字符流体系

```
Reader（抽象类）
    ├── FileReader           文件字符输入流
    ├── BufferedReader       缓冲字符输入流
    ├── InputStreamReader    字节流转字符流
    └── StringReader         字符串输入流

Writer（抽象类）
    ├── FileWriter           文件字符输出流
    ├── BufferedWriter       缓冲字符输出流
    ├── OutputStreamWriter   字符流转字节流
    ├── PrintWriter          打印流
    └── StringWriter         字符串输出流
```

## 字节流 vs 字符流

| 特性     | 字节流                   | 字符流        |
| -------- | ------------------------ | ------------- |
| 单位     | 字节（byte）             | 字符（char）  |
| 处理类型 | 任意文件                 | 纯文本文件    |
| 编码     | 不处理编码               | 自动处理编码  |
| 基类     | InputStream/OutputStream | Reader/Writer |

## FileReader 文件字符输入流

用于读取文本文件。

### 构造方法

```java
// 使用默认编码
FileReader fr = new FileReader("test.txt");

// 指定编码（JDK 11+）
FileReader fr = new FileReader("test.txt", Charset.forName("UTF-8"));
```

### 常用方法

| 方法                                      | 说明                           |
| ----------------------------------------- | ------------------------------ |
| `int read()`                              | 读取一个字符，返回 -1 表示结束 |
| `int read(char[] cbuf)`                   | 读取多个字符到数组             |
| `int read(char[] cbuf, int off, int len)` | 读取指定长度的字符             |
| `void close()`                            | 关闭流                         |

### 读取文件示例

```java
import java.io.FileReader;
import java.io.IOException;

public class FileReaderDemo {
    public static void main(String[] args) {
        // 逐字符读取
        try (FileReader fr = new FileReader("test.txt")) {
            int ch;
            while ((ch = fr.read()) != -1) {
                System.out.print((char) ch);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 使用字符数组读取

```java
try (FileReader fr = new FileReader("test.txt")) {
    char[] buffer = new char[1024];
    int len;
    while ((len = fr.read(buffer)) != -1) {
        System.out.print(new String(buffer, 0, len));
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

## FileWriter 文件字符输出流

用于写入文本文件。

### 构造方法

```java
// 覆盖写入
FileWriter fw = new FileWriter("test.txt");

// 追加写入
FileWriter fw = new FileWriter("test.txt", true);

// 指定编码（JDK 11+）
FileWriter fw = new FileWriter("test.txt", Charset.forName("UTF-8"));
```

### 常用方法

| 方法                                       | 说明               |
| ------------------------------------------ | ------------------ |
| `void write(int c)`                        | 写入一个字符       |
| `void write(char[] cbuf)`                  | 写入字符数组       |
| `void write(String str)`                   | 写入字符串         |
| `void write(String str, int off, int len)` | 写入字符串的一部分 |
| `void flush()`                             | 刷新缓冲区         |
| `void close()`                             | 关闭流             |

### 写入文件示例

```java
import java.io.FileWriter;
import java.io.IOException;

public class FileWriterDemo {
    public static void main(String[] args) {
        try (FileWriter fw = new FileWriter("output.txt")) {
            // 写入字符串
            fw.write("Hello, 世界！\n");
            
            // 写入字符数组
            char[] chars = {'J', 'a', 'v', 'a'};
            fw.write(chars);
            
            // 写入单个字符
            fw.write('\n');
            
            // 写入字符串的一部分
            fw.write("ABCDEFG", 0, 3);  // 写入 ABC
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

::: warning flush() 的重要性
字符流内部有缓冲区，数据先写入缓冲区，需要调用 `flush()` 或 `close()` 才会真正写入文件。
:::

```java
FileWriter fw = new FileWriter("test.txt");
fw.write("Hello");
fw.flush();  // 立即写入文件
// 或者
fw.close();  // 关闭时自动 flush
```

## InputStreamReader 转换流

将字节流转换为字符流，可以指定编码。

```java
import java.io.*;

public class InputStreamReaderDemo {
    public static void main(String[] args) {
        try (InputStreamReader isr = new InputStreamReader(
                new FileInputStream("test.txt"), "UTF-8")) {
            char[] buffer = new char[1024];
            int len;
            while ((len = isr.read(buffer)) != -1) {
                System.out.print(new String(buffer, 0, len));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## OutputStreamWriter 转换流

将字符流转换为字节流，可以指定编码。

```java
try (OutputStreamWriter osw = new OutputStreamWriter(
        new FileOutputStream("test.txt"), "UTF-8")) {
    osw.write("你好，世界！");
} catch (IOException e) {
    e.printStackTrace();
}
```

### 编码转换示例

将 GBK 编码文件转换为 UTF-8 编码：

```java
public class EncodingConvert {
    public static void main(String[] args) {
        try (InputStreamReader isr = new InputStreamReader(
                new FileInputStream("gbk.txt"), "GBK");
             OutputStreamWriter osw = new OutputStreamWriter(
                new FileOutputStream("utf8.txt"), "UTF-8")) {
            
            char[] buffer = new char[1024];
            int len;
            while ((len = isr.read(buffer)) != -1) {
                osw.write(buffer, 0, len);
            }
            System.out.println("编码转换完成");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## PrintWriter 打印流

提供更方便的输出方法。

```java
import java.io.PrintWriter;
import java.io.FileWriter;
import java.io.IOException;

public class PrintWriterDemo {
    public static void main(String[] args) {
        try (PrintWriter pw = new PrintWriter(new FileWriter("output.txt"))) {
            // 打印字符串
            pw.println("Hello World");
            
            // 格式化输出
            pw.printf("姓名：%s，年龄：%d%n", "张三", 25);
            
            // 打印各种类型
            pw.print(100);
            pw.print(true);
            pw.println(3.14);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 自动刷新

```java
// 第二个参数 true 表示自动刷新
PrintWriter pw = new PrintWriter(new FileWriter("output.txt"), true);
pw.println("自动刷新");  // println 后自动 flush
```

## StringReader / StringWriter

在内存中读写字符串。

### StringReader

```java
String str = "Hello World";
try (StringReader sr = new StringReader(str)) {
    int ch;
    while ((ch = sr.read()) != -1) {
        System.out.print((char) ch);
    }
}
```

### StringWriter

```java
try (StringWriter sw = new StringWriter()) {
    sw.write("Hello ");
    sw.write("World");
    
    String result = sw.toString();
    System.out.println(result);  // Hello World
}
```

## 文本文件复制

```java
public class TextFileCopy {
    public static void main(String[] args) {
        try (FileReader fr = new FileReader("source.txt");
             FileWriter fw = new FileWriter("target.txt")) {
            
            char[] buffer = new char[1024];
            int len;
            while ((len = fr.read(buffer)) != -1) {
                fw.write(buffer, 0, len);
            }
            System.out.println("文件复制完成");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 逐行读取文件

使用 BufferedReader 可以逐行读取：

```java
try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

## 字符编码问题

### 常见编码

| 编码   | 说明               | 中文字节数 |
| ------ | ------------------ | ---------- |
| ASCII  | 美国标准信息交换码 | 不支持中文 |
| GBK    | 中国国标码         | 2 字节     |
| UTF-8  | 通用编码           | 3 字节     |
| UTF-16 | Unicode 编码       | 2 字节     |

### 乱码原因

```
写入时使用编码 A → 文件 → 读取时使用编码 B → 乱码
```

### 解决方案

确保读写使用相同编码：

```java
// 写入
try (OutputStreamWriter osw = new OutputStreamWriter(
        new FileOutputStream("test.txt"), "UTF-8")) {
    osw.write("你好");
}

// 读取（使用相同编码）
try (InputStreamReader isr = new InputStreamReader(
        new FileInputStream("test.txt"), "UTF-8")) {
    // 正确读取
}
```

## 小结

- **FileReader/FileWriter**：文件字符流，处理文本文件
- **InputStreamReader/OutputStreamWriter**：转换流，指定编码
- **PrintWriter**：打印流，提供便捷的输出方法
- **StringReader/StringWriter**：内存字符流
- 字符流自动处理编码，但需确保读写编码一致
- 字符流有缓冲区，写入后需要 `flush()` 或 `close()`
- 纯文本文件优先使用字符流，其他文件使用字节流
