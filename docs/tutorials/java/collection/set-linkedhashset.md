---
order : 9
---

# Set - LinkedHashSet 源码解析

::: tip 写在前面
LinkedHashSet 是 HashSet 的子类，底层通过 LinkedHashMap 实现。与 HashSet 的主要区别是 LinkedHashSet 维护了元素的插入顺序。如需了解 HashSet 的详细实现，请参阅[《Set - HashSet 源码解析》](https://www.codermast.com/java/collection/set-hashset.html)。
:::

## 介绍

LinkedHashSet 继承自 HashSet，底层使用 LinkedHashMap 存储元素，因此它具有以下特点：

- **有序性**：元素按照插入顺序存储
- **不允许重复**：继承自 Set 接口的特性
- **允许 null**：允许一个 null 元素
- **非线程安全**：与 HashSet 一样，不是线程安全的
- **性能略低于 HashSet**：因为需要维护链表顺序

## 类继承关系

```
Set (接口)
  ↑
HashSet
  ↑
LinkedHashSet
```

## 底层实现

### 构造方法

LinkedHashSet 的所有构造方法都调用了父类 HashSet 的一个特殊构造方法：

```java
public class LinkedHashSet<E>
    extends HashSet<E>
    implements Set<E>, Cloneable, java.io.Serializable {

    /**
     * 默认构造，初始容量 16，负载因子 0.75
     */
    public LinkedHashSet() {
        super(16, .75f, true);
    }

    /**
     * 指定初始容量
     */
    public LinkedHashSet(int initialCapacity) {
        super(initialCapacity, .75f, true);
    }

    /**
     * 指定初始容量和负载因子
     */
    public LinkedHashSet(int initialCapacity, float loadFactor) {
        super(initialCapacity, loadFactor, true);
    }

    /**
     * 通过集合创建
     */
    public LinkedHashSet(Collection<? extends E> c) {
        super(Math.max(2*c.size(), 11), .75f, true);
        addAll(c);
    }
}
```

### HashSet 的特殊构造方法

注意 LinkedHashSet 调用的是 HashSet 的一个包级私有构造方法：

```java
// HashSet 中的特殊构造方法，专为 LinkedHashSet 设计
HashSet(int initialCapacity, float loadFactor, boolean dummy) {
    map = new LinkedHashMap<>(initialCapacity, loadFactor);
}
```

这个构造方法使用 **LinkedHashMap** 而非 HashMap 作为底层存储，第三个参数 `dummy` 仅用于区分不同的构造方法。

### 存储结构对比

```
HashSet 存储结构（HashMap）：
┌─────────────────────────────────────┐
│  [0] → A → D                        │
│  [1] → B                            │
│  [2] → C → E                        │
│  ...                                │
└─────────────────────────────────────┘
遍历顺序：无序

LinkedHashSet 存储结构（LinkedHashMap）：
┌─────────────────────────────────────┐
│  [0] → A → D                        │
│  [1] → B                            │
│  [2] → C → E                        │
│  ...                                │
└─────────────────────────────────────┘
双向链表：A ←→ B ←→ C ←→ D ←→ E
遍历顺序：按插入顺序
```

## 使用示例

### 基本使用

```java
import java.util.LinkedHashSet;
import java.util.Set;

public class LinkedHashSetDemo {
    public static void main(String[] args) {
        Set<String> set = new LinkedHashSet<>();
        
        // 添加元素
        set.add("C");
        set.add("A");
        set.add("B");
        set.add("A");  // 重复元素，不会添加
        
        // 遍历（按插入顺序）
        System.out.println("LinkedHashSet: " + set);
        // 输出：LinkedHashSet: [C, A, B]
        
        for (String s : set) {
            System.out.println(s);
        }
        // 输出：C A B（按插入顺序）
    }
}
```

### 与 HashSet 对比

```java
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

public class SetCompare {
    public static void main(String[] args) {
        // HashSet - 无序
        Set<Integer> hashSet = new HashSet<>();
        hashSet.add(3);
        hashSet.add(1);
        hashSet.add(2);
        System.out.println("HashSet: " + hashSet);
        // 可能输出：HashSet: [1, 2, 3]（顺序不确定）
        
        // LinkedHashSet - 有序
        Set<Integer> linkedHashSet = new LinkedHashSet<>();
        linkedHashSet.add(3);
        linkedHashSet.add(1);
        linkedHashSet.add(2);
        System.out.println("LinkedHashSet: " + linkedHashSet);
        // 输出：LinkedHashSet: [3, 1, 2]（按插入顺序）
    }
}
```

## 常用方法

由于 LinkedHashSet 继承自 HashSet，其方法与 HashSet 完全相同：

| 方法                 | 说明             |
| -------------------- | ---------------- |
| `add(E e)`           | 添加元素         |
| `remove(Object o)`   | 删除元素         |
| `contains(Object o)` | 判断是否包含元素 |
| `size()`             | 获取元素个数     |
| `isEmpty()`          | 判断是否为空     |
| `clear()`            | 清空集合         |
| `iterator()`         | 获取迭代器       |

所有这些方法的时间复杂度都是 O(1)。

## 去重并保持顺序

LinkedHashSet 的一个常见应用是对列表去重同时保持原有顺序：

```java
import java.util.*;

public class DeduplicateWithOrder {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("B", "A", "C", "A", "B", "D");
        
        // 使用 LinkedHashSet 去重
        Set<String> set = new LinkedHashSet<>(list);
        
        // 转回 List
        List<String> result = new ArrayList<>(set);
        
        System.out.println("原始列表：" + list);
        // 输出：原始列表：[B, A, C, A, B, D]
        
        System.out.println("去重后：" + result);
        // 输出：去重后：[B, A, C, D]
    }
}
```

## 三种 Set 对比

| 特性       | HashSet  | LinkedHashSet    | TreeSet              |
| ---------- | -------- | ---------------- | -------------------- |
| 底层实现   | HashMap  | LinkedHashMap    | TreeMap              |
| 遍历顺序   | 无序     | 插入顺序         | 自然排序/自定义排序  |
| 时间复杂度 | O(1)     | O(1)             | O(log n)             |
| 允许 null  | 是       | 是               | 否（使用自然排序时） |
| 适用场景   | 一般场景 | 需要保持插入顺序 | 需要排序             |

## 性能特点

### 时间复杂度

| 操作     | 时间复杂度 |
| -------- | ---------- |
| add      | O(1)       |
| remove   | O(1)       |
| contains | O(1)       |
| 遍历     | O(n)       |

### 与 HashSet 的性能对比

- **插入性能**：略低于 HashSet（需要维护链表）
- **查询性能**：与 HashSet 相同
- **遍历性能**：与 HashSet 相同，但保证顺序
- **内存占用**：略高于 HashSet（额外的链表指针）

## 小结

- LinkedHashSet 继承自 HashSet，底层使用 LinkedHashMap
- 主要区别是**保持元素的插入顺序**
- 通过双向链表维护顺序，性能略低于 HashSet
- 常用于需要**去重且保持顺序**的场景
- 所有操作的时间复杂度都是 O(1)
- 与 HashSet 一样，非线程安全，允许一个 null 元素
