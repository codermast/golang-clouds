---
order: 5
---

# Redis 高可用

主从复制、哨兵、Cluster 集群。

## 主从复制

一主多从，实现数据备份和读写分离。

### 配置方式

```bash
# 方式 1：配置文件
# redis.conf（从节点）
replicaof 192.168.1.100 6379
masterauth password

# 方式 2：命令
REPLICAOF 192.168.1.100 6379
CONFIG SET masterauth password

# 取消复制
REPLICAOF NO ONE
```

### 复制原理

**全量复制（首次同步）：**

```
1. 从节点发送 PSYNC ? -1
2. 主节点执行 BGSAVE 生成 RDB
3. 主节点发送 RDB 给从节点
4. 主节点发送复制期间的写命令
5. 从节点加载 RDB，执行命令
```

**增量复制（断线重连）：**

```
1. 从节点发送 PSYNC <replid> <offset>
2. 主节点检查 offset 是否在 repl_backlog 中
3. 如果在，发送增量数据
4. 如果不在，执行全量复制
```

### 相关配置

```bash
# 主节点
repl-backlog-size 1mb          # 复制积压缓冲区大小
repl-backlog-ttl 3600          # 积压缓冲区保留时间

# 从节点
replica-read-only yes          # 从节点只读
replica-serve-stale-data yes   # 复制中是否响应请求
```

### 主从架构

```
         Master（读写）
         /    |    \
    Slave1  Slave2  Slave3（只读）
```

**优点：**
- 数据备份
- 读写分离，提高读性能

**缺点：**
- 主节点故障需要手动切换
- 写性能无法扩展

## 哨兵模式

自动故障检测和主从切换。

### 哨兵功能

| 功能         | 说明                         |
| :----------- | :--------------------------- |
| 监控         | 监控主从节点是否正常         |
| 通知         | 故障时通知管理员             |
| 自动故障转移 | 主节点故障时自动选举新主节点 |
| 配置提供     | 客户端通过哨兵获取主节点地址 |

### 部署配置

```bash
# sentinel.conf
port 26379
sentinel monitor mymaster 192.168.1.100 6379 2  # 2 个哨兵同意才切换
sentinel auth-pass mymaster password
sentinel down-after-milliseconds mymaster 30000  # 30秒无响应判断下线
sentinel failover-timeout mymaster 180000        # 故障转移超时
sentinel parallel-syncs mymaster 1               # 同时同步的从节点数

# 启动哨兵
redis-sentinel /path/to/sentinel.conf
```

### 故障转移流程

```
1. 主观下线：单个哨兵认为主节点不可用
2. 客观下线：quorum 个哨兵都认为主节点不可用
3. 选举领导者：哨兵选举出 leader
4. 选择新主节点：
   - 过滤不健康的从节点
   - 按优先级、offset、runid 排序
   - 选择最优从节点
5. 执行切换：
   - 新主节点执行 REPLICAOF NO ONE
   - 其他从节点指向新主节点
   - 旧主节点恢复后成为从节点
```

### 哨兵架构

```
    Sentinel1   Sentinel2   Sentinel3
         \         |         /
          \        |        /
           ↘      ↓       ↙
              Master
            /        \
        Slave1      Slave2
```

**客户端连接：**

```java
// Java 连接哨兵
Set<String> sentinels = new HashSet<>();
sentinels.add("192.168.1.101:26379");
sentinels.add("192.168.1.102:26379");
sentinels.add("192.168.1.103:26379");

JedisSentinelPool pool = new JedisSentinelPool("mymaster", sentinels);
try (Jedis jedis = pool.getResource()) {
    jedis.set("key", "value");
}
```

## Cluster 集群

分片集群，支持数据分区和水平扩展。

### 集群特点

| 特点         | 说明                         |
| :----------- | :--------------------------- |
| 数据分片     | 16384 个槽位分布在多个节点   |
| 高可用       | 每个主节点可以有从节点       |
| 自动故障转移 | 主节点故障时自动切换         |
| 去中心化     | 无需代理，节点间 Gossip 通信 |

### 槽位分配

```
0 ~ 5460      →  Node1
5461 ~ 10922  →  Node2
10923 ~ 16383 →  Node3

key 的槽位 = CRC16(key) % 16384
```

### 部署配置

```bash
# redis.conf
port 7001
cluster-enabled yes
cluster-config-file nodes-7001.conf
cluster-node-timeout 15000
cluster-require-full-coverage no

# 创建集群
redis-cli --cluster create \
  192.168.1.101:7001 192.168.1.102:7001 192.168.1.103:7001 \
  192.168.1.101:7002 192.168.1.102:7002 192.168.1.103:7002 \
  --cluster-replicas 1

# 集群信息
redis-cli -c -h 192.168.1.101 -p 7001
CLUSTER INFO
CLUSTER NODES
CLUSTER SLOTS
```

### 集群操作

```bash
# 添加节点
redis-cli --cluster add-node new_host:port existing_host:port

# 添加从节点
redis-cli --cluster add-node new_host:port existing_host:port --cluster-slave --cluster-master-id <node-id>

# 迁移槽位
redis-cli --cluster reshard host:port

# 删除节点
redis-cli --cluster del-node host:port node-id

# 故障转移
CLUSTER FAILOVER              # 从节点执行，手动切换
```

### 集群架构

```
      ┌─────────────────────────────────────┐
      │            Cluster                  │
      │  ┌───────┐  ┌───────┐  ┌───────┐   │
      │  │Master1│  │Master2│  │Master3│   │
      │  │0-5460 │  │5461-  │  │10923- │   │
      │  │       │  │10922  │  │16383  │   │
      │  └───┬───┘  └───┬───┘  └───┬───┘   │
      │      │          │          │       │
      │  ┌───┴───┐  ┌───┴───┐  ┌───┴───┐   │
      │  │Slave1 │  │Slave2 │  │Slave3 │   │
      │  └───────┘  └───────┘  └───────┘   │
      └─────────────────────────────────────┘
```

### 客户端连接

```java
// Jedis Cluster
Set<HostAndPort> nodes = new HashSet<>();
nodes.add(new HostAndPort("192.168.1.101", 7001));
nodes.add(new HostAndPort("192.168.1.102", 7001));
nodes.add(new HostAndPort("192.168.1.103", 7001));

JedisCluster cluster = new JedisCluster(nodes);
cluster.set("key", "value");
String value = cluster.get("key");
```

```yaml
# Spring Boot
spring:
  redis:
    cluster:
      nodes:
        - 192.168.1.101:7001
        - 192.168.1.102:7001
        - 192.168.1.103:7001
      max-redirects: 3
```

### 集群限制

| 限制        | 说明                            |
| :---------- | :------------------------------ |
| 多 key 操作 | 必须在同一个槽（使用 hash tag） |
| 事务        | 仅支持同槽 key                  |
| Lua 脚本    | 仅支持同槽 key                  |
| 数据库      | 只能使用 db0                    |

```bash
# Hash Tag：强制 key 在同一槽
SET {user:1001}:name "张三"
SET {user:1001}:age 25
# {user:1001} 用于计算槽位
```

## 方案对比

| 方案    | 优点             | 缺点                  |
| :------ | :--------------- | :-------------------- |
| 主从    | 简单，读写分离   | 手动切换，无法扩展写  |
| 哨兵    | 自动故障转移     | 无法扩展写，资源浪费  |
| Cluster | 水平扩展，高可用 | 复杂，多 key 操作受限 |
