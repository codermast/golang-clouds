---
order: 4
icon: simple-icons:redis
---

# Redis 面试题

数据类型、持久化、集群、缓存一致性、性能优化。

## 基础与数据结构

- 5 大基本类型（String/Hash/List/Set/ZSet）底层分别是什么？（SDS、哈希表、quicklist、跳表+哈希表）。
- Bitmap/HyperLogLog/Geo/Stream 典型场景？
- String 为何不可变？SDS 与 C 字符串区别？
- ZSet 为何用跳表而不是红黑树？

## 持久化

- RDB vs AOF 区别：触发方式、文件大小、恢复速度、数据安全性。
- AOF 同步策略：always/everysec/no 的权衡。
- AOF 重写原理？多文件 AOF（Redis 7）结构？
- 混合持久化原理与优点？

## 集群与高可用

- 主从复制流程，增量复制的实现？
- 哨兵选主流程：主观下线/客观下线、选举 leader、从节点排序规则。
- Cluster 槽位分配与 hash tag 用法；多 key 操作限制？
- 主从延迟的原因与治理（并行复制、提升从库配置、拆分大事务）。

## 缓存问题与一致性

- 缓存穿透/击穿/雪崩的原因与解决方案。
- Cache Aside 模式：读流程、写流程；为什么删除缓存而不是更新？
- 延迟双删、异步删除（Canal 监听 binlog）。
- 分布式锁正确姿势：SET NX PX + 唯一值；解锁 Lua；锁续期（看门狗）。

## 性能与内存

- 内存淘汰策略：allkeys-lru/lfu、volatile-ttl 等，何时选什么？
- 大 key 风险与处理：拆分、UNLINK 异步删除、SCAN 分批。
- 慢查询与热点 key 排查：SLOWLOG、`--bigkeys`、`--memkeys`、`monitor` 使用注意。
- 网络模型：单线程命令执行 + IO 多线程；为什么单线程也快？

## 常见命令陷阱

- KEYS vs SCAN；HGETALL/SMEMBERS 大量数据风险。
- 事务 `MULTI/EXEC`：不回滚、编译/运行时错误行为。
- Pipeline 与事务区别：是否原子？网络优化？

## 高频清单

- [ ] RDB vs AOF、同步策略
- [ ] AOF 重写与混合持久化
- [ ] 主从复制与哨兵选主流程
- [ ] Cluster 槽位、hash tag、多 key 限制
- [ ] 缓存穿透/击穿/雪崩解决方案
- [ ] 分布式锁正确实现（加锁/解锁/续期）
- [ ] 淘汰策略选择与大 key 处理
- [ ] IO 多路复用 + 单线程为何高性能
