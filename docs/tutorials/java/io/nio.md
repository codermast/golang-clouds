---
order : 6
---

# Java IO - NIO

NIO（New IO）是 JDK 1.4 引入的新 IO 模型，提供了更高效的 IO 操作方式，支持非阻塞 IO 和多路复用。

## BIO vs NIO

| 特性     | BIO                | NIO                               |
| -------- | ------------------ | --------------------------------- |
| 全称     | Blocking IO        | Non-blocking IO                   |
| 模型     | 流（Stream）       | 通道（Channel）+ 缓冲区（Buffer） |
| 阻塞     | 阻塞               | 非阻塞                            |
| 多路复用 | 不支持             | 支持（Selector）                  |
| 适用场景 | 连接数少，数据量大 | 连接数多，数据量小                |

## NIO 核心组件

```
┌─────────────────────────────────────┐
│              Selector               │  多路复用器
├─────────────────────────────────────┤
│  Channel   Channel   Channel   ...  │  通道
├─────────────────────────────────────┤
│              Buffer                 │  缓冲区
└─────────────────────────────────────┘
```

### 三大核心

1. **Buffer（缓冲区）**：数据的容器
2. **Channel（通道）**：数据的传输通道
3. **Selector（选择器）**：多路复用器

## Buffer 缓冲区

Buffer 是一个数据容器，所有数据都通过 Buffer 传输。

### Buffer 类型

| 类型         | 说明                 |
| ------------ | -------------------- |
| ByteBuffer   | 字节缓冲区（最常用） |
| CharBuffer   | 字符缓冲区           |
| ShortBuffer  | 短整型缓冲区         |
| IntBuffer    | 整型缓冲区           |
| LongBuffer   | 长整型缓冲区         |
| FloatBuffer  | 浮点型缓冲区         |
| DoubleBuffer | 双精度浮点型缓冲区   |

### Buffer 核心属性

```java
// 容量：缓冲区最大容量，不可改变
private int capacity;

// 限制：可读/写的最大位置
private int limit;

// 位置：下一个读/写的位置
private int position;

// 标记：用于 reset() 恢复位置
private int mark = -1;

// 关系：mark <= position <= limit <= capacity
```

### 创建 Buffer

```java
// 分配堆内存
ByteBuffer buffer = ByteBuffer.allocate(1024);

// 分配直接内存（性能更好，但分配较慢）
ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);

// 包装现有数组
byte[] bytes = new byte[1024];
ByteBuffer wrapBuffer = ByteBuffer.wrap(bytes);
```

### Buffer 基本操作

```java
import java.nio.ByteBuffer;

public class BufferDemo {
    public static void main(String[] args) {
        // 1. 创建缓冲区
        ByteBuffer buffer = ByteBuffer.allocate(10);
        System.out.println("初始状态：" + bufferInfo(buffer));
        
        // 2. 写入数据
        buffer.put((byte) 'H');
        buffer.put((byte) 'e');
        buffer.put((byte) 'l');
        buffer.put((byte) 'l');
        buffer.put((byte) 'o');
        System.out.println("写入后：" + bufferInfo(buffer));
        
        // 3. 切换为读模式
        buffer.flip();
        System.out.println("flip后：" + bufferInfo(buffer));
        
        // 4. 读取数据
        while (buffer.hasRemaining()) {
            System.out.print((char) buffer.get());
        }
        System.out.println();
        System.out.println("读取后：" + bufferInfo(buffer));
        
        // 5. 清空缓冲区
        buffer.clear();
        System.out.println("clear后：" + bufferInfo(buffer));
    }
    
    static String bufferInfo(ByteBuffer buffer) {
        return String.format("position=%d, limit=%d, capacity=%d",
            buffer.position(), buffer.limit(), buffer.capacity());
    }
}
```

### 常用方法

| 方法        | 说明                       |
| ----------- | -------------------------- |
| `put()`     | 写入数据                   |
| `get()`     | 读取数据                   |
| `flip()`    | 切换为读模式               |
| `clear()`   | 清空缓冲区（位置归零）     |
| `compact()` | 压缩缓冲区（保留未读数据） |
| `rewind()`  | 重读（position 归零）      |
| `mark()`    | 标记当前位置               |
| `reset()`   | 恢复到标记位置             |

