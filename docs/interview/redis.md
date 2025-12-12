---
order: 4
icon: logos:redis
---

# Redis 面试题

Redis 面试高频考点，覆盖数据结构、持久化、集群、缓存一致性、性能优化等核心知识。

---

## 一、数据结构

### Q1: Redis 的五种基本数据类型及底层实现

| 类型 | 底层实现 | 应用场景 |
| :--- | :--- | :--- |
| **String** | SDS（动态字符串） | 缓存、计数器、分布式锁 |
| **Hash** | ziplist / hashtable | 对象属性存储 |
| **List** | quicklist（ziplist + 链表） | 消息队列、时间线 |
| **Set** | intset / hashtable | 标签、共同好友 |
| **ZSet** | ziplist / skiplist + hashtable | 排行榜、优先队列 |

---

### Q2: 为什么用 SDS 而不是 C 字符串？

| 特性 | C 字符串 | SDS |
| :--- | :--- | :--- |
| 获取长度 | O(N) 遍历 | O(1) 直接读 len |
| 缓冲区溢出 | 可能溢出 | 自动扩容 |
| 二进制安全 | ❌ 不支持 \0 | ✅ 支持任意二进制 |
| 内存分配 | 每次修改都分配 | 空间预分配、惰性释放 |

```c
struct sdshdr {
    int len;      // 已用长度
    int free;     // 剩余空间
    char buf[];   // 实际数据
};
```

---

### Q3: ZSet 为什么用跳表而不是红黑树？

| 特性 | 跳表 | 红黑树 |
| :--- | :--- | :--- |
| 实现复杂度 | 简单 | 复杂 |
| 范围查询 | ✅ O(logN + M) | 需要中序遍历 |
| 内存占用 | 略多 | 略少 |
| 并发友好 | 更容易加锁 | 旋转操作复杂 |

**结论：** 跳表实现简单，范围查询效率高，更适合 Redis 场景。

---

### Q4: 常用的扩展数据类型

| 类型 | 说明 | 应用场景 |
| :--- | :--- | :--- |
| **Bitmap** | 位图 | 用户签到、在线状态 |
| **HyperLogLog** | 基数统计（误差 0.81%） | UV 统计 |
| **Geo** | 地理位置 | 附近的人、门店 |
| **Stream** | 消息流 | 消息队列（Redis 5.0+） |

```bash
# Bitmap 签到
SETBIT user:sign:1001:202401 1 1  # 1月2日签到
BITCOUNT user:sign:1001:202401    # 统计签到天数

# HyperLogLog UV
PFADD uv:20240101 user1 user2 user3
PFCOUNT uv:20240101
```

---

## 二、持久化

### Q5: RDB 和 AOF 的区别

| 特性 | RDB | AOF |
| :--- | :--- | :--- |
| 原理 | 内存快照 | 命令日志 |
| 文件大小 | 小（二进制压缩） | 大（文本命令） |
| 恢复速度 | 快 | 慢 |
| 数据安全 | 可能丢失分钟级数据 | 最多丢 1 秒 |
| 性能影响 | fork 子进程时影响 | everysec 影响小 |

**推荐：** 同时开启 RDB + AOF，优先用 AOF 恢复。

---

### Q6: AOF 的同步策略

```bash
appendfsync always    # 每条命令都刷盘，最安全，性能最差
appendfsync everysec  # 每秒刷盘（默认），折中方案
appendfsync no        # 不主动刷盘，由 OS 决定，性能最好，风险最大
```

**生产建议：** 使用 `everysec`，最多丢失 1 秒数据。

---

### Q7: AOF 重写机制

**为什么需要重写？**
- AOF 文件持续增长
- 很多命令可以合并（如多次 INCR 合并为 SET）

**重写流程：**
1. fork 子进程，读取当前内存数据
2. 子进程写入新 AOF 文件
3. 主进程继续处理命令，增量写入 AOF 重写缓冲区
4. 子进程完成后，将缓冲区内容追加到新文件
5. 原子替换旧 AOF 文件

---

### Q8: 混合持久化

**原理（Redis 4.0+）：**
- AOF 重写时，先写入 RDB 格式快照
- 快照后的增量命令以 AOF 格式追加

**优点：**
- 恢复速度快（RDB 部分）
- 数据安全性高（AOF 部分）

```bash
aof-use-rdb-preamble yes  # 开启混合持久化
```

