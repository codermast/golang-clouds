---
order: 3
icon: logos:mysql
---

# MySQL 面试题

MySQL 数据库面试高频考点，覆盖索引、事务、锁、优化、主从复制等核心知识。

---

## 一、索引

### Q1: B+Tree 为什么比 B-Tree/Hash 更适合 MySQL？

**B+Tree vs B-Tree：**

| 特性 | B+Tree | B-Tree |
| :--- | :--- | :--- |
| 数据存储 | 只在叶子节点存数据 | 所有节点都存数据 |
| 叶子节点 | 有链表串联，支持范围查询 | 无链表 |
| 每页存储 | 更多 key（因为不存数据） | 较少 key |
| IO 次数 | 更少（树更矮） | 更多 |

**B+Tree vs Hash：**

| 特性 | B+Tree | Hash |
| :--- | :--- | :--- |
| 等值查询 | O(logN) | O(1) |
| 范围查询 | ✅ 支持 | ❌ 不支持 |
| 排序 | ✅ 支持 | ❌ 不支持 |
| 前缀匹配 | ✅ 支持 | ❌ 不支持 |

**结论：** B+Tree 更适合 OLTP 场景的范围查询和排序需求。

---

### Q2: 聚簇索引和二级索引的区别？什么是回表？

**聚簇索引（Clustered Index）：**
- 叶子节点存储**完整数据行**
- InnoDB 主键索引就是聚簇索引
- 每表只有一个

**二级索引（Secondary Index）：**
- 叶子节点存储**主键值**
- 非主键索引都是二级索引
- 查询完整数据需要**回表**

**回表：** 通过二级索引查到主键后，再根据主键去聚簇索引查完整数据。

```sql
-- 回表查询
SELECT * FROM user WHERE name = 'Tom';
-- 1. 通过 name 索引找到主键 id
-- 2. 通过主键 id 回表查完整数据

-- 覆盖索引，无需回表
SELECT id, name FROM user WHERE name = 'Tom';
-- name 索引已包含 id 和 name，直接返回
```

---

### Q3: 什么是最左前缀法则？

**联合索引 (a, b, c) 的最左前缀法则：**

| 查询条件 | 是否使用索引 |
| :--- | :--- |
| `a = 1` | ✅ |
| `a = 1 AND b = 2` | ✅ |
| `a = 1 AND b = 2 AND c = 3` | ✅ |
| `b = 2` | ❌ 无法使用 |
| `b = 2 AND c = 3` | ❌ 无法使用 |
| `a = 1 AND c = 3` | ✅ 只用 a |

**范围查询右侧失效：**

```sql
-- 索引 (a, b, c)
SELECT * FROM t WHERE a = 1 AND b > 2 AND c = 3;
-- 只能用到 a 和 b，c 无法使用（范围查询后的列失效）
```

---

### Q4: 索引失效的常见场景

| 场景 | 示例 | 原因 |
| :--- | :--- | :--- |
| 函数/表达式 | `WHERE YEAR(date) = 2024` | 索引列被加工 |
| 隐式类型转换 | `WHERE varchar_col = 123` | 字符串列用数字查 |
| 左模糊 | `WHERE name LIKE '%Tom'` | 无法走索引 |
| OR 部分无索引 | `WHERE a = 1 OR b = 2` | b 无索引则全表扫 |
| 数据分布差 | 回表代价超过全表扫描 | 优化器放弃索引 |
| 不等于 | `WHERE status != 1` | 需扫描大部分数据 |

---

### Q5: 如何创建高效的联合索引？

**选择原则：**

1. **区分度高的列在前**
2. **常用查询条件优先**
3. **考虑排序/分组需求**
4. **尽量覆盖高频查询**

```sql
-- 查询：WHERE user_id = ? AND status = ? ORDER BY created_at
-- 推荐索引：(user_id, status, created_at)

-- 避免冗余索引
-- (a), (a,b), (a,b,c) 只需要 (a,b,c)
```

---

## 二、事务与 MVCC

### Q6: 事务的 ACID 特性及实现

| 特性 | 说明 | 实现机制 |
| :--- | :--- | :--- |
| **A** 原子性 | 全成功或全失败 | Undo Log |
| **C** 一致性 | 数据状态正确 | 依赖其他三个特性 |
| **I** 隔离性 | 事务互不干扰 | MVCC + 锁 |
| **D** 持久性 | 提交后永久保存 | Redo Log |

