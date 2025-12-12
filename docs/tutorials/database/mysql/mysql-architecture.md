---
order: 7
---

# MySQL 高可用架构

主从复制、读写分离、分库分表。

## 主从复制

### 原理

```
┌─────────────┐                    ┌─────────────┐
│   Master    │                    │    Slave    │
│  ┌───────┐  │     ① binlog      │  ┌───────┐  │
│  │ binlog│──┼────────────────→──┼──│IO线程 │  │
│  └───────┘  │                    │  └───┬───┘  │
└─────────────┘                    │      ↓      │
                                   │  ┌───────┐  │
                                   │  │relay  │  │
                                   │  │ log   │  │
                                   │  └───┬───┘  │
                                   │      ↓      │
                                   │  ┌───────┐  │
                                   │  │SQL线程│  │
                                   │  └───────┘  │
                                   └─────────────┘
```

**三步流程：**
1. Master 将数据变更写入 binlog
2. Slave 的 IO 线程读取 Master 的 binlog，写入 relay log
3. Slave 的 SQL 线程执行 relay log 中的事件

### 配置步骤

**Master 配置**

```ini
# my.cnf
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog_format = ROW
```

```sql
-- 创建复制用户
CREATE USER 'repl'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;

-- 查看 Master 状态
SHOW MASTER STATUS;
```

**Slave 配置**

```ini
# my.cnf
[mysqld]
server-id = 2
relay-log = mysql-relay
read_only = 1
```

```sql
-- 配置主从关系
CHANGE MASTER TO
    MASTER_HOST = '192.168.1.100',
    MASTER_USER = 'repl',
    MASTER_PASSWORD = 'password',
    MASTER_LOG_FILE = 'mysql-bin.000001',
    MASTER_LOG_POS = 154;

-- 启动复制
START SLAVE;

-- 查看状态
SHOW SLAVE STATUS\G
```

### 复制模式

| 模式   | 说明                        | 特点               |
| :----- | :-------------------------- | :----------------- |
| 异步   | 默认模式，Master 不等 Slave | 性能好，可能丢数据 |
| 半同步 | 至少一个 Slave 确认         | 折中               |
| 全同步 | 所有 Slave 确认             | 性能差，不推荐     |

**半同步复制**

```sql
-- Master 安装插件
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = 1;

-- Slave 安装插件
INSTALL PLUGIN rpl_semi_sync_slave SONAME 'semisync_slave.so';
SET GLOBAL rpl_semi_sync_slave_enabled = 1;
```

### 主从延迟

**原因：**
- 从库机器性能差
- 大事务
- 从库压力大

**解决方案：**
- 提升从库配置
- 拆分大事务
- 多个从库分担压力
- 并行复制

```sql
-- 开启并行复制（MySQL 5.7+）
SET GLOBAL slave_parallel_type = 'LOGICAL_CLOCK';
SET GLOBAL slave_parallel_workers = 8;
```

## 读写分离

### 原理

```
                    ┌─────────────┐
                    │   应用程序   │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   中间件    │
                    └──────┬──────┘
              ┌────────────┼────────────┐
              ↓            ↓            ↓
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │ Master  │  │ Slave1  │  │ Slave2  │
        │  (写)   │  │  (读)   │  │  (读)   │
        └─────────┘  └─────────┘  └─────────┘
```

### 实现方式

| 方式   | 说明               | 代表产品              |
| :----- | :----------------- | :-------------------- |
| 代码层 | 在代码中判断读写   | 动态数据源            |
| 中间件 | 独立代理层         | MyCat, ShardingSphere |
| 驱动层 | MySQL Connector 层 | mysql-connector-j     |

### 代码实现

```java
// Spring Boot 动态数据源示例
@Configuration
public class DataSourceConfig {
    
    @Bean
    public DataSource dynamicDataSource() {
        DynamicRoutingDataSource dataSource = new DynamicRoutingDataSource();
        dataSource.setDefaultTargetDataSource(masterDataSource());
        
        Map<Object, Object> dataSources = new HashMap<>();
        dataSources.put("master", masterDataSource());
        dataSources.put("slave", slaveDataSource());
        dataSource.setTargetDataSources(dataSources);
        
        return dataSource;
    }
}

// 使用注解切换
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ReadOnly {}

@Aspect
@Component
public class DataSourceAspect {
    
    @Before("@annotation(ReadOnly)")
    public void switchToSlave() {
        DynamicDataSourceContextHolder.set("slave");
    }
    
    @After("@annotation(ReadOnly)")
    public void restore() {
        DynamicDataSourceContextHolder.clear();
    }
}
```

