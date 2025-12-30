---
order: 2
icon: logos:java
---

# Java 面试题

Java 面试高频考点，覆盖基础语法、集合框架、JVM、并发编程、Spring 等核心知识。

---

## 一、基础语法

### Q1: Java 基本类型与包装类型的区别

| 特性 | 基本类型 | 包装类型 |
| :--- | :--- | :--- |
| 存储位置 | 栈内存 | 堆内存 |
| 默认值 | 有默认值（如 int=0） | null |
| 泛型支持 | ❌ | ✅ |
| 性能 | 高 | 低（有装箱拆箱开销） |

**自动装箱/拆箱陷阱：**

```java
Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);  // true（缓存 -128~127）
System.out.println(c == d);  // false（new 出来的对象）

Integer e = null;
int f = e;  // NullPointerException!
```

---

### Q2: String 为什么不可变？

**实现：**
```java
public final class String {
    private final char[] value;  // Java 8
    private final byte[] value;  // Java 9+
}
```

**好处：**
1. **线程安全**：不可变对象天然线程安全
2. **字符串池**：可以安全地共享
3. **哈希缓存**：hashCode 只需计算一次
4. **安全性**：防止被篡改

**String vs StringBuilder vs StringBuffer：**

| 类 | 可变性 | 线程安全 | 性能 |
| :--- | :--- | :--- | :--- |
| String | ❌ | ✅ | 拼接慢 |
| StringBuilder | ✅ | ❌ | 快 |
| StringBuffer | ✅ | ✅ | 较慢（synchronized） |

---

### Q3: == 和 equals 的区别

| 比较方式 | 基本类型 | 引用类型 |
| :--- | :--- | :--- |
| `==` | 比较值 | 比较地址 |
| `equals` | - | 比较内容（需重写） |

**重写 equals 必须重写 hashCode：**
- 两个对象 equals 相等，hashCode 必须相等
- hashCode 相等，equals 不一定相等

---

### Q4: final、finally、finalize 的区别

| 关键字 | 作用 |
| :--- | :--- |
| **final** | 修饰类（不可继承）、方法（不可重写）、变量（不可修改） |
| **finally** | try-catch 后必须执行的代码块 |
| **finalize** | 对象被 GC 前调用（已废弃，不推荐使用） |

---

### Q5: 接口和抽象类的区别

| 特性 | 接口 | 抽象类 |
| :--- | :--- | :--- |
| 多继承 | ✅ 可实现多个 | ❌ 只能继承一个 |
| 构造器 | ❌ 没有 | ✅ 有 |
| 成员变量 | 只能 public static final | 可以有普通变量 |
| 方法 | 默认 public abstract | 可以有具体方法 |
| 设计目的 | 定义行为契约 | 代码复用 |

**Java 8+：** 接口可以有 default 方法和 static 方法。

---

## 二、集合框架

### Q6: ArrayList 和 LinkedList 的区别

| 特性 | ArrayList | LinkedList |
| :--- | :--- | :--- |
| 底层结构 | 动态数组 | 双向链表 |
| 随机访问 | O(1) | O(N) |
| 插入删除 | O(N)（需移动元素） | O(1)（找到位置后） |
| 内存占用 | 紧凑 | 每个节点有指针开销 |

**ArrayList 扩容：**
- 默认容量 10
- 扩容为原来的 1.5 倍（`oldCapacity + (oldCapacity >> 1)`）
- 建议指定初始容量

---

### Q7: HashMap 的底层原理

**结构（Java 8）：**
- 数组 + 链表 + 红黑树
- 默认容量 16，负载因子 0.75

**重要参数：**

| 参数 | 说明 |
| :--- | :--- |
| 树化阈值 | 链表长度 > 8 且数组长度 >= 64 |
| 退化阈值 | 树节点 < 6 时退化为链表 |
| 扩容 | 元素数量 > 容量 × 负载因子 |

**put 流程：**
1. 计算 key 的 hash：`(h = key.hashCode()) ^ (h >>> 16)`
2. 计算下标：`hash & (n - 1)`
3. 位置为空直接插入
4. 不为空，判断 key 是否相同
5. 相同则覆盖，不同则处理冲突（链表或红黑树）
6. 判断是否需要扩容

---

### Q8: HashMap 为什么线程不安全

**问题：**
1. **数据覆盖**：多线程 put 可能覆盖数据
2. **死循环**（Java 7）：头插法扩容导致链表成环
3. **数据丢失**：扩容时数据丢失

**解决方案：**
- `Collections.synchronizedMap()`
- `ConcurrentHashMap`（推荐）

---

### Q9: ConcurrentHashMap 的实现原理

**Java 7：**
- 分段锁（Segment），每个 Segment 是一个小的 HashMap
- 并发度取决于 Segment 数量

