---
order : 19
---
# MySQL进阶 - InnoDB存储引擎

## 逻辑存储结构
![InnoDB逻辑存储结构](/assets/database/mysql/innodb-engine/2023-05-13-22-00-15.png)
InnoDB引擎的存储结构主要包含5个部分：
1. 表空间Tablespace

主要是MySQL中的ibd文件，一个MySQL实例可以对应多个表空间，用于存储记录、索引等数据。表空间用来管理多个Segment段。

2. 段Segment

段分为数据段(Leaf node segment)、索引段(Non-leaf node segment)、回滚段(Rollback segment)，InnoDB是索引组织表，数据段就是B+树的叶子结点，索引段即为B+树的非叶子结点。段用来管理多个Extent区。

3. 区Extent

区是表空间中的单元结构。每个区的大小为1M。默认情况下，InnoDB存储引擎页大小为16K，即一个区中一共有64个连续的页。

4. 页Page

页是InnoDB存储引擎磁盘管理的最小单元，每个页的大小默认为16KB。为了保证页的连续性，InnoDB存储引擎每次从磁盘申请4-5个区。

5. 行Row

InnoDB存储引擎数据是按行进行存放的。

::: tip 字段解释
Trx_id：每次对某条记录产生改动时，都会把对应的事务id赋值给trx_id隐藏列。

Roll_pointer：每次对某条引记录进行改动时，都会把旧的版本写入到undo日志中，然后这个隐藏列就相当于一个指针，可以通过它来找到该记录修改前的信息。
> 这个字段在后面的MVCC版本控制时会使用到。
:::

## 架构
MySQL5.5版本开始，默认使用InnoDB存储引擎，它擅长事务处理，具有崩溃恢复特征，在日常开发中使用非常广泛。下面是InnoDB架构图。

![InnoDB架构](/assets/database/mysql/innodb-engine/2023-05-13-22-17-39.png)

### 内存结构

![内存结构](/assets/database/mysql/innodb-engine/2023-05-13-22-18-38.png)

上图为InnoDB的内存架构，由图可知，主要分为三个部分

#### Buffer Pool 缓冲池

缓冲池是主内存中的一个区域，里面可以缓存磁盘上经常操作的真实数据，在执行增删改查操作时，先操作缓冲池中的数据（若缓冲池中没有所需数据，再从磁盘加载并且缓存），然后再以一定的频率刷新到磁盘，从而减少磁盘IO，加快处理速度。

缓冲池以Page页为单位，底层采用链表数据结构管理Page。根据状态，将Page分为三种类型：

- free page：空闲Page，未被使用。

- clean page：被使用的Page，但是数据并未被修改过。

- dirty page：脏页，脏Page，被使用过的Page，数据被修改过，页中数据与磁盘中数据产生了不一致。

#### Change Buffer 更改缓冲区

更改缓冲区（针对于非唯一的二级索引页），在执行DML语句时，如果这些数据Page没有在Buffer Pool中，不会直接操作磁盘，而会将数据变更存在更改缓冲区 Change Buffer 中，在未来数据被读取时，再将数据恢复到 Buffer Pool 中，再将合并后的数据写回磁盘内。

::: warning Change Buffer 的意义是什么？

与聚集索引不同，二级索引通常情况下是非唯一的，并且以相对随机的顺序插入二级索引。同样，删除和更新可能会影响索引树中不相邻的二级索引页，如果每一次都操作磁盘，会造成大量的磁盘IO。

有了Change Buffer 以后，我们可以在缓冲池中进行合并处理，减少磁盘IO。

:::
#### Log Buffer 日志缓冲区

日志缓冲区，用来保存要写入到磁盘中的Log日志数据（redo log、undo log），默认大小为16MB，日志缓冲区中的数据会定期刷新到磁盘中。如果需要更新、插入或者删除许多行的事务，增加日志缓冲区的大小可以节省磁盘IO。

::: tip 参数
- innodb_log_buffer_sie：缓冲区大小
- innodb_flush_log_at_trx_commit：日志刷新到磁盘时机
> 该参数有三个值，默认为 1 
> - 0 : 每秒将日志写入并刷新到磁盘一次。
> - 1 : 日志在每次事务提交时写入并刷新到磁盘。
> - 2 : 日志在每次事务提交后写入，并每秒刷新到磁盘一次。
:::

#### Adaptive Hash Index 自适应哈希索引

自适应哈希索引，用于优化对Buffer Pool 数据的查询，InnoDB存储引擎会监控对表上各索引页的查询，如果观察到哈希索引可以提升速度，则建立哈希索引，称之为自适应哈希索引。

自适应哈希索引无需人工干预，是系统根据情况自动完成的。

::: tip 参数
- adaptive_hash_index
:::
### 磁盘结构

![磁盘结构](/assets/database/mysql/innodb-engine/2023-05-13-23-18-50.png)

#### System Tablespace 系统表空间

系统表空间是更改缓冲区的存储区域。如果表是在系统表空间而不是每个表文件或通用表空间中创建的，它也可能包含表和索引数据。（在MySQL5.x版本中还包含InnoDB数据字典、undo log等）

