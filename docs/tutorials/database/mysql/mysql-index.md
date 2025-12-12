---
order: 3
---

# MySQL 索引

索引是帮助 MySQL 高效获取数据的**有序数据结构**。

## 索引结构

### 为什么用 B+Tree？

| 数据结构 | 问题                             |
| :------- | :------------------------------- |
| 二叉树   | 顺序插入退化为链表               |
| 红黑树   | 本质还是二叉树，层级深           |
| B-Tree   | 非叶子节点也存数据，单节点容量小 |
| Hash     | 不支持范围查询、排序             |

**B+Tree 优势：**
- 非叶子节点只存索引，单节点可存更多 key
- 叶子节点形成有序链表，支持范围查询
- 层级低（3 层可存 2000W+ 数据）

### B+Tree 结构

```
                    [15|30|45]              <- 根节点（只存索引）
                   /    |    \
        [5|10|15]    [20|25|30]   [35|40|45]   <- 分支节点
           |            |            |
    [1→3→5→7→10→12→15]→[17→20→23→25→28→30]→[32→35→38→40→42→45]
                                              <- 叶子节点（存数据，有序链表）
```

## 索引分类

### 按数据结构

| 类型      | 说明                   | 支持引擎            |
| :-------- | :--------------------- | :------------------ |
| B+Tree    | 最常用，支持范围查询   | InnoDB, MyISAM      |
| Hash      | 精确匹配快，不支持范围 | Memory              |
| Full-text | 全文索引               | InnoDB 5.6+, MyISAM |

### 按逻辑分类

| 类型     | 说明                | 关键字      |
| :------- | :------------------ | :---------- |
| 主键索引 | 唯一 + 非空         | PRIMARY KEY |
| 唯一索引 | 值唯一，可以有 NULL | UNIQUE      |
| 普通索引 | 无限制              | INDEX       |
| 全文索引 | 文本搜索            | FULLTEXT    |

### InnoDB 索引分类

| 类型     | 说明                         | 特点         |
| :------- | :--------------------------- | :----------- |
| 聚簇索引 | 主键索引，叶子节点存完整数据 | 有且仅有一个 |
| 二级索引 | 非主键索引，叶子节点存主键值 | 可以有多个   |

**聚簇索引选取规则：**
1. 有主键 → 主键索引
2. 无主键 → 第一个 UNIQUE 非空索引
3. 都没有 → 生成隐藏的 rowid

## 索引操作

```sql
-- 创建索引
CREATE INDEX idx_name ON user(name);
CREATE UNIQUE INDEX idx_email ON user(email);
CREATE INDEX idx_name_age ON user(name, age);  -- 联合索引

-- 查看索引
SHOW INDEX FROM user;

-- 删除索引
DROP INDEX idx_name ON user;

-- 建表时创建索引
CREATE TABLE user (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(100),
    INDEX idx_name(name),
    UNIQUE INDEX idx_email(email)
);
```

## 回表与覆盖索引

### 回表查询

```sql
-- 假设 name 有索引
SELECT * FROM user WHERE name = '张三';

-- 执行过程：
-- 1. 在 name 的二级索引中找到 '张三' 对应的主键 id
-- 2. 根据 id 在聚簇索引中查找完整数据
-- 3. 这个过程叫"回表"
```

### 覆盖索引

```sql
-- 假设有联合索引 (name, age)
SELECT name, age FROM user WHERE name = '张三';

-- 执行过程：
-- 1. 在联合索引中找到 '张三'
-- 2. 索引中已包含 name 和 age，直接返回
-- 3. 无需回表，这叫"覆盖索引"
```

**优化原则：尽量使用覆盖索引，减少 `SELECT *`**

## 索引失效场景

| 场景             | 示例                               | 原因             |
| :--------------- | :--------------------------------- | :--------------- |
| 最左前缀不匹配   | idx(a,b,c) 只查 b                  | 联合索引从左匹配 |
| 索引列运算       | WHERE YEAR(date) = 2024            | 函数破坏索引     |
| 类型隐式转换     | WHERE phone = 123（phone是字符串） | 类型不匹配       |
| 左模糊查询       | WHERE name LIKE '%张'              | 无法利用索引     |
| OR 条件无索引    | WHERE a=1 OR b=2（b无索引）        | 全表扫描更快     |
| 范围查询右侧失效 | idx(a,b) WHERE a>1 AND b=2         | b 的索引失效     |

### 最左前缀法则

联合索引 `idx(a, b, c)`：

| 查询条件                  | 是否走索引 | 使用的索引列 |
| :------------------------ | :--------- | :----------- |
| a = 1                     | ✅          | a            |
| a = 1 AND b = 2           | ✅          | a, b         |
| a = 1 AND b = 2 AND c = 3 | ✅          | a, b, c      |
| b = 2                     | ❌          | 无           |
| a = 1 AND c = 3           | ✅          | a（c失效）   |
| a > 1 AND b = 2           | ✅          | a（b失效）   |

## 索引设计原则

1. **频繁查询的字段**建索引
2. **区分度高**的字段优先（如手机号 > 性别）
3. **字符串长字段**用前缀索引
4. **联合索引**优于多个单列索引
5. 索引不是越多越好，影响写入性能
6. 避免在索引列上做运算或函数

### 前缀索引

```sql
-- 对 email 前 10 个字符建索引
CREATE INDEX idx_email ON user(email(10));

-- 选择合适的前缀长度（区分度接近原始字段）
SELECT 
    COUNT(DISTINCT email) / COUNT(*) AS full_selectivity,
    COUNT(DISTINCT LEFT(email, 5)) / COUNT(*) AS prefix5,
    COUNT(DISTINCT LEFT(email, 10)) / COUNT(*) AS prefix10
FROM user;
```

## SQL 提示

```sql
-- 建议使用索引
SELECT * FROM user USE INDEX(idx_name) WHERE name = '张三';

-- 忽略索引
SELECT * FROM user IGNORE INDEX(idx_name) WHERE name = '张三';

-- 强制使用索引
SELECT * FROM user FORCE INDEX(idx_name) WHERE name = '张三';
```

## 索引常见问题

### Q1: 为什么主键建议自增？

自增主键顺序插入，性能好。非自增主键可能导致页分裂，影响性能。

### Q2: 为什么推荐使用整型主键？

- 整型比较快
- 占用空间小（二级索引存主键）
- UUID 36 字节，无序，性能差

### Q3: 什么时候不建索引？

- 数据量小（< 几千条）
- 频繁更新的字段
- 区分度低的字段（如性别）
