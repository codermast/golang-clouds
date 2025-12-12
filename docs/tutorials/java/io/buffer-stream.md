---
order : 5
---

# Java IO - 缓冲流

缓冲流是对基本流的包装，通过内置缓冲区减少系统调用次数，大幅提升读写效率。

## 为什么需要缓冲流

普通流每次读写都会进行系统调用，效率较低：

```
普通流：程序 ←→ 操作系统 ←→ 磁盘（频繁交互）
缓冲流：程序 ←→ 缓冲区 ←→ 操作系统 ←→ 磁盘（批量交互）
```

缓冲流内部维护一个缓冲区（默认 8KB），减少与操作系统的交互次数。

## 缓冲流分类

| 类型 | 字节缓冲流           | 字符缓冲流     |
| ---- | -------------------- | -------------- |
| 输入 | BufferedInputStream  | BufferedReader |
| 输出 | BufferedOutputStream | BufferedWriter |

## BufferedInputStream 字节缓冲输入流

### 构造方法

```java
// 使用默认缓冲区大小（8192 字节）
BufferedInputStream bis = new BufferedInputStream(new FileInputStream("test.txt"));

// 指定缓冲区大小
BufferedInputStream bis = new BufferedInputStream(new FileInputStream("test.txt"), 16384);
```

### 使用示例

```java
import java.io.*;

public class BufferedInputStreamDemo {
    public static void main(String[] args) {
        try (BufferedInputStream bis = new BufferedInputStream(
                new FileInputStream("test.txt"))) {
            
            byte[] buffer = new byte[1024];
            int len;
            while ((len = bis.read(buffer)) != -1) {
                System.out.print(new String(buffer, 0, len));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## BufferedOutputStream 字节缓冲输出流

### 构造方法

```java
BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream("test.txt"));
BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream("test.txt"), 16384);
```

### 使用示例

```java
try (BufferedOutputStream bos = new BufferedOutputStream(
        new FileOutputStream("output.txt"))) {
    
    String content = "Hello, Buffered Stream!";
    bos.write(content.getBytes());
    // 不需要手动 flush，close 时会自动 flush
} catch (IOException e) {
    e.printStackTrace();
}
```

## BufferedReader 字符缓冲输入流

提供 `readLine()` 方法，可以逐行读取。

### 构造方法

```java
BufferedReader br = new BufferedReader(new FileReader("test.txt"));
BufferedReader br = new BufferedReader(new FileReader("test.txt"), 16384);
```

### 逐行读取

```java
import java.io.*;

