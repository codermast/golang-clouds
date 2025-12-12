---
order : 2
---

# 线程池

## 为什么需要线程池

线程的创建和销毁都需要消耗系统资源，频繁地创建和销毁线程会带来以下问题：

1. **资源消耗**：线程创建和销毁需要时间和内存开销
2. **响应速度**：任务到来时需要等待线程创建
3. **线程管理**：无限制创建线程可能导致系统资源耗尽

线程池通过**复用线程**来解决这些问题。

## ThreadPoolExecutor

`ThreadPoolExecutor` 是 Java 线程池的核心实现类。

### 核心参数

```java
public ThreadPoolExecutor(
    int corePoolSize,           // 核心线程数
    int maximumPoolSize,        // 最大线程数
    long keepAliveTime,         // 空闲线程存活时间
    TimeUnit unit,              // 时间单位
    BlockingQueue<Runnable> workQueue,  // 工作队列
    ThreadFactory threadFactory,        // 线程工厂
    RejectedExecutionHandler handler    // 拒绝策略
)
```

### 参数详解

| 参数            | 说明                                                                  |
| --------------- | --------------------------------------------------------------------- |
| corePoolSize    | 核心线程数，即使空闲也不会被回收（除非设置了 allowCoreThreadTimeOut） |
| maximumPoolSize | 线程池最大线程数                                                      |
| keepAliveTime   | 非核心线程空闲时的存活时间                                            |
| unit            | keepAliveTime 的时间单位                                              |
| workQueue       | 存放等待执行任务的阻塞队列                                            |
| threadFactory   | 创建线程的工厂，可自定义线程名称等属性                                |
| handler         | 当队列满且线程数达到最大时的拒绝策略                                  |

### 工作流程

```
提交任务
    ↓
核心线程数未满？ ─── 是 ──→ 创建核心线程执行
    ↓ 否
队列未满？ ─── 是 ──→ 加入队列等待
    ↓ 否
最大线程数未满？ ─── 是 ──→ 创建非核心线程执行
    ↓ 否
执行拒绝策略
```

### 创建线程池示例

```java
import java.util.concurrent.*;

public class ThreadPoolDemo {
    public static void main(String[] args) {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2,                      // 核心线程数
            5,                      // 最大线程数
            60,                     // 空闲线程存活时间
            TimeUnit.SECONDS,       // 时间单位
            new LinkedBlockingQueue<>(10),  // 队列容量 10
            Executors.defaultThreadFactory(),
            new ThreadPoolExecutor.AbortPolicy()  // 拒绝策略
        );
        
        // 提交任务
        for (int i = 0; i < 15; i++) {
            final int taskId = i;
            executor.execute(() -> {
                System.out.println("任务 " + taskId + " 执行，线程：" + 
                    Thread.currentThread().getName());
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
        }
        
        // 关闭线程池
        executor.shutdown();
    }
}
```

## 四种常用线程池

`Executors` 工具类提供了四种常用线程池的快捷创建方式。

### 1. FixedThreadPool - 固定线程数

```java
ExecutorService fixedPool = Executors.newFixedThreadPool(5);
```

特点：
- 核心线程数 = 最大线程数
- 使用无界队列 `LinkedBlockingQueue`
- 适用于负载较重、需要限制线程数量的场景

::: warning 注意
使用无界队列可能导致内存溢出（OOM）
:::

### 2. CachedThreadPool - 缓存线程池

```java
ExecutorService cachedPool = Executors.newCachedThreadPool();
```

特点：
- 核心线程数为 0，最大线程数为 Integer.MAX_VALUE
- 使用 `SynchronousQueue`，不存储任务
- 线程空闲 60 秒后回收
- 适用于执行大量短期异步任务

::: warning 注意
可能创建大量线程导致系统资源耗尽
:::

### 3. SingleThreadExecutor - 单线程

```java
ExecutorService singlePool = Executors.newSingleThreadExecutor();
```

特点：
- 只有一个线程，保证任务按顺序执行
- 使用无界队列
- 适用于需要保证顺序执行的场景

### 4. ScheduledThreadPool - 定时线程池

```java
ScheduledExecutorService scheduledPool = Executors.newScheduledThreadPool(5);

// 延迟 3 秒执行
scheduledPool.schedule(() -> {
    System.out.println("延迟执行");
}, 3, TimeUnit.SECONDS);

// 延迟 1 秒后，每隔 2 秒执行一次
scheduledPool.scheduleAtFixedRate(() -> {
    System.out.println("周期执行");
}, 1, 2, TimeUnit.SECONDS);
```

## 拒绝策略

当队列满且线程数达到最大时，触发拒绝策略。

### 四种内置策略

