---
order: 6
---

# MySQL 性能优化

SQL 优化是后端开发必备技能。

## 执行计划

使用 `EXPLAIN` 分析 SQL 执行计划。

```sql
EXPLAIN SELECT * FROM user WHERE name = '张三';
```

### 关键字段

| 字段  | 说明           | 关注点         |
| :---- | :------------- | :------------- |
| type  | 访问类型       | 越快越好       |
| key   | 实际使用的索引 | 是否使用索引   |
| rows  | 预估扫描行数   | 越少越好       |
| Extra | 额外信息       | 是否有优化空间 |

### type 访问类型

从好到差排序：

| 类型   | 说明                  |
| :----- | :-------------------- |
| system | 表只有一行            |
| const  | 主键/唯一索引等值查询 |
| eq_ref | 主键/唯一索引连接     |
| ref    | 普通索引等值查询      |
| range  | 索引范围查询          |
| index  | 全索引扫描            |
| ALL    | 全表扫描（最差）      |

```sql
-- const：主键查询
EXPLAIN SELECT * FROM user WHERE id = 1;

-- ref：普通索引
EXPLAIN SELECT * FROM user WHERE name = '张三';

-- range：范围查询
EXPLAIN SELECT * FROM user WHERE age > 18;

-- ALL：全表扫描
EXPLAIN SELECT * FROM user WHERE email LIKE '%@qq.com';
```

### Extra 常见值

| 值                    | 说明                | 建议     |
| :-------------------- | :------------------ | :------- |
| Using index           | 覆盖索引            | ✅ 好     |
| Using where           | 使用 WHERE 过滤     | 正常     |
| Using temporary       | 使用临时表          | ⚠️ 需优化 |
| Using filesort        | 文件排序            | ⚠️ 需优化 |
| Using index condition | 索引条件下推（ICP） | ✅ 好     |

## 慢查询

### 开启慢查询日志

```sql
-- 查看慢查询配置
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 开启慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- 超过 1 秒记录

-- 查看慢查询日志路径
SHOW VARIABLES LIKE 'slow_query_log_file';
```

### 分析慢查询

```bash
# 使用 mysqldumpslow 分析
mysqldumpslow -s t -t 10 /var/lib/mysql/slow.log

# -s：排序方式（t:时间, c:次数, r:返回行数）
# -t：显示前 N 条
```

### 常见慢查询原因

| 原因         | 解决方案            |
| :----------- | :------------------ |
| 未使用索引   | 添加索引            |
| 索引失效     | 优化 SQL            |
| 返回数据过多 | 分页、减少 SELECT * |
| 关联表过多   | 减少 JOIN           |
| 子查询效率低 | 改为 JOIN           |
| 排序数据量大 | 添加排序字段索引    |

## SQL 优化

### SELECT 优化

```sql
-- ❌ 避免 SELECT *
SELECT * FROM user;

-- ✅ 只查需要的字段
SELECT id, name FROM user;

-- ❌ 避免在 WHERE 中使用函数
SELECT * FROM user WHERE YEAR(create_time) = 2024;

-- ✅ 使用范围查询
SELECT * FROM user WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01';

-- ❌ 避免隐式类型转换
SELECT * FROM user WHERE phone = 13800138000;  -- phone 是字符串

-- ✅ 类型匹配
SELECT * FROM user WHERE phone = '13800138000';
```

### JOIN 优化

```sql
-- 小表驱动大表
-- ✅ 小表放在前面
SELECT * FROM small_table s JOIN large_table l ON s.id = l.sid;

-- 确保 JOIN 字段有索引
-- ✅ 被驱动表的关联字段需要索引
SELECT * FROM orders o JOIN user u ON o.user_id = u.id;  -- user.id 有主键索引

-- 减少 JOIN 表数量
-- 建议不超过 3 张表
```

### ORDER BY 优化

```sql
-- ✅ 利用索引排序（联合索引 idx(a, b)）
SELECT * FROM t WHERE a = 1 ORDER BY b;

-- ❌ 无法使用索引排序
SELECT * FROM t WHERE a > 1 ORDER BY b;  -- 范围查询后排序失效
SELECT * FROM t ORDER BY a, b DESC;       -- 排序方向不一致
SELECT * FROM t ORDER BY a, c;            -- 非索引字段
```