---

### Q7: MySQL 的四种隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| :--- | :--- | :--- | :--- |
| READ UNCOMMITTED | ✅ | ✅ | ✅ |
| READ COMMITTED (RC) | ❌ | ✅ | ✅ |
| REPEATABLE READ (RR) | ❌ | ❌ | ✅* |
| SERIALIZABLE | ❌ | ❌ | ❌ |

**MySQL 默认 RR，通过 MVCC + Next-Key Lock 基本解决幻读。**

---

### Q8: 谈谈你对 MVCC 的理解？它的实现原理是什么？

**MVCC (Multi-Version Concurrency Control)** 多版本并发控制，是 InnoDB 实现隔离级别（尤其是 RC 和 RR）的核心机制。它允许数据库在并发场景下，实现**“非阻塞读”**（快照读），解决了读写冲突问题。

#### 1. 核心思想
通过维护数据的历史版本，让读操作不加锁就能读到一致性的数据，从而提高系统的吞吐量。

#### 2. 三大核心支撑
MVCC 的实现依赖于：**隐藏字段、Undo Log 版本链、ReadView**。

*   **隐藏字段**：每行数据除了真实数据外，还有几个隐藏列：
    *   `DB_TRX_ID`：最近修改该行数据的**事务 ID**。
    *   `DB_ROLL_PTR`：回滚指针，指向该行数据上一个版本的 **Undo Log** 地址。
    *   `DB_ROW_ID`：隐式主键（如果没有显式主键）。
*   **Undo Log 版本链**：
    当事务修改数据时，老版本数据会被写入 Undo Log，并通过隐藏列的 `roll_ptr` 把这些记录串联起来，形成一个**版本链**。
*   **ReadView (一致性视图)**：
    事务进行“快照读”时产生的一个快照，包含 4 个核心属性：
    *   `m_ids`：生成 ReadView 时，当前系统中**活跃且未提交**的事务 ID 列表。
    *   `min_trx_id`：`m_ids` 中的最小值。
    *   `max_trx_id`：生成 ReadView 时系统应该分配给下一个事务的 ID（即当前最大事务 ID + 1）。
    *   `creator_trx_id`：生成该 ReadView 的当前事务 ID。

#### 3. 数据可见性算法（重点）
当事务读取数据时，会拿到版本链中某个版本的 `trx_id`，并与 ReadView 进行对比：
1.  **等于 `creator_trx_id`**：说明是自己改的，**可见**。
2.  **小于 `min_trx_id`**：说明该版本事务在视图生成前已提交，**可见**。
3.  **大于等于 `max_trx_id`**：说明该版本事务在视图生成后才开启，**不可见**。
4.  **在 `min_trx_id` 和 `max_trx_id` 之间**：
    *   如果在 `m_ids` 中：说明该版本事务还未提交，**不可见**。
    *   如果不在 `m_ids` 中：说明该版本事务已提交，**可见**。

#### 4. RC 和 RR 的区别
MVCC 在不同隔离级别下的表现差异主要体现在 **ReadView 的生成时机**：
*   **RC (Read Committed)**：**每次执行 SELECT** 都会重新生成一个新的 ReadView。所以能读到别的事务刚提交的数据。
*   **RR (Repeatable Read)**：**仅在事务第一次执行 SELECT** 时生成一个 ReadView，后续所有的快照读都复用这一个。所以保证了同一个事务内多次读取结果一致。

**总结：** MVCC 让事务在不加锁的情况下实现了安全、高效的读取，是 MySQL 处理高并发读写请求的“杀手锏”。

---

### Q9: Redo Log 和 Binlog 的两阶段提交

**为什么需要两阶段提交？**

保证 Redo Log 和 Binlog 的一致性。

**流程：**

```
1. 写入 Redo Log（prepare 状态）
2. 写入 Binlog
3. 提交事务，Redo Log 改为 commit 状态
```

**崩溃恢复：**
- Redo Log 是 prepare，Binlog 无记录 → 回滚
- Redo Log 是 prepare，Binlog 有记录 → 提交

---

## 三、锁

### Q10: InnoDB 的锁类型

**按粒度分：**

| 锁类型 | 说明 |
| :--- | :--- |
| 全局锁 | `FLUSH TABLES WITH READ LOCK` |
| 表锁 | MDL 锁、意向锁 |
| 行锁 | Record Lock、Gap Lock、Next-Key Lock |

