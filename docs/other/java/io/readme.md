---
index : false
icon : fluent:stream-20-filled
dir :
    link : true
---

# Java IO 框架

Java IO（Input/Output）框架是 Java 中用于处理输入输出操作的核心库，提供了丰富的类和接口来处理文件、网络、内存等数据源的读写操作。

## 目录

<Catalog hideHeading='false'/>

## 核心内容

### 1. File 类
- File 类基础操作
- 文件与目录的创建、删除、遍历
- 文件过滤器的使用

### 2. IO 流体系
- 字节流与字符流的区别
- 输入流与输出流的分类
- IO 流继承体系

### 3. 字节流
- InputStream 与 OutputStream
- FileInputStream 与 FileOutputStream
- 字节数组流、数据流

### 4. 字符流
- Reader 与 Writer
- FileReader 与 FileWriter
- 字符编码与乱码问题

### 5. 缓冲流
- BufferedInputStream 与 BufferedOutputStream
- BufferedReader 与 BufferedWriter
- 缓冲流的性能优势

### 6. NIO（New IO）
- Channel 与 Buffer
- Selector 多路复用
- 文件通道与内存映射

## IO 流体系图

```
                    ┌─── FileInputStream
                    ├─── BufferedInputStream
    InputStream ────├─── DataInputStream
                    ├─── ObjectInputStream
                    └─── ByteArrayInputStream

                    ┌─── FileOutputStream
                    ├─── BufferedOutputStream
    OutputStream ───├─── DataOutputStream
                    ├─── ObjectOutputStream
                    └─── ByteArrayOutputStream

                    ┌─── FileReader
                    ├─── BufferedReader
    Reader ─────────├─── InputStreamReader
                    └─── StringReader

                    ┌─── FileWriter
                    ├─── BufferedWriter
    Writer ─────────├─── OutputStreamWriter
                    ├─── PrintWriter
                    └─── StringWriter
```

## 说明

本系列文章基于 JDK 8 编写，涵盖了 Java IO 编程的核心知识点。从基础的 File 操作到高级的 NIO 编程，帮助你全面掌握 Java IO 体系。

## 参考资料

- Java IO 官方文档
- https://blog.csdn.net/xiaojin21cen/article/details/104712206
- https://zhuanlan.zhihu.com/p/475320277
