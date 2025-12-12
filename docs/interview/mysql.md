---
order: 3
icon: logos:mysql
---

# MySQL 面试题

索引、事务、锁、优化、主从复制。

## 索引

- B+Tree 为什么比 B-Tree/Hash 更适合 MySQL？
- 聚簇索引 vs 二级索引？回表是什么？如何用覆盖索引避免回表？
- 最左前缀法则、范围查询右侧列失效的原因？
- 索引失效场景：函数/表达式、隐式类型转换、左模糊、OR 部分无索引、数据分布差。
- 前缀索引如何确定长度？如何评估选择性？
- 联合索引列顺序如何选择？区分度、查询频率、排序/分组需求。

## 事务与 MVCC

- ACID 与实现：原子性/undo log，一致性，隔离性/MVCC+锁，持久性/redo log。
- 隔离级别与并发现象：RU/RC/RR/Serializable；MySQL 默认 RR，如何避免幻读（快照读 + 间隙锁）。
- MVCC 组成：隐藏列（trx_id、roll_ptr）、undo log、Read View；RC vs RR 的 Read View 生成时机。
- 两阶段提交：redo log prepare/commit + binlog，作用是什么？

## 锁

- 锁粒度：全局锁、表锁（MDL）、行锁（Record/GAP/Next-Key）。
- 间隙锁/临键锁的作用与加锁规则（唯一索引等值、范围、非唯一）。
- 死锁检测与处理：`show engine innodb status`、`innodb_print_all_deadlocks`、超时设置。
- 意向锁的作用？如何与行锁协作？

## SQL 优化

- `EXPLAIN` 关键字段：type（const/eq_ref/ref/range/index/ALL）、rows、key、Extra（Using index/filesort/temporary）。
- 慢查询排查：slow log、`mysqldumpslow`、`pt-query-digest`。
- 查询优化：避免 SELECT *、索引覆盖、分页优化（子查询/ID 游标）、避免函数/隐式转换。
- 写入优化：批量插入、合理主键（自增避免页分裂）、控制大事务。
- 表设计：字段类型“够用且小”、少 NULL、前缀索引、冷热分离、分库分表触发条件。

## 复制与高可用

- 主从复制流程：binlog→从库 IO 线程→relay log→SQL 线程。
- 复制模式：异步/半同步/全同步；半同步优缺点。
- 主从延迟原因与缓解：大事务、从库性能、单线程复制；并行复制配置。
- 读写分离注意：主从延迟、事务内强制走主库、热点读走主库。

## 高频清单

- [ ] B+Tree 优势、覆盖索引
- [ ] 最左前缀、范围查询失效
- [ ] RC vs RR，MVCC 实现与 Read View 时机
- [ ] 间隙锁/临键锁作用与加锁规则
- [ ] redo/binlog 两阶段提交
- [ ] `EXPLAIN` 关键字段含义
- [ ] 慢查询排查流程
- [ ] 分库分表的时机与代价
