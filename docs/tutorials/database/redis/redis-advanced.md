---
order: 3
---

# Redis 进阶功能

事务、发布订阅、Lua 脚本、Pipeline。

## 事务

Redis 事务保证命令的**顺序执行**，但不保证原子性。

### 基本命令

```bash
MULTI                     # 开启事务
EXEC                      # 执行事务
DISCARD                   # 取消事务
WATCH key [key ...]       # 监视 key（乐观锁）
UNWATCH                   # 取消监视
```

### 使用示例

```bash
# 基本事务
MULTI
SET user:1001:name "张三"
SET user:1001:age 25
INCR user:1001:age
EXEC

# WATCH 乐观锁
WATCH user:1001:balance
balance = GET user:1001:balance
MULTI
SET user:1001:balance <new_balance>
EXEC
# 如果 balance 被其他客户端修改，EXEC 返回 nil
```

### 事务特点

| 特点     | 说明                           |
| :------- | :----------------------------- |
| 顺序执行 | 事务中的命令按顺序执行         |
| 不回滚   | 某条命令失败，其他命令仍会执行 |
| 编译错误 | 语法错误整个事务不执行         |
| 运行错误 | 运行时错误只影响当前命令       |

## 发布订阅

简单的消息广播机制。

```bash
# 订阅频道
SUBSCRIBE channel [channel ...]       # 订阅
PSUBSCRIBE pattern [pattern ...]      # 模式订阅
UNSUBSCRIBE [channel ...]             # 取消订阅

# 发布消息
PUBLISH channel message               # 发布消息

# 查看
PUBSUB CHANNELS [pattern]             # 活跃频道
PUBSUB NUMSUB channel [channel ...]   # 订阅数
```

### 使用示例

```bash
# 终端 1：订阅
SUBSCRIBE news:sports news:tech

# 终端 2：发布
PUBLISH news:sports "NBA 总决赛开始"
PUBLISH news:tech "Redis 8.0 发布"

# 模式订阅
PSUBSCRIBE news:*          # 订阅所有 news: 开头的频道
```

**注意**：发布订阅消息不会持久化，离线消息会丢失。

## Lua 脚本

Lua 脚本可以保证多个命令的原子性执行。

### 基本命令

```bash
EVAL script numkeys key [key ...] arg [arg ...]  # 执行脚本
EVALSHA sha1 numkeys key [key ...] arg [arg ...] # 执行缓存脚本
SCRIPT LOAD script           # 加载脚本
SCRIPT EXISTS sha1           # 检查脚本是否存在
SCRIPT FLUSH                 # 清空脚本缓存
SCRIPT KILL                  # 终止运行中的脚本
```

### 脚本语法

```lua
-- KEYS[n]：传入的 key，从 1 开始
-- ARGV[n]：传入的参数，从 1 开始
-- redis.call()：执行 Redis 命令，出错抛异常
-- redis.pcall()：执行 Redis 命令，出错返回错误

-- 示例：原子性 GET + SET
local value = redis.call('GET', KEYS[1])
if value then
    return value
else
    redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
    return ARGV[1]
end
```

### 实际应用

**分布式锁**

```lua
-- 加锁
if redis.call('SETNX', KEYS[1], ARGV[1]) == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[2])
    return 1
else
    return 0
end

-- 解锁
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
else
    return 0
end
```

```bash
# 加锁
EVAL "if redis.call('SETNX', KEYS[1], ARGV[1]) == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[2]) return 1 else return 0 end" 1 lock:order:1001 uuid 30000

# 解锁
EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end" 1 lock:order:1001 uuid
```

**限流**

```lua
-- 滑动窗口限流
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now .. math.random())
    redis.call('EXPIRE', key, window / 1000)
    return 1
else
    return 0
end
```

## Pipeline 管道

批量发送命令，减少网络往返。

### Java 示例

```java
// Jedis Pipeline
try (Jedis jedis = pool.getResource()) {
    Pipeline pipeline = jedis.pipelined();
    
    for (int i = 0; i < 1000; i++) {
        pipeline.set("key:" + i, "value:" + i);
    }
    
    List<Object> results = pipeline.syncAndReturnAll();
}

// Lettuce Pipeline
RedisAsyncCommands<String, String> async = connection.async();
async.setAutoFlushCommands(false);

List<RedisFuture<?>> futures = new ArrayList<>();
for (int i = 0; i < 1000; i++) {
    futures.add(async.set("key:" + i, "value:" + i));
}

async.flushCommands();
LettuceFutures.awaitAll(5, TimeUnit.SECONDS, futures.toArray(new RedisFuture[0]));
```

### Pipeline vs 事务

| 特性     | Pipeline | 事务（MULTI）    |
| :------- | :------- | :--------------- |
| 原子性   | ❌        | 部分（顺序执行） |
| 网络优化 | ✅        | ✅                |
| 使用场景 | 批量操作 | 需要顺序保证     |

## Stream 消息队列

Redis 5.0+ 引入，支持消费组的消息队列。

### 基本操作

```bash
# 生产消息
XADD stream * field1 value1 field2 value2
XADD stream MAXLEN 1000 * field value    # 限制长度

# 消费消息
XREAD COUNT 10 STREAMS stream 0          # 从头读取
XREAD COUNT 10 BLOCK 5000 STREAMS stream $  # 阻塞读取新消息

# 查看消息
XLEN stream                              # 消息数量
XRANGE stream - + COUNT 10               # 范围查询
XINFO STREAM stream                      # 流信息
```

### 消费组

```bash
# 创建消费组
XGROUP CREATE stream mygroup 0           # 从头消费
XGROUP CREATE stream mygroup $ MKSTREAM  # 从新消息开始

# 消费组消费
XREADGROUP GROUP mygroup consumer1 COUNT 10 STREAMS stream >

# 确认消息
XACK stream mygroup message_id

# 查看待确认消息
XPENDING stream mygroup
XPENDING stream mygroup - + 10 consumer1

# 转移消息（处理超时）
XCLAIM stream mygroup consumer2 60000 message_id
```

### 完整示例

```bash
# 创建流和消费组
XGROUP CREATE orders mygroup 0 MKSTREAM

# 生产者
XADD orders * order_id 1001 amount 100

# 消费者 1
XREADGROUP GROUP mygroup consumer1 COUNT 1 BLOCK 5000 STREAMS orders >

# 确认消费
XACK orders mygroup 1234567890-0

# 查看未确认消息
XPENDING orders mygroup

# 死信处理
XCLAIM orders mygroup consumer2 60000 1234567890-0
```

### Stream vs List vs Pub/Sub

| 特性     | Stream | List | Pub/Sub |
| :------- | :----- | :--- | :------ |
| 持久化   | ✅      | ✅    | ❌       |
| 消费组   | ✅      | ❌    | ❌       |
| 消息确认 | ✅      | ❌    | ❌       |
| 历史消息 | ✅      | ✅    | ❌       |
| 广播     | ❌      | ❌    | ✅       |
