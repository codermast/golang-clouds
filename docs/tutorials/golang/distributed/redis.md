---
order: 1
---

# Go - Redis

使用 go-redis 操作 Redis，实现缓存、分布式锁等功能。

## 安装

```bash
go get github.com/redis/go-redis/v9
```

## 连接 Redis

### 单机连接

```go
import (
    "context"
    "github.com/redis/go-redis/v9"
)

var rdb *redis.Client

func initRedis() {
    rdb = redis.NewClient(&redis.Options{
        Addr:     "localhost:6379",
        Password: "",  // 密码
        DB:       0,   // 数据库
        PoolSize: 100, // 连接池大小
    })
    
    // 测试连接
    ctx := context.Background()
    _, err := rdb.Ping(ctx).Result()
    if err != nil {
        panic(err)
    }
}
```

### 集群连接

```go
rdb := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{
        "localhost:7000",
        "localhost:7001",
        "localhost:7002",
    },
    Password: "",
})
```

### 哨兵连接

```go
rdb := redis.NewFailoverClient(&redis.FailoverOptions{
    MasterName:    "mymaster",
    SentinelAddrs: []string{"localhost:26379"},
    Password:      "",
    DB:            0,
})
```

## 基本操作

### String 操作

```go
ctx := context.Background()

// 设置值
err := rdb.Set(ctx, "key", "value", 0).Err()  // 0 表示不过期
err := rdb.Set(ctx, "key", "value", time.Hour).Err()  // 1小时过期

// 设置值（不存在时）
ok, err := rdb.SetNX(ctx, "key", "value", time.Hour).Result()

// 设置值（存在时）
ok, err := rdb.SetXX(ctx, "key", "value", time.Hour).Result()

// 获取值
val, err := rdb.Get(ctx, "key").Result()
if err == redis.Nil {
    fmt.Println("key 不存在")
}

// 批量设置
err := rdb.MSet(ctx, "key1", "val1", "key2", "val2").Err()

// 批量获取
vals, err := rdb.MGet(ctx, "key1", "key2").Result()

// 自增
n, err := rdb.Incr(ctx, "counter").Result()
n, err := rdb.IncrBy(ctx, "counter", 10).Result()

// 自减
n, err := rdb.Decr(ctx, "counter").Result()
n, err := rdb.DecrBy(ctx, "counter", 10).Result()

// 追加
length, err := rdb.Append(ctx, "key", "append").Result()

// 获取长度
length, err := rdb.StrLen(ctx, "key").Result()
```

### Hash 操作

```go
ctx := context.Background()

// 设置单个字段
err := rdb.HSet(ctx, "user:1", "name", "张三").Err()

// 设置多个字段
err := rdb.HSet(ctx, "user:1", map[string]interface{}{
    "name":  "张三",
    "age":   25,
    "email": "zhangsan@example.com",
}).Err()

// 获取单个字段
val, err := rdb.HGet(ctx, "user:1", "name").Result()

// 获取多个字段
vals, err := rdb.HMGet(ctx, "user:1", "name", "age").Result()

// 获取所有字段
fields, err := rdb.HGetAll(ctx, "user:1").Result()

// 字段是否存在
exists, err := rdb.HExists(ctx, "user:1", "name").Result()

// 删除字段
n, err := rdb.HDel(ctx, "user:1", "age").Result()

// 字段自增
n, err := rdb.HIncrBy(ctx, "user:1", "age", 1).Result()

// 获取所有字段名
keys, err := rdb.HKeys(ctx, "user:1").Result()

// 获取所有字段值
vals, err := rdb.HVals(ctx, "user:1").Result()

// 获取字段数量
length, err := rdb.HLen(ctx, "user:1").Result()
```

### List 操作

```go
ctx := context.Background()

// 左侧插入
n, err := rdb.LPush(ctx, "list", "a", "b", "c").Result()

// 右侧插入
n, err := rdb.RPush(ctx, "list", "d", "e").Result()

// 左侧弹出
val, err := rdb.LPop(ctx, "list").Result()

// 右侧弹出
val, err := rdb.RPop(ctx, "list").Result()

// 获取范围
vals, err := rdb.LRange(ctx, "list", 0, -1).Result()  // 获取全部

// 获取长度
length, err := rdb.LLen(ctx, "list").Result()

// 获取索引位置的值
val, err := rdb.LIndex(ctx, "list", 0).Result()

// 设置索引位置的值
err := rdb.LSet(ctx, "list", 0, "new").Err()

// 删除元素
n, err := rdb.LRem(ctx, "list", 1, "a").Result()  // 删除1个值为"a"的元素

// 阻塞弹出
val, err := rdb.BLPop(ctx, time.Second*5, "list").Result()
val, err := rdb.BRPop(ctx, time.Second*5, "list").Result()
```

