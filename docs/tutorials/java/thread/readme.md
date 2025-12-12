---
index : false
icon : uim:process
dir :
    link : true
---

# Java 并发框架

Java 并发编程是 Java 开发中非常重要的一个领域，它允许程序同时执行多个任务，充分利用多核处理器的性能。本系列文章将系统性地介绍 Java 并发编程的核心知识。

## 目录

<Catalog hideHeading='false'/>

## 核心内容

### 1. 线程基础
- 线程的创建方式：Thread、Runnable、Callable
- 线程的生命周期与状态转换
- 线程的基本操作：start、sleep、join、interrupt

### 2. 线程池
- ThreadPoolExecutor 核心参数详解
- 四种常用线程池：Fixed、Cached、Single、Scheduled
- 线程池的工作原理与最佳实践

### 3. 同步机制
- synchronized 关键字原理
- Lock 接口与 ReentrantLock
- ReadWriteLock 读写锁
- volatile 关键字与可见性

### 4. 并发工具类
- CountDownLatch 倒计时器
- CyclicBarrier 循环栅栏
- Semaphore 信号量
- Exchanger 交换器

### 5. 并发集合
- ConcurrentHashMap 并发哈希表
- CopyOnWriteArrayList 写时复制列表
- BlockingQueue 阻塞队列

### 6. 原子类
- AtomicInteger、AtomicLong 基本原子类
- AtomicReference 引用原子类
- CAS 原理与 ABA 问题

### 7. CompletableFuture
- Future 与 Callable
- CompletableFuture 异步编程
- 组合式异步编程

## 说明

本系列文章基于 JDK 8 编写，涵盖了 Java 并发编程的核心知识点。JDK 后续版本虽有更新，但核心原理保持一致，具有较高的参考价值。

## 参考资料

- Java 并发编程实战
- Java 并发编程的艺术
- Pdai：https://pdai.tech/md/java/thread/java-thread-x-overview.html
