---
order: 2
---

# Redis 数据类型

Redis 5 种基本数据类型 + 4 种特殊类型。

## String 字符串

最基本的类型，可以存储字符串、整数、浮点数。

### 基本命令

```bash
# 设置/获取
SET key value                     # 设置值
GET key                           # 获取值
MSET k1 v1 k2 v2                  # 批量设置
MGET k1 k2                        # 批量获取
GETSET key value                  # 设置新值，返回旧值
SETNX key value                   # 不存在才设置
SETEX key seconds value           # 设置值和过期时间

# 追加/获取长度
APPEND key value                  # 追加
STRLEN key                        # 长度

# 数值操作
INCR key                          # +1
DECR key                          # -1
INCRBY key increment              # +n
DECRBY key decrement              # -n
INCRBYFLOAT key increment         # +浮点数

# 位操作
SETRANGE key offset value         # 替换部分
GETRANGE key start end            # 截取部分
```

### 应用场景

```bash
# 1. 缓存对象（JSON）
SET user:1001 '{"id":1001,"name":"张三","age":25}'

# 2. 计数器
SET article:1001:views 0
INCR article:1001:views

# 3. 分布式锁
SET lock:order:1001 uuid NX EX 30    # NX：不存在才设置，EX：过期时间

# 4. 限流
INCR rate:user:1001
EXPIRE rate:user:1001 60             # 每分钟限流
```

## Hash 哈希

字段-值映射，适合存储对象。

### 基本命令

```bash
# 设置/获取
HSET key field value              # 设置单个字段
HMSET key f1 v1 f2 v2             # 设置多个字段
HGET key field                    # 获取单个字段
HMGET key f1 f2                   # 获取多个字段
HGETALL key                       # 获取所有字段和值
HKEYS key                         # 所有字段名
HVALS key                         # 所有值
HLEN key                          # 字段数量

# 判断/删除
HEXISTS key field                 # 字段是否存在
HDEL key field [field ...]        # 删除字段
HSETNX key field value            # 不存在才设置

# 数值操作
HINCRBY key field increment       # 字段 +n
HINCRBYFLOAT key field increment  # 字段 +浮点数
```

### 应用场景

```bash
# 1. 存储对象
HSET user:1001 name "张三" age 25 email "zhangsan@test.com"
HGET user:1001 name

# 2. 购物车
HSET cart:user:1001 goods:1001 2    # 商品ID -> 数量
HINCRBY cart:user:1001 goods:1001 1 # 数量 +1
HDEL cart:user:1001 goods:1001      # 删除商品
HGETALL cart:user:1001              # 获取购物车
```

## List 列表

有序列表，支持头尾操作。

### 基本命令

```bash
# 插入
LPUSH key value [value ...]       # 左插入
RPUSH key value [value ...]       # 右插入
LINSERT key BEFORE|AFTER pivot value  # 在指定元素前/后插入

# 弹出
LPOP key [count]                  # 左弹出
RPOP key [count]                  # 右弹出
BLPOP key [key ...] timeout       # 阻塞左弹出
BRPOP key [key ...] timeout       # 阻塞右弹出

# 获取
LRANGE key start stop             # 获取范围（0 -1 获取全部）
LINDEX key index                  # 获取指定位置
LLEN key                          # 列表长度

# 修改
LSET key index value              # 修改指定位置
LTRIM key start stop              # 保留范围内的元素
LREM key count value              # 删除指定值
```

### 应用场景

```bash
# 1. 消息队列
LPUSH queue:order order_data      # 生产者
BRPOP queue:order 30              # 消费者（阻塞等待 30 秒）

# 2. 最新列表（时间线）
LPUSH timeline:user:1001 post_id
LTRIM timeline:user:1001 0 99     # 只保留最新 100 条
LRANGE timeline:user:1001 0 9     # 获取最新 10 条
```

## Set 集合

无序、不重复的字符串集合。

### 基本命令

```bash
# 添加/删除
SADD key member [member ...]      # 添加成员
SREM key member [member ...]      # 删除成员
SPOP key [count]                  # 随机弹出

# 查询
SMEMBERS key                      # 所有成员
SISMEMBER key member              # 是否存在
SCARD key                         # 成员数量
SRANDMEMBER key [count]           # 随机获取

# 集合运算
SINTER key [key ...]              # 交集
SUNION key [key ...]              # 并集
SDIFF key [key ...]               # 差集
SINTERSTORE dest key [key ...]    # 交集存储
SUNIONSTORE dest key [key ...]    # 并集存储
SDIFFSTORE dest key [key ...]     # 差集存储
```

### 应用场景

