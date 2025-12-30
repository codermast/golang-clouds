---
order : 3
---

# 同步机制

## 线程安全问题

多线程环境下，多个线程同时访问共享资源可能导致数据不一致。

```java
public class UnsafeCounter {
    private int count = 0;
    
    public void increment() {
        count++;  // 非原子操作：读取 → 加1 → 写入
    }
    
    public static void main(String[] args) throws InterruptedException {
        UnsafeCounter counter = new UnsafeCounter();
        
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 10000; i++) counter.increment();
        });
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 10000; i++) counter.increment();
        });
        
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        
        // 结果可能小于 20000
        System.out.println("count = " + counter.count);
    }
}
```

## synchronized 关键字

`synchronized` 是 Java 内置的同步机制，可以保证同一时刻只有一个线程执行同步代码。

### 三种使用方式

#### 1. 同步实例方法

```java
public class Counter {
    private int count = 0;
    
    // 锁对象是 this（当前实例）
    public synchronized void increment() {
        count++;
    }
    
    public synchronized int getCount() {
        return count;
    }
}
```

#### 2. 同步静态方法

```java
public class Counter {
    private static int count = 0;
    
    // 锁对象是 Counter.class
    public static synchronized void increment() {
        count++;
    }
}
```

#### 3. 同步代码块

```java
public class Counter {
    private int count = 0;
    private final Object lock = new Object();
    
    public void increment() {
        synchronized (lock) {  // 指定锁对象
            count++;
        }
    }
    
    public void increment2() {
        synchronized (this) {  // 等同于同步实例方法
            count++;
        }
    }
}
```

### synchronized 原理

`synchronized` 基于 **Monitor（监视器锁）** 实现：

1. 每个对象都有一个 Monitor
2. 线程执行 `monitorenter` 指令获取锁
3. 执行完毕或异常时执行 `monitorexit` 指令释放锁
4. 同一时刻只有一个线程能持有 Monitor

### 锁升级

JDK 6 之后，synchronized 进行了大量优化，引入了**锁升级**机制：

```
无锁 → 偏向锁 → 轻量级锁 → 重量级锁
```

| 锁状态   | 适用场景       | 特点                    |
| -------- | -------------- | ----------------------- |
| 偏向锁   | 单线程访问     | 无需 CAS，仅记录线程 ID |
| 轻量级锁 | 多线程交替执行 | CAS 自旋                |
| 重量级锁 | 多线程竞争激烈 | 阻塞等待                |

## Lock 接口

`Lock` 是 JDK 5 引入的显式锁，比 synchronized 更灵活。

### Lock vs synchronized

| 特性     | synchronized | Lock                     |
| -------- | ------------ | ------------------------ |
| 获取锁   | 隐式         | 显式 lock()              |
| 释放锁   | 自动         | 手动 unlock()            |
| 可中断   | 不支持       | 支持 lockInterruptibly() |
| 超时获取 | 不支持       | 支持 tryLock(timeout)    |
| 公平锁   | 不支持       | 支持                     |
| 条件变量 | 单一         | 多个 Condition           |

### ReentrantLock 使用

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class Counter {
    private int count = 0;
    private final Lock lock = new ReentrantLock();
    
    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();  // 必须在 finally 中释放锁
        }
    }
}
```

### 可重入性

可重入锁允许同一线程多次获取同一把锁。

```java
public class ReentrantDemo {
    private final ReentrantLock lock = new ReentrantLock();
    
    public void outer() {
        lock.lock();
        try {
            System.out.println("outer");
            inner();  // 同一线程可以再次获取锁
        } finally {
            lock.unlock();
        }
    }
    
    public void inner() {
        lock.lock();
        try {
            System.out.println("inner");
        } finally {
            lock.unlock();
        }
    }
}
```

### 公平锁与非公平锁

```java
// 公平锁：按照请求顺序获取锁
Lock fairLock = new ReentrantLock(true);

// 非公平锁（默认）：允许插队，性能更好
Lock unfairLock = new ReentrantLock(false);
```

### tryLock - 尝试获取锁

```java
Lock lock = new ReentrantLock();

// 立即尝试
if (lock.tryLock()) {
    try {
        // 获取到锁
    } finally {
        lock.unlock();
    }
} else {
    // 获取失败
}

// 超时尝试
if (lock.tryLock(5, TimeUnit.SECONDS)) {
    try {
        // 获取到锁
    } finally {
        lock.unlock();
    }
} else {
    // 超时未获取到锁
}
```

### lockInterruptibly - 可中断获取锁

```java
Lock lock = new ReentrantLock();

Thread thread = new Thread(() -> {
    try {
        lock.lockInterruptibly();  // 可被中断
        try {
            // 业务逻辑
        } finally {
            lock.unlock();
        }
    } catch (InterruptedException e) {
        System.out.println("获取锁时被中断");
    }
});

