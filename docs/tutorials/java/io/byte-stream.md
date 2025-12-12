---
order : 3
---

# Java IO - 字节流

字节流是 Java IO 中最基本的流类型，以字节（byte）为单位进行数据读写，可以处理任意类型的文件。

## 字节流体系

```
InputStream（抽象类）
    ├── FileInputStream        文件输入流
    ├── BufferedInputStream    缓冲输入流
    ├── DataInputStream        数据输入流
    ├── ObjectInputStream      对象输入流
    └── ByteArrayInputStream   字节数组输入流

OutputStream（抽象类）
    ├── FileOutputStream       文件输出流
    ├── BufferedOutputStream   缓冲输出流
    ├── DataOutputStream       数据输出流
    ├── ObjectOutputStream     对象输出流
    └── ByteArrayOutputStream  字节数组输出流
```

## FileInputStream 文件输入流

用于从文件中读取字节数据。

### 构造方法

```java
// 通过文件路径创建
FileInputStream fis = new FileInputStream("test.txt");

// 通过 File 对象创建
File file = new File("test.txt");
FileInputStream fis = new FileInputStream(file);
```

### 常用方法

| 方法                                   | 说明                                 |
| -------------------------------------- | ------------------------------------ |
| `int read()`                           | 读取一个字节，返回 -1 表示结束       |
| `int read(byte[] b)`                   | 读取多个字节到数组，返回读取的字节数 |
| `int read(byte[] b, int off, int len)` | 读取指定长度的字节                   |
| `int available()`                      | 返回可读取的字节数                   |
| `void close()`                         | 关闭流                               |

### 读取文件示例

```java
import java.io.FileInputStream;
import java.io.IOException;

public class FileInputStreamDemo {
    public static void main(String[] args) {
        // try-with-resources 自动关闭流
        try (FileInputStream fis = new FileInputStream("test.txt")) {
            // 方式一：逐字节读取
            int data;
            while ((data = fis.read()) != -1) {
                System.out.print((char) data);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 使用字节数组读取

```java
try (FileInputStream fis = new FileInputStream("test.txt")) {
    // 方式二：使用字节数组读取（推荐）
    byte[] buffer = new byte[1024];
    int len;
    while ((len = fis.read(buffer)) != -1) {
        String content = new String(buffer, 0, len);
        System.out.print(content);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

### 一次性读取全部内容

```java
try (FileInputStream fis = new FileInputStream("test.txt")) {
    // 获取文件大小
    int size = fis.available();
    byte[] bytes = new byte[size];
    fis.read(bytes);
    System.out.println(new String(bytes));
} catch (IOException e) {
    e.printStackTrace();
}
```

::: warning 注意
一次性读取适用于小文件，大文件可能导致内存溢出。
:::

## FileOutputStream 文件输出流

用于将字节数据写入文件。

### 构造方法

```java
// 覆盖写入
FileOutputStream fos = new FileOutputStream("test.txt");

// 追加写入
FileOutputStream fos = new FileOutputStream("test.txt", true);
```

### 常用方法

| 方法                                     | 说明                   |
| ---------------------------------------- | ---------------------- |
| `void write(int b)`                      | 写入一个字节           |
| `void write(byte[] b)`                   | 写入字节数组           |
| `void write(byte[] b, int off, int len)` | 写入字节数组的指定部分 |
| `void flush()`                           | 刷新缓冲区             |
| `void close()`                           | 关闭流                 |

### 写入文件示例

```java
import java.io.FileOutputStream;
import java.io.IOException;

public class FileOutputStreamDemo {
    public static void main(String[] args) {
        try (FileOutputStream fos = new FileOutputStream("output.txt")) {
            // 写入字符串
            String content = "Hello, Java IO!";
            fos.write(content.getBytes());
            
            // 写入换行
            fos.write("\n".getBytes());
            
            // 追加内容
            fos.write("这是第二行".getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 追加写入

```java
try (FileOutputStream fos = new FileOutputStream("output.txt", true)) {
    fos.write("\n追加的内容".getBytes());
} catch (IOException e) {
    e.printStackTrace();
}
```

## 文件复制

使用字节流实现文件复制：

```java
public class FileCopy {
    public static void main(String[] args) {
        String source = "source.jpg";
        String target = "target.jpg";
        
        try (FileInputStream fis = new FileInputStream(source);
             FileOutputStream fos = new FileOutputStream(target)) {
            
            byte[] buffer = new byte[1024];
            int len;
            while ((len = fis.read(buffer)) != -1) {
                fos.write(buffer, 0, len);
            }
            System.out.println("文件复制完成");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## ByteArrayInputStream 字节数组输入流

从字节数组中读取数据。

```java
byte[] data = "Hello World".getBytes();
try (ByteArrayInputStream bais = new ByteArrayInputStream(data)) {
    int b;
    while ((b = bais.read()) != -1) {
        System.out.print((char) b);
    }
}
```

## ByteArrayOutputStream 字节数组输出流

将数据写入内存中的字节数组。

```java
try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
    baos.write("Hello ".getBytes());
    baos.write("World".getBytes());
    
    // 获取字节数组
    byte[] bytes = baos.toByteArray();
    System.out.println(new String(bytes));
    
    // 转换为字符串
    System.out.println(baos.toString());
}
```

## DataInputStream 数据输入流

用于读取基本数据类型。

```java
try (DataInputStream dis = new DataInputStream(
        new FileInputStream("data.dat"))) {
    int num = dis.readInt();
    double d = dis.readDouble();
    String s = dis.readUTF();
    System.out.println(num + ", " + d + ", " + s);
} catch (IOException e) {
    e.printStackTrace();
}
```

## DataOutputStream 数据输出流

用于写入基本数据类型。

```java
try (DataOutputStream dos = new DataOutputStream(
        new FileOutputStream("data.dat"))) {
    dos.writeInt(100);
    dos.writeDouble(3.14);
    dos.writeUTF("Hello");
} catch (IOException e) {
    e.printStackTrace();
}
```

## ObjectInputStream 对象输入流

用于读取对象（反序列化）。

```java
try (ObjectInputStream ois = new ObjectInputStream(
        new FileInputStream("object.dat"))) {
    User user = (User) ois.readObject();
    System.out.println(user);
} catch (IOException | ClassNotFoundException e) {
    e.printStackTrace();
}
```

## ObjectOutputStream 对象输出流

用于写入对象（序列化）。

```java
// User 类必须实现 Serializable 接口
try (ObjectOutputStream oos = new ObjectOutputStream(
        new FileOutputStream("object.dat"))) {
    User user = new User("张三", 25);
    oos.writeObject(user);
} catch (IOException e) {
    e.printStackTrace();
}
```

## 流的关闭

### 传统方式

```java
FileInputStream fis = null;
try {
    fis = new FileInputStream("test.txt");
    // 读取操作
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (fis != null) {
        try {
            fis.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### try-with-resources（推荐）

```java
try (FileInputStream fis = new FileInputStream("test.txt")) {
    // 读取操作
} catch (IOException e) {
    e.printStackTrace();
}
// 自动关闭流
```

## 小结

- **FileInputStream/FileOutputStream**：文件字节流，最常用
- **ByteArrayInputStream/ByteArrayOutputStream**：内存字节流
- **DataInputStream/DataOutputStream**：处理基本数据类型
- **ObjectInputStream/ObjectOutputStream**：对象序列化/反序列化
- 使用 **try-with-resources** 自动关闭流
- 使用字节数组缓冲区提高读写效率
