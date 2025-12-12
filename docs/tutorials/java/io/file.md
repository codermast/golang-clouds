---
order : 1
---

# Java IO - File 类

## 概述

Java.io.File 类是文件和目录路径名称的抽象表示，主要用于文件和目录的创建、查找和删除等操作。它是文件和目录路径名的抽象表示，文件和目录可以通过 File 封装成对象，对于 File 而言，其封装的并不是一个真正存在的文件，仅仅是一个路径名，该路径下的文件可以存在也可以不存在。

::: tip 开始之前
在正式学习 File 类的使用之前，非常有必要了解一下相对路径和绝对路径的相关概念，这将贯穿在后面的章节。

- 相对路径：一般是从当前目录开始，可使用 `../` 来表示上层目录，可重复使用，是开发工作中最常使用的。
- 绝对路径：从文件系统的根目录开始，直到所需要的文件时截止，是一个完整的路径。在 Windows 中指从盘符开始的路径。
:::

## 常用API

### 构造方法

|方法名|介绍|
|:---:|:---:|
|`public File(String name)` | 根据文件路径名创建文件对象|
|`public File(String parent,String child)` | 根据父路径名字符串和子路径名字符串创建文件对象|
|`public File(File parent,String child) `|  根据父路径对应文件对象和子路径名字符串创建文件对象|

只要看过 File 类的源码，就不难看出这三个构造方法实际上只是对父级路径和子级路径进行拼接，然后再创建 File 对象。

既然底层只是进行了父、子路径字符串的拼接，那为什么我们不亲自进行拼接呢？这其实是一个很简单，但很容易被忽视的问题。

