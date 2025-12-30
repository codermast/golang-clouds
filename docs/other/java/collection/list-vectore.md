---
order : 3
---

# List - Vector 源码解析

## 介绍

Vector 是 Java 早期提供的线程安全的动态数组实现，与 ArrayList 类似，底层也是基于数组实现的。Vector 的主要特点是所有公共方法都使用 `synchronized` 修饰，保证了线程安全性，但也因此在单线程环境下性能较差。

Vector 的特点：
- **线程安全**：所有方法都是同步的
- **动态扩容**：默认扩容为原来的 2 倍（ArrayList 是 1.5 倍）
- **有序集合**：元素按照插入顺序存储
- **允许 null 值**：可以存储 null 元素
- **遗留类**：JDK 1.0 就存在，现已不推荐使用

::: warning 不推荐使用
在实际开发中，不推荐使用 Vector。如果需要线程安全的 List，可以使用：
- `Collections.synchronizedList(new ArrayList<>())`
- `CopyOnWriteArrayList`（适合读多写少场景）
:::

## 常用 API

|           方法名            |         功能         |
| :-------------------------: | :------------------: |
|         `add(E e)`          |    添加元素到末尾    |
| `add(int index, E element)` |  在指定位置插入元素  |
|      `get(int index)`       |  获取指定位置的元素  |
| `set(int index, E element)` |  修改指定位置的元素  |
|     `remove(int index)`     |  删除指定位置的元素  |
|     `remove(Object o)`      |     删除指定元素     |
|          `size()`           |     获取元素个数     |
|         `isEmpty()`         |     判断是否为空     |
|    `contains(Object o)`     | 判断是否包含指定元素 |
|        `capacity()`         |     获取当前容量     |

## 底层实现

### 成员变量

```java
/**
 * 存储元素的数组缓冲区
 */
protected Object[] elementData;

/**
 * 元素个数
 */
protected int elementCount;

/**
 * 扩容增量，如果为 0 则每次扩容为原来的 2 倍
 */
protected int capacityIncrement;
```

### 构造方法

Vector 提供了四个构造方法：

```java
/**
 * 无参构造，默认容量为 10
 */
public Vector() {
    this(10);
}

/**
 * 指定初始容量
 */
public Vector(int initialCapacity) {
    this(initialCapacity, 0);
}

/**
 * 指定初始容量和扩容增量
 */
public Vector(int initialCapacity, int capacityIncrement) {
    super();
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal Capacity: " + initialCapacity);
    this.elementData = new Object[initialCapacity];
    this.capacityIncrement = capacityIncrement;
}

/**
 * 通过集合创建
 */
public Vector(Collection<? extends E> c) {
    elementData = c.toArray();
    elementCount = elementData.length;
    if (elementData.getClass() != Object[].class)
        elementData = Arrays.copyOf(elementData, elementCount, Object[].class);
}
```

### add 方法

```java
/**
 * 添加元素到末尾（同步方法）
 */
public synchronized boolean add(E e) {
    modCount++;
    ensureCapacityHelper(elementCount + 1);
    elementData[elementCount++] = e;
    return true;
}

/**
 * 在指定位置插入元素
 */
public void add(int index, E element) {
    insertElementAt(element, index);
}

/**
 * 在指定位置插入元素（同步方法）
 */
public synchronized void insertElementAt(E obj, int index) {
    modCount++;
    if (index > elementCount) {
        throw new ArrayIndexOutOfBoundsException(index + " > " + elementCount);
    }
    ensureCapacityHelper(elementCount + 1);
    System.arraycopy(elementData, index, elementData, index + 1, elementCount - index);
    elementData[index] = obj;
    elementCount++;
}
```

### get 方法

```java
/**
 * 获取指定位置的元素（同步方法）
 */
public synchronized E get(int index) {
    if (index >= elementCount)
        throw new ArrayIndexOutOfBoundsException(index);
    return elementData(index);
}

@SuppressWarnings("unchecked")
E elementData(int index) {
    return (E) elementData[index];
}
```

### remove 方法

```java
/**
 * 删除指定位置的元素
 */
public synchronized E remove(int index) {
    modCount++;
    if (index >= elementCount)
        throw new ArrayIndexOutOfBoundsException(index);
    E oldValue = elementData(index);

    int numMoved = elementCount - index - 1;
    if (numMoved > 0)
        System.arraycopy(elementData, index + 1, elementData, index, numMoved);
    elementData[--elementCount] = null; // 帮助 GC

    return oldValue;
}

/**
 * 删除指定元素
 */
public boolean remove(Object o) {
    return removeElement(o);
}

/**
 * 删除指定元素（同步方法）
 */
public synchronized boolean removeElement(Object obj) {
    modCount++;
    int i = indexOf(obj);
    if (i >= 0) {
        removeElementAt(i);
        return true;
    }
    return false;
}
```

### 扩容机制

Vector 的扩容机制与 ArrayList 不同：

```java
/**
 * 确保容量足够
 */
private void ensureCapacityHelper(int minCapacity) {
    if (minCapacity - elementData.length > 0)
        grow(minCapacity);
}

/**
 * 扩容操作
 */
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    // 如果 capacityIncrement > 0，则增加 capacityIncrement
    // 否则扩容为原来的 2 倍
    int newCapacity = oldCapacity + ((capacityIncrement > 0) ?
                                     capacityIncrement : oldCapacity);
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

::: tip 扩容对比
- **Vector**：默认扩容为原来的 **2 倍**
- **ArrayList**：扩容为原来的 **1.5 倍**
:::

## Vector vs ArrayList

| 特性     | Vector             | ArrayList |
| -------- | ------------------ | --------- |
| 线程安全 | 是（synchronized） | 否        |
| 扩容倍数 | 2 倍               | 1.5 倍    |
| 性能     | 较低               | 较高      |
| 版本     | JDK 1.0            | JDK 1.2   |
| 推荐程度 | 不推荐             | 推荐      |

## 线程安全替代方案

### 1. Collections.synchronizedList

```java
List<String> list = Collections.synchronizedList(new ArrayList<>());
```

### 2. CopyOnWriteArrayList

```java
List<String> list = new CopyOnWriteArrayList<>();
```

::: warning 注意
`CopyOnWriteArrayList` 适合读多写少的场景，写操作会复制整个数组，开销较大。
:::

## 小结

- Vector 是线程安全的动态数组，所有方法都使用 `synchronized` 修饰
- 默认初始容量为 10，默认扩容为原来的 2 倍
- 由于同步开销，性能低于 ArrayList
- 在实际开发中不推荐使用，可用 `CopyOnWriteArrayList` 或 `Collections.synchronizedList` 替代
- Stack 继承自 Vector，实现了栈的功能