```java
// 1. AbortPolicy（默认）：抛出 RejectedExecutionException 异常
new ThreadPoolExecutor.AbortPolicy()

// 2. CallerRunsPolicy：由调用线程执行该任务
new ThreadPoolExecutor.CallerRunsPolicy()

// 3. DiscardPolicy：直接丢弃任务，不抛异常
new ThreadPoolExecutor.DiscardPolicy()

// 4. DiscardOldestPolicy：丢弃队列中最老的任务
new ThreadPoolExecutor.DiscardOldestPolicy()
```

### 自定义拒绝策略

```java
RejectedExecutionHandler customHandler = (r, executor) -> {
    // 记录日志
    System.out.println("任务被拒绝：" + r.toString());
    // 可以选择：重试、持久化、发送告警等
};
```

## 工作队列

### 常用队列类型

| 队列类型              | 特点                 | 适用场景         |
| --------------------- | -------------------- | ---------------- |
| ArrayBlockingQueue    | 有界，数组实现       | 需要限制队列大小 |
| LinkedBlockingQueue   | 可选有界，链表实现   | 通用场景         |
| SynchronousQueue      | 不存储元素，直接传递 | CachedThreadPool |
| PriorityBlockingQueue | 支持优先级排序       | 需要优先级的任务 |
| DelayQueue            | 延迟队列             | 定时任务         |

### 队列选择建议

```java
// 有界队列 - 推荐
new ArrayBlockingQueue<>(1000)
new LinkedBlockingQueue<>(1000)

// 无界队列 - 慎用，可能 OOM
new LinkedBlockingQueue<>()
```

## 线程工厂

自定义线程工厂可以设置线程名称、优先级、是否守护线程等。

```java
ThreadFactory customFactory = new ThreadFactory() {
    private final AtomicInteger threadNumber = new AtomicInteger(1);
    
    @Override
    public Thread newThread(Runnable r) {
        Thread thread = new Thread(r, "custom-pool-" + threadNumber.getAndIncrement());
        thread.setDaemon(false);
        thread.setPriority(Thread.NORM_PRIORITY);
        return thread;
    }
};

// 使用 Guava 提供的 ThreadFactoryBuilder（推荐）
// ThreadFactory factory = new ThreadFactoryBuilder()
//     .setNameFormat("order-pool-%d")
//     .setDaemon(false)
//     .build();
```

## 线程池监控

```java
ThreadPoolExecutor executor = (ThreadPoolExecutor) Executors.newFixedThreadPool(5);

// 监控指标
System.out.println("核心线程数：" + executor.getCorePoolSize());
System.out.println("最大线程数：" + executor.getMaximumPoolSize());
System.out.println("当前线程数：" + executor.getPoolSize());
System.out.println("活动线程数：" + executor.getActiveCount());
System.out.println("完成任务数：" + executor.getCompletedTaskCount());
System.out.println("队列任务数：" + executor.getQueue().size());
```

## 关闭线程池

```java
// 平滑关闭：不再接受新任务，等待已有任务完成
executor.shutdown();

// 立即关闭：尝试中断正在执行的任务，返回未执行的任务列表
List<Runnable> notExecuted = executor.shutdownNow();

// 等待关闭完成
boolean terminated = executor.awaitTermination(60, TimeUnit.SECONDS);
```

## 最佳实践

### 1. 线程池参数配置

```java
// CPU 密集型任务：线程数 = CPU 核心数 + 1
int cpuCores = Runtime.getRuntime().availableProcessors();
int corePoolSize = cpuCores + 1;

// IO 密集型任务：线程数 = CPU 核心数 * 2
int ioPoolSize = cpuCores * 2;

// 混合型任务：根据 CPU 计算时间和 IO 等待时间比例调整
// 线程数 = CPU 核心数 * (1 + IO 等待时间 / CPU 计算时间)
```

### 2. 推荐配置示例

```java
public class RecommendedThreadPool {
    public static ThreadPoolExecutor createThreadPool() {
        int corePoolSize = Runtime.getRuntime().availableProcessors();
        int maxPoolSize = corePoolSize * 2;
        
        return new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            60, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(1000),  // 有界队列
            new ThreadFactoryBuilder()
                .setNameFormat("business-pool-%d")
                .build(),
            new ThreadPoolExecutor.CallerRunsPolicy()  // 调用者执行策略
        );
    }
}
```

### 3. 避免使用 Executors 创建线程池

阿里巴巴 Java 开发手册明确规定：

::: danger 强制
线程池不允许使用 Executors 创建，而是通过 ThreadPoolExecutor 的方式创建，这样可以更加明确线程池的运行规则，规避资源耗尽的风险。
:::

## 小结

- 线程池通过复用线程减少创建销毁开销，提高响应速度
- `ThreadPoolExecutor` 是核心实现，七个参数需要理解清楚
- 优先使用有界队列，避免 OOM
- 根据任务类型（CPU/IO 密集型）合理配置线程数
- 不推荐使用 `Executors` 快捷方法，而是手动创建线程池
