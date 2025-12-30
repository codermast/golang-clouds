---
order : 2
---

# List - LinkedList 源码解析

![](/assets/java/core/list-linkedlist/2024-03-24-22-48-48.png)

## 介绍

LinkedList 是一个同时实现了 List 和 Deque 接口的双向链表，既可以被看做是一个顺序集合，也可以看做是一个队列，又可以看做为一个栈。

1. 双向链表结构
    - LinkedList 内部使用双向链表来存储元素，每个节点包含了对前一个节点和后一个节点的引用。
    - 这种结构使得在任意位置进行删除和插入操作的时间复杂度是 O(1)。
2. 实现接口
    - 实现了 List 接口，故可以存储一组有序元素，并且支持通过索引访问、插入、删除等操作。
    - 实现了 Deque 接口，提供了双端队列的功能，故可以从队列的两端进行元素的插入和删除操作。

3. 特点和优势
    - 节点逻辑有序：LinkedList 中的所有数据节点，是通过引用来连接起来，在物理存储上是随机分配的。
    - 支持动态增长：LinkedList 的容量可以动态增长，不必要像数组预先分配指定大小且连续的空间。
    - 插入和删除效率高：因为其底层是通过引用连接起来的，故对其操作时仅需更改与其相连接的结点的引用即可。
    - 线程不安全的：是非线程安全的，在并发环境下使用，需要考虑同步操作或者改用其他线程安全的类，如 `java.util.concurrent.ConcurrentLinkedDeque`。

4. 适用场景
    - 不需要频繁的随机访问数据，需要频繁的添加、修改、删除操作，特别是在中间位置时推荐使用。
    - 对存储占用不敏感的情况，因为其是通过引用连接起来的，所以相较于数组而言，存储了较多的辅助信息，故存储消耗比 ArrayList 大。

## 常用API

1. 添加元素

- add(E e)：向链表尾部添加元素 e。
- add(int index, E element)：在指定位置 index 插入元素 element。

2. 获取元素

- get(int index)：获取指定位置 index 的元素。
- getFirst()：获取链表的第一个元素。
- getLast()：获取链表的最后一个元素。

3. 移除元素

- remove(int index)：移除指定位置 index 的元素。
- removeFirst()：移除链表的第一个元素。
- removeLast()：移除链表的最后一个元素。

4. 替换元素

- set(int index, E element)：替换指定位置 index 的元素为 element。

5. 查询元素位置

- indexOf(Object o)：返回元素 o 在链表中第一次出现的位置。
- lastIndexOf(Object o)：返回元素 o 在链表中最后一次出现的位置。

6. 链表操作

- addFirst(E e)：在链表头部添加元素 e。
- addLast(E e)：在链表尾部添加元素 e。
- offer(E e)：向链表尾部添加元素，返回是否成功。
- offerFirst(E e)：向链表头部添加元素，返回是否成功。
- offerLast(E e)：向链表尾部添加元素，返回是否成功。
- poll()：移除并返回链表头部的元素。
- pollFirst()：移除并返回链表的第一个元素。
- pollLast()：移除并返回链表的最后一个元素。
- peek()：返回链表头部的元素，不移除。
- peekFirst()：返回链表的第一个元素，不移除。
- peekLast()：返回链表的最后一个元素，不移除。
- push(E e)：在链表头部添加元素 e，等效于 addFirst。
- pop()：移除并返回链表头部的元素，等效于 removeFirst。

7. 其他方法

- isEmpty()：判断链表是否为空。
- size()：返回链表的大小（元素个数）。
- clear()：清空链表中的所有元素。
- contains(Object o)：判断链表是否包含元素 o。

## 实现方式

### 底层存储

LinkedList 的底层通过双向链表实现，底层主要是通过头指针、尾指针、元素个数这三个值来进行存储的。

- size：元素个数，或链表长度
- first：指向链表的头节点
- last：指向链表的末尾节点
::: tip 注意
这里要注意的是，当链表为空的时候 first 和 last 引用都指向null。
:::

- 底层实现源码

```java
transient int size;

/**
 * Pointer to first node.
 * Invariant: (first == null && last == null) ||
 *            (first.prev == null && first.item != null)
 */
transient Node<E> first;

/**
 * Pointer to last node.
 * Invariant: (first == null && last == null) ||
 *            (last.next == null && last.item != null)
 */
transient Node<E> last;
```

- Node类：其是 LinkedList 的静态私有内部类

```java
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;

    Node(Node<E> prev, E element, Node<E> next) {
        this.item = element;
        this.next = next;
        this.prev = prev;
    }
}
```