public class BufferedReaderDemo {
    public static void main(String[] args) {
        try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
            String line;
            int lineNumber = 0;
            while ((line = br.readLine()) != null) {
                lineNumber++;
                System.out.println(lineNumber + ": " + line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 读取所有行（JDK 8+）

```java
try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
    // 使用 Stream 读取所有行
    br.lines().forEach(System.out::println);
} catch (IOException e) {
    e.printStackTrace();
}
```

### 收集为 List

```java
import java.util.List;
import java.util.stream.Collectors;

try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
    List<String> lines = br.lines().collect(Collectors.toList());
    lines.forEach(System.out::println);
} catch (IOException e) {
    e.printStackTrace();
}
```

## BufferedWriter 字符缓冲输出流

提供 `newLine()` 方法，写入系统换行符。

### 构造方法

```java
BufferedWriter bw = new BufferedWriter(new FileWriter("test.txt"));
BufferedWriter bw = new BufferedWriter(new FileWriter("test.txt"), 16384);
```

### 使用示例

```java
import java.io.*;

public class BufferedWriterDemo {
    public static void main(String[] args) {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter("output.txt"))) {
            bw.write("第一行内容");
            bw.newLine();  // 写入换行符
            bw.write("第二行内容");
            bw.newLine();
            bw.write("第三行内容");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 性能对比

### 测试代码

```java
import java.io.*;

public class PerformanceTest {
    public static void main(String[] args) throws IOException {
        String file = "largefile.txt";
        
        // 生成测试文件
        generateTestFile(file, 10_000_000);
        
        // 普通流读取
        long start1 = System.currentTimeMillis();
        readWithoutBuffer(file);
        long time1 = System.currentTimeMillis() - start1;
        System.out.println("普通流耗时：" + time1 + "ms");
        
        // 缓冲流读取
        long start2 = System.currentTimeMillis();
        readWithBuffer(file);
        long time2 = System.currentTimeMillis() - start2;
        System.out.println("缓冲流耗时：" + time2 + "ms");
    }
    
    static void readWithoutBuffer(String file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] buffer = new byte[1024];
            while (fis.read(buffer) != -1) {
                // 读取
            }
        }
    }
    
    static void readWithBuffer(String file) throws IOException {
        try (BufferedInputStream bis = new BufferedInputStream(
                new FileInputStream(file))) {
            byte[] buffer = new byte[1024];
            while (bis.read(buffer) != -1) {
                // 读取
            }
        }
    }
    
    static void generateTestFile(String file, int lines) throws IOException {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(file))) {
            for (int i = 0; i < lines; i++) {
                bw.write("This is line " + i);
                bw.newLine();
            }
        }
    }
}
```

### 性能对比结果

| 操作           | 普通流 | 缓冲流 | 提升 |
| -------------- | ------ | ------ | ---- |
| 读取 10MB 文件 | ~500ms | ~50ms  | 10x  |
| 写入 10MB 文件 | ~600ms | ~80ms  | 7x   |

## 文件复制（缓冲流版）

### 字节缓冲流复制

```java
public class BufferedFileCopy {
    public static void main(String[] args) {
        String source = "source.mp4";
        String target = "target.mp4";
        
        try (BufferedInputStream bis = new BufferedInputStream(
                new FileInputStream(source));
             BufferedOutputStream bos = new BufferedOutputStream(
                new FileOutputStream(target))) {
            
            byte[] buffer = new byte[8192];
            int len;
            while ((len = bis.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            System.out.println("复制完成");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 字符缓冲流复制

```java
public class BufferedTextCopy {
    public static void main(String[] args) {
        try (BufferedReader br = new BufferedReader(new FileReader("source.txt"));
             BufferedWriter bw = new BufferedWriter(new FileWriter("target.txt"))) {
            
            String line;
            while ((line = br.readLine()) != null) {
                bw.write(line);
                bw.newLine();
            }
            System.out.println("复制完成");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 实战：文件排序

读取文件内容，排序后写入新文件：

```java
import java.io.*;
import java.util.*;

public class FileSorter {
    public static void main(String[] args) {
        try (BufferedReader br = new BufferedReader(new FileReader("numbers.txt"));
             BufferedWriter bw = new BufferedWriter(new FileWriter("sorted.txt"))) {
            
            // 读取所有行
            List<Integer> numbers = new ArrayList<>();
            String line;
            while ((line = br.readLine()) != null) {
                numbers.add(Integer.parseInt(line.trim()));
            }
            
            // 排序
            Collections.sort(numbers);
            
            // 写入结果
            for (Integer num : numbers) {
                bw.write(String.valueOf(num));
                bw.newLine();
            }
            System.out.println("排序完成");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 实战：统计词频

```java
import java.io.*;
import java.util.*;

public class WordCounter {
    public static void main(String[] args) {
        Map<String, Integer> wordCount = new HashMap<>();
        
        try (BufferedReader br = new BufferedReader(new FileReader("article.txt"))) {
            String line;
            while ((line = br.readLine()) != null) {
                // 分割单词
                String[] words = line.toLowerCase().split("\\W+");
                for (String word : words) {
                    if (!word.isEmpty()) {
                        wordCount.merge(word, 1, Integer::sum);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        // 输出结果
        wordCount.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(10)
            .forEach(e -> System.out.println(e.getKey() + ": " + e.getValue()));
    }
}
```

## 缓冲区大小选择

| 场景                | 建议缓冲区大小 |
| ------------------- | -------------- |
| 小文件（< 1MB）     | 默认 8KB       |
| 中等文件（1-100MB） | 16KB - 64KB    |
| 大文件（> 100MB）   | 64KB - 256KB   |
| SSD 磁盘            | 较小缓冲区即可 |
| HDD 磁盘            | 较大缓冲区更优 |

## 小结

- **缓冲流**通过内置缓冲区减少系统调用，大幅提升性能
- **BufferedReader** 提供 `readLine()` 逐行读取
- **BufferedWriter** 提供 `newLine()` 写入换行符
- 处理大文件时，缓冲流性能提升可达 **10 倍以上**
- 默认缓冲区 8KB，可根据场景调整
- 始终使用 try-with-resources 确保流被正确关闭
