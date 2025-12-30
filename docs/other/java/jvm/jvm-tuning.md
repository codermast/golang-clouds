---
order : 4
---

# JVM 调优

JVM 调优是优化 Java 应用性能的重要手段，主要包括参数配置、性能监控和问题排查。

## 常用 JVM 参数

### 堆内存参数

```bash
# 初始堆大小
-Xms512m

# 最大堆大小
-Xmx1024m

# 年轻代大小
-Xmn256m

# Eden 与 Survivor 比例（默认 8:1:1）
-XX:SurvivorRatio=8

# 年轻代与老年代比例
-XX:NewRatio=2
```

### 元空间参数

```bash
# 初始元空间大小
-XX:MetaspaceSize=128m

# 最大元空间大小
-XX:MaxMetaspaceSize=256m
```

### 栈参数

```bash
# 线程栈大小
-Xss256k
```

### GC 相关参数

```bash
# 使用 G1 收集器
-XX:+UseG1GC

# G1 期望最大停顿时间
-XX:MaxGCPauseMillis=200

# 使用 CMS 收集器
-XX:+UseConcMarkSweepGC

# CMS 触发阈值
-XX:CMSInitiatingOccupancyFraction=75

# 使用 Parallel 收集器
-XX:+UseParallelGC
-XX:+UseParallelOldGC
```

### 日志参数

```bash
# JDK 8 GC 日志
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-Xloggc:/path/to/gc.log

# JDK 9+ GC 日志
-Xlog:gc*:file=/path/to/gc.log:time,level,tags
```

### 其他常用参数

```bash
# 打印 JVM 参数
-XX:+PrintFlagsFinal

# OOM 时生成堆转储
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dump.hprof

# 字符串常量池大小
-XX:StringTableSize=60013

# 大对象直接进入老年代的阈值
-XX:PretenureSizeThreshold=1m

# 晋升到老年代的年龄阈值
-XX:MaxTenuringThreshold=15
```

## 参数配置建议

### 通用建议

```bash
# 生产环境推荐配置
-Xms4g -Xmx4g                    # 初始和最大堆大小相同，避免动态扩容
-XX:+UseG1GC                      # 使用 G1 收集器
-XX:MaxGCPauseMillis=200          # 期望最大停顿 200ms
-XX:+HeapDumpOnOutOfMemoryError   # OOM 时自动 dump
-XX:HeapDumpPath=/logs/dump.hprof
-Xlog:gc*:file=/logs/gc.log:time,level,tags
```

### 内存配置原则

| 场景       | 建议                         |
| ---------- | ---------------------------- |
| 普通应用   | 堆大小 = 可用内存的 50%-70%  |
| 高并发应用 | 适当增大年轻代               |
| 低延迟应用 | 使用 G1 或 ZGC               |
| 批处理应用 | 使用 Parallel GC，关注吞吐量 |

## 性能监控工具

### 命令行工具

#### jps - 查看 Java 进程

```bash
$ jps -l
12345 com.example.Application
12346 org.apache.catalina.startup.Bootstrap
```

#### jstat - 查看 GC 统计

```bash
# 查看 GC 统计，每秒刷新一次
$ jstat -gc 12345 1000

 S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    
8192.0 8192.0  0.0   1024.0  65536.0  32768.0   131072.0   65536.0  52224.0 49152.0

# 列说明
# S0C/S1C: Survivor 0/1 容量
# S0U/S1U: Survivor 0/1 已使用
# EC/EU: Eden 容量/已使用
# OC/OU: Old 容量/已使用
# MC/MU: Metaspace 容量/已使用
```

```bash
# 查看 GC 次数和时间
$ jstat -gcutil 12345 1000

  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00  12.50  45.67  50.00  94.12  92.34   100    1.234     5    0.567   1.801

# YGC/YGCT: Young GC 次数/时间
# FGC/FGCT: Full GC 次数/时间
# GCT: GC 总时间
```

#### jinfo - 查看 JVM 参数

```bash
# 查看所有参数
$ jinfo -flags 12345

# 查看特定参数
$ jinfo -flag MaxHeapSize 12345
-XX:MaxHeapSize=1073741824

# 动态修改参数（部分参数支持）
$ jinfo -flag +PrintGCDetails 12345
```

#### jmap - 内存映射

```bash
# 生成堆转储
$ jmap -dump:format=b,file=dump.hprof 12345

# 查看堆使用情况
$ jmap -heap 12345

# 查看对象直方图
$ jmap -histo 12345 | head -20
```

#### jstack - 线程堆栈

```bash
# 打印线程堆栈
$ jstack 12345 > thread_dump.txt

# 检测死锁
$ jstack -l 12345
```

### 可视化工具

#### JConsole

```bash
$ jconsole
```

功能：
- 内存监控
- 线程监控
- 类加载监控
- MBean 管理

#### VisualVM

```bash
$ jvisualvm
```

功能：
- 性能分析
- 内存分析
- CPU 分析
- 线程分析