```bash
# 1. 标签
SADD user:1001:tags "Go" "Redis" "MySQL"
SMEMBERS user:1001:tags

# 2. 共同关注
SADD follow:user:1001 2001 2002 2003
SADD follow:user:1002 2001 2004 2005
SINTER follow:user:1001 follow:user:1002    # 共同关注

# 3. 抽奖
SADD lottery:1 user1 user2 user3
SRANDMEMBER lottery:1 3           # 随机抽 3 人（不移除）
SPOP lottery:1 1                  # 随机抽 1 人（移除）
```

## ZSet 有序集合

带分数的有序集合，按分数排序。

### 基本命令

```bash
# 添加/删除
ZADD key score member [score member ...]  # 添加
ZREM key member [member ...]              # 删除
ZINCRBY key increment member              # 分数 +n

# 查询
ZSCORE key member                         # 获取分数
ZRANK key member                          # 获取排名（升序，从 0 开始）
ZREVRANK key member                       # 获取排名（降序）
ZCARD key                                 # 成员数量
ZCOUNT key min max                        # 分数范围内的数量

# 范围查询
ZRANGE key start stop [WITHSCORES]        # 按排名升序
ZREVRANGE key start stop [WITHSCORES]     # 按排名降序
ZRANGEBYSCORE key min max [WITHSCORES]    # 按分数范围
ZRANGEBYLEX key min max                   # 按字典序

# 集合运算
ZINTERSTORE dest numkeys key [key ...]    # 交集
ZUNIONSTORE dest numkeys key [key ...]    # 并集
```

### 应用场景

```bash
# 1. 排行榜
ZADD rank:game 1000 user1 800 user2 1200 user3
ZREVRANGE rank:game 0 9 WITHSCORES        # Top 10
ZINCRBY rank:game 50 user1                # 加分
ZREVRANK rank:game user1                  # 我的排名

# 2. 延迟队列
ZADD delay:queue <timestamp> task_data    # 添加任务
ZRANGEBYSCORE delay:queue 0 <now> LIMIT 0 10  # 获取到期任务

# 3. 限流（滑动窗口）
ZADD rate:user:1001 <timestamp> <uuid>    # 记录请求
ZREMRANGEBYSCORE rate:user:1001 0 <now-60s>   # 移除 60 秒前的
ZCARD rate:user:1001                      # 统计请求数
```

## 特殊类型

### Bitmap 位图

```bash
SETBIT key offset value           # 设置位
GETBIT key offset                 # 获取位
BITCOUNT key [start end]          # 统计 1 的数量
BITOP AND|OR|XOR|NOT dest key [key ...]  # 位运算
```

**应用场景**

```bash
# 用户签到
SETBIT sign:user:1001:202401 0 1   # 1月1日签到
SETBIT sign:user:1001:202401 1 1   # 1月2日签到
BITCOUNT sign:user:1001:202401     # 1月签到天数

# 在线状态
SETBIT online:users 1001 1         # 用户1001在线
GETBIT online:users 1001           # 查询在线状态
```

### HyperLogLog 基数统计

基数统计（不精确），误差率约 0.81%，占用固定 12KB。

```bash
PFADD key element [element ...]   # 添加元素
PFCOUNT key [key ...]             # 统计基数
PFMERGE dest key [key ...]        # 合并
```

**应用场景**

```bash
# UV 统计
PFADD uv:page:1001 user1 user2 user3
PFCOUNT uv:page:1001
```

### Geo 地理位置

```bash
GEOADD key longitude latitude member  # 添加位置
GEOPOS key member [member ...]        # 获取位置
GEODIST key member1 member2 [unit]    # 计算距离（m/km/mi/ft）
GEORADIUS key longitude latitude radius unit  # 范围查询
GEOSEARCH key FROMMEMBER member BYRADIUS 5 km  # 附近的人
```

**应用场景**

```bash
# 附近的人
GEOADD location 116.397128 39.916527 user1
GEOADD location 116.405285 39.904989 user2
GEOSEARCH location FROMMEMBER user1 BYRADIUS 5 km
```

### Stream 消息流

Redis 5.0+ 的消息队列，支持消费组。

```bash
# 生产者
XADD stream * field value          # 添加消息（* 自动生成 ID）

# 消费者
XREAD COUNT 10 STREAMS stream 0    # 读取消息
XREAD BLOCK 5000 STREAMS stream $  # 阻塞读取新消息

# 消费组
XGROUP CREATE stream group 0       # 创建消费组
XREADGROUP GROUP group consumer COUNT 10 STREAMS stream >  # 消费
XACK stream group id               # 确认消息
```