**行锁类型：**

| 类型 | 说明 | 解决问题 |
| :--- | :--- | :--- |
| Record Lock | 锁定单行 | 解决脏读、不可重复读 |
| Gap Lock | 锁定间隙 | 解决幻读 |
| Next-Key Lock | Record + Gap | InnoDB 默认 |

---

### Q11: 什么情况会产生间隙锁？

**RR 隔离级别下：**

```sql
-- 假设 id 有 1, 5, 10

-- 等值查询（不存在）
SELECT * FROM t WHERE id = 3 FOR UPDATE;
-- 锁住间隙 (1, 5)

-- 范围查询
SELECT * FROM t WHERE id > 3 AND id < 8 FOR UPDATE;
-- 锁住间隙 (1, 5] 和 (5, 10)
```

**间隙锁的问题：** 可能导致死锁，降低并发。

---

### Q12: 如何排查和解决死锁

**排查方法：**

```sql
-- 查看最近死锁
SHOW ENGINE INNODB STATUS\G

-- 开启死锁日志
SET GLOBAL innodb_print_all_deadlocks = 1;
```

**解决策略：**
1. 按固定顺序访问表/行
2. 减小事务粒度
3. 使用索引避免全表扫描
4. 设置锁等待超时 `innodb_lock_wait_timeout`

---

## 四、SQL 优化

### Q13: EXPLAIN 关键字段解读

| 字段 | 说明 | 关键值 |
| :--- | :--- | :--- |
| type | 访问类型 | const > eq_ref > ref > range > index > ALL |
| key | 实际使用的索引 | NULL 表示未使用索引 |
| rows | 预估扫描行数 | 越少越好 |
| Extra | 额外信息 | Using index（好）/ Using filesort（注意） |

**type 值解释：**
- **const**：主键/唯一索引等值查询
- **eq_ref**：关联查询，唯一索引匹配
- **ref**：普通索引等值查询
- **range**：范围查询
- **ALL**：全表扫描（需优化）

---

### Q14: 慢查询如何排查

**开启慢查询日志：**

```sql
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 2;  -- 超过 2 秒记录
```

**分析工具：**

```bash
# 官方工具
mysqldumpslow -s t -t 10 slow.log

# Percona 工具（推荐）
pt-query-digest slow.log
```

**优化步骤：**
1. 开启慢查询日志
2. 找出 Top N 慢 SQL
3. EXPLAIN 分析执行计划
4. 添加/优化索引
5. 重写 SQL 或调整业务

---

### Q15: 分页查询如何优化

**问题：** `LIMIT 100000, 10` 需要扫描 100010 行

**优化方案：**

```sql
-- 原始 SQL
SELECT * FROM orders ORDER BY id LIMIT 100000, 10;

-- 优化 1：子查询
SELECT * FROM orders
WHERE id >= (SELECT id FROM orders ORDER BY id LIMIT 100000, 1)
LIMIT 10;

-- 优化 2：游标分页（推荐）
SELECT * FROM orders WHERE id > 上次最大ID ORDER BY id LIMIT 10;
```

---

## 五、复制与高可用

### Q16: 主从复制的原理

**流程：**

```
1. Master 写入 Binlog
2. Slave IO 线程拉取 Binlog
3. Slave 写入 Relay Log
4. Slave SQL 线程重放 Relay Log
```

**复制模式：**

| 模式 | 说明 | 特点 |
| :--- | :--- | :--- |
| 异步 | Master 不等 Slave | 性能好，可能丢数据 |
| 半同步 | 至少一个 Slave 确认 | 折中方案 |
| 全同步 | 所有 Slave 确认 | 强一致，性能差 |

---

### Q17: 主从延迟的原因和解决方案

**原因：**
1. 大事务执行慢
2. 从库机器性能差
3. 单线程回放（MySQL 5.6 前）
4. 网络延迟

**解决方案：**
1. 拆分大事务
2. 开启并行复制 `slave_parallel_workers`
3. 提升从库配置
4. 关键读操作强制走主库

---

### Q18: 分库分表的时机和策略

**触发条件：**
- 单表超过 2000 万行
- 表大小超过 2GB
- QPS 超过单实例瓶颈

**分表策略：**

| 策略 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| Hash | 按 key 取模 | 数据均匀分布 |
| Range | 按范围划分 | 时间序列数据 |
| 一致性哈希 | 减少扩容迁移 | 动态扩容场景 |

