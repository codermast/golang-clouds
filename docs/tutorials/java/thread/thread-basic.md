---
order : 1
---

# 线程基础

## 什么是线程

线程（Thread）是操作系统能够进行运算调度的最小单位，它被包含在进程之中，是进程中的实际运作单位。一个进程可以包含多个线程，这些线程共享进程的内存空间和资源。

## 线程与进程的区别

| 特性     | 进程              | 线程                     |
| -------- | ----------------- | ------------------------ |
| 资源分配 | 独立的内存空间    | 共享进程的内存空间       |
| 切换开销 | 较大              | 较小                     |
| 通信方式 | 进程间通信（IPC） | 直接共享内存             |
| 独立性   | 相互独立          | 同一进程内的线程相互依赖 |

## 创建线程的方式

### 1. 继承 Thread 类

```java
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程运行中：" + Thread.currentThread().getName());
    }
    
    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.start(); // 启动线程
    }
}
```

### 2. 实现 Runnable 接口

```java
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程运行中：" + Thread.currentThread().getName());
    }
    
    public static void main(String[] args) {
        Thread thread = new Thread(new MyRunnable());
        thread.start();
        
        // Lambda 写法
        Thread thread2 = new Thread(() -> {
            System.out.println("Lambda 线程运行中");
        });
        thread2.start();
    }
}
```

### 3. 实现 Callable 接口

与 Runnable 不同，Callable 可以返回结果并抛出异常。

```java
import java.util.concurrent.Callable;
import java.util.concurrent.FutureTask;

public class MyCallable implements Callable<String> {
    @Override
    public String call() throws Exception {
        Thread.sleep(1000);
        return "Callable 执行结果";
    }
    
    public static void main(String[] args) throws Exception {
        FutureTask<String> futureTask = new FutureTask<>(new MyCallable());
        Thread thread = new Thread(futureTask);
        thread.start();
        
        // 获取返回结果（会阻塞直到任务完成）
        String result = futureTask.get();
        System.out.println(result);
    }
}
```

### 三种方式的对比

| 方式          | 优点                         | 缺点                      |
| ------------- | ---------------------------- | ------------------------- |
| 继承 Thread   | 简单直观                     | Java 单继承限制，扩展性差 |
| 实现 Runnable | 避免单继承限制，便于资源共享 | 无法获取返回值            |
| 实现 Callable | 可以获取返回值，可以抛出异常 | 相对复杂                  |

## 线程的生命周期

Java 线程有以下几种状态：

```
NEW（新建）
    ↓ start()
RUNNABLE（可运行）
    ↓ 获取锁失败
BLOCKED（阻塞）
    ↓ wait()/join()/park()
WAITING（等待）
    ↓ wait(timeout)/sleep(timeout)
TIMED_WAITING（超时等待）
    ↓ 执行完成
TERMINATED（终止）
```

### 状态详解

| 状态          | 说明                                 |
| ------------- | ------------------------------------ |
| NEW           | 线程被创建但尚未启动                 |
| RUNNABLE      | 线程正在运行或等待 CPU 调度          |
| BLOCKED       | 线程等待获取监视器锁                 |
| WAITING       | 线程无限期等待另一个线程执行特定操作 |
| TIMED_WAITING | 线程等待指定时间                     |
| TERMINATED    | 线程执行完毕                         |

### 状态转换示例

```java
public class ThreadStateDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        
        // NEW 状态
        System.out.println("创建后：" + thread.getState());
        
        thread.start();
        // RUNNABLE 状态
        System.out.println("启动后：" + thread.getState());
        
        Thread.sleep(100);
        // TIMED_WAITING 状态（因为线程内部在 sleep）
        System.out.println("sleep 中：" + thread.getState());
        
        thread.join();
        // TERMINATED 状态
        System.out.println("结束后：" + thread.getState());
    }
}
```

## 线程的基本操作

### start() vs run()

```java
Thread thread = new Thread(() -> {
    System.out.println("当前线程：" + Thread.currentThread().getName());
});

// 正确：启动新线程执行 run 方法
thread.start();

// 错误：仅在当前线程中调用 run 方法，不会创建新线程
thread.run();
```

### sleep() - 线程休眠

```java
// 让当前线程休眠指定时间
Thread.sleep(1000); // 休眠 1 秒

// 更推荐的方式
TimeUnit.SECONDS.sleep(1); // 休眠 1 秒
TimeUnit.MILLISECONDS.sleep(500); // 休眠 500 毫秒
```

### join() - 等待线程结束

```java
Thread thread = new Thread(() -> {
    try {
        Thread.sleep(2000);
        System.out.println("子线程执行完毕");
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
});

thread.start();
thread.join(); // 主线程等待 thread 执行完毕
System.out.println("主线程继续执行");
```

### interrupt() - 中断线程

```java
Thread thread = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        System.out.println("线程运行中...");
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            // sleep 被中断会抛出异常，需要重新设置中断标志
            Thread.currentThread().interrupt();
            break;
        }
    }
    System.out.println("线程被中断，退出");
});

thread.start();
Thread.sleep(3000);
thread.interrupt(); // 中断线程
```

### yield() - 让出 CPU

```java
Thread.yield(); // 提示调度器当前线程愿意让出 CPU，但不保证一定让出
```

### setDaemon() - 守护线程

```java
Thread daemonThread = new Thread(() -> {
    while (true) {
        System.out.println("守护线程运行中...");
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            break;
        }
    }
});

// 设置为守护线程（必须在 start 之前设置）
daemonThread.setDaemon(true);
daemonThread.start();

// 主线程结束后，守护线程也会自动结束
Thread.sleep(3000);
System.out.println("主线程结束");
```

## 线程优先级

Java 线程优先级范围为 1-10，默认为 5。

```java
Thread thread = new Thread(() -> {
    // 线程任务
});

thread.setPriority(Thread.MAX_PRIORITY); // 10
thread.setPriority(Thread.MIN_PRIORITY); // 1
thread.setPriority(Thread.NORM_PRIORITY); // 5（默认）
```

::: warning 注意
线程优先级只是给调度器的建议，不保证一定按优先级执行。
:::

## 常见问题

### 1. 为什么不推荐使用 stop() 方法？

`stop()` 方法已被废弃，因为它会立即终止线程，可能导致：
- 资源无法正确释放
- 数据不一致
- 锁无法释放

推荐使用中断机制来优雅地停止线程。

### 2. sleep() 和 wait() 的区别？

| 方法    | 所属类 | 释放锁 | 唤醒方式                  |
| ------- | ------ | ------ | ------------------------- |
| sleep() | Thread | 不释放 | 时间到自动唤醒            |
| wait()  | Object | 释放   | notify()/notifyAll() 唤醒 |

### 3. 如何优雅地停止线程？

```java
public class GracefulStop {
    private volatile boolean running = true;
    
    public void stop() {
        running = false;
    }
    
    public void run() {
        while (running) {
            // 执行任务
        }
        // 清理资源
    }
}
```

## 小结

- 线程是程序执行的最小单位，Java 提供了三种创建线程的方式
- 线程有六种状态，理解状态转换对于编写正确的并发程序非常重要
- 掌握 start、sleep、join、interrupt 等基本操作是并发编程的基础
- 使用中断机制而非 stop() 来停止线程
