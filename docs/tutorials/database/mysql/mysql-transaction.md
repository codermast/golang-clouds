---
order: 4
---

# MySQL 事务

事务是一组不可分割的操作，要么全部成功，要么全部失败。

## 事务操作

```sql
-- 查看自动提交状态
SELECT @@autocommit;

-- 关闭自动提交
SET @@autocommit = 0;

-- 开启事务
START TRANSACTION;
-- 或
BEGIN;

-- 提交事务
COMMIT;

-- 回滚事务
ROLLBACK;
```

**示例**

```sql
START TRANSACTION;

UPDATE account SET balance = balance - 100 WHERE name = '张三';
UPDATE account SET balance = balance + 100 WHERE name = '李四';

-- 成功则提交
COMMIT;

-- 失败则回滚
-- ROLLBACK;
```

## ACID 特性

| 特性   | 说明                               | 实现机制         |
| :----- | :--------------------------------- | :--------------- |
| 原子性 | 事务不可分割，要么全成功要么全失败 | undo log         |
| 一致性 | 事务前后数据状态一致               | 其他三个特性保证 |
| 隔离性 | 事务之间互不干扰                   | MVCC + 锁        |
| 持久性 | 事务提交后数据永久保存             | redo log         |

## 并发问题

| 问题       | 描述                                   |
| :--------- | :------------------------------------- |
| 脏读       | 读到其他事务**未提交**的数据           |
| 不可重复读 | 同一事务内两次读取**同一行**数据不一致 |
| 幻读       | 同一事务内两次读取**记录数**不一致     |

### 脏读

```
事务A                        事务B
BEGIN;                       BEGIN;
UPDATE user SET age=20;      
                             SELECT age FROM user; → 20（脏读）
ROLLBACK;                    
                             -- 读到的20是无效数据
```

### 不可重复读

```
事务A                        事务B
BEGIN;                       BEGIN;
SELECT age FROM user; → 18   
                             UPDATE user SET age=20;
                             COMMIT;
SELECT age FROM user; → 20   -- 两次读取结果不同
COMMIT;
```

### 幻读

```
事务A                            事务B
BEGIN;                           BEGIN;
SELECT * WHERE age=18; → 2条     
                                 INSERT INTO user VALUES(3, 18);
                                 COMMIT;
SELECT * WHERE age=18; → 3条     -- 记录数变化
COMMIT;
```

## 隔离级别

| 隔离级别         | 脏读 | 不可重复读 | 幻读 | 性能 |
| :--------------- | :--- | :--------- | :--- | :--- |
| Read Uncommitted | ✅    | ✅          | ✅    | 最高 |
| Read Committed   | ❌    | ✅          | ✅    | 较高 |
| Repeatable Read  | ❌    | ❌          | ✅    | 一般 |
| Serializable     | ❌    | ❌          | ❌    | 最低 |

**MySQL 默认隔离级别：Repeatable Read（RR）**

```sql
-- 查看隔离级别
SELECT @@transaction_isolation;

-- 设置隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET GLOBAL TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

## MVCC

MVCC（Multi-Version Concurrency Control）多版本并发控制，用于实现 RC 和 RR 隔离级别。

### 核心组件

| 组件      | 说明                              |
| :-------- | :-------------------------------- |
| 隐藏字段  | DB_TRX_ID、DB_ROLL_PTR、DB_ROW_ID |
| undo log  | 记录数据的历史版本                |
| Read View | 判断版本可见性                    |

### 隐藏字段

每行数据都有三个隐藏字段：

| 字段        | 说明                     |
| :---------- | :----------------------- |
| DB_TRX_ID   | 最后修改该行的事务 ID    |
| DB_ROLL_PTR | 指向 undo log 的指针     |
| DB_ROW_ID   | 隐藏主键（无主键时使用） |

### 版本链

```
当前版本
┌──────────────────────┐
│ id=1, name='张三'    │
│ DB_TRX_ID = 100      │
│ DB_ROLL_PTR ─────────┼──┐
└──────────────────────┘  │
                          ▼
                    ┌──────────────────────┐
                    │ id=1, name='李四'    │
                    │ DB_TRX_ID = 50       │
                    │ DB_ROLL_PTR ─────────┼──┐
                    └──────────────────────┘  │
                                              ▼
                                        ┌──────────────────────┐
                                        │ id=1, name='王五'    │
                                        │ DB_TRX_ID = 10       │
                                        │ DB_ROLL_PTR = NULL   │
                                        └──────────────────────┘
```

### Read View

Read View 记录当前活跃事务，用于判断版本可见性。

| 字段           | 说明                       |
| :------------- | :------------------------- |
| m_ids          | 活跃事务 ID 列表           |
| min_trx_id     | 最小活跃事务 ID            |
| max_trx_id     | 下一个待分配的事务 ID      |
| creator_trx_id | 创建该 Read View 的事务 ID |

**可见性判断规则：**

```
trx_id == creator_trx_id  → 可见（自己的修改）
trx_id < min_trx_id       → 可见（事务已提交）
trx_id >= max_trx_id      → 不可见（未来的事务）
trx_id in m_ids           → 不可见（未提交的活跃事务）
其他                       → 可见
```

### RC vs RR 的区别

| 隔离级别 | Read View 生成时机   |
| :------- | :------------------- |
| RC       | 每次 SELECT 都生成   |
| RR       | 第一次 SELECT 时生成 |

**这就是为什么 RR 能避免不可重复读：**
- RC：每次读都是最新视图，能读到其他事务已提交的数据
- RR：使用同一个视图，看不到后续提交的数据

## 日志

### redo log（重做日志）

- **作用**：保证事务持久性
- **原理**：记录数据页的物理变化
- **机制**：WAL（Write-Ahead Logging），先写日志再写磁盘

```
┌──────────┐    ①写入    ┌──────────┐
│  事务    │ ──────────→ │ redo log │  ← 顺序写，速度快
└──────────┘             └──────────┘
                               │
                               ↓ ②后台刷盘
                         ┌──────────┐
                         │ 数据文件  │  ← 随机写，速度慢
                         └──────────┘
```

### undo log（回滚日志）

- **作用**：保证事务原子性，支持 MVCC
- **原理**：记录数据修改前的值
- **用途**：
  - 事务回滚
  - MVCC 版本链

### binlog（归档日志）

- **作用**：主从复制、数据恢复
- **位置**：Server 层
- **格式**：
  - STATEMENT：记录 SQL 语句
  - ROW：记录行数据变化
  - MIXED：混合模式

### 两阶段提交

确保 redo log 和 binlog 一致：

```
1. 写入 redo log（prepare 状态）
2. 写入 binlog
3. 提交 redo log（commit 状态）
```

## 事务常见问题

### Q1: 大事务的危害？

- 锁定资源时间长，影响并发
- undo log 膨胀
- 主从延迟

### Q2: 如何避免长事务？

- 控制事务大小
- 避免在事务中做耗时操作
- 设置超时时间

### Q3: RR 级别下如何解决幻读？

- 快照读：MVCC
- 当前读：间隙锁（Next-Key Lock）
