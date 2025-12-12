---
order: 6
---

# Redis 性能优化

内存优化、缓存问题、最佳实践。

## 内存优化

### 内存分析

```bash
# 内存使用情况
INFO memory

# 关键指标
used_memory              # Redis 分配的内存
used_memory_rss          # 操作系统分配的内存
mem_fragmentation_ratio  # 内存碎片率（> 1.5 需要关注）

# 大 key 分析
redis-cli --bigkeys
redis-cli --memkeys

# 扫描大 key
redis-cli -h host -p port --bigkeys -i 0.1  # 0.1 秒间隔
```

### 内存淘汰策略

```bash
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
```

| 策略            | 说明                               |
| :-------------- | :--------------------------------- |
| noeviction      | 不淘汰，内存满时拒绝写入（默认）   |
| allkeys-lru     | 所有 key 中 LRU 淘汰               |
| allkeys-lfu     | 所有 key 中 LFU 淘汰（Redis 4.0+） |
| allkeys-random  | 所有 key 中随机淘汰                |
| volatile-lru    | 有过期时间的 key 中 LRU 淘汰       |
| volatile-lfu    | 有过期时间的 key 中 LFU 淘汰       |
| volatile-random | 有过期时间的 key 中随机淘汰        |
| volatile-ttl    | 有过期时间的 key 中 TTL 最短的淘汰 |

**推荐：allkeys-lru 或 allkeys-lfu**

### 内存优化技巧

**1. 选择合适的数据结构**

```bash
# Hash 比 String 更省内存
# 不推荐
SET user:1001:name "张三"
SET user:1001:age 25

# 推荐
HSET user:1001 name "张三" age 25
```

**2. 使用 Hash 小对象优化**

```bash
# redis.conf
hash-max-listpack-entries 512    # 元素 <= 512 时使用 listpack
hash-max-listpack-value 64       # 值长度 <= 64 时使用 listpack
```

**3. 压缩列表阈值**

```bash
# 小对象使用压缩结构
list-max-listpack-size -2        # 每个节点最大 8KB
zset-max-listpack-entries 128
zset-max-listpack-value 64
```

**4. 共享整数对象**

```bash
# Redis 默认共享 0-9999 的整数对象
# 设置更大范围可以节省内存
```

### Key 设计原则

```bash
# 1. 简短但有意义
# Bad
user:information:details:1001
# Good
u:1001

# 2. 避免大 key
# String 建议 < 10KB
# Hash/List/Set/ZSet 建议元素 < 5000

# 3. 设置合理的过期时间
SET key value EX 3600

# 4. 避免 key 集中过期
# 加入随机过期时间
SET key value EX $(( 3600 + RANDOM % 300 ))
```

## 缓存问题

### 缓存穿透

查询不存在的数据，每次都打到数据库。

**解决方案：**

```java
// 1. 缓存空值
String value = redis.get(key);
if (value == null) {
    value = db.get(key);
    if (value == null) {
        redis.set(key, "", 60);  // 缓存空值
    } else {
        redis.set(key, value, 3600);
    }
}

// 2. 布隆过滤器
BloomFilter filter = BloomFilter.create(1000000, 0.01);
if (!filter.contains(key)) {
    return null;  // 一定不存在
}
// 可能存在，查询缓存和数据库
```

### 缓存击穿

热点 key 过期，大量请求打到数据库。

**解决方案：**

```java
// 1. 互斥锁
String value = redis.get(key);
if (value == null) {
    if (redis.setnx(lockKey, "1", 30)) {
        try {
            value = db.get(key);
            redis.set(key, value, 3600);
        } finally {
            redis.del(lockKey);
        }
    } else {
        Thread.sleep(100);
        return get(key);  // 重试
    }
}

// 2. 逻辑过期
// 缓存永不过期，但存储逻辑过期时间
// 读取时检查是否过期，异步更新
```

### 缓存雪崩

大量 key 同时过期，数据库压力剧增。

**解决方案：**