**Java 8：**
- 数组 + 链表 + 红黑树（和 HashMap 类似）
- 使用 CAS + synchronized（锁单个桶）
- 并发度大幅提升

```java
// put 流程
if (tab[i] == null) {
    CAS 插入  // 无锁
} else {
    synchronized (tab[i]) {
        // 链表或红黑树操作
    }
}
```

---

### Q10: fail-fast 和 fail-safe 的区别

| 特性 | fail-fast | fail-safe |
| :--- | :--- | :--- |
| 检测修改 | 立即抛出 ConcurrentModificationException | 不抛异常 |
| 实现 | modCount 检查 | 操作副本 |
| 典型类 | ArrayList、HashMap | CopyOnWriteArrayList、ConcurrentHashMap |
| 内存开销 | 低 | 高（复制） |

---

## 三、JVM

### Q11: JVM 内存结构

| 区域 | 说明 | 线程共享 |
| :--- | :--- | :--- |
| **堆** | 对象实例 | ✅ |
| **方法区** | 类信息、常量、静态变量 | ✅ |
| **虚拟机栈** | 方法调用的栈帧 | ❌ |
| **本地方法栈** | Native 方法 | ❌ |
| **程序计数器** | 当前执行的字节码指令地址 | ❌ |

**堆分代：**
- 新生代（Eden + S0 + S1）
- 老年代

---

### Q12: 垃圾回收算法

| 算法 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| **标记-清除** | 标记垃圾后清除 | 老年代 |
| **复制算法** | 存活对象复制到另一块区域 | 新生代 |
| **标记-整理** | 标记后移动存活对象到一端 | 老年代 |
| **分代收集** | 不同代用不同算法 | 实际使用 |

---

### Q13: 常见的垃圾回收器

| 回收器 | 特点 | 适用场景 |
| :--- | :--- | :--- |
| **Serial** | 单线程，STW | 单核 CPU、小堆 |
| **ParNew** | Serial 多线程版 | 配合 CMS |
| **Parallel** | 吞吐量优先 | 后台任务 |
| **CMS** | 低延迟，并发标记 | Web 应用（已废弃） |
| **G1** | 分 Region，可预测停顿 | 大堆、低延迟（推荐） |
| **ZGC** | 超低延迟（<10ms） | 超大堆 |

**G1 vs CMS：**

| 特性 | CMS | G1 |
| :--- | :--- | :--- |
| 内存布局 | 分代 | 分 Region |
| 回收方式 | 标记-清除（碎片） | 标记-整理（无碎片） |
| 可预测性 | 差 | 可设置目标停顿时间 |
| 大对象 | 老年代 | Humongous Region |

---

### Q14: 类加载机制与双亲委派

**类加载过程：**
```
加载 → 验证 → 准备 → 解析 → 初始化
```

**双亲委派：**
```
BootstrapClassLoader（rt.jar）
        ↑
ExtClassLoader（ext/*.jar）
        ↑
AppClassLoader（classpath）
        ↑
自定义 ClassLoader
```

**为什么使用双亲委派：**
- 避免类重复加载
- 保护核心类（如 java.lang.String）

**如何打破：**
- 重写 `loadClass()` 方法
- SPI（JDBC、JNDI）
- OSGi

---

## 四、并发编程

### Q15: synchronized 和 ReentrantLock 的区别

| 特性 | synchronized | ReentrantLock |
| :--- | :--- | :--- |
| 实现 | JVM 内置 | Java API |
| 释放锁 | 自动释放 | 必须手动 unlock |
| 可中断 | ❌ | ✅ `lockInterruptibly()` |
| 公平锁 | ❌ | ✅ 可设置 |
| 条件队列 | 一个（wait/notify） | 多个（Condition） |
| 性能 | JDK 6 后优化，差距不大 | 略好 |

**synchronized 锁升级：**
```
无锁 → 偏向锁 → 轻量级锁（CAS 自旋） → 重量级锁
```

---

### Q16: volatile 的作用

**两个语义：**
1. **可见性**：修改后立即对其他线程可见
2. **有序性**：禁止指令重排序

**不保证原子性：** 复合操作（如 i++）不是原子的

**典型场景：**
- 状态标识（如 running = false）
- 双重检查锁定（DCL）单例

```java
// DCL 单例
private static volatile Singleton instance;

public static Singleton getInstance() {
    if (instance == null) {
        synchronized (Singleton.class) {
            if (instance == null) {
                instance = new Singleton();
            }
        }
    }
    return instance;
}
```

---

### Q17: 线程池的核心参数

```java
new ThreadPoolExecutor(
    corePoolSize,     // 核心线程数
    maximumPoolSize,  // 最大线程数
    keepAliveTime,    // 空闲线程存活时间
    unit,             // 时间单位
    workQueue,        // 工作队列
    threadFactory,    // 线程工厂
    handler           // 拒绝策略
);
```

