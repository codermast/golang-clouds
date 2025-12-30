---
order : 7
---
# Set - HashSet源码解析

::: tip 写在前面
本篇主要是对 Java 中 HashSet 的源码解析，在 Java 中 HashSet 的底层实现是依赖于 HashMap 的，存储元素的容器是一个 Map 集合，仅仅通过方法的包装来实现 Set 接口，故本篇不再赘述 HashMap 的底层存储逻辑，详情请看[《Map - HashMap源码解析》](https://www.codermast.com/java/collection/map-hashmap.html)。
:::

## 介绍

HashSet 基于 HashMap 底层实现，是一个不允许重复 Key 的集合，其值的存储是无序的。HashSet 和 HashMap 一样，允许且仅允许一个为 null 的 key，由于 HashMap 是线性不安全的，故 HashSet 也是线性不安全的。

## 底层实现

查阅 HashSet 源码不难看出，HashSet 的底层是通过一个 HashMap 对象来存储的。

```java
private transient HashMap<E,Object> map;
```

### 构造方法

```java
public HashSet() {
    map = new HashMap<>();
}

public HashSet(Collection<? extends E> c) {
    map = new HashMap<>(Math.max((int) (c.size()/.75f) + 1, 16));
    addAll(c);
}

public HashSet(int initialCapacity, float loadFactor) {
    map = new HashMap<>(initialCapacity, loadFactor);
}

public HashSet(int initialCapacity) {
    map = new HashMap<>(initialCapacity);
}

HashSet(int initialCapacity, float loadFactor, boolean dummy) {
    map = new LinkedHashMap<>(initialCapacity, loadFactor);
}
```
### add方法

```java
public boolean add(E e) {
    return map.put(e, PRESENT)==null;
}
```

这里的 PRESENT 是在 HashSet 中定义的一个 Object 类型的静态常量

```java
// Dummy value to associate with an Object in the backing Map
private static final Object PRESENT = new Object();
```

### size方法

```java
public int size() {
    return map.size();
}
```

### isEmpty方法

```java
public boolean isEmpty() {
    return map.isEmpty();
}
```

### contains方法

```java
public boolean contains(Object o) {
    return map.containsKey(o);
}
```

### clear方法

```java
public void clear() {
    map.clear();
}
```