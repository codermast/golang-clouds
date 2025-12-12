---
order : 8
---
# Set - TreeSet源码解析

TreeSet 是一个 Set 集合接口的实现类，与 HashSet 类似，其底层也是通过维护了一个 TreeMap 对象来封装了一些实现方法，故本篇不再对 TreeSet 的底层原理进行详细说明，仅对常用 API 做简单介绍，如需了解 TreeMap 的底层实现原理，请移步 [Map - HashMap 源码解析](https://www.codermast.com/java/collection/map-hashmap.html)

## 介绍

TreeSet 是一个存储不重复元素的集合，存储元素有序，但并不记录元素的添加顺序，底层是通过红黑树实现的，基于 TreeMap，自定义排序。

## 底层实现

```java
private transient NavigableMap<E,Object> m;

public TreeSet() {
    this(new TreeMap<E,Object>());
}

TreeSet(NavigableMap<E,Object> m) {
    this.m = m;
}
```

由 TreeSet 的源码可见，TreeSet 的底层实际上是通过维护一个 TreeMap 对象来进行元素存取的。

### 构造方法

```java
public TreeSet() {
    this(new TreeMap<E,Object>());
}

public TreeSet(Comparator<? super E> comparator) {
    this(new TreeMap<>(comparator));
}
public TreeSet(Collection<? extends E> c) {
    this();
    addAll(c);
}

public TreeSet(SortedSet<E> s) {
    this(s.comparator());
    addAll(s);
}

TreeSet(NavigableMap<E,Object> m) {
    this.m = m;
}
```

由构造方法可以看出，TreeSet 可以通过传入一个自定义比较器来进行自定义排序。

### add方法


```java
public boolean add(E e) {
    return m.put(e, PRESENT)==null;
}

public  boolean addAll(Collection<? extends E> c) {
    // Use linear-time version if applicable
    if (m.size()==0 && c.size() > 0 &&
        c instanceof SortedSet &&
        m instanceof TreeMap) {
        SortedSet<? extends E> set = (SortedSet<? extends E>) c;
        TreeMap<E,Object> map = (TreeMap<E, Object>) m;
        Comparator<?> cc = set.comparator();
        Comparator<? super E> mc = map.comparator();
        if (cc==mc || (cc != null && cc.equals(mc))) {
            map.addAllForTreeSet(set, PRESENT);
            return true;
        }
    }
    return super.addAll(c);
}
```
这里调用了其父类 `AbstractCollection` 中的 `addAll(Collection<? extends E> c)` 方法。其父类虽然是抽象类，但是该方法并不是抽象方法，有具体的实现过程，可直接调用。

```java
public boolean addAll(Collection<? extends E> c) {
    boolean modified = false;
    for (E e : c)
        if (add(e))
            modified = true;
    return modified;
}
```

### clear方法

clear 方法的功能是清空容器内的所有元素。

```java

```

### remove方法

- 从容器中删除指定元素 o

```java
public boolean remove(Object o) {
    Iterator<E> it = iterator();
    if (o==null) {
        while (it.hasNext()) {
            if (it.next()==null) {
                it.remove();
                return true;
            }
        }
    } else {
        while (it.hasNext()) {
            if (o.equals(it.next())) {
                it.remove();
                return true;
            }
        }
    }
    return false;
}
```

- 删除所有在 集合 c 中出现过的元素

```java
    public boolean removeAll(Collection<?> c) {
        Objects.requireNonNull(c);
        boolean modified = false;
        Iterator<?> it = iterator();
        while (it.hasNext()) {
            if (c.contains(it.next())) {
                it.remove();
                modified = true;
            }
        }
        return modified;
    }
```
### size方法