### 构造方法

LinkedList 中提供了两个构造方法：
- `LinkedList()`：创建一个空集合
- `LinkedList(Collection<? extends E> var1)`：创建一个指定元素列表的集合

```java
/**
 * Constructs an empty list.
 */
public LinkedList() {
    this.size = 0;
}

/**
 * Constructs a list containing the elements of the specified
 * collection, in the order they are returned by the collection's
 * iterator.
 *
 * @param  c the collection whose elements are to be placed into this list
 * @throws NullPointerException if the specified collection is null
 */
public LinkedList(Collection<? extends E> c) {
    this();
    this.addAll(c);
}
```
### add方法
LinkedList 中向集合中添加元素的操作，提供了 6 个不同的实现方法：`add(E e)`、`add(int index, E element)`、`addAll(Collection<? extends E> c)`、`addAll(int index, Collection<? extends E> c)`、`addFirst(E e)`、`addLast(E e)`

- add(E e)：向链表尾部添加元素 e。

```java
/**
 * Appends the specified element to the end of this list.
 *
 * <p>This method is equivalent to {@link #addLast}.
 *
 * @param e element to be appended to this list
 * @return {@code true} (as specified by {@link Collection#add})
 */
public boolean add(E e) {
    linkLast(e);
    return true;
}
```

- add(int index, E element)：在指定位置 index 插入元素 element。

```java
/**
 * Inserts the specified element at the specified position in this list.
 * Shifts the element currently at that position (if any) and any
 * subsequent elements to the right (adds one to their indices).
 *
 * @param index index at which the specified element is to be inserted
 * @param element element to be inserted
 * @throws IndexOutOfBoundsException {@inheritDoc}
 */
public void add(int index, E element) {
    checkPositionIndex(index);

    if (index == size)
        linkLast(element);
    else
        linkBefore(element, node(index));
}
```

- addAll(Collection<? extends E> c)

```java
/**
 * Appends all of the elements in the specified collection to the end of
 * this list, in the order that they are returned by the specified
 * collection's iterator.  The behavior of this operation is undefined if
 * the specified collection is modified while the operation is in
 * progress.  (Note that this will occur if the specified collection is
 * this list, and it's nonempty.)
 *
 * @param c collection containing elements to be added to this list
 * @return {@code true} if this list changed as a result of the call
 * @throws NullPointerException if the specified collection is null
 */
public boolean addAll(Collection<? extends E> c) {
    return addAll(size, c);
}
```

- addAll(int index, Collection<? extends E> c)

```java
/**
 * Inserts all of the elements in the specified collection into this
 * list, starting at the specified position.  Shifts the element
 * currently at that position (if any) and any subsequent elements to
 * the right (increases their indices).  The new elements will appear
 * in the list in the order that they are returned by the
 * specified collection's iterator.
 *
 * @param index index at which to insert the first element
 *              from the specified collection
 * @param c collection containing elements to be added to this list
 * @return {@code true} if this list changed as a result of the call
 * @throws IndexOutOfBoundsException {@inheritDoc}
 * @throws NullPointerException if the specified collection is null
 */
public boolean addAll(int index, Collection<? extends E> c) {
    checkPositionIndex(index);

    Object[] a = c.toArray();
    int numNew = a.length;
    if (numNew == 0)
        return false;

    Node<E> pred, succ;
    if (index == size) {
        succ = null;
        pred = last;
    } else {
        succ = node(index);
        pred = succ.prev;
    }

    for (Object o : a) {
        @SuppressWarnings("unchecked") E e = (E) o;
        Node<E> newNode = new Node<>(pred, e, null);
        if (pred == null)
            first = newNode;
        else
            pred.next = newNode;
        pred = newNode;
    }

    if (succ == null) {
        last = pred;
    } else {
        pred.next = succ;
        succ.prev = pred;
    }

    size += numNew;
    modCount++;
    return true;
}
```

- addFirst(E e)：向链表头部插入元素 e

```java
/**
 * Inserts the specified element at the beginning of this list.
 *
 * @param e the element to add
 */
public void addFirst(E e) {
    linkFirst(e);
}
```

- addLast(E e)：向链表尾部插入元素 e

```java
/**
 * Appends the specified element to the end of this list.
 *
 * <p>This method is equivalent to {@link #add}.
 *
 * @param e the element to add
 */
public void addLast(E e) {
    linkLast(e);
}
```