### Set 操作

```go
ctx := context.Background()

// 添加成员
n, err := rdb.SAdd(ctx, "set", "a", "b", "c").Result()

// 获取所有成员
members, err := rdb.SMembers(ctx, "set").Result()

// 判断是否是成员
isMember, err := rdb.SIsMember(ctx, "set", "a").Result()

// 获取成员数量
count, err := rdb.SCard(ctx, "set").Result()

// 删除成员
n, err := rdb.SRem(ctx, "set", "a").Result()

// 随机获取成员
member, err := rdb.SRandMember(ctx, "set").Result()

// 随机弹出成员
member, err := rdb.SPop(ctx, "set").Result()

// 集合运算
// 交集
vals, err := rdb.SInter(ctx, "set1", "set2").Result()
// 并集
vals, err := rdb.SUnion(ctx, "set1", "set2").Result()
// 差集
vals, err := rdb.SDiff(ctx, "set1", "set2").Result()
```

### Sorted Set 操作

```go
ctx := context.Background()

// 添加成员
n, err := rdb.ZAdd(ctx, "zset", redis.Z{Score: 100, Member: "张三"}).Result()

// 批量添加
n, err := rdb.ZAdd(ctx, "zset",
    redis.Z{Score: 90, Member: "李四"},
    redis.Z{Score: 80, Member: "王五"},
).Result()

// 获取分数
score, err := rdb.ZScore(ctx, "zset", "张三").Result()

// 分数自增
newScore, err := rdb.ZIncrBy(ctx, "zset", 10, "张三").Result()

// 获取排名（从小到大）
rank, err := rdb.ZRank(ctx, "zset", "张三").Result()

// 获取排名（从大到小）
rank, err := rdb.ZRevRank(ctx, "zset", "张三").Result()

// 按排名获取（从小到大）
vals, err := rdb.ZRange(ctx, "zset", 0, -1).Result()

// 按排名获取（从大到小）
vals, err := rdb.ZRevRange(ctx, "zset", 0, 9).Result()  // Top 10

// 按分数范围获取
vals, err := rdb.ZRangeByScore(ctx, "zset", &redis.ZRangeBy{
    Min: "80",
    Max: "100",
}).Result()

// 获取成员数量
count, err := rdb.ZCard(ctx, "zset").Result()

// 删除成员
n, err := rdb.ZRem(ctx, "zset", "张三").Result()

// 按排名删除
n, err := rdb.ZRemRangeByRank(ctx, "zset", 0, 2).Result()
```

## 高级操作

### 管道（Pipeline）

```go
ctx := context.Background()

// 管道：批量发送命令，减少网络往返
pipe := rdb.Pipeline()

pipe.Set(ctx, "key1", "value1", 0)
pipe.Set(ctx, "key2", "value2", 0)
pipe.Get(ctx, "key1")
pipe.Get(ctx, "key2")

cmds, err := pipe.Exec(ctx)
if err != nil {
    panic(err)
}

for _, cmd := range cmds {
    fmt.Println(cmd.(*redis.StringCmd).Val())
}
```

### 事务

```go
ctx := context.Background()

// 事务：原子性执行多个命令
_, err := rdb.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
    pipe.Set(ctx, "key1", "value1", 0)
    pipe.Set(ctx, "key2", "value2", 0)
    return nil
})

// Watch：乐观锁
err := rdb.Watch(ctx, func(tx *redis.Tx) error {
    // 获取当前值
    n, err := tx.Get(ctx, "counter").Int()
    if err != nil && err != redis.Nil {
        return err
    }
    
    // 在事务中修改
    _, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
        pipe.Set(ctx, "counter", n+1, 0)
        return nil
    })
    return err
}, "counter")
```

### Lua 脚本

```go
ctx := context.Background()

// 简单脚本
script := redis.NewScript(`
    return redis.call('set', KEYS[1], ARGV[1])
`)
err := script.Run(ctx, rdb, []string{"key"}, "value").Err()

// 复杂脚本（原子操作）
script := redis.NewScript(`
    local current = redis.call('get', KEYS[1])
    if current == false then
        return redis.call('set', KEYS[1], ARGV[1])
    end
    return nil
