---
order: 1
---

# SQL 基础

SQL（Structured Query Language）是操作关系型数据库的标准语言。

## SQL 分类

| 分类 | 全称                       | 说明         | 关键字                 |
| :--- | :------------------------- | :----------- | :--------------------- |
| DDL  | Data Definition Language   | 数据定义语言 | CREATE, ALTER, DROP    |
| DML  | Data Manipulation Language | 数据操作语言 | INSERT, UPDATE, DELETE |
| DQL  | Data Query Language        | 数据查询语言 | SELECT                 |
| DCL  | Data Control Language      | 数据控制语言 | GRANT, REVOKE          |

## DDL - 数据定义

### 数据库操作

```sql
-- 创建数据库
CREATE DATABASE [IF NOT EXISTS] db_name [DEFAULT CHARSET utf8mb4];

-- 删除数据库
DROP DATABASE [IF EXISTS] db_name;

-- 使用数据库
USE db_name;

-- 查看当前数据库
SELECT DATABASE();
```

### 表操作

```sql
-- 创建表
CREATE TABLE user (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    username    VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password    VARCHAR(100) NOT NULL COMMENT '密码',
    email       VARCHAR(100) COMMENT '邮箱',
    age         TINYINT UNSIGNED DEFAULT 0 COMMENT '年龄',
    status      TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '用户表';

-- 查看表结构
DESC user;

-- 查看建表语句
SHOW CREATE TABLE user;

-- 修改表名
ALTER TABLE user RENAME TO t_user;

-- 添加字段
ALTER TABLE user ADD phone VARCHAR(20) COMMENT '手机号';

-- 修改字段类型
ALTER TABLE user MODIFY phone VARCHAR(15);

-- 修改字段名和类型
ALTER TABLE user CHANGE phone mobile VARCHAR(15) COMMENT '手机';

-- 删除字段
ALTER TABLE user DROP mobile;

-- 删除表
DROP TABLE [IF EXISTS] user;

-- 清空表（保留结构）
TRUNCATE TABLE user;
```

### 数据类型

**整数类型**

| 类型     | 字节 | 范围（有符号） | 范围（无符号） |
| :------- | :--- | :------------- | :------------- |
| TINYINT  | 1    | -128 ~ 127     | 0 ~ 255        |
| SMALLINT | 2    | -32768 ~ 32767 | 0 ~ 65535      |
| INT      | 4    | -2^31 ~ 2^31-1 | 0 ~ 2^32-1     |
| BIGINT   | 8    | -2^63 ~ 2^63-1 | 0 ~ 2^64-1     |

**字符串类型**

| 类型       | 说明       | 长度限制 |
| :--------- | :--------- | :------- |
| CHAR(n)    | 定长字符串 | 0-255    |
| VARCHAR(n) | 变长字符串 | 0-65535  |
| TEXT       | 长文本     | 0-65535  |
| LONGTEXT   | 超长文本   | 0-4GB    |

**日期类型**

| 类型      | 格式                | 说明               |
| :-------- | :------------------ | :----------------- |
| DATE      | YYYY-MM-DD          | 日期               |
| TIME      | HH:MM:SS            | 时间               |
| DATETIME  | YYYY-MM-DD HH:MM:SS | 日期时间           |
| TIMESTAMP | YYYY-MM-DD HH:MM:SS | 时间戳（自动更新） |

### 约束

| 约束 | 关键字         | 说明                 |
| :--- | :------------- | :------------------- |
| 主键 | PRIMARY KEY    | 唯一标识，非空且唯一 |
| 唯一 | UNIQUE         | 值唯一               |
| 非空 | NOT NULL       | 不能为空             |
| 默认 | DEFAULT        | 默认值               |
| 外键 | FOREIGN KEY    | 关联其他表的主键     |
| 自增 | AUTO_INCREMENT | 自动递增             |

```sql
-- 外键约束
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 添加外键
ALTER TABLE orders ADD CONSTRAINT fk_user 
    FOREIGN KEY (user_id) REFERENCES user(id);

-- 删除外键
ALTER TABLE orders DROP FOREIGN KEY fk_user;
```

## DML - 数据操作

### INSERT

```sql
-- 插入单条
INSERT INTO user (username, password, email) 
VALUES ('张三', '123456', 'zhangsan@test.com');

-- 插入多条
INSERT INTO user (username, password) VALUES 
    ('李四', '123456'),
    ('王五', '123456');

-- 插入所有字段（不推荐）
INSERT INTO user VALUES (1, '赵六', '123456', 'zhaoliu@test.com', 18, 1, NOW(), NOW());
```

### UPDATE

```sql
-- 更新单个字段
UPDATE user SET status = 0 WHERE id = 1;

-- 更新多个字段
UPDATE user SET password = '654321', email = 'new@test.com' WHERE id = 1;

-- 条件更新
UPDATE user SET age = age + 1 WHERE status = 1;

-- ⚠️ 不带 WHERE 会更新所有记录
UPDATE user SET status = 1;
```

