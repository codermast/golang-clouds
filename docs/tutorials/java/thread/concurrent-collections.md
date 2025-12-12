---
order : 5
---

# 并发集合

Java 并发包提供了多种线程安全的集合类，用于替代传统的同步集合（如 `Collections.synchronizedList`）。

## 为什么需要并发集合

传统同步集合的问题：

```java
// 传统方式：整个方法加锁，性能差
List<String> syncList = Collections.synchronizedList(new ArrayList<>());

// 复合操作仍然不安全
if (!syncList.contains("item")) {
    syncList.add("item");  // 检查-插入不是原子操作
}
```

并发集合的优势：
- 更细粒度的锁，更高的并发性能
- 提供原子性的复合操作
- 迭代器是弱一致性的，不会抛出 ConcurrentModificationException

## ConcurrentHashMap

`ConcurrentHashMap` 是线程安全的 HashMap，是最常用的并发集合。

### JDK 7 vs JDK 8 实现

| 版本   | 实现方式           | 特点                    |
| ------ | ------------------ | ----------------------- |
| JDK 7  | 分段锁（Segment）  | 默认 16 个段，并发度 16 |
| JDK 8+ | CAS + synchronized | 锁粒度更细，性能更好    |

### 基本使用

```java
import java.util.concurrent.ConcurrentHashMap;

public class ConcurrentHashMapDemo {
    public static void main(String[] args) {
        ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
        
        // 基本操作
        map.put("a", 1);
        map.get("a");
        map.remove("a");
        
        // 原子操作
        map.putIfAbsent("b", 2);  // 不存在才插入
        map.replace("b", 2, 3);   // CAS 替换
        map.compute("c", (k, v) -> v == null ? 1 : v + 1);  // 计算
        map.merge("d", 1, Integer::sum);  // 合并
    }
}
```

### 原子操作方法

```java
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// putIfAbsent：不存在才插入，返回旧值
Integer old = map.putIfAbsent("key", 100);

// computeIfAbsent：不存在才计算并插入
Integer value = map.computeIfAbsent("key", k -> expensiveCompute(k));

// computeIfPresent：存在才更新
map.computeIfPresent("key", (k, v) -> v + 1);

// compute：无论是否存在都计算
map.compute("key", (k, v) -> v == null ? 1 : v + 1);

// merge：合并值
map.merge("key", 1, Integer::sum);  // 累加
```

### 批量操作（JDK 8+）

```java
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
// 初始化数据...

// forEach：并行遍历
map.forEach(2, (k, v) -> System.out.println(k + "=" + v));

// search：并行搜索
String result = map.search(2, (k, v) -> v > 100 ? k : null);

// reduce：并行归约
Integer sum = map.reduce(2, (k, v) -> v, Integer::sum);

// 参数 2 是并行阈值，元素数超过该值才并行处理
```

### 注意事项

::: warning 弱一致性
ConcurrentHashMap 的迭代器是弱一致性的，可能不会反映迭代开始后的修改。
:::

```java
// size() 和 isEmpty() 返回的是近似值
// 在并发场景下可能不准确
int size = map.size();  // 近似值
boolean empty = map.isEmpty();  // 近似值
```

## CopyOnWriteArrayList

`CopyOnWriteArrayList` 是线程安全的 ArrayList，采用**写时复制**策略。

### 实现原理

- 读操作：直接读取，无锁
- 写操作：复制整个数组，在新数组上修改，然后替换

### 适用场景

- 读多写少
- 允许短暂的数据不一致
- 遍历操作远多于修改操作

### 基本使用

```java
import java.util.concurrent.CopyOnWriteArrayList;

public class CopyOnWriteArrayListDemo {
    public static void main(String[] args) {
        CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
        
        // 添加元素（会复制数组）
        list.add("a");
        list.add("b");
        
        // 读取元素（无锁）
        String first = list.get(0);
        
        // 遍历时可以安全修改
        for (String item : list) {
            if (item.equals("a")) {
                list.remove(item);  // 不会抛出 ConcurrentModificationException
            }
        }
    }
}
```

### 缺点

::: danger 注意
- 写操作开销大（需要复制整个数组）
- 内存占用高（写操作时存在两个数组）
- 数据一致性弱（读到的可能是旧数据）
:::

## CopyOnWriteArraySet

`CopyOnWriteArraySet` 基于 CopyOnWriteArrayList 实现，特点相同。

```java
import java.util.concurrent.CopyOnWriteArraySet;

CopyOnWriteArraySet<String> set = new CopyOnWriteArraySet<>();
set.add("a");
set.add("b");
set.add("a");  // 重复元素，不会添加
```

## BlockingQueue 阻塞队列

阻塞队列在队列满或空时会阻塞，常用于生产者-消费者模式。

### 核心方法

| 操作 | 抛异常    | 返回特殊值 | 阻塞   | 超时                    |
| ---- | --------- | ---------- | ------ | ----------------------- |
| 插入 | add(e)    | offer(e)   | put(e) | offer(e, timeout, unit) |
| 移除 | remove()  | poll()     | take() | poll(timeout, unit)     |
| 检查 | element() | peek()     | -      | -                       |

### ArrayBlockingQueue

有界阻塞队列，数组实现。

