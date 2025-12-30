---
order : 6
---

# Map - LinkedHashMap 源码解析

## 介绍

LinkedHashMap 是 HashMap 的子类，在 HashMap 的基础上维护了一个双向链表，用于记录元素的插入顺序或访问顺序。因此 LinkedHashMap 既具有 HashMap 的高效查找能力，又能保持元素的顺序。

LinkedHashMap 的特点：
- **有序性**：可以按照插入顺序或访问顺序遍历元素
- **继承 HashMap**：拥有 HashMap 的所有特性
- **支持 LRU**：可用于实现 LRU（最近最少使用）缓存
- **非线程安全**：与 HashMap 一样，不是线程安全的

## 数据结构

LinkedHashMap 在 HashMap 的基础上，增加了双向链表来维护顺序：

```
HashMap 结构 + 双向链表
    ┌───────────────────────────────────────┐
    │  table[0] → Entry1 ←→ Entry2          │
    │  table[1] → Entry3                     │
    │  table[2] → Entry4 ←→ Entry5 ←→ Entry6 │
    │  ...                                   │
    └───────────────────────────────────────┘
                    ↓
    双向链表（按顺序连接所有 Entry）：
    head ←→ Entry1 ←→ Entry3 ←→ Entry4 ←→ Entry2 ←→ ... ←→ tail
```

## 常用 API

LinkedHashMap 继承自 HashMap，API 与 HashMap 基本一致：

```java
// 创建 LinkedHashMap
LinkedHashMap<String, Integer> map = new LinkedHashMap<>();

// 创建按访问顺序排序的 LinkedHashMap
LinkedHashMap<String, Integer> accessOrderMap = new LinkedHashMap<>(16, 0.75f, true);

// 添加元素
map.put("a", 1);
map.put("b", 2);
map.put("c", 3);

// 获取元素
Integer value = map.get("a");

// 遍历（按插入顺序）
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + " = " + entry.getValue());
}
```

## 底层实现

### Entry 节点

LinkedHashMap 的 Entry 继承自 HashMap.Node，增加了 before 和 after 指针：

```java
/**
 * LinkedHashMap 的 Entry，继承自 HashMap.Node
 */
static class Entry<K,V> extends HashMap.Node<K,V> {
    Entry<K,V> before, after;  // 双向链表指针
    
    Entry(int hash, K key, V value, Node<K,V> next) {
        super(hash, key, value, next);
    }
}
```

### 成员变量

```java
/**
 * 双向链表的头节点（最老的元素）
 */
transient LinkedHashMap.Entry<K,V> head;

/**
 * 双向链表的尾节点（最新的元素）
 */
transient LinkedHashMap.Entry<K,V> tail;

/**
 * 迭代顺序：
 * true - 按访问顺序
 * false - 按插入顺序（默认）
 */
final boolean accessOrder;
```

### 构造方法

```java
/**
 * 默认构造，按插入顺序
 */
public LinkedHashMap() {
    super();
    accessOrder = false;
}

/**
 * 指定初始容量
 */
public LinkedHashMap(int initialCapacity) {
    super(initialCapacity);
    accessOrder = false;
}

/**
 * 指定初始容量、负载因子和排序模式
 * @param accessOrder true 表示按访问顺序，false 表示按插入顺序
 */
public LinkedHashMap(int initialCapacity, float loadFactor, boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}
```

### 创建节点

LinkedHashMap 重写了 HashMap 的 newNode 方法：

```java
Node<K,V> newNode(int hash, K key, V value, Node<K,V> e) {
    LinkedHashMap.Entry<K,V> p = new LinkedHashMap.Entry<K,V>(hash, key, value, e);
    linkNodeLast(p);  // 将新节点链接到双向链表末尾
    return p;
}

/**
 * 将节点链接到双向链表末尾
 */
private void linkNodeLast(LinkedHashMap.Entry<K,V> p) {
    LinkedHashMap.Entry<K,V> last = tail;
    tail = p;
    if (last == null)
        head = p;
    else {
        p.before = last;
        last.after = p;
    }
}
```

### get 方法