从上面和 Add 操作相关的方法源码不难看出，绝大多数的实现都是基于 
- `linkFirst(E e)`（向链表头部插入元素 e）
- `linkLast(E e)` ：（向链表尾部插入元素 e）

这两个方法实现的。下面对这两个方法的源码进行解析：

```java
/**
 * Links e as first element.
 */
private void linkFirst(E e) {
    final Node<E> f = first;
    final Node<E> newNode = new Node<>(null, e, f);
    first = newNode;
    if (f == null)
        last = newNode;
    else
        f.prev = newNode;
    size++;
    modCount++;
}

/**
 * Links e as last element.
 */
void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}
```

### get方法
LinkedList 中提供了 3 个关于获取元素的方法：get(int index)、getFirst()、getLast()

- get(int index)：获取指定下标的元素

```java
/**
 * Returns the element at the specified position in this list.
 *
 * @param index index of the element to return
 * @return the element at the specified position in this list
 * @throws IndexOutOfBoundsException {@inheritDoc}
 */
public E get(int index) {
    checkElementIndex(index);
    return node(index).item;
}
```

- getFirst()：获取首元素

```java
/**
 * Returns the first element in this list.
 *
 * @return the first element in this list
 * @throws NoSuchElementException if this list is empty
 */
public E getFirst() {
    final Node<E> f = first;
    if (f == null)
        throw new NoSuchElementException();
    return f.item;
}
```

- getLast()：获取末尾元素

```java
/**
 * Returns the last element in this list.
 *
 * @return the last element in this list
 * @throws NoSuchElementException if this list is empty
 */
public E getLast() {
    final Node<E> l = last;
    if (l == null)
        throw new NoSuchElementException();
    return l.item;
}
```

### remove方法

LinkedList 中提供了 7 个关于删除元素的方法：remove()、remove(int index)、remove(Object o)、removeFirst()、removeLast()、removeFirstOccurrence(Object o)、removeLastOccurrence(Object o)

- remove()：删除头节点引用

```java
/**
 * Retrieves and removes the head (first element) of this list.
 *
 * @return the head of this list
 * @throws NoSuchElementException if this list is empty
 * @since 1.5
 */
public E remove() {
    return removeFirst();
}
```
- remove(int index)：删除索引为 index 的引用

```java
/**
 * Removes the element at the specified position in this list.  Shifts any
 * subsequent elements to the left (subtracts one from their indices).
 * Returns the element that was removed from the list.
 *
 * @param index the index of the element to be removed
 * @return the element previously at the specified position
 * @throws IndexOutOfBoundsException {@inheritDoc}
 */
public E remove(int index) {
    checkElementIndex(index);
    return unlink(node(index));
}
```
- remove(Object o)：删除列表中元素 o 第一次出现的引用

```java
/**
 * Removes the first occurrence of the specified element from this list,
 * if it is present.  If this list does not contain the element, it is
 * unchanged.  More formally, removes the element with the lowest index
 * {@code i} such that
 * <tt>(o==null&nbsp;?&nbsp;get(i)==null&nbsp;:&nbsp;o.equals(get(i)))</tt>
 * (if such an element exists).  Returns {@code true} if this list
 * contained the specified element (or equivalently, if this list
 * changed as a result of the call).
 *
 * @param o element to be removed from this list, if present
 * @return {@code true} if this list contained the specified element
 */
public boolean remove(Object o) {
    if (o == null) {
        for (Node<E> x = first; x != null; x = x.next) {
            if (x.item == null) {
                unlink(x);
                return true;
            }
        }
    } else {
        for (Node<E> x = first; x != null; x = x.next) {
            if (o.equals(x.item)) {
                unlink(x);
                return true;
            }
        }
    }
    return false;
}
```
- removeFirst()：删除列表中第一个元素

```java
/**
 * Removes and returns the first element from this list.
 *
 * @return the first element from this list
 * @throws NoSuchElementException if this list is empty
 */
public E removeFirst() {
    final Node<E> f = first;
    if (f == null)
        throw new NoSuchElementException();
    return unlinkFirst(f);
}
```
- removeLast()：删除列表中的最后一个元素

```java
/**
 * Removes and returns the last element from this list.
 *
 * @return the last element from this list
 * @throws NoSuchElementException if this list is empty
 */
public E removeLast() {
    final Node<E> l = last;
    if (l == null)
        throw new NoSuchElementException();
    return unlinkLast(l);
}
```

- removeFirstOccurrence(Object o)：从头向后遍历，删除此列表中指定元素的第一个引用，如果不包含该元素，则列表保持不变。