---

## 三、集群与高可用

### Q9: 主从复制原理

**全量复制：**
1. Slave 发送 PSYNC 命令
2. Master 执行 BGSAVE，生成 RDB
3. Master 发送 RDB 给 Slave
4. Master 发送复制缓冲区内容

**增量复制（Redis 2.8+）：**
- 使用 `repl_backlog` 环形缓冲区
- Slave 断线重连后，发送 offset
- 如果 offset 在 backlog 内，只同步增量

---

### Q10: 哨兵模式的选主流程

**1. 主观下线（SDOWN）：**
- Sentinel 认为 Master 不可用

**2. 客观下线（ODOWN）：**
- 超过 quorum 个 Sentinel 都认为 Master 不可用

**3. 选举 Sentinel Leader（Raft）**

**4. Sentinel Leader 选新 Master：**
1. 过滤不健康的 Slave
2. 按优先级 `slave-priority` 排序
3. 优先级相同，选复制偏移量最大的
4. 偏移量相同，选 runid 最小的

---

### Q11: Cluster 模式的特点

**槽位分配：**
- 固定 16384 个槽位
- 数据按 `CRC16(key) % 16384` 分配到槽

**多 key 操作限制：**
- 多 key 命令（MGET、MSET）必须在同一槽
- 使用 hash tag：`{user}:1001` 和 `{user}:1002` 在同一槽

```bash
# hash tag 用法
SET {order}:1001 value1
SET {order}:1002 value2
MGET {order}:1001 {order}:1002  # ✅ 可以
```

---

## 四、缓存问题

### Q12: 缓存穿透、击穿、雪崩

| 问题 | 原因 | 解决方案 |
| :--- | :--- | :--- |
| **穿透** | 查询不存在的数据 | 布隆过滤器、缓存空值 |
| **击穿** | 热点 key 过期 | 互斥锁、永不过期 + 异步更新 |
| **雪崩** | 大量 key 同时过期 | 随机过期时间、多级缓存 |

**缓存穿透 - 布隆过滤器：**

```python
# 查询前先判断
if not bloom_filter.exists(key):
    return None  # 一定不存在
data = cache.get(key) or db.get(key)
```

**缓存击穿 - 互斥锁：**

```python
def get_data(key):
    data = cache.get(key)
    if data:
        return data
    
    if acquire_lock(key):
        try:
            data = cache.get(key)  # 双重检查
            if not data:
                data = db.get(key)
                cache.set(key, data, ttl)
        finally:
            release_lock(key)
    return data
```

---

### Q13: 缓存与数据库一致性

**Cache Aside 模式（推荐）：**

**读流程：**
1. 先读缓存
2. 缓存命中则返回
3. 未命中则查 DB，写入缓存

**写流程：**
1. 更新 DB
2. 删除缓存（而非更新）

**为什么删除而不是更新？**
- 避免并发写导致缓存和 DB 不一致
- 延迟更新，下次读取时自动加载

**延迟双删：**

```python
def update_data(key, value):
    cache.delete(key)         # 第一次删除
    db.update(key, value)
    time.sleep(0.5)           # 等待可能的并发读
    cache.delete(key)         # 第二次删除
```

---

### Q14: 分布式锁的正确实现

**加锁：**

```bash
SET lock_key unique_value NX PX 30000
# NX: 不存在才设置
# PX: 30 秒过期
```

**解锁（Lua 保证原子性）：**

```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
else
    return 0
end
```

**锁续期（看门狗）：**
- 后台线程定期检查锁
- 业务未完成则延长过期时间
- Redisson 已内置实现

---

## 五、性能优化

### Q15: 内存淘汰策略

| 策略 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| noeviction | 不淘汰，写入报错 | 数据不能丢 |
| allkeys-lru | 淘汰最近最少使用 | 通用缓存 |
| allkeys-lfu | 淘汰最不常用（Redis 4.0+） | 热点数据明显 |
| volatile-ttl | 淘汰快过期的 | 有过期时间的数据 |
| volatile-lru | 只在设置过期时间的 key 中淘汰 | 部分数据需持久化 |

**推荐：** `allkeys-lru` 或 `allkeys-lfu`

---

### Q16: 大 key 问题及处理

**风险：**
- 阻塞其他请求（单线程）
- 网络传输慢
- DEL 可能阻塞主线程

**发现大 key：**