在 Windows 系统中的文件层级分割符是 `\`，而在 Linux 系统中是 `/`，Java 是一个跨平台语言，如果我们直接将路径名写成绝对，那么在 Windows 上能运行的程序，可能在 Linux 系统内无法正常运行。

故为了跨平台的兼容性，一般都使用提供的构造方法来进行拼接。

那么有些时候必须要使用这个分隔符，该怎么做呢？在 Java 中提供了 `File.separator` 属性来根据当前运行的操作系统，获取文件分隔符。

### 判断

|方法名|介绍|
|:---:|:---:|
|public boolean isDirectory()|判断此路径名表示的 File 对象是否为文件夹|
|public boolean isFile()|判断此路径名表示的 File 对象是否为文件|
|public boolean exists()|判断此路径名表示的 File 是否存在|


### 获取

|方法名|介绍|
|:---:|:---:|
|public long length()|获取文件的大小（字节数）|
|public String getAbsolutePath()|获取文件的绝对路径|
|public String getPath()|获取定义文件时使用的路径|
|public String getName()|获取文件的名称，带后缀|
|public long lastModified()|获取文件的最后修改时间（时间毫秒值）|

### 创建、删除

|方法名|介绍|
|:---:|:---:|
|public boolean createNewFile()|创建一个新的空文件|
|public boolean mkdir()|创建单级文件夹|
|public boolean mkdirs()|创建多级文件夹|
|public boolean delete()|删除文件、空文件夹|

### 获取多个信息

|方法名|介绍|
|:---:|:---:|
|public String[] list()|获取当前该路径下所有文件名|
|public String[] list(FilenameFilter filter)|利用文件名过滤器获取当前该路径下所有文件名|
|public static File[] listRoots()|列出可用的文件系统根|
|public File[] listFiles()|获取当前该路径下所有内容|
|public File[] listFiles(FileFilter filter)|利用`文件`过滤器获取当前该路径下所有内容|
|public File[] listFiles(FilenameFilter filter)|利用`文件名`过滤器获取当前该路径下所有内容|

::: tip FileFilter 和 FilenameFilter
- FileFilter：文件过滤器，是一个接口，用于抽象路径名(File对象)的过滤器
    - 接口里唯一的抽象方法：`boolean accept(File pathname)` 测试 pathname 是否应该包含在当前 File 目录中 若符合则返回true。
    - 参数`(File pathname)`：使用ListFiles方法遍历目录后 得到的每一个文件对象
- FilenameFilter：文件名称过滤器，也是一个接口
    - 接口里的唯一抽象方法：`boolean accept(File dir, String name)` 测试 name 是否应该包含在当前 dir 目录中 若符合则返回true。
    - 参数`(File dir, String name)`：dir 是文件所在的目录，name 是匹配的名称

这两个过滤器都是接口，在使用之前需要进行实现，`accept()`方法返回的是一个布尔值：
- true：将传递过去的File对象保存到File数组中(放行)
- false：不将传递过去的File对象保存到File数组中
:::

## API使用

- 获取

```java
public static void main(String[] args) {
    // 1. 根据文件名创建文件对象
    File file = new File("com/codermast/io/test.txt");

    // 2. 获取文件的字节数
    System.out.println(file.length());

    // 3. 获取文件的绝对路径
    System.out.println(file.getAbsolutePath());

    // 4. 获取文件的名称
    System.out.println(file.getName());

    // 5. 获取文件最后修改时间
    System.out.println(file.lastModified());

    // 6. 获取文件定义时使用的路径
    System.out.println(file.getPath());
}
```

执行结果：

```text
4
/Users/codermast/DevProjects/Demo/com/codermast/io/test.txt
test.txt
1712891669178
com/codermast/io/test.txt
```

- 判断

```java
public static void main(String[] args) {
    // 1. 创建文件对象
    File file = new File("com/codermast/io/test.txt");

    // 2. 判断是否为文件夹
    System.out.println("判断是否为文件夹：" + file.isDirectory());

    // 3. 判断是否为文件
    System.out.println("判断是否为文件：" + file.isFile());

    // 4. 判断文件是否存在
    System.out.println("判断文件是否存在：" + file.exists());
}
```

执行结果

```text
判断是否为文件夹：false
判断是否为文件：true
判断文件是否存在：true
```

- 创建、删除

```java
public static void main(String[] args) throws IOException {
    // 1. 创建一个新的空文件
    File file = new File("com/codermast/io/codermast.txt");
    boolean newFile = file.createNewFile();
    System.out.println("创建新的空文件：" + newFile);

    // 2. 创建单级文件夹
    File dir = new File("com/codermast/io/test");
    boolean mkdir = dir.mkdir();
    System.out.println("创建单级文件夹：" + mkdir);

    // 3. 创建多级文件夹
    File dir2 = new File("com/codermast/io/test/test1");
    boolean mkdirs = dir2.mkdirs();
    System.out.println("创建多级文件夹：" + mkdirs);

    // 4. 删除文件
    System.out.println("删除文件：" + file.delete());

    // 5. 删除空文件夹
    System.out.println("删除空文件夹" + dir2.delete());
}
```

第一次执行结果：

```text
创建新的空文件：true
创建单级文件夹：true
创建多级文件夹：true
删除文件：true
删除空文件夹true
```

第二次执行结果：

```text
创建新的空文件：true
创建单级文件夹：false
创建多级文件夹：true
删除文件：true
删除空文件夹true
```
- 获取多个信息

```java
public static void main(String[] args) {
    System.out.println("===================");
    // 1. 创建文件夹对象
    File file = new File("com/codermast/io/");

    // 2. 获取当前文件夹下所有文件名
    String[] list = file.list();
    for (String s : list) {
        System.out.println(s);
    }
    System.out.println("===================");
    // 3. 利用文件名过滤器获取当前文件夹下所有文件名
    String[] list1 = file.list(new FilenameFilter() {
        @Override
        public boolean accept(File dir, String name) {
            return name.toLowerCase().endsWith(".java");
        }
    });
    // Lambda 写法
    // String[] list1 = file.list((dir, name) -> name.toLowerCase().endsWith(".java"));
    for (String s : list1) {
        System.out.println(s);
    }
    System.out.println("===================");

    // 4. 列出可用的文件系统根：在 windows 上可能有多个根，Linux 和 MacOS 上只有一个根
    File[] files = File.listRoots();
    for (File file1 : files) {
        System.out.println(file1);
    }
    System.out.println("===================");

    // 5. 获取当前该路径下所有内容
    File[] files1 = file.listFiles();
    for (File file2 : files1) {
        System.out.println(file2);
    }
    System.out.println("===================");

    // 6. 利用文件过滤器获取当前该路径下所有内容
    File[] files2 = file.listFiles(new FileFilter() {
        @Override
        public boolean accept(File pathname) {
            return pathname.getName().toLowerCase().endsWith(".java");
        }
    });
    // Lambda 写法
    // File[] files2 = file.listFiles(pathname -> pathname.getName().toLowerCase().endsWith(".java"));
    for (File file1 : files2) {
        System.out.println(file1);
    }
    System.out.println("===================");

    // 7. 利用文件名过滤器获取当前该路径下所有内容
    File[] files3 = file.listFiles(new FileFilter() {
        @Override
        public boolean accept(File pathname) {
            return pathname.getName().toLowerCase().endsWith(".txt");
        }
    });
    // Lambda 写法
    // File[] files3 = file.listFiles(pathname -> pathname.getName().toLowerCase().endsWith(".java"));

    for (File file1 : files3) {
        System.out.println(file1.getName());
    }
    System.out.println("===================");
}
```
执行结果：
```text
===================
test
OsPathSeparatorUtils.java
FileJudgeDemo.java
FileCreateDeleteDemo.java
FileGetDemo.java
FileMultipleDemo.java
test.txt
===================
OsPathSeparatorUtils.java
FileJudgeDemo.java
FileCreateDeleteDemo.java
FileGetDemo.java
FileMultipleDemo.java
===================
/
===================
com/codermast/io/test
com/codermast/io/OsPathSeparatorUtils.java
com/codermast/io/FileJudgeDemo.java
com/codermast/io/FileCreateDeleteDemo.java
com/codermast/io/FileGetDemo.java
com/codermast/io/FileMultipleDemo.java
com/codermast/io/test.txt
===================
com/codermast/io/OsPathSeparatorUtils.java
com/codermast/io/FileJudgeDemo.java
com/codermast/io/FileCreateDeleteDemo.java
com/codermast/io/FileGetDemo.java
com/codermast/io/FileMultipleDemo.java
===================
test.txt
===================
```