`)
result, err := script.Run(ctx, rdb, []string{"key"}, "value").Result()
```

## 分布式锁

### 简单实现

```go
func TryLock(ctx context.Context, key string, value string, expiration time.Duration) bool {
    ok, err := rdb.SetNX(ctx, key, value, expiration).Result()
    if err != nil {
        return false
    }
    return ok
}

func Unlock(ctx context.Context, key string, value string) bool {
    // 使用 Lua 脚本保证原子性
    script := redis.NewScript(`
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
    `)
    result, err := script.Run(ctx, rdb, []string{key}, value).Int()
    return err == nil && result == 1
}

// 使用
lockKey := "lock:resource"
lockValue := uuid.New().String()

if TryLock(ctx, lockKey, lockValue, time.Second*10) {
    defer Unlock(ctx, lockKey, lockValue)
    // 执行业务逻辑
}
```

### 使用 Redsync

```go
import (
    "github.com/go-redsync/redsync/v4"
    "github.com/go-redsync/redsync/v4/redis/goredis/v9"
)

pool := goredis.NewPool(rdb)
rs := redsync.New(pool)

mutex := rs.NewMutex("lock:resource",
    redsync.WithExpiry(time.Second*10),
    redsync.WithTries(3),
)

if err := mutex.Lock(); err != nil {
    // 获取锁失败
    return err
}
defer mutex.Unlock()

// 执行业务逻辑
```

## 缓存模式

### Cache Aside

```go
func GetUser(ctx context.Context, userID int) (*User, error) {
    // 1. 先查缓存
    key := fmt.Sprintf("user:%d", userID)
    val, err := rdb.Get(ctx, key).Result()
    if err == nil {
        var user User
        json.Unmarshal([]byte(val), &user)
        return &user, nil
    }
    
    // 2. 缓存未命中，查数据库
    user, err := db.GetUserByID(userID)
    if err != nil {
        return nil, err
    }
    
    // 3. 写入缓存
    data, _ := json.Marshal(user)
    rdb.Set(ctx, key, data, time.Hour)
    
    return user, nil
}

func UpdateUser(ctx context.Context, user *User) error {
    // 1. 更新数据库
    if err := db.UpdateUser(user); err != nil {
        return err
    }
    
    // 2. 删除缓存
    key := fmt.Sprintf("user:%d", user.ID)
    rdb.Del(ctx, key)
    
    return nil
}
```

### 缓存穿透（布隆过滤器）

```go
import "github.com/bits-and-blooms/bloom/v3"

var filter *bloom.BloomFilter

func init() {
    // 创建布隆过滤器
    filter = bloom.NewWithEstimates(1000000, 0.01)
    
    // 加载已有数据
    users, _ := db.GetAllUserIDs()
    for _, id := range users {
        filter.AddString(fmt.Sprintf("%d", id))
    }
}

func GetUser(ctx context.Context, userID int) (*User, error) {
    // 先检查布隆过滤器
    if !filter.TestString(fmt.Sprintf("%d", userID)) {
        return nil, errors.New("用户不存在")
    }
    
    // 查缓存和数据库...
}
```

### 缓存击穿（互斥锁）

```go
func GetUserWithLock(ctx context.Context, userID int) (*User, error) {
    key := fmt.Sprintf("user:%d", userID)
    lockKey := fmt.Sprintf("lock:user:%d", userID)
    
    // 1. 查缓存
    val, err := rdb.Get(ctx, key).Result()
    if err == nil {
        var user User
        json.Unmarshal([]byte(val), &user)
        return &user, nil
    }
    
    // 2. 获取锁
    lockValue := uuid.New().String()
    if !TryLock(ctx, lockKey, lockValue, time.Second*3) {
        // 获取锁失败，等待后重试
        time.Sleep(time.Millisecond * 100)
        return GetUserWithLock(ctx, userID)
    }
    defer Unlock(ctx, lockKey, lockValue)
    
    // 3. 双重检查
    val, err = rdb.Get(ctx, key).Result()
    if err == nil {
        var user User
        json.Unmarshal([]byte(val), &user)
        return &user, nil
    }
    
    // 4. 查数据库并写缓存
    user, err := db.GetUserByID(userID)
    if err != nil {
        return nil, err
    }
    
    data, _ := json.Marshal(user)
    rdb.Set(ctx, key, data, time.Hour)
    
    return user, nil
}
```