## Channel 通道

Channel 是双向的数据传输通道。

### 常用 Channel

| Channel             | 说明           |
| ------------------- | -------------- |
| FileChannel         | 文件通道       |
| SocketChannel       | TCP 客户端通道 |
| ServerSocketChannel | TCP 服务端通道 |
| DatagramChannel     | UDP 通道       |

### FileChannel 文件通道

```java
import java.io.*;
import java.nio.*;
import java.nio.channels.*;

public class FileChannelDemo {
    public static void main(String[] args) throws IOException {
        // 读取文件
        try (FileInputStream fis = new FileInputStream("test.txt");
             FileChannel channel = fis.getChannel()) {
            
            ByteBuffer buffer = ByteBuffer.allocate(1024);
            int bytesRead = channel.read(buffer);
            
            while (bytesRead != -1) {
                buffer.flip();  // 切换为读模式
                while (buffer.hasRemaining()) {
                    System.out.print((char) buffer.get());
                }
                buffer.clear();  // 清空，准备下次读取
                bytesRead = channel.read(buffer);
            }
        }
    }
}
```

### 写入文件

```java
try (FileOutputStream fos = new FileOutputStream("output.txt");
     FileChannel channel = fos.getChannel()) {
    
    String content = "Hello NIO!";
    ByteBuffer buffer = ByteBuffer.wrap(content.getBytes());
    channel.write(buffer);
}
```

### 文件复制

```java
public class NIOFileCopy {
    public static void main(String[] args) throws IOException {
        try (FileInputStream fis = new FileInputStream("source.txt");
             FileOutputStream fos = new FileOutputStream("target.txt");
             FileChannel inChannel = fis.getChannel();
             FileChannel outChannel = fos.getChannel()) {
            
            ByteBuffer buffer = ByteBuffer.allocate(1024);
            while (inChannel.read(buffer) != -1) {
                buffer.flip();
                outChannel.write(buffer);
                buffer.clear();
            }
        }
    }
}
```

### transferTo / transferFrom

更高效的文件复制方式：

```java
try (FileChannel inChannel = new FileInputStream("source.txt").getChannel();
     FileChannel outChannel = new FileOutputStream("target.txt").getChannel()) {
    
    // 直接传输，零拷贝
    inChannel.transferTo(0, inChannel.size(), outChannel);
    // 或者
    // outChannel.transferFrom(inChannel, 0, inChannel.size());
}
```

## 内存映射文件

将文件直接映射到内存，适合处理大文件。

```java
import java.io.*;
import java.nio.*;
import java.nio.channels.*;

public class MappedFileDemo {
    public static void main(String[] args) throws IOException {
        try (RandomAccessFile file = new RandomAccessFile("large.txt", "rw");
             FileChannel channel = file.getChannel()) {
            
            // 将文件映射到内存
            MappedByteBuffer buffer = channel.map(
                FileChannel.MapMode.READ_WRITE, 
                0, 
                channel.size()
            );
            
            // 直接操作内存
            while (buffer.hasRemaining()) {
                System.out.print((char) buffer.get());
            }
        }
    }
}
```

## Selector 选择器

Selector 实现 IO 多路复用，一个线程可以管理多个 Channel。

### Selector 工作原理

```
           ┌─── SocketChannel 1
           │
Selector ──├─── SocketChannel 2
           │
           └─── SocketChannel 3
```

### 事件类型

| 事件     | 常量                    | 说明           |
| -------- | ----------------------- | -------------- |
| 连接就绪 | SelectionKey.OP_CONNECT | 客户端连接成功 |
| 接收就绪 | SelectionKey.OP_ACCEPT  | 服务端接收连接 |
| 读就绪   | SelectionKey.OP_READ    | 有数据可读     |
| 写就绪   | SelectionKey.OP_WRITE   | 可以写入数据   |

### NIO 服务端示例

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.util.Iterator;

public class NIOServer {
    public static void main(String[] args) throws IOException {
        // 1. 创建 Selector
        Selector selector = Selector.open();
        
        // 2. 创建 ServerSocketChannel
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(8080));
        serverChannel.configureBlocking(false);  // 非阻塞
        
