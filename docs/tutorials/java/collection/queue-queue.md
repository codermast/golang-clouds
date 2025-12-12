---
order : 10
---

# Queue - Queue 接口解析

## 介绍

Queue（队列）是一种先进先出（FIFO，First In First Out）的数据结构。Java 中的 Queue 是一个接口，继承自 Collection 接口，定义了队列的基本操作方法。

队列的特点：
- **先进先出**：最先入队的元素最先出队
- **单向操作**：从队尾入队，从队头出队
- **两组 API**：一组在操作失败时抛异常，一组返回特殊值

## Queue 接口方法

Queue 接口定义了两组方法，功能相同但失败时的处理方式不同：

| 操作     | 抛异常      | 返回特殊值 |
| -------- | ----------- | ---------- |
| 入队     | `add(e)`    | `offer(e)` |
| 出队     | `remove()`  | `poll()`   |
| 查看队头 | `element()` | `peek()`   |

### 方法详解

```java
public interface Queue<E> extends Collection<E> {
    
    /**
     * 入队操作，添加元素到队尾
     * 成功返回 true，失败抛出 IllegalStateException
     */
    boolean add(E e);
    
    /**
     * 入队操作，添加元素到队尾
     * 成功返回 true，失败返回 false
     */
    boolean offer(E e);
    
    /**
     * 出队操作，移除并返回队头元素
     * 队列为空时抛出 NoSuchElementException
     */
    E remove();
    
    /**
     * 出队操作，移除并返回队头元素
     * 队列为空时返回 null
     */
    E poll();
    
    /**
     * 查看队头元素（不移除）
     * 队列为空时抛出 NoSuchElementException
     */
    E element();
    
    /**
     * 查看队头元素（不移除）
     * 队列为空时返回 null
     */
    E peek();
}
```

## Queue 实现类

Java 提供了多种 Queue 的实现：

| 实现类                  | 特点                                   |
| ----------------------- | -------------------------------------- |
| `LinkedList`            | 双向链表实现，同时实现了 List 和 Deque |
| `ArrayDeque`            | 循环数组实现，性能优于 LinkedList      |
| `PriorityQueue`         | 优先级队列，基于堆实现                 |
| `ArrayBlockingQueue`    | 有界阻塞队列                           |
| `LinkedBlockingQueue`   | 可选有界阻塞队列                       |
| `ConcurrentLinkedQueue` | 非阻塞并发队列                         |

## LinkedList 作为 Queue

LinkedList 实现了 Queue 接口，可以作为队列使用：

```java
import java.util.LinkedList;
import java.util.Queue;

public class LinkedListQueueDemo {
    public static void main(String[] args) {
        Queue<String> queue = new LinkedList<>();
        
        // 入队
        queue.offer("A");
        queue.offer("B");
        queue.offer("C");
        System.out.println("队列：" + queue);  // [A, B, C]
        
        // 查看队头
        System.out.println("队头元素：" + queue.peek());  // A
        
        // 出队
        System.out.println("出队：" + queue.poll());  // A
        System.out.println("队列：" + queue);  // [B, C]
        
        // 遍历（不会改变队列）
        for (String s : queue) {
            System.out.println(s);
        }
    }
}
```

## ArrayDeque 作为 Queue

ArrayDeque 基于循环数组实现，性能通常优于 LinkedList：

```java
import java.util.ArrayDeque;
import java.util.Queue;

public class ArrayDequeQueueDemo {
    public static void main(String[] args) {
        Queue<Integer> queue = new ArrayDeque<>();
        
        // 入队
        queue.offer(1);
        queue.offer(2);
        queue.offer(3);
        
        // 批量出队
        while (!queue.isEmpty()) {
            System.out.println(queue.poll());
        }
        // 输出：1 2 3
    }
}
```

## PriorityQueue 优先级队列

PriorityQueue 是一个基于堆的优先级队列，元素按照自然顺序或指定的比较器排序：

```java
import java.util.PriorityQueue;
import java.util.Queue;

public class PriorityQueueDemo {
    public static void main(String[] args) {
        // 默认小顶堆
        Queue<Integer> minHeap = new PriorityQueue<>();
        minHeap.offer(3);
        minHeap.offer(1);
        minHeap.offer(2);
        
        // 按优先级出队
        while (!minHeap.isEmpty()) {
            System.out.println(minHeap.poll());
        }
        // 输出：1 2 3
        
        // 大顶堆
        Queue<Integer> maxHeap = new PriorityQueue<>((a, b) -> b - a);
        maxHeap.offer(3);
        maxHeap.offer(1);
        maxHeap.offer(2);
        
        while (!maxHeap.isEmpty()) {
            System.out.println(maxHeap.poll());
        }
        // 输出：3 2 1
    }
}
```

### PriorityQueue 特点

- **基于堆实现**：默认是小顶堆
- **非 FIFO**：按优先级出队，不是先进先出
- **不允许 null**：会抛出 NullPointerException
- **非线程安全**：多线程使用需要同步

## 阻塞队列 BlockingQueue

BlockingQueue 是 Queue 的子接口，提供了阻塞操作：

| 操作 | 抛异常   | 返回特殊值 | 阻塞   | 超时                    |
| ---- | -------- | ---------- | ------ | ----------------------- |
| 入队 | add(e)   | offer(e)   | put(e) | offer(e, timeout, unit) |
| 出队 | remove() | poll()     | take() | poll(timeout, unit)     |

```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class BlockingQueueDemo {
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);
        
        // 生产者线程
        new Thread(() -> {
            try {
                queue.put("消息1");
                queue.put("消息2");
                System.out.println("消息已发送");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
        
        // 消费者线程
        new Thread(() -> {
            try {
                Thread.sleep(1000);
                System.out.println("收到：" + queue.take());
                System.out.println("收到：" + queue.take());
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

## 队列实现选择

| 场景           | 推荐实现                                 |
| -------------- | ---------------------------------------- |
| 普通队列       | ArrayDeque                               |
| 需要 List 操作 | LinkedList                               |
| 优先级队列     | PriorityQueue                            |
| 生产者-消费者  | ArrayBlockingQueue / LinkedBlockingQueue |
| 高并发         | ConcurrentLinkedQueue                    |

## 小结

- Queue 是先进先出（FIFO）的数据结构
- 提供两组 API：抛异常版和返回特殊值版
- 常用实现：LinkedList、ArrayDeque、PriorityQueue
- ArrayDeque 性能通常优于 LinkedList
- PriorityQueue 按优先级出队，不是 FIFO
- BlockingQueue 提供阻塞操作，适用于生产者-消费者模式