### 注意事项

| 问题       | 解决方案         |
| :--------- | :--------------- |
| 主从延迟   | 强制读主库、缓存 |
| 事务问题   | 事务内全部走主库 |
| 数据一致性 | 关键查询走主库   |

## 分库分表

### 何时分库分表

| 指标       | 阈值             |
| :--------- | :--------------- |
| 单表数据量 | > 500万 ~ 1000万 |
| 单库数据量 | > 5000万         |
| 并发连接数 | > 单库承受能力   |

### 拆分策略

**垂直拆分**

按业务拆分：

```
用户库          订单库          商品库
├── user       ├── orders      ├── product
├── user_ext   ├── order_item  ├── category
└── address    └── payment     └── inventory
```

**水平拆分**

按规则拆分：

```
user_0          user_1          user_2
├── id 0-999    ├── id 1000-1999├── id 2000-2999
```

### 分片策略

| 策略       | 说明       | 优缺点         |
| :--------- | :--------- | :------------- |
| 范围分片   | 按 ID 范围 | 简单，热点问题 |
| Hash 分片  | 按 ID 取模 | 均匀，扩容复杂 |
| 时间分片   | 按时间     | 适合日志       |
| 一致性Hash | 虚拟节点   | 扩容平滑       |

### ShardingSphere 示例

```yaml
# application.yml
spring:
  shardingsphere:
    datasource:
      names: ds0, ds1
      ds0:
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://localhost:3306/db0
        username: root
        password: 123456
      ds1:
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://localhost:3306/db1
        username: root
        password: 123456
    
    rules:
      sharding:
        tables:
          user:
            actual-data-nodes: ds$->{0..1}.user_$->{0..1}
            database-strategy:
              standard:
                sharding-column: id
                sharding-algorithm-name: database-inline
            table-strategy:
              standard:
                sharding-column: id
                sharding-algorithm-name: table-inline
        
        sharding-algorithms:
          database-inline:
            type: INLINE
            props:
              algorithm-expression: ds$->{id % 2}
          table-inline:
            type: INLINE
            props:
              algorithm-expression: user_$->{id % 2}
```

### 分库分表问题

| 问题      | 解决方案                 |
| :-------- | :----------------------- |
| 跨库 JOIN | 避免，或使用中间件       |
| 跨库事务  | 分布式事务、最终一致性   |
| 全局 ID   | 雪花算法、UUID、号段模式 |
| 跨库分页  | 归并排序、二次查询       |
| 数据迁移  | 双写、增量同步           |

### 全局 ID 方案

| 方案     | 优点             | 缺点             |
| :------- | :--------------- | :--------------- |
| UUID     | 简单             | 无序，索引效率低 |
| 雪花算法 | 趋势递增，高性能 | 时钟回拨问题     |
| 号段模式 | 数据库生成       | 依赖数据库       |
| Redis    | 高性能           | 依赖 Redis       |

**雪花算法结构**

```
0 | 0000000000 0000000000 0000000000 0000000000 0 | 00000 | 00000 | 0000000000 00
  |←───────────────── 41位时间戳 ────────────────→|←5位→|←5位→|←──── 12位序列号 ─→|
                                                  机器ID 数据中心
```

## 高可用方案

### MHA（Master High Availability）

```
                 ┌─────────────┐
                 │ MHA Manager │
                 └──────┬──────┘
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Master  │   │ Slave1  │   │ Slave2  │
    └─────────┘   └─────────┘   └─────────┘
```

**功能：**
- 自动故障转移
- 数据补偿（从宕机 Master 拉取 binlog）

### MGR（MySQL Group Replication）

MySQL 官方的高可用方案，基于 Paxos 协议。

**模式：**
- 单主模式：自动选主
- 多主模式：任意节点可写

### 其他方案

| 方案             | 说明                 |
| :--------------- | :------------------- |
| Keepalived + VIP | 简单，故障切换慢     |
| Orchestrator     | GitHub 开源          |
| Vitess           | YouTube 开源，云原生 |
| TiDB             | 分布式 NewSQL        |
