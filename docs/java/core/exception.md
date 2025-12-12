---
order : 4
---
# Java核心 - 异常

![](/assets/java/core/exception/2024-03-20-20-54-35.png)

> 上图中的继承关系，只罗列了常用的几个异常和错误，大体结构如此。

## 概述

异常是程序中的一些错误，但并不是所有的错误都是异常，其中有些错误是可以处理的，有些是不可以处理的。异常主要分为：Error（错误） 和 Exception（异常）。

## 层次结构

**Throwable**

Throwable 是 Java 中所有错误与异常的超类，包含了两个子类：Error（错误）和 Exception（异常），通常情况下用于指示发生了异常情况。

**Error**

Error 类及其子类，是程序中无法处理的错误，表示运行应用程序中出现了严重的错误。

此类错误一般表示代码运行时 JVM 出现问题。通常有 Virtual MachineError（虚拟机运行错误）、NoClassDefFoundError（类定义错误）等。比如 OutOfMemoryError：内存不足错误；StackOverflowError：栈溢出错误。此类错误发生时，JVM 将终止线程。

这些错误是不受检异常，非代码性错误。因此，当此类错误发生时，应用程序不应该去处理此类错误。按照 Java 惯例，我们是不应该实现任何新的 Error 子类的！

**Exception**

Exception 及其子类，是程序本身可以捕获并且处理的异常。Exception 主要分为两种类型：RuntimeException（运行时异常） 和 编译时异常（非运行时异常）。

- 运行时异常：

运行时异常都是 RuntimeException 类或其子类，这些异常是不检查异常，程序中可以对其进行捕获处理，也可以不做任何处理，这些异常一般都是因为程序逻辑错误，程序应该从逻辑角度尽可能避免这类异常的发生。

运行时异常的特点是 Java 译器不会检查它，也就是说，当程序中可能出现这类异常，即使没有用 try-catch 语句捕获它，也没有用 throws 子句声明抛出它，也会编译通过。

- 非运行时异常：

非运行时异常是 RuntimeException 以外的异常，类型上都属于 Exception 类及其子类。从程序语法角度讲是必须进行处理的异常，如果不处理，程序就不能编译通过。如 IOException、SQLException 等以及用户自定义的 Exception 异常，一般情况下不自定义检查异常。

## 异常基础

### 异常关键字

- try – 用于监听。将要被监听的代码(可能抛出异常的代码)放在try语句块之内，当try语句块内发生异常时，异常就被抛出。
- catch – 用于捕获异常。catch用来捕获try语句块中发生的异常。
- finally – finally语句块总是会被执行。它主要用于回收在try块里打开的物力资源(如数据库连接、网络连接和磁盘文件)。只有finally块，执行完成之后，才会回来执行try或者catch块中的return或者throw语句，如果finally中使用了return或者throw等终止方法的语句，则就不会跳回执行，直接停止。
- throw – 用于抛出异常。
- throws – 用在方法签名中，用于声明该方法可能抛出的异常。


### 异常声明

在 Java 中大部分的功能语句都是在方法中执行，如果方法内的某条语句可能会出现异常，但是并没有进行捕获处理，那么就需要将异常传递给上层处理，对该方法进行异常的声明。使用 throws 关键字声明，多个异常使用 `,` 隔开。用法如下：

```java
public static void main(String[] args) throws IOException, FileNotFoundException{ 
    // main thread statemenets ....
}
```

### 异常抛出

在当前方法中抛出一个异常可以使用 throw 关键字，通常情况下，当代码执行到某个条件下无法继续正常执行时，可以使用 throw 关键字抛出异常，以告知调用者当前的程序状态。

如下所示，当 num < 0 时，抛出一个 IllegalArgumentException 异常。
```java
public void checkNumber(int num) {
  if (num < 0) {
    throw new IllegalArgumentException("Number must be positive");
  }
}
```

大部分情况下都不需要手动抛出异常，因为Java的大部分方法要么已经处理异常，要么已声明异常。所以一般都是捕获异常或者再往上抛。

