---
order: 2
icon: logos:java
---

# Java 面试题

涵盖语法、集合、JVM、并发、Spring、工程实践。

## 基础与集合

- Java 基本类型与包装类型差异？自动装箱/拆箱的陷阱？
- `String` 不可变的原因和好处？`StringBuilder` vs `StringBuffer`？
- `ArrayList` vs `LinkedList` vs `Vector`？扩容机制？
- `HashMap` 1.7/1.8 底层、hash 冲突、resize、树化条件？线程安全问题？
- `ConcurrentHashMap` 分段锁 vs CAS+红黑树，size 统计为何是近似值？
- fail-fast vs fail-safe 迭代器？

## JVM 与性能

- JVM 内存结构：堆/栈/方法区/本地方法栈/程序计数器。
- 对象创建过程：类加载检查→分配（指针碰撞/空闲列表）→零值→设置对象头→构造函数。
- 垃圾回收器：Serial/ParNew/Parallel/CMS/G1/ZGC；CMS 与 G1 对比？
- GC 触发：Minor/Young GC、Mixed GC 触发条件；安全点/安全区域是什么？
- 内存溢出排查：`-Xms/-Xmx/-Xmn/-XX:MetaspaceSize`、`jmap -heap`、`jmap -histo`、`jstack`。
- 类加载机制：双亲委派、破坏方式（SPI、自定义 ClassLoader）。

## 并发

- `synchronized` 与 `ReentrantLock` 区别（可重入、公平性、可中断、条件队列）。
- `volatile` 语义：可见性、有序性；不保证原子性，适用场景（状态标识、DCL）。
- AQS 核心：CLH 队列、state、`tryAcquire/tryRelease`、`Condition`。
- 线程池：`ThreadPoolExecutor` 7 参；拒绝策略；核心/最大线程与队列关系；常见配置踩坑。
- 原子类：CAS、ABA 问题及解决（版本号/AtomicStampedReference）。
- `CompletableFuture` 常用组合：`allOf/anyOf/thenCombine`；异常处理 `handle/exceptionally`。

## Spring & Spring Boot

- IOC/DI、Bean 生命周期（实例化→依赖注入→`@PostConstruct`→初始化→使用→销毁）。
- AOP：核心概念（JoinPoint、Pointcut、Advice、Weaving）；动态代理 JDK vs CGLIB 场景。
- `@Transactional` 原理：AOP 拦截、事务传播、隔离级别；失效场景（同类内部调用、非 public）。
- Spring MVC 流程：DispatcherServlet→HandlerMapping→HandlerAdapter→Controller→ViewResolver。
- Spring Boot 自动装配：`spring.factories`/`AutoConfiguration`、`@Conditional*` 常见条件。
- 配置绑定：`@ConfigurationProperties` vs `@Value`，`@Validated` 校验。

## MyBatis / 数据访问

- MyBatis 缓存：一级/二级缓存范围与失效；脏数据风险。
- N+1 查询问题与解决：`<resultMap>` `association`/`collection`、`fetchType=lazy`、JOIN/批量查询。
- 连接池 HikariCP：核心参数（`maximumPoolSize`、`minimumIdle`、`connectionTimeout`、`idleTimeout`）。

## 分布式与工程实践

- 分布式 ID：雪花算法、号段模式、数据库自增的优缺点。
- 配置中心/注册中心：Nacos/Consul 作用区别。
- 服务熔断/限流：`Resilience4j`/`Sentinel`，熔断 vs 降级区别。
- 分布式事务：2PC、TCC、SAGA、消息最终一致；本地事务 + 可靠消息。
- 日志与链路：Logback/Log4j2 异步、采样；Zipkin/SkyWalking/OTel。
- 常见排查：CPU 飙高（`top -H` + `jstack`）、Full GC（GC 日志）、线程阻塞（死锁检测）。

## 高频清单

- [ ] HashMap 扩容/树化条件
- [ ] volatile 语义与使用场景
- [ ] synchronized vs ReentrantLock
- [ ] AQS 工作原理
- [ ] 线程池 7 参数与拒绝策略
- [ ] `@Transactional` 失效场景
- [ ] Spring Boot 自动装配原理
- [ ] G1/CMS 区别与选择
- [ ] 雪花算法组成、时钟回拨处理
- [ ] N+1 查询及解决方案
