---
order: 5
---

# MySQL 锁

锁用于解决并发访问时的数据一致性问题。

## 锁分类

```
MySQL 锁
├── 按粒度
│   ├── 全局锁 - 锁整个数据库
│   ├── 表级锁 - 锁整张表
│   └── 行级锁 - 锁单行数据
├── 按模式
│   ├── 共享锁(S) - 读锁
│   └── 排他锁(X) - 写锁
└── 按加锁方式
    ├── 隐式锁 - 自动加锁
    └── 显式锁 - 手动加锁
```

## 全局锁

锁定整个数据库，所有表只读。

```sql
-- 加全局锁
FLUSH TABLES WITH READ LOCK;

-- 释放锁
UNLOCK TABLES;
```

**使用场景**：全库备份

```bash
# 使用 mysqldump 备份时自动加全局锁
mysqldump -uroot -p --all-databases > backup.sql

# InnoDB 推荐使用 --single-transaction 避免全局锁
mysqldump -uroot -p --single-transaction --all-databases > backup.sql
```

## 表级锁

### 表锁

```sql
-- 加表读锁
LOCK TABLES user READ;

-- 加表写锁
LOCK TABLES user WRITE;

-- 释放锁
UNLOCK TABLES;
```

| 锁类型 | 当前会话   | 其他会话     |
| :----- | :--------- | :----------- |
| 读锁   | 可读不可写 | 可读不可写   |
| 写锁   | 可读可写   | 不可读不可写 |

### 元数据锁（MDL）

访问表时自动加锁，无需手动操作。

| 操作   | 锁类型   | 说明         |
| :----- | :------- | :----------- |
| SELECT | MDL 读锁 | 可并发读     |
| DML    | MDL 读锁 | 可并发读     |
| DDL    | MDL 写锁 | 阻塞其他操作 |

**注意**：DDL 会阻塞查询，生产环境慎用。

### 意向锁

InnoDB 自动维护，用于表锁和行锁的协调。

| 类型 | 说明       |
| :--- | :--------- |
| IS   | 意向共享锁 |
| IX   | 意向排他锁 |

**作用**：快速判断表中是否有行锁，避免逐行检查。

## 行级锁

InnoDB 支持行级锁，锁粒度最小，并发度最高。

### 行锁类型

| 类型          | 说明                 |
| :------------ | :------------------- |
| Record Lock   | 记录锁，锁单行       |
| Gap Lock      | 间隙锁，锁索引间隙   |
| Next-Key Lock | 临键锁，Record + Gap |

### 共享锁与排他锁

```sql
-- 共享锁（S锁）
SELECT * FROM user WHERE id = 1 LOCK IN SHARE MODE;
-- MySQL 8.0+
SELECT * FROM user WHERE id = 1 FOR SHARE;

-- 排他锁（X锁）
SELECT * FROM user WHERE id = 1 FOR UPDATE;
```

| 锁类型 | S锁  | X锁  |
| :----- | :--- | :--- |
| S锁    | 兼容 | 冲突 |
| X锁    | 冲突 | 冲突 |

### 行锁加锁规则

**默认锁类型：Next-Key Lock（左开右闭区间）**

| 场景                         | 锁类型        |
| :--------------------------- | :------------ |
| 唯一索引等值查询，记录存在   | Record Lock   |
| 唯一索引等值查询，记录不存在 | Gap Lock      |
| 唯一索引范围查询             | Next-Key Lock |
| 非唯一索引等值查询           | Next-Key Lock |
| 无索引                       | 全表锁        |

### 间隙锁示例

假设 id 有值：1, 5, 10

```sql
-- 锁住 (5, 10) 区间
SELECT * FROM user WHERE id = 7 FOR UPDATE;

-- 其他事务无法在 (5, 10) 区间插入数据
INSERT INTO user VALUES (6, ...);  -- 阻塞
INSERT INTO user VALUES (8, ...);  -- 阻塞
```

### 临键锁示例

```sql
-- 锁住 (5, 10] 区间
SELECT * FROM user WHERE id >= 5 AND id < 10 FOR UPDATE;

-- 锁定的区间
-- (5, 10]：包含 10
-- 其他事务不能插入 6, 7, 8, 9，也不能修改 10
```

## 死锁

两个事务互相等待对方释放锁。

### 死锁示例

```
事务A                        事务B
BEGIN;                       BEGIN;
UPDATE user SET ... WHERE id=1;  -- 锁住 id=1
                             UPDATE user SET ... WHERE id=2;  -- 锁住 id=2
UPDATE user SET ... WHERE id=2;  -- 等待 id=2
                             UPDATE user SET ... WHERE id=1;  -- 等待 id=1
-- 死锁！
```

### 死锁处理

**InnoDB 死锁检测**：自动检测并回滚代价小的事务

```sql
-- 查看死锁日志
SHOW ENGINE INNODB STATUS;

-- 查看锁等待
SELECT * FROM information_schema.INNODB_LOCKS;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;

-- MySQL 8.0+
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;
```

### 避免死锁

| 方法           | 说明                     |
| :------------- | :----------------------- |
| 固定顺序访问   | 多表操作按固定顺序       |
| 大事务拆分     | 减少锁持有时间           |
| 使用低隔离级别 | RC 比 RR 锁更少          |
| 添加合理索引   | 避免全表锁               |
| 设置超时       | innodb_lock_wait_timeout |

```sql
-- 设置锁等待超时（默认 50 秒）
SET innodb_lock_wait_timeout = 10;

-- 关闭死锁检测（高并发场景）
SET innodb_deadlock_detect = OFF;
```

## 锁优化

### 减少锁冲突

```sql
-- 1. 使用索引，避免全表锁
SELECT * FROM user WHERE id = 1 FOR UPDATE;  -- 行锁
SELECT * FROM user WHERE name = 'xxx' FOR UPDATE;  -- 无索引则表锁

-- 2. 控制事务大小
BEGIN;
-- 尽量少的操作
COMMIT;

-- 3. 尽快提交事务
-- 不要在事务中做耗时操作
```

### 锁监控

```sql
-- 当前运行的事务
SELECT * FROM information_schema.INNODB_TRX;

-- 锁等待情况
SELECT 
    r.trx_id AS waiting_trx_id,
    r.trx_query AS waiting_query,
    b.trx_id AS blocking_trx_id,
    b.trx_query AS blocking_query
FROM information_schema.INNODB_LOCK_WAITS w
JOIN information_schema.INNODB_TRX r ON r.trx_id = w.requesting_trx_id
JOIN information_schema.INNODB_TRX b ON b.trx_id = w.blocking_trx_id;
```

## 锁常见问题

### Q1: 为什么 UPDATE 不走索引会锁全表？

InnoDB 行锁是加在索引上的。没有索引，只能锁全表。

### Q2: INSERT 会加什么锁？

- 普通 INSERT：隐式锁（延迟加锁）
- INSERT ... ON DUPLICATE KEY UPDATE：Next-Key Lock
- INSERT INTO ... SELECT：共享 Next-Key Lock

### Q3: 乐观锁和悲观锁？

| 类型   | 实现                  | 适用场景 |
| :----- | :-------------------- | :------- |
| 悲观锁 | SELECT ... FOR UPDATE | 写多读少 |
| 乐观锁 | 版本号 / CAS          | 读多写少 |

```sql
-- 乐观锁示例
UPDATE product 
SET stock = stock - 1, version = version + 1 
WHERE id = 1 AND version = 5;
```
