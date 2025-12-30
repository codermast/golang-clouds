---
order : 4
headerDepth : 1
---

# container

在Go语言标准库中，`container` 包提供了几种常用的数据结构实现，这些数据结构对于高效地管理和操作数据非常有用。以下是 `container` 包中主要的数据结构：

## 1. 切片（slice）

Go语言中的切片是一个动态数组，是非常常用和灵活的数据结构。切片在 `container` 包中并不单独提供，但在Go语言中广泛用于处理列表和集合数据。

::: tip <a href="/golang/core/basic/array-slice.html">「Golang - 基础知识 - 数组和切片」</a>
:::
## 2. 队列（Queue）

`container` 包提供了一个基于双链表实现的队列：

- **`list.List`**: 双向链表实现的列表，可以用作队列或者栈。

```go
package main

import (
    "container/list"
    "fmt"
)

func main() {
    // 创建一个新的链表
    myQueue := list.New()

    // 入队操作
    myQueue.PushBack("Alice")
    myQueue.PushBack("Bob")

    // 出队操作
    front := myQueue.Front()
    if front != nil {
        fmt.Println("Front:", front.Value) // 输出: Front: Alice
        myQueue.Remove(front)
    }

    // 遍历队列
    fmt.Println("Queue contents:")
    for e := myQueue.Front(); e != nil; e = e.Next() {
        fmt.Println(e.Value)
    }
}
```

## 3. 堆（Heap）

`container/heap` 包提供了堆操作的接口，但没有直接提供堆的实现，需要通过实现 `heap.Interface` 接口来使用。堆是一种优先队列，可以高效地提取最小或最大元素。

```go
package main

import (
    "container/heap"
    "fmt"
)

// 示例结构体
type Item struct {
    value    string // 值
    priority int    // 优先级
    index    int    // 在堆中的索引
}

// 实现 heap.Interface 接口
type PriorityQueue []*Item

func (pq PriorityQueue) Len() int { return len(pq) }

func (pq PriorityQueue) Less(i, j int) bool {
    return pq[i].priority < pq[j].priority
}

func (pq PriorityQueue) Swap(i, j int) {
    pq[i], pq[j] = pq[j], pq[i]
    pq[i].index = i
    pq[j].index = j
}

func (pq *PriorityQueue) Push(x interface{}) {
    item := x.(*Item)
    item.index = len(*pq)
    *pq = append(*pq, item)
}

func (pq *PriorityQueue) Pop() interface{} {
    old := *pq
    n := len(old)
    item := old[n-1]
    item.index = -1
    *pq = old[0 : n-1]
    return item
}

func main() {
    // 创建优先队列
    pq := make(PriorityQueue, 0)
    heap.Init(&pq)

    // 插入元素
    items := []*Item{
        {value: "foo", priority: 3},
        {value: "bar", priority: 1},
        {value: "baz", priority: 2},
    }

    for _, item := range items {
        heap.Push(&pq, item)
    }

    // 弹出最小元素
    for pq.Len() > 0 {
        item := heap.Pop(&pq).(*Item)
        fmt.Printf("(%s, %d) ", item.value, item.priority)
    }
    // 输出: (bar, 1) (baz, 2) (foo, 3)
}
```

## 4. 链表（List）

`container/list` 是Go语言标准库中提供的双向链表的实现，它支持高效的插入、删除和遍历操作。下面是一个简单的示例，演示了如何使用 `container/list` 包来操作双向链表：

```go
package main

import (
    "container/list"
    "fmt"
)

func main() {
    // 创建一个新的双向链表
    mylist := list.New()

    // 在链表尾部添加元素
    mylist.PushBack("Alice")
    mylist.PushBack("Bob")
    mylist.PushBack("Charlie")

    // 在链表头部添加元素
    mylist.PushFront("David")

    // 遍历链表并打印元素
    fmt.Println("List contents (forward):")
    for e := mylist.Front(); e != nil; e = e.Next() {
        fmt.Println(e.Value)
    }

    // 访问链表尾部元素
    fmt.Println("Last element:", mylist.Back().Value)

    // 删除链表中的一个元素
    secondElement := mylist.Front().Next()
    mylist.Remove(secondElement)

    // 再次遍历链表并打印元素
    fmt.Println("List contents after removal:")
    for e := mylist.Front(); e != nil; e = e.Next() {
        fmt.Println(e.Value)
    }
}
```

### 解释示例代码：

1. **创建链表和插入操作**:
   - `list.New()`: 创建一个新的空链表。
   - `PushBack(value interface{})`: 将元素添加到链表的末尾。
   - `PushFront(value interface{})`: 将元素添加到链表的头部。

2. **遍历链表**:
   - `Front()`: 获取链表的第一个元素。
   - `Back()`: 获取链表的最后一个元素。
   - `Next()`: 获取下一个节点。
   - 使用 `for` 循环遍历链表，从头到尾访问每个元素。

3. **删除操作**:
   - `Remove(e *Element)`: 从链表中移除指定的元素。

在上述示例中，我们首先创建了一个双向链表 `mylist`，然后向其中添加了几个元素。我们展示了如何从头部和尾部插入元素，以及如何遍历链表并打印每个元素。最后，我们演示了如何从链表中移除一个元素，并再次遍历链表来验证删除操作的效果。

通过 `container/list` 包，你可以方便地实现和操作双向链表，适用于需要频繁插入、删除或者遍历操作的场景，例如实现队列、栈或者其他需要动态管理元素顺序的数据结构。

## 5. 环形链表（ring）

`container/ring` 包提供了环形链表的实现，它可以方便地进行环形数据结构的操作。环形链表是一种特殊的链表，其中最后一个元素指向第一个元素，形成一个闭环。这种数据结构在循环遍历和轮转操作中非常有用。下面是一个简单的示例，演示了如何使用 `container/ring` 包来操作环形链表：

```go
package main

import (
    "container/ring"
    "fmt"
)

func main() {
    // 创建一个环形链表，初始长度为 3
    myring := ring.New(3)

    // 初始化环形链表的值
    for i := 1; i <= myring.Len(); i++ {
        myring.Value = fmt.Sprintf("Node %d", i)
        myring = myring.Next()
    }

    // 打印环形链表的所有值
    fmt.Println("Ring contents:")
    myring.Do(func(value interface{}) {
        fmt.Println(value)
    })

    // 在环形链表中轮转一次
    myring = myring.Move(1)

    // 打印轮转后的环形链表的所有值
    fmt.Println("\nAfter rotation:")
    myring.Do(func(value interface{}) {
        fmt.Println(value)
    })
}
```

### 解释示例代码：

1. **创建环形链表和初始化**:
   - `ring.New(n int)`: 创建一个包含 `n` 个元素的环形链表。
   - 使用 `for` 循环初始化环形链表的每个节点的值。

2. **遍历环形链表**:
   - `Do(func(value interface{}))`: 遍历环形链表的所有节点，并对每个节点执行指定的函数。

3. **轮转操作**:
   - `Move(n int) *Ring`: 将环形链表向前（正数）或向后（负数）轮转 `n` 个位置。

在示例中，我们首先创建了一个包含三个元素的环形链表 `myring`。然后，我们使用 `for` 循环为每个节点赋值，然后打印环形链表的所有值。接下来，我们对环形链表进行一次轮转操作，将链表向前移动一个位置，再次打印轮转后的环形链表的所有值。

通过 `container/ring` 包，你可以方便地实现和操作环形链表，这种数据结构在需要循环遍历或轮转操作的场景中非常有用，例如实现循环队列、任务调度等。