### 异常捕获

在发生异常时不仅仅可以进行异常的声明，一些能够被处理的异常可以通过捕获进行处理，从而不交给上层。

常见的异常捕获方式有：

- **try-catch**

在一个 try-catch 代码块中，可以捕获多个异常，并且根据异常的不同类型，做出不同的处理方式。用法如下：

```java
try {
    // statement
} catch (FileNotFoundException e) {
    // handle FileNotFoundException
} catch (IOException e) {
    // handle IOException
}
```

同一个 catch 也可以捕获多种类型异常，用 | 隔开
```java
try {
    // statement
} catch (FileNotFoundException e | UnknownHostException e) {
    // handle FileNotFoundException or UnknownHostException
} catch (IOException e) {
    // handle IOException
}
```

- **try-catch-finally**

有时我们需要在捕获到异常并且处理结束后，关闭某些资源。这时可以使用 try-catch-finally 代码块。

```java
try {                        
    // statement                
} catch(Exception e) {   
    // handle Exception   
} finally {
    // must excute statement
}
```

执行顺序：

- 首先执行 try 代码块内的语句
    - 发生异常时：执行完 catch 内的语句
    - 未发生异常时：跳过 catch 代码块
- 最后执行 finally 内的语句

::: warning 注意
这里要注意的是，try 代码块的执行过程中，一旦发生异常，转而执行 catch 内的代码，此时 try 发生异常之后的代码是不会被执行的。
:::
- **try-finally**

在特定的情况下，我们也可以直接使用 try-finally。try 块中引起异常，异常代码之后的语句不再执行，直接执行finally语句。 try块没有引发异常，则执行完try块就执行finally语句。

try-finally可用在不需要捕获异常的代码，可以保证资源在使用后被关闭。例如IO流中执行完相应操作后，关闭相应资源；使用Lock对象保证线程同步，通过finally可以保证锁会被释放；数据库连接代码时，关闭连接操作等等。

```java
//以Lock加锁为例，演示try-finally
ReentrantLock lock = new ReentrantLock();
try {
    //需要加锁的代码
} finally {
    lock.unlock(); //保证锁一定被释放
}
```
::: tip finally遇见如下情况不会执行

- 在前面的代码中用了System.exit()退出程序。
- finally语句块中发生了异常。
- 程序所在的线程死亡。
- 关闭CPU。
:::
- **try-with-resource**

finally 中的 close 方法也可能抛出 IOException, 从而覆盖了原始异常。JAVA 7 提供了更优雅的方式来实现资源的自动释放，自动释放的资源需要是实现了 AutoCloseable 接口的类。

```java
private  static void tryWithResourceTest(){
    try (Scanner scanner = new Scanner(new FileInputStream("c:/abc"),"UTF-8")){
        // code
    } catch (IOException e){
        // handle exception
    }
}
```

- Scanner
```java
public final class Scanner implements Iterator<String>, Closeable {
  // ...
}
public interface Closeable extends AutoCloseable {
    public void close() throws IOException;
}
```

try 代码块退出时，会自动调用 scanner.close 方法，和把 scanner.close 方法放在 finally 代码块中不同的是，若 scanner.close 抛出异常，则会被抑制，抛出的仍然为原始异常。被抑制的异常会由 addSusppressed 方法添加到原来的异常，如果想要获取被抑制的异常列表，可以调用 getSuppressed 方法来获取。


### 异常自定义

习惯上，定义一个异常类应包含两个构造函数，一个无参构造函数和一个带有详细描述信息的构造函数（Throwable 的 toString 方法会打印这些详细信息，调试时很有用）。

下面是一个简单的自定义异常类：

```java
public class MyException extends Exception {
    public MyException(){ }
    public MyException(String msg){
        super(msg);
    }
    // ...
}
```

::: warning 注意
Java 中需要我们自定义的绝大多数都是 Exception，Error 一般不能自己解决，故不需要自定义。
:::