```bash
redis-cli --bigkeys
redis-cli --memkeys
```

**处理方案：**
1. **拆分**：大 Hash 拆成多个小 Hash
2. **异步删除**：`UNLINK` 代替 `DEL`
3. **分批操作**：`HSCAN/SSCAN` 分批读取

---

### Q17: Redis 为什么这么快

| 因素 | 说明 |
| :--- | :--- |
| **内存存储** | 直接操作内存，无磁盘 IO |
| **单线程命令处理** | 无线程切换、无锁竞争 |
| **IO 多路复用** | epoll 高效处理并发连接 |
| **高效数据结构** | SDS、跳表、哈希表等 |
| **IO 多线程**（Redis 6.0+） | 读写网络 IO 多线程 |

---

### Q18: Pipeline 和事务的区别

| 特性 | Pipeline | 事务 (MULTI/EXEC) |
| :--- | :--- | :--- |
| 目的 | 减少网络往返 | 保证原子执行 |
| 原子性 | ❌ | ✅（部分原子） |
| 回滚 | - | ❌ 不支持 |
| 性能 | 更好 | 略差 |

**注意：** Redis 事务不保证 ACID，编译错误会取消事务，运行时错误不回滚。

---

## 六、更多八股文

### Q19: 过期删除策略

| 策略 | 说明 | 使用场景 |
| :--- | :--- | :--- |
| **定时删除** | key 过期立即删除 | CPU 开销大，不使用 |
| **惰性删除** | 访问时检查是否过期 | Redis 使用 |
| **定期删除** | 周期性随机检查删除 | Redis 使用 |

**Redis 采用：** 惰性删除 + 定期删除

---

### Q20: 热点 Key 问题

**危害：**
- 单节点压力过大
- 网络带宽瓶颈

**解决方案：**

| 方案 | 说明 |
| :--- | :--- |
| 本地缓存 | 减少 Redis 访问 |
| 读写分离 | 多个从节点分担读压力 |
| 二级 key | 将 key 拆分为多个 |
| 热点发现 | `--hotkeys` 参数 |

---

### Q21: Redis Lua 脚本

**优点：**
- 原子性执行
- 减少网络往返
- 复杂逻辑封装

**示例：**

```lua
-- 限流脚本
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local current = tonumber(redis.call('GET', key) or "0")

if current + 1 > limit then
    return 0
else
    redis.call('INCR', key)
    redis.call('EXPIRE', key, 1)
    return 1
end
```

---

### Q22: Redlock 分布式锁

**原理：** 向多个独立 Redis 节点加锁

**步骤：**
1. 获取当前时间
2. 依次向 N 个节点请求加锁
3. 超过半数成功且耗时小于锁过期时间 → 加锁成功
4. 失败则释放所有节点的锁

**争议：** Martin Kleppmann 质疑其正确性（时钟漂移问题）

---

### Q23: Redis 集群扩容流程

```bash
# 1. 添加新节点
redis-cli --cluster add-node new_host:port existing_host:port

# 2. 重新分配槽位
redis-cli --cluster reshard existing_host:port

# 3. 数据迁移（自动）
```

---

### Q24: Redis 和 Memcached 的区别

| 特性 | Redis | Memcached |
| :--- | :--- | :--- |
| 数据类型 | 丰富（5 种+） | 只有 String |
| 持久化 | ✅ | ❌ |
| 集群 | ✅ 原生支持 | 客户端分片 |
| 多线程 | 6.0+ IO 多线程 | 多线程 |
| 内存效率 | 略低 | 更高 |

---

## 七、高频考点清单

### 必考

- [ ] 五种数据类型及底层实现
- [ ] RDB vs AOF，同步策略
- [ ] 缓存穿透/击穿/雪崩解决方案
- [ ] 分布式锁正确实现
- [ ] 主从复制与哨兵选主流程

### 常考

- [ ] ZSet 为什么用跳表
- [ ] AOF 重写与混合持久化
- [ ] Cluster 槽位与 hash tag
- [ ] 内存淘汰策略
- [ ] 大 key 处理
- [ ] 过期删除策略

### 进阶

- [ ] Redis 单线程为何高性能
- [ ] IO 多路复用原理
- [ ] Raft 选举（Sentinel/Cluster）
- [ ] 缓存与 DB 一致性方案
- [ ] Redlock 原理与争议
- [ ] 热点 Key 解决方案

