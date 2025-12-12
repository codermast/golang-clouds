---
order: 2
---

# SQL 进阶

多表查询、子查询、函数、视图、存储过程。

## 多表查询

### 表关系

| 关系   | 说明                 | 示例          |
| :----- | :------------------- | :------------ |
| 一对一 | 一条记录对应一条记录 | 用户-用户详情 |
| 一对多 | 一条记录对应多条记录 | 部门-员工     |
| 多对多 | 多条记录对应多条记录 | 学生-课程     |

### 连接查询

**内连接**

```sql
-- 隐式内连接
SELECT e.name, d.name 
FROM employee e, department d 
WHERE e.dept_id = d.id;

-- 显式内连接（推荐）
SELECT e.name, d.name 
FROM employee e 
INNER JOIN department d ON e.dept_id = d.id;
```

**外连接**

```sql
-- 左外连接：包含左表所有记录
SELECT e.name, d.name 
FROM employee e 
LEFT JOIN department d ON e.dept_id = d.id;

-- 右外连接：包含右表所有记录
SELECT e.name, d.name 
FROM employee e 
RIGHT JOIN department d ON e.dept_id = d.id;
```

**自连接**

```sql
-- 查询员工及其上级
SELECT a.name AS employee, b.name AS manager 
FROM employee a 
LEFT JOIN employee b ON a.manager_id = b.id;
```

### 联合查询

```sql
-- UNION：去重合并
SELECT name FROM employee WHERE age < 30
UNION
SELECT name FROM employee WHERE salary > 10000;

-- UNION ALL：不去重
SELECT name FROM employee WHERE age < 30
UNION ALL
SELECT name FROM employee WHERE salary > 10000;
```

### 子查询

**标量子查询**（返回单个值）

```sql
-- 查询工资高于平均工资的员工
SELECT * FROM employee 
WHERE salary > (SELECT AVG(salary) FROM employee);
```

**列子查询**（返回一列）

```sql
-- 查询销售部和技术部的员工
SELECT * FROM employee 
WHERE dept_id IN (SELECT id FROM department WHERE name IN ('销售部', '技术部'));
```

**行子查询**（返回一行）

```sql
-- 查询与张三同部门同职位的员工
SELECT * FROM employee 
WHERE (dept_id, job) = (SELECT dept_id, job FROM employee WHERE name = '张三');
```

**表子查询**（返回多行多列）

```sql
-- 查询入职日期在2020年后的员工信息及部门
SELECT e.*, d.name 
FROM (SELECT * FROM employee WHERE entry_date > '2020-01-01') e
LEFT JOIN department d ON e.dept_id = d.id;
```

## 常用函数

### 字符串函数

| 函数                     | 说明         | 示例                             |
| :----------------------- | :----------- | :------------------------------- |
| CONCAT(s1, s2, ...)      | 拼接字符串   | CONCAT('Hello', 'World')         |
| LENGTH(s)                | 字符串长度   | LENGTH('Hello') → 5              |
| UPPER(s) / LOWER(s)      | 大小写转换   | UPPER('hello') → 'HELLO'         |
| TRIM(s)                  | 去除首尾空格 | TRIM(' hello ') → 'hello'        |
| SUBSTRING(s, start, len) | 截取子串     | SUBSTRING('Hello', 1, 3) → 'Hel' |
| REPLACE(s, old, new)     | 替换         | REPLACE('abc', 'a', 'x') → 'xbc' |

### 数值函数

| 函数        | 说明     | 示例                    |
| :---------- | :------- | :---------------------- |
| CEIL(x)     | 向上取整 | CEIL(1.5) → 2           |
| FLOOR(x)    | 向下取整 | FLOOR(1.5) → 1          |
| ROUND(x, d) | 四舍五入 | ROUND(3.1415, 2) → 3.14 |
| MOD(x, y)   | 取模     | MOD(7, 3) → 1           |
| RAND()      | 随机数   | RAND() → 0.xxx          |
| ABS(x)      | 绝对值   | ABS(-5) → 5             |

### 日期函数