```java
/**
 * Removes the first occurrence of the specified element in this
 * list (when traversing the list from head to tail).  If the list
 * does not contain the element, it is unchanged.
 *
 * @param o element to be removed from this list, if present
 * @return {@code true} if the list contained the specified element
 * @since 1.6
 */
public boolean removeFirstOccurrence(Object o) {
    return remove(o);
}
```
- removeLastOccurrence(Object o)：从头向后遍历，删除此列表中指定元素的最后一个引用，如果不包含该元素，则列表保持不变。
```java
/**
 * Removes the last occurrence of the specified element in this
 * list (when traversing the list from head to tail).  If the list
 * does not contain the element, it is unchanged.
 *
 * @param o element to be removed from this list, if present
 * @return {@code true} if the list contained the specified element
 * @since 1.6
 */
public boolean removeLastOccurrence(Object o) {
    if (o == null) {
        for (Node<E> x = last; x != null; x = x.prev) {
            if (x.item == null) {
                unlink(x);
                return true;
            }
        }
    } else {
        for (Node<E> x = last; x != null; x = x.prev) {
            if (o.equals(x.item)) {
                unlink(x);
                return true;
            }
        }
    }
    return false;
}
```

### set方法

LindedList 中修改指定索引位置的元素为 element。

- set(int index,E element)

```java
/**
 * Replaces the element at the specified position in this list with the
 * specified element.
 *
 * @param index index of the element to replace
 * @param element element to be stored at the specified position
 * @return the element previously at the specified position
 * @throws IndexOutOfBoundsException {@inheritDoc}
 */
public E set(int index, E element) {
    checkElementIndex(index);
    Node<E> x = node(index);
    E oldVal = x.item;
    x.item = element;
    return oldVal;
}
```

### clear方法

LinkedList 中提供的 clear 方法清空该链表/集合中的所有元素。

- clear()

```java
/**
 * Removes all of the elements from this list.
 * The list will be empty after this call returns.
 */
public void clear() {
    // Clearing all of the links between nodes is "unnecessary", but:
    // - helps a generational GC if the discarded nodes inhabit
    //   more than one generation
    // - is sure to free memory even if there is a reachable Iterator
    for (Node<E> x = first; x != null; ) {
        Node<E> next = x.next;
        x.item = null;
        x.next = null;
        x.prev = null;
        x = next;
    }
    first = last = null;
    size = 0;
    modCount++;
}
```

### index方法

LinkedList 中提供的 indexOf(Object o) 方法可以查找链表中第一次出现元素 o 的索引下标。

- indexOf(Object o)

```java
/**
 * Returns the index of the first occurrence of the specified element
 * in this list, or -1 if this list does not contain the element.
 * More formally, returns the lowest index {@code i} such that
 * <tt>(o==null&nbsp;?&nbsp;get(i)==null&nbsp;:&nbsp;o.equals(get(i)))</tt>,
 * or -1 if there is no such index.
 *
 * @param o element to search for
 * @return the index of the first occurrence of the specified element in
 *         this list, or -1 if this list does not contain the element
 */
public int indexOf(Object o) {
    int index = 0;
    if (o == null) {
        for (Node<E> x = first; x != null; x = x.next) {
            if (x.item == null)
                return index;
            index++;
        }
    } else {
        for (Node<E> x = first; x != null; x = x.next) {
            if (o.equals(x.item))
                return index;
            index++;
        }
    }
    return -1;
}
```

### Queue接口方法

Queue 接口是单向队列的接口，提供了对队列的主要操作方法：

- peek()：查看队列顶端元素，也就是出口处元素
- poll()：返回队列顶端元素，并且将该元素出队列
- remove()：移除队首元素
- offer(E e)：将元素 e 入队

```java
/**
 * Retrieves, but does not remove, the head (first element) of this list.
 *
 * @return the head of this list, or {@code null} if this list is empty
 * @since 1.5
 */
public E peek() {
    final Node<E> f = first;
    return (f == null) ? null : f.item;
}

/**
 * Retrieves, but does not remove, the head (first element) of this list.
 *
 * @return the head of this list
 * @throws NoSuchElementException if this list is empty
 * @since 1.5
 */
public E element() {
    return getFirst();
}

/**
 * Retrieves and removes the head (first element) of this list.
 *
 * @return the head of this list, or {@code null} if this list is empty
 * @since 1.5
 */
public E poll() {
    final Node<E> f = first;
    return (f == null) ? null : unlinkFirst(f);
}

/**
 * Retrieves and removes the head (first element) of this list.
 *
 * @return the head of this list
 * @throws NoSuchElementException if this list is empty
 * @since 1.5
 */
public E remove() {
    return removeFirst();
}

/**
 * Adds the specified element as the tail (last element) of this list.
 *
 * @param e the element to add
 * @return {@code true} (as specified by {@link Queue#offer})
 * @since 1.5
 */
public boolean offer(E e) {
    return add(e);
}
```