### GROUP BY 优化

```sql
-- ✅ GROUP BY 字段使用索引
SELECT status, COUNT(*) FROM user GROUP BY status;  -- status 有索引

-- ❌ 避免 SELECT 非聚合、非 GROUP BY 字段
SELECT name, status, COUNT(*) FROM user GROUP BY status;  -- name 不确定
```

### LIMIT 优化

```sql
-- ❌ 深分页效率低
SELECT * FROM user LIMIT 1000000, 10;

-- ✅ 使用覆盖索引 + 子查询
SELECT * FROM user u 
JOIN (SELECT id FROM user LIMIT 1000000, 10) t 
ON u.id = t.id;

-- ✅ 使用游标分页（记住上次 ID）
SELECT * FROM user WHERE id > 1000000 LIMIT 10;
```

### INSERT 优化

```sql
-- ❌ 单条插入
INSERT INTO user VALUES (...);
INSERT INTO user VALUES (...);

-- ✅ 批量插入
INSERT INTO user VALUES (...), (...), (...);

-- ✅ 关闭自动提交，手动提交
SET autocommit = 0;
INSERT INTO user VALUES (...);
INSERT INTO user VALUES (...);
COMMIT;

-- ✅ 有序插入（按主键顺序）
INSERT INTO user (id, ...) VALUES (1, ...), (2, ...), (3, ...);
```

### UPDATE/DELETE 优化

```sql
-- ✅ 使用索引定位
UPDATE user SET status = 0 WHERE id = 1;

-- ❌ 避免大范围更新
UPDATE user SET status = 0;  -- 全表更新

-- ✅ 分批更新
UPDATE user SET status = 0 WHERE id BETWEEN 1 AND 1000;
UPDATE user SET status = 0 WHERE id BETWEEN 1001 AND 2000;
```

## 表结构优化

### 数据类型选择

| 原则         | 说明                        |
| :----------- | :-------------------------- |
| 小而够用     | TINYINT 比 INT 省空间       |
| 整型优于字符 | INT 比 VARCHAR 查询快       |
| 避免 NULL    | NULL 需要额外空间，索引复杂 |
| 定长优于变长 | CHAR 比 VARCHAR 快          |

```sql
-- ✅ 优化后
CREATE TABLE user (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    age TINYINT UNSIGNED NOT NULL DEFAULT 0,
    gender TINYINT NOT NULL DEFAULT 0,  -- 0未知 1男 2女
    status TINYINT NOT NULL DEFAULT 1,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 大表优化

| 方案     | 说明           | 适用场景   |
| :------- | :------------- | :--------- |
| 垂直拆分 | 按字段拆分     | 大字段分离 |
| 水平拆分 | 按行拆分       | 数据量大   |
| 冷热分离 | 冷数据归档     | 历史数据   |
| 归档     | 定期清理或归档 | 日志类数据 |

## 配置优化

### 内存相关

```ini
# InnoDB 缓冲池大小（建议物理内存的 60-80%）
innodb_buffer_pool_size = 8G

# 连接缓冲区
join_buffer_size = 4M
sort_buffer_size = 4M
read_buffer_size = 4M
```

### 连接相关

```ini
# 最大连接数
max_connections = 500

# 连接超时
wait_timeout = 28800
interactive_timeout = 28800
```

### 日志相关

```ini
# 慢查询日志
slow_query_log = ON
long_query_time = 1

# binlog 格式
binlog_format = ROW
```

## 优化检查清单

| 检查项           | 方法                   |
| :--------------- | :--------------------- |
| 是否使用索引     | EXPLAIN 查看 key 字段  |
| 索引是否失效     | 检查 type 是否为 ALL   |
| 是否有文件排序   | Extra 是否有 filesort  |
| 是否有临时表     | Extra 是否有 temporary |
| 扫描行数是否过多 | 查看 rows 字段         |
| 是否返回过多数据 | 检查 SELECT 字段       |
| 连接表是否过多   | 控制 JOIN 数量         |
| 是否有深分页     | 优化 LIMIT             |
