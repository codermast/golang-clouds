---
order: 1
---

# Redis 基础

Redis 安装配置与基本命令。

## 安装配置

### Linux 安装

```bash
# Ubuntu/Debian
apt update && apt install redis-server

# CentOS
yum install redis

# 编译安装
wget https://download.redis.io/releases/redis-7.0.0.tar.gz
tar xzf redis-7.0.0.tar.gz
cd redis-7.0.0
make && make install
```

### Docker 安装

```bash
# 启动 Redis
docker run -d --name redis -p 6379:6379 redis:7

# 带密码和持久化
docker run -d --name redis \
  -p 6379:6379 \
  -v /data/redis:/data \
  redis:7 redis-server --requirepass mypassword --appendonly yes
```

### 配置文件

```bash
# redis.conf 关键配置
bind 0.0.0.0                    # 监听地址
port 6379                       # 端口
daemonize yes                   # 后台运行
requirepass yourpassword        # 密码
maxmemory 2gb                   # 最大内存
maxmemory-policy allkeys-lru    # 淘汰策略

# 启动
redis-server /path/to/redis.conf

# 连接
redis-cli -h 127.0.0.1 -p 6379 -a password
```

## Key 操作

### 基本命令

```bash
# 查看 key
KEYS *                    # 查看所有 key（生产禁用！）
KEYS user:*               # 模式匹配
SCAN 0 MATCH user:* COUNT 100    # 迭代查找（推荐）
EXISTS key                # 判断 key 是否存在
TYPE key                  # 查看类型

# 删除 key
DEL key [key ...]         # 同步删除
UNLINK key [key ...]      # 异步删除（推荐）

# 重命名
RENAME key newkey
RENAMENX key newkey       # 仅当 newkey 不存在时

# 移动
MOVE key db               # 移动到指定数据库
```

### 过期时间

```bash
# 设置过期时间
EXPIRE key seconds        # 秒
PEXPIRE key milliseconds  # 毫秒
EXPIREAT key timestamp    # Unix 时间戳
EXPIRETIME key            # 查看过期时间戳（Redis 7.0+）

# 查看剩余时间
TTL key                   # 秒（-1 永不过期，-2 不存在）
PTTL key                  # 毫秒

# 移除过期时间
PERSIST key

# 设置值同时设置过期时间
SET key value EX 60       # 60 秒
SET key value PX 60000    # 60000 毫秒
SETEX key 60 value        # 同上
```

### Key 命名规范

```
业务:模块:id

示例：
user:profile:1001         # 用户信息
order:detail:202401001    # 订单详情
cache:hot:goods           # 热门商品缓存
lock:order:1001           # 分布式锁
```

## 数据库操作

Redis 默认有 16 个数据库（0-15）。

```bash
SELECT 1                  # 切换数据库
DBSIZE                    # 当前库 key 数量
FLUSHDB                   # 清空当前库
FLUSHALL                  # 清空所有库（危险！）
```

## 客户端连接

### Java - Jedis

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>4.3.0</version>
</dependency>
```

```java
// 单机连接
Jedis jedis = new Jedis("localhost", 6379);
jedis.auth("password");
jedis.set("key", "value");
String value = jedis.get("key");
jedis.close();

// 连接池
JedisPool pool = new JedisPool("localhost", 6379);
try (Jedis jedis = pool.getResource()) {
    jedis.set("key", "value");
}
```

### Java - Lettuce

```xml
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.2.0.RELEASE</version>
</dependency>
```

```java
RedisClient client = RedisClient.create("redis://password@localhost:6379");
StatefulRedisConnection<String, String> connection = client.connect();
RedisCommands<String, String> commands = connection.sync();

commands.set("key", "value");
String value = commands.get("key");

connection.close();
client.shutdown();
```

### Spring Data Redis

```yaml
# application.yml
spring:
  redis:
    host: localhost
    port: 6379
    password: yourpassword
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
```

```java
@Autowired
private StringRedisTemplate redisTemplate;

// String 操作
redisTemplate.opsForValue().set("key", "value", 60, TimeUnit.SECONDS);
String value = redisTemplate.opsForValue().get("key");

// Hash 操作
redisTemplate.opsForHash().put("user:1001", "name", "张三");

// List 操作
redisTemplate.opsForList().rightPush("list", "item");

// Set 操作
redisTemplate.opsForSet().add("set", "member");

// ZSet 操作
redisTemplate.opsForZSet().add("rank", "user1", 100);
```

## 常用管理命令

```bash
# 服务器信息
INFO                      # 全部信息
INFO server               # 服务器信息
INFO memory               # 内存信息
INFO replication          # 主从信息
INFO stats                # 统计信息

# 客户端管理
CLIENT LIST               # 客户端列表
CLIENT KILL ip:port       # 断开连接
CLIENT SETNAME name       # 设置名称

# 配置管理
CONFIG GET maxmemory      # 查看配置
CONFIG SET maxmemory 4gb  # 修改配置
CONFIG REWRITE            # 持久化到配置文件

# 慢查询
SLOWLOG GET 10            # 最近 10 条慢查询
SLOWLOG LEN               # 慢查询数量
SLOWLOG RESET             # 清空慢查询日志

# 持久化
BGSAVE                    # 后台 RDB
BGREWRITEAOF              # 后台 AOF 重写
LASTSAVE                  # 上次保存时间
```