```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class ArrayBlockingQueueDemo {
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);
        
        // 生产者
        new Thread(() -> {
            try {
                for (int i = 0; i < 20; i++) {
                    queue.put("item-" + i);  // 队列满时阻塞
                    System.out.println("生产：item-" + i);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
        
        // 消费者
        new Thread(() -> {
            try {
                while (true) {
                    String item = queue.take();  // 队列空时阻塞
                    System.out.println("消费：" + item);
                    Thread.sleep(500);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

### LinkedBlockingQueue

可选有界阻塞队列，链表实现。

```java
// 无界队列（慎用，可能 OOM）
BlockingQueue<String> unbounded = new LinkedBlockingQueue<>();

// 有界队列（推荐）
BlockingQueue<String> bounded = new LinkedBlockingQueue<>(1000);
```

### PriorityBlockingQueue

支持优先级的无界阻塞队列。

```java
import java.util.concurrent.PriorityBlockingQueue;

public class PriorityBlockingQueueDemo {
    public static void main(String[] args) throws InterruptedException {
        PriorityBlockingQueue<Task> queue = new PriorityBlockingQueue<>();
        
        queue.put(new Task(3, "低优先级任务"));
        queue.put(new Task(1, "高优先级任务"));
        queue.put(new Task(2, "中优先级任务"));
        
        // 按优先级取出
        System.out.println(queue.take());  // 高优先级任务
        System.out.println(queue.take());  // 中优先级任务
        System.out.println(queue.take());  // 低优先级任务
    }
}

class Task implements Comparable<Task> {
    int priority;
    String name;
    
    Task(int priority, String name) {
        this.priority = priority;
        this.name = name;
    }
    
    @Override
    public int compareTo(Task other) {
        return Integer.compare(this.priority, other.priority);
    }
    
    @Override
    public String toString() {
        return name;
    }
}
```

### DelayQueue

延迟队列，元素只有到期后才能被取出。

```java
import java.util.concurrent.DelayQueue;
import java.util.concurrent.Delayed;
import java.util.concurrent.TimeUnit;

public class DelayQueueDemo {
    public static void main(String[] args) throws InterruptedException {
        DelayQueue<DelayedTask> queue = new DelayQueue<>();
        
        queue.put(new DelayedTask("任务1", 5000));  // 5秒后执行
        queue.put(new DelayedTask("任务2", 2000));  // 2秒后执行
        queue.put(new DelayedTask("任务3", 3000));  // 3秒后执行
        
        while (!queue.isEmpty()) {
            DelayedTask task = queue.take();  // 阻塞直到有元素到期
            System.out.println("执行：" + task.name);
        }
    }
}

class DelayedTask implements Delayed {
    String name;
    long executeTime;
    
    DelayedTask(String name, long delayMs) {
        this.name = name;
        this.executeTime = System.currentTimeMillis() + delayMs;
    }
    
    @Override
    public long getDelay(TimeUnit unit) {
        return unit.convert(executeTime - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
    }
    
    @Override
    public int compareTo(Delayed other) {
        return Long.compare(this.executeTime, ((DelayedTask) other).executeTime);
    }
}
```

### SynchronousQueue

不存储元素的阻塞队列，每个 put 必须等待一个 take。

```java
import java.util.concurrent.SynchronousQueue;

SynchronousQueue<String> queue = new SynchronousQueue<>();

// 生产者和消费者必须同时就绪
new Thread(() -> {
    try {
        queue.put("data");  // 阻塞直到有消费者
    } catch (InterruptedException e) {}
}).start();

new Thread(() -> {
    try {
        String data = queue.take();  // 阻塞直到有生产者
    } catch (InterruptedException e) {}
}).start();
```

## ConcurrentLinkedQueue

非阻塞线程安全队列，基于 CAS 实现。

```java
import java.util.concurrent.ConcurrentLinkedQueue;

ConcurrentLinkedQueue<String> queue = new ConcurrentLinkedQueue<>();

// 添加元素
queue.offer("a");
queue.add("b");

// 获取元素
String head = queue.poll();  // 移除并返回头部
String peek = queue.peek();  // 仅查看头部
```

## ConcurrentSkipListMap

线程安全的有序 Map，基于跳表实现。

```java
import java.util.concurrent.ConcurrentSkipListMap;

ConcurrentSkipListMap<Integer, String> map = new ConcurrentSkipListMap<>();

map.put(3, "c");
map.put(1, "a");
map.put(2, "b");

// 有序遍历
map.forEach((k, v) -> System.out.println(k + "=" + v));
// 输出：1=a, 2=b, 3=c

// 范围查询
map.subMap(1, 3);  // 1-2
map.headMap(2);    // < 2
map.tailMap(2);    // >= 2
```

## 并发集合选择指南

| 场景           | 推荐集合                                 |
| -------------- | ---------------------------------------- |
| 高并发 Map     | ConcurrentHashMap                        |
| 读多写少 List  | CopyOnWriteArrayList                     |
| 读多写少 Set   | CopyOnWriteArraySet                      |
| 有序 Map       | ConcurrentSkipListMap                    |
| 有序 Set       | ConcurrentSkipListSet                    |
| 生产者-消费者  | ArrayBlockingQueue / LinkedBlockingQueue |
| 定时任务       | DelayQueue                               |
| 优先级任务     | PriorityBlockingQueue                    |
| 高性能无界队列 | ConcurrentLinkedQueue                    |

## 小结

- **ConcurrentHashMap**：高并发场景首选，JDK 8 后性能更优
- **CopyOnWriteArrayList/Set**：读多写少场景，牺牲写性能换取读性能
- **BlockingQueue**：生产者-消费者模式核心组件
- **ConcurrentSkipListMap/Set**：需要有序的并发场景
- 根据读写比例、是否需要阻塞、是否需要有序等特性选择合适的并发集合