### Deque接口方法

Deque 双向队列接口继承自 Queue 队列接口，主要提供了双向队列相关的一些操作方法：

- offerFirst(E e)：从队头插入元素
- offerLast(E e)：从队位插入元素
- peekFirst()：查看队头元素
- peekLast()：查看队尾元素
- pollFirst()：弹出对头元素
- pollLast()：弹出队尾元素
- push(E e)：从队头将元素 e 入队
- pop()：出队一个元素
- removeFirstOccurrence(Object o)：删除元素 o 第一次出现的引用
- removeLastOccurrence(Object o)：删除元素 o 最后一次出现的引用


```java
/**
 * Inserts the specified element at the front of this list.
 *
 * @param e the element to insert
 * @return {@code true} (as specified by {@link Deque#offerFirst})
 * @since 1.6
 */
public boolean offerFirst(E e) {
    addFirst(e);
    return true;
}

/**
 * Inserts the specified element at the end of this list.
 *
 * @param e the element to insert
 * @return {@code true} (as specified by {@link Deque#offerLast})
 * @since 1.6
 */
public boolean offerLast(E e) {
    addLast(e);
    return true;
}

/**
 * Retrieves, but does not remove, the first element of this list,
 * or returns {@code null} if this list is empty.
 *
 * @return the first element of this list, or {@code null}
 *         if this list is empty
 * @since 1.6
 */
public E peekFirst() {
    final Node<E> f = first;
    return (f == null) ? null : f.item;
    }

/**
 * Retrieves, but does not remove, the last element of this list,
 * or returns {@code null} if this list is empty.
 *
 * @return the last element of this list, or {@code null}
 *         if this list is empty
 * @since 1.6
 */
public E peekLast() {
    final Node<E> l = last;
    return (l == null) ? null : l.item;
}

/**
 * Retrieves and removes the first element of this list,
 * or returns {@code null} if this list is empty.
 *
 * @return the first element of this list, or {@code null} if
 *     this list is empty
 * @since 1.6
 */
public E pollFirst() {
    final Node<E> f = first;
    return (f == null) ? null : unlinkFirst(f);
}

/**
 * Retrieves and removes the last element of this list,
 * or returns {@code null} if this list is empty.
 *
 * @return the last element of this list, or {@code null} if
 *     this list is empty
 * @since 1.6
 */
public E pollLast() {
    final Node<E> l = last;
    return (l == null) ? null : unlinkLast(l);
}

/**
 * Pushes an element onto the stack represented by this list.  In other
 * words, inserts the element at the front of this list.
 *
 * <p>This method is equivalent to {@link #addFirst}.
 *
 * @param e the element to push
 * @since 1.6
 */
public void push(E e) {
    addFirst(e);
}

/**
 * Pops an element from the stack represented by this list.  In other
 * words, removes and returns the first element of this list.
 *
 * <p>This method is equivalent to {@link #removeFirst()}.
 *
 * @return the element at the front of this list (which is the top
 *         of the stack represented by this list)
 * @throws NoSuchElementException if this list is empty
 * @since 1.6
 */
public E pop() {
    return removeFirst();
}

/**
 * Removes the first occurrence of the specified element in this
 * list (when traversing the list from head to tail).  If the list
 * does not contain the element, it is unchanged.
 *
 * @param o element to be removed from this list, if present
 * @return {@code true} if the list contained the specified element
 * @since 1.6
 */
public boolean removeFirstOccurrence(Object o) {
    return remove(o);
}

/**
 * Removes the last occurrence of the specified element in this
 * list (when traversing the list from head to tail).  If the list
 * does not contain the element, it is unchanged.
 *
 * @param o element to be removed from this list, if present
 * @return {@code true} if the list contained the specified element
 * @since 1.6
 */
public boolean removeLastOccurrence(Object o) {
    if (o == null) {
        for (Node<E> x = last; x != null; x = x.prev) {
            if (x.item == null) {
                unlink(x);
                return true;
            }
        }
    } else {
        for (Node<E> x = last; x != null; x = x.prev) {
            if (o.equals(x.item)) {
                unlink(x);
                return true;
            }
        }
    }
    return false;
}
```