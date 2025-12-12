---
index: false
icon: tabler:brand-mysql
dir:
    link: true
    order: 1
---

# MySQL

MySQL 是最流行的开源关系型数据库，也是后端开发必备技能。

## 目录

<Catalog hideHeading='false'/>

## 学习路线

| 阶段 | 主题     | 核心内容                               | 链接                                |
| :--- | :------- | :------------------------------------- | :---------------------------------- |
| 1    | SQL 基础 | DDL、DML、DQL、DCL                     | [进入学习](./sql-basic.md)          |
| 2    | SQL 进阶 | 多表查询、子查询、函数、视图、存储过程 | [进入学习](./sql-advanced.md)       |
| 3    | 索引     | B+Tree、索引类型、索引优化             | [进入学习](./mysql-index.md)        |
| 4    | 事务     | ACID、隔离级别、MVCC                   | [进入学习](./mysql-transaction.md)  |
| 5    | 锁机制   | 表锁、行锁、间隙锁、死锁               | [进入学习](./mysql-lock.md)         |
| 6    | 性能优化 | 执行计划、慢查询、SQL优化              | [进入学习](./mysql-optimize.md)     |
| 7    | 高可用   | 主从复制、读写分离、分库分表           | [进入学习](./mysql-architecture.md) |

## 快速参考

### 常用命令

```sql
-- 连接数据库
mysql -u root -p

-- 查看数据库
SHOW DATABASES;

-- 创建数据库
CREATE DATABASE mydb DEFAULT CHARSET utf8mb4;

-- 使用数据库
USE mydb;

-- 查看表
SHOW TABLES;

-- 查看表结构
DESC table_name;

-- 查看建表语句
SHOW CREATE TABLE table_name;
```

### 数据类型速查

| 分类   | 类型                        | 说明                 |
| :----- | :-------------------------- | :------------------- |
| 整数   | TINYINT, INT, BIGINT        | 1/4/8 字节           |
| 小数   | DECIMAL(M,D), FLOAT, DOUBLE | 精确/近似小数        |
| 字符串 | CHAR(n), VARCHAR(n), TEXT   | 定长/变长/大文本     |
| 日期   | DATE, DATETIME, TIMESTAMP   | 日期/日期时间/时间戳 |
| 二进制 | BLOB                        | 二进制大对象         |
| JSON   | JSON                        | MySQL 5.7+           |

### 核心知识点

```
MySQL 核心知识体系
├── SQL 语言
│   ├── DDL - 数据定义（CREATE/ALTER/DROP）
│   ├── DML - 数据操作（INSERT/UPDATE/DELETE）
│   ├── DQL - 数据查询（SELECT）
│   └── DCL - 权限控制（GRANT/REVOKE）
├── 存储引擎
│   ├── InnoDB - 默认引擎，支持事务、行锁
│   └── MyISAM - 不支持事务，表锁，读取快
├── 索引
│   ├── 聚簇索引 - 主键索引，数据和索引一起存储
│   ├── 二级索引 - 非主键索引，需要回表
│   └── 覆盖索引 - 索引包含所需字段，无需回表
├── 事务
│   ├── ACID 特性
│   ├── 隔离级别 - RU/RC/RR/Serializable
│   └── MVCC - 多版本并发控制
├── 锁
│   ├── 全局锁、表锁、行锁
│   ├── 间隙锁、临键锁
│   └── 意向锁
└── 日志
    ├── redo log - 重做日志，保证持久性
    ├── undo log - 回滚日志，保证原子性
    └── binlog - 归档日志，主从复制
```

## 面试高频

- InnoDB 和 MyISAM 的区别？
- B+Tree 为什么比 B-Tree 更适合做索引？
- 什么是回表查询？如何避免？
- 索引失效的场景有哪些？
- 事务的隔离级别？MySQL 默认是哪个？
- MVCC 是如何实现的？
- 什么是幻读？RR 级别下如何解决？
- 什么是死锁？如何避免？
- 慢查询如何优化？
- 主从复制的原理？
