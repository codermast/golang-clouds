---
order : 4
---

# 并发工具类

Java 并发包提供了多种实用的并发工具类，用于控制线程之间的协调与同步。

## CountDownLatch 倒计时器

`CountDownLatch` 允许一个或多个线程等待其他线程完成操作。

### 核心方法

- `countDown()`：计数器减 1
- `await()`：等待计数器变为 0
- `await(timeout, unit)`：带超时的等待

### 使用场景

1. 主线程等待多个子线程完成
2. 多个线程等待某个条件就绪后同时开始

### 示例：等待多个任务完成

```java
import java.util.concurrent.CountDownLatch;

public class CountDownLatchDemo {
    public static void main(String[] args) throws InterruptedException {
        int taskCount = 5;
        CountDownLatch latch = new CountDownLatch(taskCount);
        
        for (int i = 0; i < taskCount; i++) {
            final int taskId = i;
            new Thread(() -> {
                try {
                    // 模拟任务执行
                    Thread.sleep((long) (Math.random() * 2000));
                    System.out.println("任务 " + taskId + " 完成");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();  // 任务完成，计数器减 1
                }
            }).start();
        }
        
        System.out.println("等待所有任务完成...");
        latch.await();  // 阻塞等待计数器变为 0
        System.out.println("所有任务已完成！");
    }
}
```

### 示例：模拟并发测试

```java
public class ConcurrentTest {
    public static void main(String[] args) throws InterruptedException {
        int threadCount = 100;
        CountDownLatch startLatch = new CountDownLatch(1);    // 控制同时开始
        CountDownLatch endLatch = new CountDownLatch(threadCount);  // 等待所有完成
        
        for (int i = 0; i < threadCount; i++) {
            new Thread(() -> {
                try {
                    startLatch.await();  // 等待开始信号
                    // 执行测试逻辑
                    System.out.println(Thread.currentThread().getName() + " 执行中");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    endLatch.countDown();
                }
            }).start();
        }
        
        Thread.sleep(1000);  // 准备时间
        System.out.println("开始并发测试！");
        startLatch.countDown();  // 发送开始信号
        
        endLatch.await();  // 等待所有线程完成
        System.out.println("并发测试完成！");
    }
}
```

::: warning 注意
CountDownLatch 是一次性的，计数器不能重置。如果需要重复使用，请使用 CyclicBarrier。
:::

## CyclicBarrier 循环栅栏

`CyclicBarrier` 让一组线程相互等待，直到所有线程都到达屏障点。

### 核心方法

- `await()`：等待其他线程到达屏障
- `await(timeout, unit)`：带超时的等待
- `reset()`：重置屏障
- `getNumberWaiting()`：获取正在等待的线程数

### CountDownLatch vs CyclicBarrier

| 特性     | CountDownLatch   | CyclicBarrier    |
| -------- | ---------------- | ---------------- |
| 计数器   | 递减             | 递减后重置       |
| 重用     | 一次性           | 可重复使用       |
| 回调     | 无               | 支持屏障动作     |
| 等待方式 | 一个线程等待多个 | 多个线程互相等待 |

### 示例：多线程分段计算

```java
import java.util.concurrent.CyclicBarrier;

public class CyclicBarrierDemo {
    public static void main(String[] args) {
        int threadCount = 3;
        
        // 当所有线程到达屏障时执行的动作
        CyclicBarrier barrier = new CyclicBarrier(threadCount, () -> {
            System.out.println("所有线程已到达屏障，继续执行下一阶段");
        });
        
        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            new Thread(() -> {
                try {
                    // 第一阶段
                    System.out.println("线程 " + threadId + " 完成阶段一");
                    barrier.await();
                    
                    // 第二阶段
                    System.out.println("线程 " + threadId + " 完成阶段二");
                    barrier.await();
                    
                    // 第三阶段
                    System.out.println("线程 " + threadId + " 完成阶段三");
                    barrier.await();
                    
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

## Semaphore 信号量

`Semaphore` 用于控制同时访问特定资源的线程数量。

### 核心方法

- `acquire()`：获取许可（阻塞）
- `acquire(n)`：获取 n 个许可
- `tryAcquire()`：尝试获取许可（非阻塞）
- `release()`：释放许可
- `availablePermits()`：获取可用许可数

### 示例：限流

```java
import java.util.concurrent.Semaphore;

public class SemaphoreDemo {
    public static void main(String[] args) {
        // 最多允许 3 个线程同时执行
        Semaphore semaphore = new Semaphore(3);
        
        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            new Thread(() -> {
                try {
                    semaphore.acquire();  // 获取许可
                    System.out.println("任务 " + taskId + " 开始执行，当前许可：" 
                        + semaphore.availablePermits());
                    Thread.sleep(2000);  // 模拟执行
                    System.out.println("任务 " + taskId + " 执行完成");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    semaphore.release();  // 释放许可
                }
            }).start();
        }
    }
}
```

### 示例：数据库连接池

```java
public class ConnectionPool {
    private final Semaphore semaphore;
    private final List<Connection> pool;
    