        // 3. 注册到 Selector
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);
        System.out.println("服务器启动，监听端口 8080");
        
        // 4. 循环处理事件
        while (true) {
            selector.select();  // 阻塞等待事件
            
            Iterator<SelectionKey> iterator = selector.selectedKeys().iterator();
            while (iterator.hasNext()) {
                SelectionKey key = iterator.next();
                iterator.remove();
                
                if (key.isAcceptable()) {
                    handleAccept(key, selector);
                } else if (key.isReadable()) {
                    handleRead(key);
                }
            }
        }
    }
    
    static void handleAccept(SelectionKey key, Selector selector) throws IOException {
        ServerSocketChannel serverChannel = (ServerSocketChannel) key.channel();
        SocketChannel clientChannel = serverChannel.accept();
        clientChannel.configureBlocking(false);
        clientChannel.register(selector, SelectionKey.OP_READ);
        System.out.println("客户端连接：" + clientChannel.getRemoteAddress());
    }
    
    static void handleRead(SelectionKey key) throws IOException {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        
        int bytesRead = channel.read(buffer);
        if (bytesRead > 0) {
            buffer.flip();
            byte[] bytes = new byte[buffer.remaining()];
            buffer.get(bytes);
            String message = new String(bytes);
            System.out.println("收到消息：" + message);
            
            // 回复消息
            ByteBuffer response = ByteBuffer.wrap(("服务器收到：" + message).getBytes());
            channel.write(response);
        } else if (bytesRead == -1) {
            System.out.println("客户端断开：" + channel.getRemoteAddress());
            channel.close();
        }
    }
}
```

### NIO 客户端示例

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;

public class NIOClient {
    public static void main(String[] args) throws IOException {
        SocketChannel channel = SocketChannel.open();
        channel.connect(new InetSocketAddress("localhost", 8080));
        
        // 发送消息
        String message = "Hello NIO Server!";
        ByteBuffer buffer = ByteBuffer.wrap(message.getBytes());
        channel.write(buffer);
        
        // 接收响应
        ByteBuffer response = ByteBuffer.allocate(1024);
        channel.read(response);
        response.flip();
        byte[] bytes = new byte[response.remaining()];
        response.get(bytes);
        System.out.println("服务器响应：" + new String(bytes));
        
        channel.close();
    }
}
```

## Files 工具类（NIO.2）

JDK 7 引入了 NIO.2，提供了更便捷的文件操作。

### 常用方法

```java
import java.nio.file.*;
import java.util.List;

public class FilesDemo {
    public static void main(String[] args) throws Exception {
        Path path = Paths.get("test.txt");
        
        // 读取所有行
        List<String> lines = Files.readAllLines(path);
        
        // 读取所有字节
        byte[] bytes = Files.readAllBytes(path);
        
        // 写入内容
        Files.write(path, "Hello".getBytes());
        Files.write(path, lines);
        
        // 复制文件
        Files.copy(path, Paths.get("copy.txt"), StandardCopyOption.REPLACE_EXISTING);
        
        // 移动文件
        Files.move(path, Paths.get("new.txt"));
        
        // 删除文件
        Files.delete(path);
        Files.deleteIfExists(path);
        
        // 创建目录
        Files.createDirectory(Paths.get("newdir"));
        Files.createDirectories(Paths.get("a/b/c"));
        
        // 判断
        boolean exists = Files.exists(path);
        boolean isDir = Files.isDirectory(path);
        boolean isFile = Files.isRegularFile(path);
    }
}
```

### 遍历目录

```java
// 遍历目录
try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get("."))) {
    for (Path entry : stream) {
        System.out.println(entry.getFileName());
    }
}

// 递归遍历
Files.walk(Paths.get("."))
    .filter(Files::isRegularFile)
    .forEach(System.out::println);

// 查找文件
Files.find(Paths.get("."), 10,
    (path, attr) -> path.toString().endsWith(".java"))
    .forEach(System.out::println);
```

## 小结

- **Buffer**：数据容器，核心属性 position、limit、capacity
- **Channel**：双向数据通道，通过 Buffer 传输数据
- **Selector**：多路复用器，一个线程管理多个 Channel
- **FileChannel**：文件操作，支持内存映射
- **NIO.2**：Files 工具类提供便捷的文件操作
- NIO 适合高并发、连接数多的场景