```java
public V get(Object key) {
    Node<K,V> e;
    if ((e = getNode(hash(key), key)) == null)
        return null;
    // 如果是访问顺序，将访问的节点移到末尾
    if (accessOrder)
        afterNodeAccess(e);
    return e.value;
}

/**
 * 将节点移动到双向链表末尾（访问顺序模式下）
 */
void afterNodeAccess(Node<K,V> e) {
    LinkedHashMap.Entry<K,V> last;
    if (accessOrder && (last = tail) != e) {
        LinkedHashMap.Entry<K,V> p = (LinkedHashMap.Entry<K,V>)e;
        LinkedHashMap.Entry<K,V> b = p.before;
        LinkedHashMap.Entry<K,V> a = p.after;
        p.after = null;
        
        if (b == null)
            head = a;
        else
            b.after = a;
        if (a != null)
            a.before = b;
        else
            last = b;
        if (last == null)
            head = p;
        else {
            p.before = last;
            last.after = p;
        }
        tail = p;
        ++modCount;
    }
}
```

### 删除节点后的处理

```java
/**
 * 节点被删除后，从双向链表中移除
 */
void afterNodeRemoval(Node<K,V> e) {
    LinkedHashMap.Entry<K,V> p = (LinkedHashMap.Entry<K,V>)e;
    LinkedHashMap.Entry<K,V> b = p.before;
    LinkedHashMap.Entry<K,V> a = p.after;
    p.before = p.after = null;
    
    if (b == null)
        head = a;
    else
        b.after = a;
    if (a == null)
        tail = b;
    else
        a.before = b;
}
```

### removeEldestEntry 方法

这是一个钩子方法，用于实现 LRU 缓存：

```java
/**
 * 是否删除最老的元素
 * 默认返回 false，子类可重写实现 LRU 缓存
 */
protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
    return false;
}
```

## 实现 LRU 缓存

利用 LinkedHashMap 可以轻松实现 LRU 缓存：

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxSize;
    
    public LRUCache(int maxSize) {
        // 设置 accessOrder 为 true，按访问顺序排序
        super(maxSize, 0.75f, true);
        this.maxSize = maxSize;
    }
    
    /**
     * 当元素数量超过 maxSize 时，删除最老的元素
     */
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxSize;
    }
}
```

使用示例：

```java
public class LRUCacheDemo {
    public static void main(String[] args) {
        LRUCache<String, Integer> cache = new LRUCache<>(3);
        
        cache.put("a", 1);
        cache.put("b", 2);
        cache.put("c", 3);
        System.out.println(cache);  // {a=1, b=2, c=3}
        
        cache.get("a");  // 访问 a，将 a 移到末尾
        System.out.println(cache);  // {b=2, c=3, a=1}
        
        cache.put("d", 4);  // 添加 d，超过容量，删除最老的 b
        System.out.println(cache);  // {c=3, a=1, d=4}
    }
}
```

## 遍历顺序示例

### 插入顺序（默认）

```java
LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
map.put("c", 3);
map.put("a", 1);
map.put("b", 2);

// 按插入顺序遍历
for (String key : map.keySet()) {
    System.out.print(key + " ");  // c a b
}
```

### 访问顺序

```java
LinkedHashMap<String, Integer> map = new LinkedHashMap<>(16, 0.75f, true);
map.put("c", 3);
map.put("a", 1);
map.put("b", 2);

map.get("c");  // 访问 c

// 按访问顺序遍历（最近访问的在最后）
for (String key : map.keySet()) {
    System.out.print(key + " ");  // a b c
}
```

## LinkedHashMap vs HashMap

| 特性     | HashMap            | LinkedHashMap                 |
| -------- | ------------------ | ----------------------------- |
| 遍历顺序 | 无序               | 有序（插入/访问顺序）         |
| 数据结构 | 数组 + 链表/红黑树 | 数组 + 链表/红黑树 + 双向链表 |
| 内存占用 | 较少               | 较多（额外的链表指针）        |
| 性能     | 略高               | 略低（维护链表开销）          |
| 适用场景 | 一般场景           | 需要保持顺序、LRU 缓存        |

## 小结

- LinkedHashMap 继承自 HashMap，在 HashMap 基础上增加了双向链表维护顺序
- 支持**插入顺序**和**访问顺序**两种遍历方式
- 通过重写 `removeEldestEntry` 方法可以轻松实现 **LRU 缓存**
- 相比 HashMap 有额外的内存和性能开销
- 适用于需要保持元素顺序的场景