```java
// 1. 过期时间加随机值
int ttl = 3600 + random.nextInt(300);
redis.set(key, value, ttl);

// 2. 热点数据永不过期

// 3. 多级缓存
// 本地缓存 + Redis + 数据库

// 4. 限流降级
if (rateLimiter.tryAcquire()) {
    return db.get(key);
} else {
    return fallback();  // 降级处理
}
```

### 缓存一致性

**Cache Aside Pattern（推荐）：**

```java
// 读
String value = redis.get(key);
if (value == null) {
    value = db.get(key);
    redis.set(key, value);
}

// 写
db.update(data);
redis.del(key);  // 删除缓存，而不是更新
```

**延迟双删：**

```java
redis.del(key);          // 第一次删除
db.update(data);
Thread.sleep(500);       // 等待主从同步
redis.del(key);          // 第二次删除
```

**Canal 监听 binlog：**

```
数据库 → binlog → Canal → 更新/删除缓存
```

## 慢查询优化

### 慢查询配置

```bash
# redis.conf
slowlog-log-slower-than 10000    # 超过 10ms 记录
slowlog-max-len 128              # 最多保存 128 条

# 查看慢查询
SLOWLOG GET 10
SLOWLOG LEN
SLOWLOG RESET
```

### 避免慢命令

| 慢命令           | 替代方案       |
| :--------------- | :------------- |
| KEYS *           | SCAN           |
| HGETALL          | HSCAN 或 HMGET |
| SMEMBERS         | SSCAN          |
| LRANGE 0 -1      | 分页 LRANGE    |
| DEL 大 key       | UNLINK         |
| FLUSHDB/FLUSHALL | FLUSHDB ASYNC  |

```bash
# SCAN 迭代
SCAN 0 MATCH user:* COUNT 100
# 返回下一个游标，继续迭代直到返回 0
```

### 大 Key 处理

```bash
# 1. 拆分大 key
# 大 List 拆分为多个小 List
# 大 Hash 按字段分组

# 2. 异步删除
UNLINK key

# 3. 渐进式删除
# Hash
HSCAN key 0 COUNT 100
HDEL key field1 field2 ...

# ZSet
ZREMRANGEBYRANK key 0 99
```

## 最佳实践

### 连接池配置

```java
// Jedis 连接池
JedisPoolConfig config = new JedisPoolConfig();
config.setMaxTotal(50);           // 最大连接数
config.setMaxIdle(10);            // 最大空闲连接
config.setMinIdle(5);             // 最小空闲连接
config.setMaxWaitMillis(3000);    // 获取连接超时
config.setTestOnBorrow(true);     // 借用时测试

JedisPool pool = new JedisPool(config, "localhost", 6379);
```

### Pipeline 批量操作

```java
// 单个操作
for (int i = 0; i < 1000; i++) {
    jedis.set("key:" + i, "value");  // 1000 次网络往返
}

// Pipeline
Pipeline pipeline = jedis.pipelined();
for (int i = 0; i < 1000; i++) {
    pipeline.set("key:" + i, "value");
}
pipeline.sync();  // 1 次网络往返
```

### 本地缓存

```java
// Caffeine + Redis 多级缓存
Cache<String, Object> localCache = Caffeine.newBuilder()
    .maximumSize(10000)
    .expireAfterWrite(5, TimeUnit.MINUTES)
    .build();

public Object get(String key) {
    // 1. 本地缓存
    Object value = localCache.getIfPresent(key);
    if (value != null) return value;
    
    // 2. Redis
    value = redis.get(key);
    if (value != null) {
        localCache.put(key, value);
        return value;
    }
    
    // 3. 数据库
    value = db.get(key);
    if (value != null) {
        redis.set(key, value, 3600);
        localCache.put(key, value);
    }
    return value;
}
```

### 监控告警

```bash
# 关键指标
used_memory               # 内存使用
connected_clients         # 连接数
blocked_clients           # 阻塞连接数
instantaneous_ops_per_sec # QPS
hit_rate                  # 命中率
mem_fragmentation_ratio   # 内存碎片率

# 计算命中率
hit_rate = keyspace_hits / (keyspace_hits + keyspace_misses)
```
