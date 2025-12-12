---
order : 11
---

# Queue - Deque 接口解析

## 介绍

Deque（Double Ended Queue，双端队列）是 Queue 的子接口，支持在队列的两端进行插入和删除操作。Deque 既可以作为队列（FIFO）使用，也可以作为栈（LIFO）使用。

Deque 的特点：
- **双端操作**：可以从头部和尾部进行插入和删除
- **可作为栈**：提供了 push、pop 方法
- **可作为队列**：提供了 offer、poll 方法
- **不允许 null**：大多数实现不允许 null 元素

## Deque 接口方法

Deque 接口在 Queue 的基础上增加了双端操作：

### 双端操作方法

| 操作位置 | 抛异常          | 返回特殊值      |
| -------- | --------------- | --------------- |
| 头部插入 | `addFirst(e)`   | `offerFirst(e)` |
| 尾部插入 | `addLast(e)`    | `offerLast(e)`  |
| 头部删除 | `removeFirst()` | `pollFirst()`   |
| 尾部删除 | `removeLast()`  | `pollLast()`    |
| 查看头部 | `getFirst()`    | `peekFirst()`   |
| 查看尾部 | `getLast()`     | `peekLast()`    |

### 作为队列使用

| Queue 方法  | 等效 Deque 方法 |
| ----------- | --------------- |
| `add(e)`    | `addLast(e)`    |
| `offer(e)`  | `offerLast(e)`  |
| `remove()`  | `removeFirst()` |
| `poll()`    | `pollFirst()`   |
| `element()` | `getFirst()`    |
| `peek()`    | `peekFirst()`   |

### 作为栈使用

| Stack 方法 | 等效 Deque 方法 |
| ---------- | --------------- |
| `push(e)`  | `addFirst(e)`   |
| `pop()`    | `removeFirst()` |
| `peek()`   | `peekFirst()`   |

## Deque 实现类

| 实现类                  | 特点                        |
| ----------------------- | --------------------------- |
| `ArrayDeque`            | 循环数组实现，推荐使用      |
| `LinkedList`            | 双向链表实现，同时实现 List |
| `ConcurrentLinkedDeque` | 并发非阻塞双端队列          |
| `LinkedBlockingDeque`   | 并发阻塞双端队列            |

## ArrayDeque

ArrayDeque 是 Deque 接口的数组实现，性能优于 LinkedList。

### 基本使用

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class ArrayDequeDemo {
    public static void main(String[] args) {
        Deque<String> deque = new ArrayDeque<>();
        
        // 从头部添加
        deque.addFirst("B");
        deque.addFirst("A");
        
        // 从尾部添加
        deque.addLast("C");
        deque.addLast("D");
        
        System.out.println("双端队列：" + deque);  // [A, B, C, D]
        
        // 从头部移除
        System.out.println("头部元素：" + deque.pollFirst());  // A
        
        // 从尾部移除
        System.out.println("尾部元素：" + deque.pollLast());   // D
        
        System.out.println("双端队列：" + deque);  // [B, C]
    }
}
```

### 作为栈使用

```java
public class DequeAsStack {
    public static void main(String[] args) {
        Deque<Integer> stack = new ArrayDeque<>();
        
        // 入栈
        stack.push(1);
        stack.push(2);
        stack.push(3);
        
        // 查看栈顶
        System.out.println("栈顶元素：" + stack.peek());  // 3
        
        // 出栈
        while (!stack.isEmpty()) {
            System.out.println(stack.pop());
        }
        // 输出：3 2 1
    }
}
```

::: tip 推荐使用 ArrayDeque 替代 Stack
Java 官方推荐使用 ArrayDeque 替代遗留类 Stack，因为：
- ArrayDeque 性能更好
- Stack 继承自 Vector，有同步开销
:::

### 作为队列使用

```java
public class DequeAsQueue {
    public static void main(String[] args) {
        Deque<String> queue = new ArrayDeque<>();
        
        // 入队（从尾部）
        queue.offer("A");
        queue.offer("B");
        queue.offer("C");
        
        // 出队（从头部）
        while (!queue.isEmpty()) {
            System.out.println(queue.poll());
        }
        // 输出：A B C
    }
}
```

## ArrayDeque 底层实现

### 循环数组

ArrayDeque 使用循环数组实现，通过 head 和 tail 指针管理队列：

```java
transient Object[] elements;  // 存储元素的数组
transient int head;           // 头部指针
transient int tail;           // 尾部指针
```

### 工作原理

```
初始状态：
head = 0, tail = 0
[ ][ ][ ][ ][ ][ ][ ][ ]
 ↑
head/tail

添加元素后：
[ ][ ][ ][A][B][C][ ][ ]
          ↑     ↑
        head   tail

继续添加和删除后（循环使用）：
[F][G][ ][ ][ ][D][E][ ]
    ↑           ↑
   tail        head
```

### 扩容机制

```java
/**
 * 扩容为原来的 2 倍
 */
private void doubleCapacity() {
    int p = head;
    int n = elements.length;
    int r = n - p;  // head 右边的元素数量
    int newCapacity = n << 1;  // 容量翻倍
    if (newCapacity < 0)
        throw new IllegalStateException("Sorry, deque too big");
    Object[] a = new Object[newCapacity];
    System.arraycopy(elements, p, a, 0, r);
    System.arraycopy(elements, 0, a, r, p);
    elements = a;
    head = 0;
    tail = n;
}
```

## LinkedList 作为 Deque

LinkedList 同时实现了 List 和 Deque 接口：

```java
import java.util.Deque;
import java.util.LinkedList;

public class LinkedListDequeDemo {
    public static void main(String[] args) {
        Deque<String> deque = new LinkedList<>();
        
        // 双端操作
        deque.addFirst("A");
        deque.addLast("B");
        
        System.out.println(deque.pollFirst());  // A
        System.out.println(deque.pollLast());   // B
    }
}
```

## ArrayDeque vs LinkedList

| 特性      | ArrayDeque | LinkedList       |
| --------- | ---------- | ---------------- |
| 数据结构  | 循环数组   | 双向链表         |
| 随机访问  | 不支持     | O(n)             |
| 头尾操作  | O(1) 摊还  | O(1)             |
| 内存占用  | 较少       | 较多（节点开销） |
| 缓存友好  | 更好       | 较差             |
| null 元素 | 不允许     | 允许             |
| 推荐程度  | **推荐**   | 需要 List 时使用 |

## 实战：使用 Deque 实现滑动窗口最大值

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class SlidingWindowMax {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || nums.length == 0) return new int[0];
        
        int[] result = new int[nums.length - k + 1];
        Deque<Integer> deque = new ArrayDeque<>();  // 存储下标
        
        for (int i = 0; i < nums.length; i++) {
            // 移除窗口外的元素
            while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
                deque.pollFirst();
            }
            
            // 维护单调递减队列
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
                deque.pollLast();
            }
            
            deque.offerLast(i);
            
            // 记录窗口最大值
            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }
        
        return result;
    }
}
```

## 小结

- Deque 是双端队列，支持在两端进行插入和删除操作
- 可以作为**队列**（FIFO）和**栈**（LIFO）使用
- **ArrayDeque** 是推荐的实现，性能优于 LinkedList
- ArrayDeque 基于循环数组实现，不允许 null 元素
- 推荐使用 ArrayDeque 替代遗留类 Stack
- LinkedList 适合需要同时使用 List 和 Deque 功能的场景
