---
order : 6
---

# 原子类

Java 原子类（Atomic Classes）提供了一种无锁的线程安全方式，基于 CAS（Compare-And-Swap）操作实现。

## CAS 原理

CAS（Compare-And-Swap）是一种乐观锁机制：

```
比较并交换：
1. 读取当前值 V
2. 计算新值 N
3. 如果当前值仍然是 V，则更新为 N
4. 如果当前值不是 V，则重试
```

### CAS 伪代码

```java
public boolean compareAndSwap(int expectedValue, int newValue) {
    // 原子操作（硬件级别保证）
    if (this.value == expectedValue) {
        this.value = newValue;
        return true;
    }
    return false;
}
```

### CAS 的优缺点

| 优点           | 缺点                     |
| -------------- | ------------------------ |
| 无锁，性能高   | ABA 问题                 |
| 避免死锁       | 自旋开销                 |
| 适合低竞争场景 | 只能保证单个变量的原子性 |

## 基本原子类

### AtomicInteger

```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicIntegerDemo {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger counter = new AtomicInteger(0);
        
        // 多线程安全递增
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    counter.incrementAndGet();  // 原子递增
                }
            });
            threads[i].start();
        }
        
        for (Thread t : threads) {
            t.join();
        }
        
        System.out.println("结果：" + counter.get());  // 10000
    }
}
```

### 常用方法

```java
AtomicInteger ai = new AtomicInteger(0);

// 获取值
int value = ai.get();

// 设置值
ai.set(10);

// 获取并设置
int old = ai.getAndSet(20);

// 递增/递减
ai.incrementAndGet();  // ++i
ai.getAndIncrement();  // i++
ai.decrementAndGet();  // --i
ai.getAndDecrement();  // i--

// 加/减指定值
ai.addAndGet(5);       // 加 5 并返回新值
ai.getAndAdd(5);       // 返回旧值并加 5

// CAS 操作
boolean success = ai.compareAndSet(20, 30);  // 期望值 20，新值 30

// 自定义更新
ai.updateAndGet(x -> x * 2);  // 更新为 x * 2
ai.getAndUpdate(x -> x * 2);  // 获取旧值，更新为 x * 2

// 累加器
ai.accumulateAndGet(10, Integer::sum);  // 与 10 累加
```

### AtomicLong

用法与 AtomicInteger 相同，用于 long 类型。

```java
AtomicLong counter = new AtomicLong(0L);
counter.incrementAndGet();
```

### AtomicBoolean

```java
AtomicBoolean flag = new AtomicBoolean(false);

// 原子设置
flag.set(true);

// CAS 设置
boolean success = flag.compareAndSet(true, false);

// 获取并设置
boolean old = flag.getAndSet(true);
```

## 引用原子类

### AtomicReference

用于对象引用的原子操作。

```java
import java.util.concurrent.atomic.AtomicReference;

public class AtomicReferenceDemo {
    public static void main(String[] args) {
        AtomicReference<User> userRef = new AtomicReference<>(new User("Alice", 20));
        
        // 原子更新
        User oldUser = userRef.get();
        User newUser = new User("Bob", 25);
        boolean success = userRef.compareAndSet(oldUser, newUser);
        
        System.out.println("更新成功：" + success);
        System.out.println("当前用户：" + userRef.get());
    }
}

class User {
    String name;
    int age;
    
    User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + '}';
    }
}
```

### AtomicStampedReference - 解决 ABA 问题

ABA 问题：值从 A 变为 B 再变回 A，CAS 无法检测到这种变化。

```java
import java.util.concurrent.atomic.AtomicStampedReference;

public class AtomicStampedReferenceDemo {
    public static void main(String[] args) {
        // 初始值 100，版本号 1
        AtomicStampedReference<Integer> ref = new AtomicStampedReference<>(100, 1);
        
        int[] stampHolder = new int[1];
        Integer value = ref.get(stampHolder);
        int stamp = stampHolder[0];
        
        System.out.println("初始值：" + value + "，版本号：" + stamp);
        
        // CAS 更新（需要匹配值和版本号）
        boolean success = ref.compareAndSet(100, 200, stamp, stamp + 1);
        System.out.println("更新成功：" + success);
        
        // 获取当前值和版本号
        value = ref.get(stampHolder);
        System.out.println("当前值：" + value + "，版本号：" + stampHolder[0]);
    }
}
```

### AtomicMarkableReference

使用布尔标记代替版本号。

```java
import java.util.concurrent.atomic.AtomicMarkableReference;

AtomicMarkableReference<String> ref = new AtomicMarkableReference<>("hello", false);

// 获取值和标记
boolean[] markHolder = new boolean[1];
String value = ref.get(markHolder);
boolean mark = markHolder[0];

// CAS 更新
ref.compareAndSet("hello", "world", false, true);
```

## 数组原子类

