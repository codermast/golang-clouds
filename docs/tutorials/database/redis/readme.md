---
index: false
icon: cib:redis
dir:
    link: true
    order: 2
---

# Redis

Redis 是高性能的键值存储数据库，常用于缓存、消息队列、分布式锁等场景。

## 目录

<Catalog hideHeading='false'/>

## 学习路线

| 阶段 | 主题     | 核心内容                      | 链接                               |
| :--- | :------- | :---------------------------- | :--------------------------------- |
| 1    | 基础入门 | 安装配置、基本命令、Key 操作  | [进入学习](./redis-basic.md)       |
| 2    | 数据类型 | String、Hash、List、Set、ZSet | [进入学习](./redis-datatype.md)    |
| 3    | 进阶功能 | 事务、发布订阅、Lua、Stream   | [进入学习](./redis-advanced.md)    |
| 4    | 持久化   | RDB、AOF、混合持久化          | [进入学习](./redis-persistence.md) |
| 5    | 高可用   | 主从复制、哨兵、Cluster 集群  | [进入学习](./redis-cluster.md)     |
| 6    | 性能优化 | 内存优化、缓存问题、最佳实践  | [进入学习](./redis-optimize.md)    |
| 7    | 底层原理 | 数据结构、网络模型、线程模型  | [进入学习](./redis-principle.md)   |

## 快速参考

### 常用命令

```bash
# 连接 Redis
redis-cli -h 127.0.0.1 -p 6379 -a password

# 基本操作
SET key value              # 设置值
GET key                    # 获取值
DEL key                    # 删除
EXPIRE key seconds         # 设置过期时间
TTL key                    # 查看剩余时间
KEYS pattern               # 查找 key（生产慎用）
SCAN cursor                # 迭代 key（推荐）

# 查看信息
INFO                       # 服务器信息
DBSIZE                     # key 数量
CLIENT LIST                # 客户端连接
```

### 数据类型速查

| 类型        | 特点           | 典型场景               |
| :---------- | :------------- | :--------------------- |
| String      | 简单键值对     | 缓存、计数器、分布式锁 |
| Hash        | 字段-值映射    | 对象存储               |
| List        | 有序列表       | 消息队列、最新列表     |
| Set         | 无序不重复集合 | 标签、共同好友         |
| ZSet        | 有序集合       | 排行榜、延迟队列       |
| Bitmap      | 位图           | 签到、在线状态         |
| HyperLogLog | 基数统计       | UV 统计                |
| Geo         | 地理位置       | 附近的人               |
| Stream      | 消息流         | 消息队列               |

### 核心知识体系

```
Redis 核心知识体系
├── 数据类型
│   ├── 5 种基本类型：String、Hash、List、Set、ZSet
│   └── 4 种特殊类型：Bitmap、HyperLogLog、Geo、Stream
├── 持久化
│   ├── RDB - 快照，恢复快，可能丢数据
│   └── AOF - 日志，数据完整，文件大
├── 高可用
│   ├── 主从复制 - 数据备份
│   ├── 哨兵模式 - 自动故障转移
│   └── Cluster - 分片集群
├── 缓存问题
│   ├── 缓存穿透 - 查不存在的数据
│   ├── 缓存击穿 - 热点 key 过期
│   └── 缓存雪崩 - 大量 key 同时过期
└── 底层原理
    ├── 单线程模型（命令执行）
    ├── IO 多路复用（epoll）
    └── 高效数据结构（SDS、跳表、压缩列表）
```

## 面试高频

- Redis 为什么这么快？
- Redis 是单线程还是多线程？
- String 底层是什么结构？
- ZSet 底层是怎么实现的？
- RDB 和 AOF 的区别？
- 主从复制的原理？
- 哨兵是怎么选举的？
- Cluster 如何分片？
- 缓存穿透、击穿、雪崩如何解决？
- 如何实现分布式锁？
- 如何保证缓存和数据库一致性？
- Redis 内存淘汰策略有哪些？