| 函数                            | 说明         | 示例                                     |
| :------------------------------ | :----------- | :--------------------------------------- |
| NOW()                           | 当前日期时间 | 2024-01-01 12:00:00                      |
| CURDATE()                       | 当前日期     | 2024-01-01                               |
| CURTIME()                       | 当前时间     | 12:00:00                                 |
| YEAR(date)                      | 提取年       | YEAR('2024-01-01') → 2024                |
| MONTH(date)                     | 提取月       | MONTH('2024-01-01') → 1                  |
| DAY(date)                       | 提取日       | DAY('2024-01-01') → 1                    |
| DATEDIFF(d1, d2)                | 日期差（天） | DATEDIFF('2024-01-10', '2024-01-01') → 9 |
| DATE_ADD(date, INTERVAL n unit) | 日期加减     | DATE_ADD(NOW(), INTERVAL 7 DAY)          |
| DATE_FORMAT(date, format)       | 日期格式化   | DATE_FORMAT(NOW(), '%Y-%m-%d')           |

### 流程控制函数

```sql
-- IF
SELECT IF(score >= 60, '及格', '不及格') FROM student;

-- IFNULL
SELECT IFNULL(email, '未填写') FROM user;

-- CASE WHEN
SELECT 
    name,
    CASE 
        WHEN score >= 90 THEN '优秀'
        WHEN score >= 60 THEN '及格'
        ELSE '不及格'
    END AS level
FROM student;
```

## 视图

视图是一个虚拟表，本身不存储数据，是对 SQL 查询的封装。

```sql
-- 创建视图
CREATE VIEW v_employee AS
SELECT e.id, e.name, e.salary, d.name AS dept_name
FROM employee e
LEFT JOIN department d ON e.dept_id = d.id;

-- 使用视图
SELECT * FROM v_employee WHERE salary > 10000;

-- 修改视图
ALTER VIEW v_employee AS
SELECT e.id, e.name FROM employee e;

-- 删除视图
DROP VIEW v_employee;

-- 查看视图
SHOW CREATE VIEW v_employee;
```

**使用场景**
- 简化复杂查询
- 数据安全（隐藏敏感字段）
- 数据独立性（表结构变化，只需修改视图）

## 存储过程

存储过程是一组预编译的 SQL 语句，存储在数据库中，可重复调用。

### 基本语法

```sql
-- 创建存储过程
DELIMITER //
CREATE PROCEDURE proc_name(IN param1 INT, OUT param2 VARCHAR(50))
BEGIN
    -- SQL 语句
    SELECT name INTO param2 FROM user WHERE id = param1;
END //
DELIMITER ;

-- 调用存储过程
CALL proc_name(1, @result);
SELECT @result;

-- 删除存储过程
DROP PROCEDURE proc_name;
```

### 变量

```sql
DELIMITER //
CREATE PROCEDURE test_var()
BEGIN
    -- 局部变量
    DECLARE count INT DEFAULT 0;
    SELECT COUNT(*) INTO count FROM user;
    SELECT count;
    
    -- 用户变量
    SET @total = 0;
    SELECT COUNT(*) INTO @total FROM user;
END //
DELIMITER ;
```

### 条件与循环

```sql
DELIMITER //
CREATE PROCEDURE test_loop(IN n INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE total INT DEFAULT 0;
    
    -- IF
    IF n <= 0 THEN
        SET total = 0;
    ELSE
        -- WHILE
        WHILE i <= n DO
            SET total = total + i;
            SET i = i + 1;
        END WHILE;
    END IF;
    
    SELECT total;
END //
DELIMITER ;
```

### 游标

```sql
DELIMITER //
CREATE PROCEDURE proc_cursor()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE uid INT;
    DECLARE uname VARCHAR(50);
    
    -- 声明游标
    DECLARE cur CURSOR FOR SELECT id, name FROM user;
    
    -- 声明处理器
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    -- 打开游标
    OPEN cur;
    
    -- 循环读取
    read_loop: LOOP
        FETCH cur INTO uid, uname;
        IF done THEN
            LEAVE read_loop;
        END IF;
        -- 处理数据
        SELECT uid, uname;
    END LOOP;
    
    -- 关闭游标
    CLOSE cur;
END //
DELIMITER ;
```

## 触发器

触发器在 INSERT/UPDATE/DELETE 操作前后自动执行。

```sql
-- 创建触发器
DELIMITER //
CREATE TRIGGER trig_user_insert
AFTER INSERT ON user
FOR EACH ROW
BEGIN
    INSERT INTO user_log (user_id, action, create_time)
    VALUES (NEW.id, 'INSERT', NOW());
END //
DELIMITER ;

-- OLD：修改/删除前的数据
-- NEW：插入/修改后的数据

-- 删除触发器
DROP TRIGGER trig_user_insert;

-- 查看触发器
SHOW TRIGGERS;
```

| 触发时机 | 可用变量 |
| :------- | :------- |
| INSERT   | NEW      |
| UPDATE   | OLD, NEW |
| DELETE   | OLD      |