**代价：**
- 跨分片查询复杂
- 分布式事务
- 唯一 ID 生成

---

## 六、更多八股文

### Q19: MySQL 的三大日志

| 日志 | 作用 | 层级 |
| :--- | :--- | :--- |
| **binlog** | 归档日志，主从复制 | Server 层 |
| **redo log** | 崩溃恢复，保证持久性 | InnoDB 存储引擎层 |
| **undo log** | 事务回滚，MVCC | InnoDB 存储引擎层 |

**redo log vs binlog：**

| 特性 | redo log | binlog |
| :--- | :--- | :--- |
| 写入方式 | 循环写，固定大小 | 追加写，归档 |
| 内容 | 物理日志（页修改） | 逻辑日志（SQL 语句） |
| 用途 | 崩溃恢复 | 复制、恢复 |

---

### Q20: Buffer Pool 的作用

**作用：** 缓存数据页和索引页，减少磁盘 IO

**组成：**
- **数据页**：缓存表数据
- **索引页**：缓存索引
- **Change Buffer**：缓存二级索引修改
- **自适应哈希索引**：热点数据索引

**淘汰策略：** 改进的 LRU，分为新生代和老年代

---

### Q21: Change Buffer 的作用

**作用：** 缓存二级索引的写操作，减少随机 IO

**条件：**
- 只对二级索引生效
- 索引不是唯一索引（唯一索引需要判断重复）

**合并时机：**
- 访问该数据页时
- 后台线程定期合并
- 数据库关闭时

---

### Q22: InnoDB 和 MyISAM 的区别

| 特性 | InnoDB | MyISAM |
| :--- | :--- | :--- |
| 事务 | ✅ | ❌ |
| 行锁 | ✅ | ❌（只有表锁） |
| 外键 | ✅ | ❌ |
| 崩溃恢复 | ✅ | ❌ |
| 全文索引 | ✅（MySQL 5.6+） | ✅ |
| 存储文件 | .ibd | .MYD + .MYI |

---

### Q23: 大表优化方案

| 方案 | 说明 |
| :--- | :--- |
| **分区表** | 按时间/范围分区 |
| **归档冷数据** | 历史数据迁移 |
| **分库分表** | 水平/垂直拆分 |
| **读写分离** | 主写从读 |
| **索引优化** | 添加合适索引 |
| **SQL 优化** | 避免全表扫描 |

---

### Q24: 如何优化 COUNT(*)

```sql
-- 慢：全表扫描
SELECT COUNT(*) FROM orders;

-- 优化方案：
-- 1. 使用二级索引（比主键索引小）
SELECT COUNT(*) FROM orders FORCE INDEX(idx_status);

-- 2. 维护计数表
-- 3. 估算值（information_schema.TABLES）
-- 4. Redis 缓存计数
```

---

### Q25: 什么是当前读和快照读

| 类型 | 说明 | 示例 |
| :--- | :--- | :--- |
| **快照读** | 读取历史版本，通过 MVCC | 普通 SELECT |
| **当前读** | 读取最新数据，加锁 | SELECT ... FOR UPDATE |

---

### Q26: MySQL 锁等待排查

```sql
-- 查看锁等待
SELECT * FROM information_schema.INNODB_LOCK_WAITS;

-- 查看事务
SELECT * FROM information_schema.INNODB_TRX;

-- 查看锁
SELECT * FROM performance_schema.data_locks;

-- 杀死阻塞事务
KILL <thread_id>;
```

---

## 七、高频考点清单

### 必考

- [ ] B+Tree 优势、聚簇索引 vs 二级索引
- [ ] 最左前缀法则、索引失效场景
- [ ] MVCC 实现、Read View 时机
- [ ] Record Lock / Gap Lock / Next-Key Lock
- [ ] Redo Log / Binlog 两阶段提交
- [ ] EXPLAIN 关键字段含义

### 常考

- [ ] 事务 ACID 实现
- [ ] 隔离级别与并发问题
- [ ] 慢查询排查流程
- [ ] 分页优化
- [ ] 死锁排查
- [ ] 三大日志的作用

### 进阶

- [ ] 主从复制原理
- [ ] 半同步复制
- [ ] 分库分表策略
- [ ] 主从延迟解决方案
- [ ] Buffer Pool 原理
- [ ] InnoDB vs MyISAM