#### JMC（Java Mission Control）

更强大的性能分析工具，支持：
- 飞行记录器（Flight Recorder）
- 实时监控
- 性能分析

## 常见问题排查

### 1. CPU 占用过高

#### 排查步骤

```bash
# 1. 找到 CPU 占用高的进程
$ top -c

# 2. 找到占用 CPU 高的线程
$ top -H -p <pid>

# 3. 将线程 ID 转为 16 进制
$ printf "%x\n" <tid>

# 4. 查看线程堆栈
$ jstack <pid> | grep -A 30 <tid_hex>
```

#### 常见原因

- 死循环
- 频繁 GC
- 正则表达式回溯
- 加密解密操作

### 2. 内存溢出（OOM）

#### 堆内存溢出

```
java.lang.OutOfMemoryError: Java heap space
```

排查：
```bash
# 1. 生成堆转储
$ jmap -dump:format=b,file=dump.hprof <pid>

# 2. 使用 MAT 或 VisualVM 分析
```

常见原因：
- 内存泄漏
- 数据量过大
- 堆配置过小

#### 元空间溢出

```
java.lang.OutOfMemoryError: Metaspace
```

常见原因：
- 动态生成大量类
- 类加载器泄漏

```bash
# 增大元空间
-XX:MaxMetaspaceSize=512m
```

#### 直接内存溢出

```
java.lang.OutOfMemoryError: Direct buffer memory
```

常见原因：
- NIO 使用过多直接内存

```bash
# 增大直接内存
-XX:MaxDirectMemorySize=512m
```

### 3. GC 频繁

#### 排查步骤

```bash
# 1. 查看 GC 日志
# 观察 GC 频率、耗时、回收比例

# 2. 查看堆使用情况
$ jstat -gcutil <pid> 1000
```

#### 优化建议

| 现象              | 可能原因             | 解决方案         |
| ----------------- | -------------------- | ---------------- |
| Young GC 频繁     | Eden 区过小          | 增大年轻代       |
| Full GC 频繁      | 老年代过小或内存泄漏 | 增大堆或排查泄漏 |
| GC 后老年代占用高 | 存在大对象或内存泄漏 | 分析堆内存       |

### 4. 死锁

#### 检测死锁

```bash
$ jstack <pid>

# 如果存在死锁，会显示类似信息：
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007f8b...
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x00007f8c...
  which is held by "Thread-1"
```

### 5. 线程阻塞

```bash
# 查看线程状态分布
$ jstack <pid> | grep "java.lang.Thread.State" | sort | uniq -c

   10 java.lang.Thread.State: RUNNABLE
   50 java.lang.Thread.State: WAITING (parking)
   20 java.lang.Thread.State: TIMED_WAITING (sleeping)
   30 java.lang.Thread.State: BLOCKED (on object monitor)
```

## GC 日志分析

### GC 日志示例

```
2024-01-01T10:00:00.000+0800: [GC (Allocation Failure) 
    [PSYoungGen: 65536K->10752K(76288K)] 
    65536K->10768K(251392K), 0.0123456 secs]
    [Times: user=0.04 sys=0.01, real=0.01 secs]
```

日志解读：
- `GC (Allocation Failure)`：GC 原因
- `PSYoungGen: 65536K->10752K(76288K)`：年轻代 GC 前后大小（容量）
- `65536K->10768K(251392K)`：堆 GC 前后大小（容量）
- `0.0123456 secs`：GC 耗时

### GC 日志分析工具

- **GCViewer**：开源 GC 日志分析工具
- **GCEasy**：在线 GC 日志分析
- **Gceasy.io**：在线分析，生成可视化报告

## 调优案例

### 案例 1：Young GC 过于频繁

**现象**：每秒多次 Young GC

**分析**：
```bash
$ jstat -gcutil <pid> 1000
  S0     S1     E      O      M
  0.00  50.00  99.99  30.00  95.00
```
Eden 区很快被填满。

**解决**：
```bash
# 增大年轻代
-Xmn512m
```

### 案例 2：Full GC 频繁

**现象**：频繁 Full GC，老年代使用率高

**分析**：
```bash
$ jmap -histo <pid> | head -20
```
发现大量相同类型对象。

**解决**：
- 排查内存泄漏
- 增大堆内存
- 调整 GC 参数

### 案例 3：GC 停顿时间长

**现象**：GC 停顿超过 500ms

**解决**：
```bash
# 切换到 G1 收集器
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200

# 或使用 ZGC（JDK 11+）
-XX:+UseZGC
```

## 小结

- **参数配置**：根据应用特点合理配置堆大小、GC 收集器
- **监控工具**：jps、jstat、jinfo、jmap、jstack
- **可视化工具**：JConsole、VisualVM、JMC
- **常见问题**：CPU 过高、OOM、GC 频繁、死锁
- **调优原则**：
  1. 不要过早优化
  2. 基于数据分析，不要凭感觉
  3. 每次只调整一个参数
  4. 在测试环境验证后再上线