    public ConnectionPool(int poolSize) {
        this.semaphore = new Semaphore(poolSize);
        this.pool = new ArrayList<>(poolSize);
        // 初始化连接
        for (int i = 0; i < poolSize; i++) {
            pool.add(createConnection());
        }
    }
    
    public Connection getConnection() throws InterruptedException {
        semaphore.acquire();
        synchronized (pool) {
            return pool.remove(pool.size() - 1);
        }
    }
    
    public void releaseConnection(Connection conn) {
        synchronized (pool) {
            pool.add(conn);
        }
        semaphore.release();
    }
    
    private Connection createConnection() {
        // 创建数据库连接
        return null;
    }
}
```

## Exchanger 交换器

`Exchanger` 用于两个线程之间交换数据。

### 基本使用

```java
import java.util.concurrent.Exchanger;

public class ExchangerDemo {
    public static void main(String[] args) {
        Exchanger<String> exchanger = new Exchanger<>();
        
        new Thread(() -> {
            try {
                String data = "线程A的数据";
                System.out.println("线程A发送：" + data);
                String received = exchanger.exchange(data);  // 交换数据
                System.out.println("线程A收到：" + received);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
        
        new Thread(() -> {
            try {
                String data = "线程B的数据";
                System.out.println("线程B发送：" + data);
                String received = exchanger.exchange(data);  // 交换数据
                System.out.println("线程B收到：" + received);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

### 应用场景

- 生产者-消费者模式中的数据交换
- 遗传算法中的数据交配
- 校对工作（两个线程分别处理数据后交换验证）

## Phaser 阶段器

`Phaser` 是 JDK 7 引入的更灵活的同步工具，可以替代 CountDownLatch 和 CyclicBarrier。

### 特点

- 支持动态注册参与者
- 支持分阶段执行
- 可重复使用

### 示例

```java
import java.util.concurrent.Phaser;

public class PhaserDemo {
    public static void main(String[] args) {
        Phaser phaser = new Phaser(3);  // 初始 3 个参与者
        
        for (int i = 0; i < 3; i++) {
            final int id = i;
            new Thread(() -> {
                // 阶段 0
                System.out.println("线程 " + id + " 完成阶段 0");
                phaser.arriveAndAwaitAdvance();
                
                // 阶段 1
                System.out.println("线程 " + id + " 完成阶段 1");
                phaser.arriveAndAwaitAdvance();
                
                // 阶段 2
                System.out.println("线程 " + id + " 完成阶段 2");
                phaser.arriveAndDeregister();  // 完成并注销
            }).start();
        }
    }
}
```

## LockSupport 线程阻塞工具

`LockSupport` 提供了更基础的线程阻塞和唤醒功能。

### 核心方法

- `park()`：阻塞当前线程
- `parkNanos(nanos)`：阻塞指定时间
- `unpark(thread)`：唤醒指定线程

### 与 wait/notify 的区别

| 特性     | wait/notify             | LockSupport          |
| -------- | ----------------------- | -------------------- |
| 调用前提 | 必须持有锁              | 无需持有锁           |
| 顺序要求 | notify 必须在 wait 之后 | unpark 可以先于 park |
| 精确唤醒 | 不支持（notify 随机）   | 支持（指定线程）     |

### 示例

```java
import java.util.concurrent.locks.LockSupport;

public class LockSupportDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            System.out.println("线程开始执行");
            LockSupport.park();  // 阻塞
            System.out.println("线程被唤醒");
        });
        
        thread.start();
        Thread.sleep(2000);
        
        System.out.println("主线程唤醒子线程");
        LockSupport.unpark(thread);  // 唤醒
    }
}
```

## 并发工具类对比

| 工具类         | 使用场景         | 重用 | 特点         |
| -------------- | ---------------- | ---- | ------------ |
| CountDownLatch | 等待多个任务完成 | 否   | 计数递减     |
| CyclicBarrier  | 多线程互相等待   | 是   | 支持回调     |
| Semaphore      | 限制并发访问数   | 是   | 控制资源访问 |
| Exchanger      | 两线程数据交换   | 是   | 成对使用     |
| Phaser         | 分阶段任务       | 是   | 动态参与者   |

## 小结

- **CountDownLatch**：一次性，等待多个任务完成
- **CyclicBarrier**：可重用，多线程互相等待，支持屏障动作
- **Semaphore**：控制并发访问数量，常用于限流
- **Exchanger**：两个线程之间交换数据
- **Phaser**：更灵活的分阶段同步工具
- **LockSupport**：底层线程阻塞/唤醒工具

根据具体场景选择合适的并发工具，可以简化并发编程的复杂度。