**执行流程：**
```
任务提交 → 核心线程未满 → 创建核心线程执行
           → 核心线程满 → 入队列
           → 队列满 → 创建非核心线程
           → 最大线程满 → 拒绝策略
```

**拒绝策略：**

| 策略 | 说明 |
| :--- | :--- |
| AbortPolicy | 抛异常（默认） |
| CallerRunsPolicy | 调用者线程执行 |
| DiscardPolicy | 静默丢弃 |
| DiscardOldestPolicy | 丢弃最旧任务 |

---

### Q18: AQS 的原理

**核心组成：**
- **state**：同步状态（volatile）
- **CLH 队列**：双向链表，存储等待线程
- **独占/共享模式**

**ReentrantLock 基于 AQS：**
- `lock()`：`tryAcquire()` 尝试获取锁，失败则加入队列
- `unlock()`：`tryRelease()` 释放锁，唤醒队列头部线程

---

### Q19: ThreadLocal 的原理和内存泄漏

**原理：**
- 每个线程有自己的 `ThreadLocalMap`
- key 是 ThreadLocal 对象（弱引用）
- value 是存储的值

**内存泄漏：**
- key（弱引用）被 GC 回收后变成 null
- value 无法被访问但无法回收
- 解决：使用后调用 `remove()`

```java
try {
    threadLocal.set(value);
    // 使用
} finally {
    threadLocal.remove();  // 必须清理
}
```

---

## 五、Spring

### Q20: Spring Bean 的生命周期

```
实例化 → 属性注入 → Aware 接口回调 → @PostConstruct
    → InitializingBean.afterPropertiesSet → 自定义 init-method
    → 使用 → @PreDestroy → DisposableBean.destroy → 自定义 destroy-method
```

---

### Q21: Spring AOP 的实现原理

**两种代理方式：**

| 方式 | 条件 | 原理 |
| :--- | :--- | :--- |
| JDK 动态代理 | 目标类实现接口 | 基于反射，生成接口代理类 |
| CGLIB | 目标类无接口 | 基于 ASM，生成子类代理 |

**核心概念：**
- **JoinPoint**：连接点（可被增强的方法）
- **Pointcut**：切入点表达式
- **Advice**：通知（Before、After、Around）
- **Aspect**：切面（Pointcut + Advice）

---

### Q22: @Transactional 失效场景

| 场景 | 原因 |
| :--- | :--- |
| 同类内部调用 | 未经过代理 |
| 非 public 方法 | 代理无法拦截 |
| 异常被 catch | 未抛出，无法回滚 |
| 抛出非 RuntimeException | 需配置 rollbackFor |
| 数据库不支持事务 | 如 MyISAM |

```java
// 配置回滚所有异常
@Transactional(rollbackFor = Exception.class)
```

---

### Q23: Spring Boot 自动装配原理

**核心注解：**
```java
@SpringBootApplication
    ├── @EnableAutoConfiguration
    │       └── @Import(AutoConfigurationImportSelector.class)
    └── @ComponentScan
```

**流程：**
1. 读取 `META-INF/spring.factories`（Spring Boot 2.x）
2. 读取 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（Spring Boot 3.x）
3. 根据 `@Conditional` 条件过滤
4. 加载满足条件的配置类

---

## 六、更多八股文

### Q24: 对象的创建过程

```
1. 类加载检查
2. 分配内存（指针碰撞/空闲列表）
3. 初始化零值
4. 设置对象头（哈希码、GC 分代年龄、锁状态、类型指针）
5. 执行 <init> 方法（构造函数）
```

---

### Q25: 强引用、软引用、弱引用、虚引用

| 类型 | 特点 | GC 行为 | 典型场景 |
| :--- | :--- | :--- | :--- |
| **强引用** | 最常见 | 不回收 | 普通对象 |
| **软引用** | SoftReference | 内存不足时回收 | 缓存 |
| **弱引用** | WeakReference | 下次 GC 必回收 | WeakHashMap |
| **虚引用** | PhantomReference | 随时回收，需配合队列 | 资源清理 |

---

### Q26: Java 反射机制

**获取 Class 对象：**
```java
Class<?> c1 = String.class;
Class<?> c2 = "hello".getClass();
Class<?> c3 = Class.forName("java.lang.String");
```

**反射的应用：**
- 框架（Spring IOC、MyBatis）
- 动态代理
- 注解处理

**缺点：** 性能开销、破坏封装、安全问题

---

### Q27: Java 异常体系

```
Throwable
├── Error（程序无法处理）
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── ...
└── Exception
    ├── RuntimeException（非受检异常）
    │   ├── NullPointerException
    │   ├── ClassCastException
    │   └── ...
    └── 受检异常（必须处理）
        ├── IOException
        ├── SQLException
        └── ...
```