thread.start();
Thread.sleep(1000);
thread.interrupt();  // 中断线程
```

## ReadWriteLock 读写锁

读写锁允许多个线程同时读，但写操作互斥。

### 使用场景

- 读多写少的场景
- 读操作不修改数据

### ReentrantReadWriteLock

```java
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class CachedData {
    private Object data;
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    
    // 读操作：多个线程可以同时读
    public Object read() {
        readLock.lock();
        try {
            return data;
        } finally {
            readLock.unlock();
        }
    }
    
    // 写操作：独占锁
    public void write(Object newData) {
        writeLock.lock();
        try {
            data = newData;
        } finally {
            writeLock.unlock();
        }
    }
}
```

### 锁降级

```java
public void processData() {
    readLock.lock();
    if (!dataValid) {
        // 释放读锁
        readLock.unlock();
        // 获取写锁
        writeLock.lock();
        try {
            if (!dataValid) {
                data = loadData();
                dataValid = true;
            }
            // 锁降级：获取读锁
            readLock.lock();
        } finally {
            // 释放写锁
            writeLock.unlock();
        }
    }
    
    try {
        // 使用数据
        use(data);
    } finally {
        readLock.unlock();
    }
}
```

## Condition 条件变量

`Condition` 提供类似于 Object.wait/notify 的功能，但更灵活。

### 基本使用

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class BoundedBuffer<T> {
    private final Object[] items = new Object[100];
    private int putIndex, takeIndex, count;
    
    private final Lock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();
    
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length) {
                notFull.await();  // 等待不满
            }
            items[putIndex] = item;
            if (++putIndex == items.length) putIndex = 0;
            count++;
            notEmpty.signal();  // 通知不空
        } finally {
            lock.unlock();
        }
    }
    
    @SuppressWarnings("unchecked")
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) {
                notEmpty.await();  // 等待不空
            }
            Object item = items[takeIndex];
            if (++takeIndex == items.length) takeIndex = 0;
            count--;
            notFull.signal();  // 通知不满
            return (T) item;
        } finally {
            lock.unlock();
        }
    }
}
```

## volatile 关键字

`volatile` 保证变量的**可见性**和**禁止指令重排序**。

### 可见性

```java
public class VolatileDemo {
    private volatile boolean running = true;
    
    public void stop() {
        running = false;  // 修改立即对其他线程可见
    }
    
    public void run() {
        while (running) {
            // 能正确读取到 running 的最新值
        }
    }
}
```

### volatile vs synchronized

| 特性     | volatile     | synchronized |
| -------- | ------------ | ------------ |
| 可见性   | ✓            | ✓            |
| 原子性   | ✗            | ✓            |
| 阻塞     | ✗            | ✓            |
| 适用场景 | 单一变量读写 | 复合操作     |

### 适用场景

```java
// 1. 状态标志
private volatile boolean shutdown = false;

// 2. 双重检查锁定（DCL）
public class Singleton {
    private static volatile Singleton instance;
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

## ThreadLocal

`ThreadLocal` 为每个线程提供独立的变量副本。

### 基本使用

```java
public class ThreadLocalDemo {
    private static final ThreadLocal<String> userContext = new ThreadLocal<>();
    
    public static void setUser(String userId) {
        userContext.set(userId);
    }
    
    public static String getUser() {
        return userContext.get();
    }
    
    public static void clear() {
        userContext.remove();  // 必须清理，避免内存泄漏
    }
}
```

### 带初始值的 ThreadLocal

```java
// 方式一：重写 initialValue
ThreadLocal<SimpleDateFormat> dateFormat = new ThreadLocal<SimpleDateFormat>() {
    @Override
    protected SimpleDateFormat initialValue() {
        return new SimpleDateFormat("yyyy-MM-dd");
    }
};

// 方式二：withInitial（推荐）
ThreadLocal<SimpleDateFormat> dateFormat2 = 
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
```

### 内存泄漏问题

::: warning 注意
ThreadLocal 使用完毕后必须调用 `remove()` 方法清理，否则可能导致内存泄漏。
:::

```java
try {
    ThreadLocal.set(value);
    // 业务逻辑
} finally {
    ThreadLocal.remove();  // 必须清理
}
```

## 死锁

### 死锁产生条件

1. **互斥**：资源只能被一个线程占用
2. **持有并等待**：线程持有资源并等待其他资源
3. **不可剥夺**：资源不能被强制剥夺
4. **循环等待**：线程之间形成等待环路

### 死锁示例

```java
public class DeadLockDemo {
    private static final Object lockA = new Object();
    private static final Object lockB = new Object();
    
    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (lockA) {
                System.out.println("Thread1 获取 lockA");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (lockB) {
                    System.out.println("Thread1 获取 lockB");
                }
            }
        }).start();
        
        new Thread(() -> {
            synchronized (lockB) {
                System.out.println("Thread2 获取 lockB");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (lockA) {
                    System.out.println("Thread2 获取 lockA");
                }
            }
        }).start();
    }
}
```

### 避免死锁

1. **按固定顺序获取锁**
2. **使用 tryLock 超时**
3. **减少锁的粒度**
4. **使用 Lock 的 lockInterruptibly**

## 小结

- `synchronized` 是内置锁，简单易用，JDK 6 后性能大幅提升
- `Lock` 提供更多高级功能：可中断、超时、公平锁
- `ReadWriteLock` 适用于读多写少场景
- `volatile` 保证可见性，但不保证原子性
- `ThreadLocal` 提供线程隔离，使用后必须 remove
- 合理使用同步机制，避免死锁