### AtomicIntegerArray

```java
import java.util.concurrent.atomic.AtomicIntegerArray;

public class AtomicIntegerArrayDemo {
    public static void main(String[] args) {
        AtomicIntegerArray array = new AtomicIntegerArray(10);
        
        // 设置指定索引的值
        array.set(0, 100);
        
        // 原子递增
        array.incrementAndGet(0);
        
        // CAS 更新
        array.compareAndSet(0, 101, 200);
        
        // 获取值
        int value = array.get(0);
        System.out.println("array[0] = " + value);
    }
}
```

### AtomicLongArray

```java
AtomicLongArray array = new AtomicLongArray(10);
array.set(0, 100L);
array.incrementAndGet(0);
```

### AtomicReferenceArray

```java
AtomicReferenceArray<String> array = new AtomicReferenceArray<>(10);
array.set(0, "hello");
array.compareAndSet(0, "hello", "world");
```

## 字段原子更新器

用于原子更新对象的某个字段，无需将整个对象变为原子类。

### AtomicIntegerFieldUpdater

```java
import java.util.concurrent.atomic.AtomicIntegerFieldUpdater;

public class AtomicFieldUpdaterDemo {
    public static void main(String[] args) {
        // 创建更新器
        AtomicIntegerFieldUpdater<Account> updater = 
            AtomicIntegerFieldUpdater.newUpdater(Account.class, "balance");
        
        Account account = new Account(1000);
        
        // 原子更新
        updater.incrementAndGet(account);
        updater.addAndGet(account, 100);
        
        System.out.println("余额：" + account.balance);
    }
}

class Account {
    // 必须是 volatile 且非 private
    volatile int balance;
    
    Account(int balance) {
        this.balance = balance;
    }
}
```

### 使用限制

::: warning 注意
- 字段必须是 `volatile` 修饰
- 字段不能是 `private`（更新器类访问不到）
- 字段不能是 `static`
:::

## 累加器（JDK 8+）

针对高并发累加场景优化，性能优于 AtomicLong。

### LongAdder

```java
import java.util.concurrent.atomic.LongAdder;

public class LongAdderDemo {
    public static void main(String[] args) throws InterruptedException {
        LongAdder adder = new LongAdder();
        
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 100000; j++) {
                    adder.increment();  // 累加
                }
            });
            threads[i].start();
        }
        
        for (Thread t : threads) {
            t.join();
        }
        
        System.out.println("结果：" + adder.sum());  // 获取总和
    }
}
```

### LongAdder vs AtomicLong

| 特性       | AtomicLong         | LongAdder             |
| ---------- | ------------------ | --------------------- |
| 实现       | 单个变量 CAS       | 分散热点，多个 Cell   |
| 低竞争性能 | 好                 | 稍差（Cell 管理开销） |
| 高竞争性能 | 差（CAS 频繁失败） | 好                    |
| 获取精确值 | 简单               | 需要汇总所有 Cell     |

### LongAccumulator

更通用的累加器，支持自定义累加函数。

```java
import java.util.concurrent.atomic.LongAccumulator;

// 求最大值
LongAccumulator max = new LongAccumulator(Long::max, Long.MIN_VALUE);
max.accumulate(10);
max.accumulate(5);
max.accumulate(20);
System.out.println("最大值：" + max.get());  // 20

// 求和
LongAccumulator sum = new LongAccumulator(Long::sum, 0);
sum.accumulate(10);
sum.accumulate(20);
System.out.println("总和：" + sum.get());  // 30
```

### DoubleAdder / DoubleAccumulator

用于浮点数的累加。

```java
import java.util.concurrent.atomic.DoubleAdder;

DoubleAdder adder = new DoubleAdder();
adder.add(1.5);
adder.add(2.5);
System.out.println("总和：" + adder.sum());  // 4.0
```

## 原子类选择指南

| 场景             | 推荐类                               |
| ---------------- | ------------------------------------ |
| 计数器（低并发） | AtomicInteger / AtomicLong           |
| 计数器（高并发） | LongAdder                            |
| 对象引用         | AtomicReference                      |
| 解决 ABA 问题    | AtomicStampedReference               |
| 数组元素         | AtomicIntegerArray / AtomicLongArray |
| 对象字段         | AtomicIntegerFieldUpdater            |
| 自定义累加       | LongAccumulator                      |

## 小结

- 原子类基于 CAS 实现，无锁、高性能
- **基本原子类**：AtomicInteger、AtomicLong、AtomicBoolean
- **引用原子类**：AtomicReference、AtomicStampedReference（解决 ABA）
- **数组原子类**：AtomicIntegerArray、AtomicLongArray
- **字段更新器**：AtomicIntegerFieldUpdater 等
- **累加器**：LongAdder（高并发累加首选）、LongAccumulator
- 根据并发程度和使用场景选择合适的原子类