---

### Q28: BIO、NIO、AIO 的区别

| 模型 | 说明 | 特点 |
| :--- | :--- | :--- |
| **BIO** | 同步阻塞 | 一个连接一个线程 |
| **NIO** | 同步非阻塞 | 多路复用，Selector 轮询 |
| **AIO** | 异步非阻塞 | 回调通知，真正异步 |

**NIO 核心组件：**
- **Channel**：双向通道
- **Buffer**：缓冲区
- **Selector**：多路复用器

---

### Q29: 序列化和反序列化

**实现方式：**
1. 实现 `Serializable` 接口
2. 设置 `serialVersionUID`

```java
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private transient String password;  // 不参与序列化
}
```

**常见序列化框架：** JSON、Protobuf、Hessian、Kryo

---

### Q30: 常用设计模式

| 模式 | 说明 | Java 中的应用 |
| :--- | :--- | :--- |
| 单例 | 全局唯一实例 | Runtime、Spring Bean |
| 工厂 | 创建对象 | Calendar.getInstance() |
| 代理 | 增强功能 | AOP、动态代理 |
| 观察者 | 发布订阅 | EventListener |
| 模板方法 | 定义骨架 | AbstractList |
| 策略 | 算法可替换 | Comparator |
| 责任链 | 链式处理 | Filter、Interceptor |

---

### Q31: Integer 缓存机制

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b);  // true（缓存）

Integer c = 128;
Integer d = 128;
System.out.println(c == d);  // false（新对象）
```

**缓存范围：** -128 ~ 127（可通过 JVM 参数调整上限）

---

### Q32: Object 类的常用方法

| 方法 | 说明 |
| :--- | :--- |
| `equals()` | 比较对象相等 |
| `hashCode()` | 返回哈希码 |
| `toString()` | 对象字符串表示 |
| `clone()` | 克隆对象 |
| `getClass()` | 获取运行时类 |
| `wait/notify` | 线程通信 |
| `finalize()` | GC 前调用（已废弃） |

---

### Q33: 深拷贝和浅拷贝

| 类型 | 说明 | 实现方式 |
| :--- | :--- | :--- |
| **浅拷贝** | 只复制引用 | Object.clone() |
| **深拷贝** | 复制整个对象树 | 序列化、手动递归复制 |

```java
// 深拷贝 - 序列化方式
public Object deepCopy(Object obj) {
    ByteArrayOutputStream bos = new ByteArrayOutputStream();
    ObjectOutputStream oos = new ObjectOutputStream(bos);
    oos.writeObject(obj);
    
    ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());
    ObjectInputStream ois = new ObjectInputStream(bis);
    return ois.readObject();
}
```

---

### Q34: JDK 动态代理 vs CGLIB

| 特性 | JDK 动态代理 | CGLIB |
| :--- | :--- | :--- |
| 条件 | 目标类必须实现接口 | 无需接口 |
| 原理 | 反射 + 接口代理类 | ASM 生成子类 |
| 性能 | 创建快，调用慢 | 创建慢，调用快 |
| final 方法 | - | 无法代理 |

---

### Q35: 如何排查 CPU 100%

```bash
# 1. 找到高 CPU 进程
top

# 2. 找到高 CPU 线程
top -Hp <pid>

# 3. 线程 ID 转 16 进制
printf '%x\n' <tid>

# 4. 导出线程栈
jstack <pid> | grep -A 50 <tid_hex>
```

**常见原因：** 死循环、频繁 GC、锁竞争

---

### Q36: 如何排查 OOM

```bash
# 设置 OOM 时自动 dump
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dump.hprof

# 分析 dump 文件
jvisualvm
MAT (Memory Analyzer Tool)
```

**常见原因：** 内存泄漏、大对象、批量查询无分页

---

## 七、高频考点清单

### 必考

- [ ] HashMap 底层原理、树化条件
- [ ] ConcurrentHashMap 实现
- [ ] JVM 内存结构
- [ ] 垃圾回收器（G1 vs CMS）
- [ ] synchronized vs ReentrantLock
- [ ] volatile 语义
- [ ] 线程池参数和执行流程

### 常考

- [ ] String 不可变原因
- [ ] 双亲委派机制
- [ ] AQS 原理
- [ ] ThreadLocal 内存泄漏
- [ ] Spring Bean 生命周期
- [ ] @Transactional 失效场景
- [ ] 强软弱虚引用
- [ ] BIO/NIO/AIO 区别

### 进阶

- [ ] synchronized 锁升级
- [ ] CMS 与 G1 区别
- [ ] 类加载过程
- [ ] Spring AOP 动态代理
- [ ] Spring Boot 自动装配原理
- [ ] 对象创建过程
- [ ] CPU 100% 排查
- [ ] OOM 排查

