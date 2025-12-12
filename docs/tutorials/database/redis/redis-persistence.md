---
order: 4
---

# Redis 持久化

Redis 提供 RDB 和 AOF 两种持久化方式。

## RDB 快照

RDB（Redis Database Backup）将内存数据快照保存到磁盘。

### 触发方式

```bash
# 手动触发
SAVE                      # 同步保存，阻塞 Redis
BGSAVE                    # 后台异步保存（推荐）

# 自动触发（redis.conf）
save 900 1                # 900 秒内至少 1 次修改
save 300 10               # 300 秒内至少 10 次修改
save 60 10000             # 60 秒内至少 10000 次修改
save ""                   # 禁用 RDB
```

### 配置参数

```bash
# redis.conf
dbfilename dump.rdb       # 文件名
dir ./                    # 保存目录
rdbcompression yes        # 压缩（LZF）
rdbchecksum yes           # 校验和
stop-writes-on-bgsave-error yes  # 保存失败时停止写入
```

### RDB 原理

```
BGSAVE 流程：
1. 主进程 fork 子进程
2. 子进程共享主进程内存（copy-on-write）
3. 子进程将内存数据写入临时 RDB 文件
4. 替换旧的 RDB 文件
```

**fork + copy-on-write：**
- fork 时只复制页表，不复制数据
- 主进程写入时，复制修改的页

### 优缺点

| 优点                | 缺点                   |
| :------------------ | :--------------------- |
| 文件紧凑，恢复快    | 两次备份间可能丢失数据 |
| fork 子进程，不阻塞 | fork 大数据集可能较慢  |
| 适合备份和灾难恢复  | 无法实时持久化         |

## AOF 日志

AOF（Append Only File）记录每个写命令。

### 开启 AOF

```bash
# redis.conf
appendonly yes            # 开启 AOF
appendfilename "appendonly.aof"  # 文件名
appenddirname "appendonlydir"    # Redis 7.0+ 目录
```

### 同步策略

```bash
# redis.conf
appendfsync always        # 每次写入都同步（最安全，性能最差）
appendfsync everysec      # 每秒同步一次（默认，推荐）
appendfsync no            # 由操作系统决定（性能最好，可能丢数据）
```

| 策略     | 性能 | 数据安全           |
| :------- | :--- | :----------------- |
| always   | 低   | 最高，几乎不丢数据 |
| everysec | 中   | 最多丢失 1 秒数据  |
| no       | 高   | 可能丢失较多数据   |

### AOF 重写

AOF 文件会越来越大，重写可以压缩文件。

```bash
# 手动触发
BGREWRITEAOF

# 自动触发（redis.conf）
auto-aof-rewrite-percentage 100   # 增长 100% 触发
auto-aof-rewrite-min-size 64mb    # 最小 64MB 才触发
```

**重写原理：**
1. fork 子进程
2. 子进程遍历内存数据，生成新 AOF
3. 主进程的新命令写入重写缓冲区
4. 子进程完成后，缓冲区命令追加到新 AOF
5. 替换旧 AOF 文件

### Redis 7.0+ 多文件 AOF

```
appendonlydir/
├── appendonly.aof.1.base.rdb    # 基础文件（RDB 格式）
├── appendonly.aof.1.incr.aof    # 增量文件
├── appendonly.aof.2.incr.aof    # 增量文件
└── appendonly.aof.manifest      # 清单文件
```

### 优缺点

| 优点         | 缺点               |
| :----------- | :----------------- |
| 数据安全性高 | 文件比 RDB 大      |
| 可读性好     | 恢复比 RDB 慢      |
| 支持重写压缩 | 写入性能略低于 RDB |

## 混合持久化

Redis 4.0+ 支持 RDB + AOF 混合持久化。

```bash
# redis.conf
aof-use-rdb-preamble yes  # 开启混合持久化
```

**原理：**
- AOF 重写时，先以 RDB 格式写入内存快照
- 再追加增量 AOF 命令
- 恢复时先加载 RDB，再执行 AOF

**优势：**
- RDB 恢复速度 + AOF 数据安全

## 如何选择

| 场景           | 推荐方案               |
| :------------- | :--------------------- |
| 允许分钟级丢失 | RDB                    |
| 允许秒级丢失   | AOF everysec           |
| 不允许丢失     | AOF always（性能较差） |
| 生产环境       | 混合持久化（推荐）     |
| 纯缓存         | 关闭持久化             |

## 数据恢复

```bash
# 启动时自动加载
# 优先级：AOF > RDB

# 手动恢复
1. 停止 Redis
2. 将备份文件复制到 dir 目录
3. 启动 Redis

# 修复损坏的 AOF
redis-check-aof --fix appendonly.aof

# 修复损坏的 RDB
redis-check-rdb dump.rdb
```

## 备份策略

```bash
# 定时备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d%H%M)
BACKUP_DIR=/data/redis/backup

# 触发 BGSAVE
redis-cli BGSAVE

# 等待完成
while [ $(redis-cli LASTSAVE) == $(redis-cli LASTSAVE) ]; do
    sleep 1
done

# 复制备份
cp /data/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# 保留最近 7 天
find $BACKUP_DIR -name "dump_*.rdb" -mtime +7 -delete
```