### DELETE

```sql
-- 删除指定记录
DELETE FROM user WHERE id = 1;

-- 条件删除
DELETE FROM user WHERE status = 0;

-- ⚠️ 不带 WHERE 会删除所有记录
DELETE FROM user;

-- 清空表（更快，不可回滚）
TRUNCATE TABLE user;
```

## DQL - 数据查询

### 基本语法

```sql
SELECT [DISTINCT] 字段列表
FROM 表名
[WHERE 条件]
[GROUP BY 分组字段]
[HAVING 分组后条件]
[ORDER BY 排序字段 ASC/DESC]
[LIMIT 起始索引, 记录数];
```

**执行顺序**：FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT

### 基础查询

```sql
-- 查询所有
SELECT * FROM user;

-- 查询指定字段
SELECT id, username, email FROM user;

-- 别名
SELECT username AS name, email AS mail FROM user;

-- 去重
SELECT DISTINCT status FROM user;
```

### 条件查询

```sql
-- 比较运算
SELECT * FROM user WHERE age > 18;
SELECT * FROM user WHERE age >= 18 AND age <= 30;
SELECT * FROM user WHERE age BETWEEN 18 AND 30;

-- 空值判断
SELECT * FROM user WHERE email IS NULL;
SELECT * FROM user WHERE email IS NOT NULL;

-- IN
SELECT * FROM user WHERE status IN (0, 1);

-- LIKE 模糊查询
SELECT * FROM user WHERE username LIKE '张%';   -- 以张开头
SELECT * FROM user WHERE username LIKE '%三';   -- 以三结尾
SELECT * FROM user WHERE username LIKE '%三%';  -- 包含三
SELECT * FROM user WHERE username LIKE '张_';   -- 张+一个字符

-- 逻辑运算
SELECT * FROM user WHERE age > 18 AND status = 1;
SELECT * FROM user WHERE age > 30 OR status = 0;
SELECT * FROM user WHERE NOT status = 0;
```

### 排序与分页

```sql
-- 单字段排序
SELECT * FROM user ORDER BY age;          -- 默认升序
SELECT * FROM user ORDER BY age DESC;     -- 降序

-- 多字段排序
SELECT * FROM user ORDER BY status DESC, age ASC;

-- 分页
SELECT * FROM user LIMIT 10;              -- 前 10 条
SELECT * FROM user LIMIT 0, 10;           -- 第 1 页
SELECT * FROM user LIMIT 10, 10;          -- 第 2 页

-- 分页公式：LIMIT (page - 1) * pageSize, pageSize
```

### 聚合函数

| 函数    | 说明     |
| :------ | :------- |
| COUNT() | 统计数量 |
| SUM()   | 求和     |
| AVG()   | 平均值   |
| MAX()   | 最大值   |
| MIN()   | 最小值   |

```sql
-- 统计
SELECT COUNT(*) FROM user;
SELECT COUNT(email) FROM user;  -- 不统计 NULL

-- 求和、平均
SELECT SUM(age), AVG(age) FROM user;

-- 最大、最小
SELECT MAX(age), MIN(age) FROM user;
```

### 分组查询

```sql
-- 按状态分组统计
SELECT status, COUNT(*) AS count FROM user GROUP BY status;

-- 分组 + 条件
SELECT status, COUNT(*) AS count 
FROM user 
WHERE age > 18 
GROUP BY status 
HAVING count > 5;
```

**WHERE vs HAVING**

| 对比       | WHERE      | HAVING     |
| :--------- | :--------- | :--------- |
| 执行时机   | 分组前过滤 | 分组后过滤 |
| 能否用聚合 | ❌          | ✅          |

## DCL - 权限控制

### 用户管理

```sql
-- 创建用户
CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';
CREATE USER 'username'@'%' IDENTIFIED BY 'password';  -- 允许远程

-- 修改密码
ALTER USER 'username'@'localhost' IDENTIFIED BY 'new_password';

-- 删除用户
DROP USER 'username'@'localhost';

-- 查看用户
SELECT user, host FROM mysql.user;
```

### 权限管理

```sql
-- 授权
GRANT ALL PRIVILEGES ON db_name.* TO 'username'@'localhost';
GRANT SELECT, INSERT ON db_name.table_name TO 'username'@'%';

-- 查看权限
SHOW GRANTS FOR 'username'@'localhost';

-- 撤销权限
REVOKE ALL PRIVILEGES ON db_name.* FROM 'username'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

| 权限   | 说明     |
| :----- | :------- |
| ALL    | 所有权限 |
| SELECT | 查询     |
| INSERT | 插入     |
| UPDATE | 更新     |
| DELETE | 删除     |
| CREATE | 创建     |
| DROP   | 删除     |
| ALTER  | 修改     |
