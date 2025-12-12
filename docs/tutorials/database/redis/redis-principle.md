---
order: 7
---

# Redis 底层原理

数据结构、线程模型、网络模型。

## 线程模型

### Redis 是单线程还是多线程？

| 版本   | 命令执行 | 其他操作                 |
| :----- | :------- | :----------------------- |
| 6.0 前 | 单线程   | 持久化、删除等使用子进程 |
| 6.0+   | 单线程   | 网络 IO 可以多线程       |

**核心命令执行始终是单线程！**

### 为什么单线程还这么快？

| 原因         | 说明                   |
| :----------- | :--------------------- |
| 纯内存操作   | 微秒级响应             |
| IO 多路复用  | 单线程处理多连接       |
| 高效数据结构 | 专门优化的数据结构     |
| 单线程无锁   | 避免上下文切换和锁竞争 |

### Redis 6.0 多线程

```bash
# redis.conf
io-threads 4                     # IO 线程数
io-threads-do-reads yes          # 读也使用多线程

# 多线程只用于网络 IO，命令执行仍是单线程
```

```
       客户端请求
           ↓
    ┌──────────────┐
    │  IO 多线程   │  ← 读取请求、写入响应
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │  主线程执行  │  ← 命令执行（单线程）
    └──────────────┘
```

## 网络模型

### IO 多路复用

Redis 使用 IO 多路复用处理多个客户端连接。

```
         ┌─────────────────────────────────┐
         │          Event Loop             │
         │  ┌─────────────────────────┐    │
         │  │    epoll/kqueue/select  │    │
         │  └────────────┬────────────┘    │
         │               ↓                 │
         │  ┌─────────────────────────┐    │
         │  │      事件处理器         │    │
         │  │  • 连接处理器           │    │
         │  │  • 命令处理器           │    │
         │  │  • 响应处理器           │    │
         │  └─────────────────────────┘    │
         └─────────────────────────────────┘
                   ↑     ↑     ↑
               Client1 Client2 Client3
```

### 事件类型

| 事件     | 说明                   |
| :------- | :--------------------- |
| 文件事件 | 客户端连接、读写       |
| 时间事件 | 定时任务（serverCron） |

### 事件处理流程

```
1. 客户端发起连接
2. 触发 AE_READABLE 事件
3. 连接处理器创建客户端对象
4. 客户端发送命令
5. 触发 AE_READABLE 事件
6. 命令处理器执行命令
7. 触发 AE_WRITABLE 事件
8. 响应处理器返回结果
```

## 数据结构

### 底层数据结构

| 结构      | 说明                   | 用途                |
| :-------- | :--------------------- | :------------------ |
| SDS       | 简单动态字符串         | String              |
| IntSet    | 整数集合               | 小 Set              |
| Dict      | 哈希表                 | Hash、Set、ZSet     |
| ZipList   | 压缩列表               | 小 List、Hash、ZSet |
| QuickList | 快速列表               | List                |
| SkipList  | 跳表                   | ZSet                |
| Listpack  | 紧凑列表（Redis 7.0+） | 替代 ZipList        |

### SDS（简单动态字符串）

```c
struct sdshdr {
    int len;       // 已使用长度
    int alloc;     // 分配的空间
    char flags;    // 类型标志
    char buf[];    // 字符数组
};
```

**SDS vs C 字符串：**

| 特性       | C 字符串   | SDS               |
| :--------- | :--------- | :---------------- |
| 获取长度   | O(n)       | O(1)              |
| 缓冲区溢出 | 可能       | 不会              |
| 修改字符串 | 每次都分配 | 预分配 + 惰性释放 |
| 二进制安全 | ❌          | ✅                 |

### Dict（哈希表）

```c
typedef struct dict {
    dictType *type;
    dictEntry **ht_table[2];  // 两个哈希表，用于 rehash
    long rehashidx;           // rehash 进度，-1 表示未进行
    // ...
} dict;
```

**渐进式 rehash：**

```
1. 分配新哈希表 ht[1]
2. rehashidx = 0
3. 每次操作时迁移 ht[0] 的部分数据到 ht[1]
4. 全部迁移完成后交换 ht[0] 和 ht[1]
5. rehashidx = -1
```

### ZipList（压缩列表）

```
┌─────────────────────────────────────────────────┐
│ zlbytes │ zltail │ zllen │ entry1 │ entry2 │ zlend │
└─────────────────────────────────────────────────┘

entry 结构:
┌──────────────────┬─────────┬─────────┐
│ prevlen (1/5字节)│ encoding│  data   │
└──────────────────┴─────────┴─────────┘
```

**优点：** 内存紧凑
**缺点：** 连锁更新风险（prevlen 从 1 字节变 5 字节）

### SkipList（跳表）

```
Level 4:  1 ────────────────────────────→ 9
Level 3:  1 ────────→ 5 ────────────────→ 9
Level 2:  1 ────→ 3 → 5 ────→ 7 ────────→ 9
Level 1:  1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
```

**特点：**
- 平均查找复杂度 O(log n)
- 每个节点有多层指针
- 适合范围查询

### 数据类型与底层结构

| 类型   | 编码                                       |
| :----- | :----------------------------------------- |
| String | int、embstr、raw                           |
| List   | quicklist（ziplist + 链表）                |
| Hash   | listpack（小）、hashtable（大）            |
| Set    | intset（整数）、hashtable                  |
| ZSet   | listpack（小）、skiplist + hashtable（大） |

### 编码转换条件

```bash
# Hash
hash-max-listpack-entries 512
hash-max-listpack-value 64

# List
list-max-listpack-size -2    # 每个节点最大 8KB

# Set
set-max-intset-entries 512

# ZSet
zset-max-listpack-entries 128
zset-max-listpack-value 64
```

## 过期策略

### 删除策略

| 策略     | 说明               | 优缺点         |
| :------- | :----------------- | :------------- |
| 惰性删除 | 访问时检查是否过期 | 内存不及时释放 |
| 定期删除 | 定时随机检查并删除 | CPU 消耗       |

**Redis 采用惰性删除 + 定期删除。**

### 定期删除算法

```
每次执行：
1. 从有过期时间的 key 中随机取 20 个
2. 删除其中已过期的 key
3. 如果过期 key 超过 25%，重复步骤 1
4. 最多执行 25ms
```

## 内存管理

### 对象结构

```c
typedef struct redisObject {
    unsigned type:4;       // 类型（string/list/hash/set/zset）
    unsigned encoding:4;   // 编码方式
    unsigned lru:24;       // LRU 时间或 LFU 计数
    int refcount;          // 引用计数
    void *ptr;             // 指向实际数据
} robj;
```

### 内存分配

```
Redis 内存分配器：
├── jemalloc（默认，推荐）
├── tcmalloc
└── libc malloc

jemalloc 特点：
├── 减少内存碎片
├── 多线程性能好
└── 支持内存统计
```

### 共享对象

```
Redis 启动时创建共享对象：
├── 0-9999 的整数
├── 常用字符串（OK、ERR 等）
└── 空对象
```

## 通信协议

### RESP 协议

```
简单字符串：+OK\r\n
错误：-ERR unknown command\r\n
整数：:1000\r\n
批量字符串：$6\r\nfoobar\r\n
数组：*2\r\n$3\r\nGET\r\n$3\r\nkey\r\n
空：$-1\r\n 或 *-1\r\n
```

### 客户端发送

```
SET key value
→ *3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n
```

### 服务端响应

```
+OK\r\n           # SET 成功
$5\r\nvalue\r\n   # GET 返回 value
```