::: tip 参数
- innodb_data_file_path
:::

#### File-Pre-Table Tablespaces 独立表空间

每个表的文件表空间包含单个InnoDB表的数据和索引，并存储在文件系统上的单个数据文件中。

::: tip 参数
- innodb_file_pre_table 默认打开，为ON，即每张表都有独立的空间
:::
#### General Tablespaces 通用表空间 

通用表空间需要通过 CREATE TABLETABLESPACE 语法创建通用表空间，在创建表时，可以指定该表空间。

1. 创建表空间
```sql
CREATE TABLESPACE tablespace_name ADD DATAFILE 'file_name' ENGINE = 'engine_name';
```

2. 创建表并且指定表空间

```sql
CREATE TABLE table_name(...) TABLESPACE tablespace_name;
```

#### Undo Tablespaces 撤销表空间

撤销表空间，MySQL实例在初始化时会自动创建两个默认的undo表空间（初始大小为16MB），用于存储undo log日志。

#### Temporary Tablespaces 临时表

InnoDB使用会话临时表和全局临时表空间。存储用户创建的临时表等数据。

#### Double Write Buffer Files 双写缓冲区

双写缓冲区，InnoDB引擎将数据页从Buffer Pool刷新到磁盘前，先将数据页写入双写缓冲区文件中，便于系统异常时恢复数据。


#### Redo Log 重做日志

重做日志是用来实现事务的持久性。该日志文件由两部分组成：重做日志缓冲以及重做日志文件，前者是在内存中，后者是在磁盘中。当事务提交之后会把所有修改信息都存到该日志中，用于在刷新脏页到磁盘时，发生错误时，进行数据恢复使用。


以循环方式写入重做日志文件，涉及两个文件

- ib_logfile0
- ib_logfile1

### 后台线程

后台线程的作用就是将InnoDB缓冲池 Buffer Poll 中的数据，在合适的时间内刷新到磁盘。

后台线程主要有四类：

1. Master Thread

核心后台线程，主要负责调度其他线程，还负责将缓冲池中的数据异步刷新到磁盘中，保持数据的一致性，还包括脏页的刷新、合并插入缓存、undo页的回收。

2. IO Thread

在InnoDB存储引擎中，使用了大量的AIO来处理IO请求，这样可以极大的提高数据库的性能，而IO Thread主要负责这些IO请求的回调。

|线程类型|默认个数|职责|
|:---:|:---:|:---:|
|Read Thread|4|负责读操作|
|Write Thread|4|负责写操作|
|Log Thread|1|负责将日志缓冲区刷新到磁盘|
|Insert Buffer Thread|1|负责将写缓冲区内容刷新到磁盘|   

3. Purge Thread

主要用于回收事务已经提交了的 undo log ，在事务提交之后，undo log 可能不用了，就用它来回收。

4. Page Cleaner Thread

协助 Master Thread 刷新脏页到磁盘的线程，它可以减轻 Master Thread 的工作压力，减少阻塞。

## 事务原理

事务是一组操作的集合，它是一个不可分割的工作单位，事务会把所有的操作作为一个整体向系统提交或撤销操作请求，即这些操作要么同时成功要么同时失败。

::: tip 事务特性 ACID
- 原子性 Atomicity : 事务是不可分割的最小操作单元，要么全部成功，要么全部失败。 
- 一致性 Consistency : 事务完成时，必须使所有的数据都保持一致性。
- 隔离性 Isolation : 数据库系统提供的隔离机制，保证事务在不受外部并发操作影响的独立环境下运行。
- 持久性 Durablity : 事务一旦提交或回滚，它对数据库中数据的改变就是永久的。
:::

### Redo Log 重做日志

重做日志，记录的是事务提交时数据页的物理修改，是用来实现事务的持久性。

该日志文件由两部分组成：重做日志缓冲（redo log buffer）以及重做日志文件（redo logo file），前者是在内存中，后者是在磁盘中。

当事务提交之后会把所有的修改信息都存到该日志文件中，用于在刷新脏页到磁盘，发生错误时，进行数据恢复使用。

![数据操作流程](/assets/database/mysql/innodb-engine/2023-05-14-00-12-25.png)

### Undo Log 

回滚日志，用于记录数据被修改前的信息，作用包含两个：提供回滚 和 MVCC（多版本并发控制），是用来实现事务的原子性。

Undo Log和Redo Log记录物理日志不一样，它是逻辑日志。可以认为当delete一条记录时，Undo Log中会记录一条对应的insert记录，反之
亦然，当update一条记录时，它记录一条对应相反的update记录。当执行rolback时，就可以从Undo Log中的逻辑记录读取到相应的内容并进行回滚。

Undo Log销毁：undo Log在事务执行时产生，事务提交时，并不会立即删除undo log，因为这些日志可能还用于MVCC。

Undo Log存储：undo log采用段的方式进行管理和记录，存放在前面介绍的rollback segment 回滚段中，内部包含 1024 个undo log segment。


