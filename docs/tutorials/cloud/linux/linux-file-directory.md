---
order: 1
---
# Linux - 文件与目录操作

## 概述

Linux 中一切皆文件，掌握文件和目录操作是使用 Linux 的基础。本文介绍常用的文件和目录操作命令。

## 目录结构

Linux 采用树形目录结构，以 `/` 为根目录：

```
/
├── bin/        # 基本命令（所有用户可用）
├── sbin/       # 系统管理命令（管理员使用）
├── boot/       # 启动文件、内核
├── dev/        # 设备文件
├── etc/        # 系统配置文件
├── home/       # 用户主目录
│   ├── user1/
│   └── user2/
├── lib/        # 共享库文件
├── media/      # 可移动设备挂载点
├── mnt/        # 临时挂载点
├── opt/        # 第三方软件
├── proc/       # 进程信息（虚拟文件系统）
├── root/       # root 用户主目录
├── run/        # 运行时数据
├── srv/        # 服务数据
├── sys/        # 系统信息（虚拟文件系统）
├── tmp/        # 临时文件
├── usr/        # 用户程序
│   ├── bin/    # 用户命令
│   ├── lib/    # 库文件
│   ├── local/  # 本地安装的软件
│   └── share/  # 共享数据
└── var/        # 可变数据
    ├── log/    # 日志文件
    ├── cache/  # 缓存
    └── www/    # Web 文件
```

## 路径表示

```bash
# 绝对路径：从根目录开始
/home/user/documents/file.txt

# 相对路径：从当前目录开始
./documents/file.txt
../other/file.txt

# 特殊路径
.       # 当前目录
..      # 上级目录
~       # 当前用户主目录
~user   # 指定用户主目录
-       # 上一次所在目录
```

## 目录操作

### pwd - 显示当前目录

```bash
pwd
# /home/user
```

### cd - 切换目录

```bash
# 切换到指定目录
cd /var/log

# 切换到主目录
cd
cd ~

# 切换到上级目录
cd ..

# 切换到上一次目录
cd -

# 切换到根目录
cd /
```

### ls - 列出目录内容

```bash
# 基本列出
ls

# 详细信息
ls -l

# 显示隐藏文件
ls -a

# 人性化显示大小
ls -lh

# 按时间排序（最新在前）
ls -lt

# 按大小排序
ls -lS

# 递归显示子目录
ls -R

# 只显示目录
ls -d */

# 常用组合
ls -la      # 详细 + 隐藏
ls -lah     # 详细 + 隐藏 + 人性化大小
ls -latr    # 详细 + 隐藏 + 按时间逆序
```

**ls -l 输出解读：**

```
-rw-r--r-- 1 user group 4096 Dec 10 10:30 file.txt
│├─┤├─┤├─┤ │  │    │     │      │          │
│ │  │  │  │  │    │     │      │          └── 文件名
│ │  │  │  │  │    │     │      └── 修改时间
│ │  │  │  │  │    │     └── 文件大小
│ │  │  │  │  │    └── 所属组
│ │  │  │  │  └── 所有者
│ │  │  │  └── 硬链接数
│ │  │  └── 其他用户权限
│ │  └── 组权限
│ └── 所有者权限
└── 文件类型（- 普通文件，d 目录，l 链接）
```

### mkdir - 创建目录

```bash
# 创建单个目录
mkdir mydir

# 创建多个目录
mkdir dir1 dir2 dir3

# 递归创建（包含父目录）
mkdir -p parent/child/grandchild

# 创建并设置权限
mkdir -m 755 mydir
```

### rmdir - 删除空目录

```bash
# 删除空目录
rmdir emptydir

# 递归删除空父目录
rmdir -p parent/child/grandchild
```

## 文件操作

### touch - 创建文件/更新时间戳

```bash
# 创建空文件
touch file.txt

# 创建多个文件
touch file1.txt file2.txt

# 更新时间戳
touch existing_file.txt

# 指定时间
touch -t 202312101030 file.txt
```

### cp - 复制文件/目录

```bash
# 复制文件
cp source.txt dest.txt

# 复制到目录
cp file.txt /path/to/dir/

# 复制多个文件到目录
cp file1.txt file2.txt /path/to/dir/

# 复制目录（递归）
cp -r sourcedir/ destdir/

# 保留属性
cp -p file.txt backup.txt

# 保留所有属性（推荐）
cp -a sourcedir/ destdir/

# 交互式（覆盖前确认）
cp -i source.txt dest.txt

# 强制覆盖
cp -f source.txt dest.txt

# 显示进度
cp -v file.txt /path/to/dir/
```

### mv - 移动/重命名文件

```bash
# 重命名文件
mv oldname.txt newname.txt

# 移动文件
mv file.txt /path/to/dir/

# 移动多个文件
mv file1.txt file2.txt /path/to/dir/

# 移动目录
mv sourcedir/ /path/to/destdir/

# 交互式
mv -i source.txt dest.txt

# 强制移动
mv -f source.txt dest.txt
```

### rm - 删除文件/目录

```bash
# 删除文件
rm file.txt

# 删除多个文件
rm file1.txt file2.txt

# 强制删除（不提示）
rm -f file.txt

# 删除目录（递归）
rm -r mydir/

# 强制递归删除
rm -rf mydir/

# 交互式删除
rm -i file.txt

# 显示删除过程
rm -v file.txt
```

::: danger 警告
`rm -rf /` 或 `rm -rf /*` 会删除整个系统，千万不要执行！
:::

### cat - 查看文件内容

```bash
# 查看文件
cat file.txt

# 显示行号
cat -n file.txt

# 显示非空行行号
cat -b file.txt

# 合并多个文件
cat file1.txt file2.txt > merged.txt

# 追加内容
cat file1.txt >> file2.txt
```

### less/more - 分页查看

```bash
# 分页查看
less file.txt
more file.txt

# less 常用操作：
# 空格/f   下一页
# b        上一页
# g        跳到开头
# G        跳到结尾
# /pattern 向下搜索
# ?pattern 向上搜索
# n        下一个匹配
# N        上一个匹配
# q        退出
```

### head/tail - 查看首尾

```bash
# 查看前 10 行（默认）
head file.txt

# 查看前 N 行
head -n 20 file.txt
head -20 file.txt

# 查看后 10 行（默认）
tail file.txt

# 查看后 N 行
tail -n 20 file.txt

# 实时跟踪文件（常用于日志）
tail -f /var/log/syslog

# 从第 N 行开始显示
tail -n +100 file.txt
```

## 文件查找

### find - 查找文件

```bash
# 按名称查找
find /path -name "*.txt"

# 忽略大小写
find /path -iname "*.TXT"

# 按类型查找
find /path -type f    # 文件
find /path -type d    # 目录
find /path -type l    # 链接

# 按大小查找
find /path -size +100M   # 大于 100MB
find /path -size -10k    # 小于 10KB
find /path -size 50M     # 等于 50MB

# 按时间查找
find /path -mtime -7     # 7 天内修改
find /path -mtime +30    # 30 天前修改
find /path -mmin -60     # 60 分钟内修改

# 按权限查找
find /path -perm 755

# 按用户查找
find /path -user root

# 组合条件
find /path -name "*.log" -size +10M -mtime +7

# 执行命令
find /path -name "*.tmp" -exec rm {} \;
find /path -name "*.log" -exec gzip {} \;

# 删除找到的文件
find /path -name "*.tmp" -delete
```

### locate - 快速查找

```bash
# 快速查找（使用数据库）
locate filename

# 更新数据库
sudo updatedb

# 忽略大小写
locate -i filename

# 限制结果数量
locate -n 10 filename
```

### which/whereis - 查找命令

```bash
# 查找命令位置
which python

# 查找命令、源码、手册
whereis python
```

## 文件内容操作

### grep - 搜索文本

```bash
# 基本搜索
grep "pattern" file.txt

# 忽略大小写
grep -i "pattern" file.txt

# 显示行号
grep -n "pattern" file.txt

# 递归搜索目录
grep -r "pattern" /path/

# 反向匹配（不包含）
grep -v "pattern" file.txt

# 只显示文件名
grep -l "pattern" *.txt

# 统计匹配数量
grep -c "pattern" file.txt

# 显示上下文
grep -A 3 "pattern" file.txt    # 后 3 行
grep -B 3 "pattern" file.txt    # 前 3 行
grep -C 3 "pattern" file.txt    # 前后各 3 行

# 正则表达式
grep -E "pattern1|pattern2" file.txt
egrep "pattern1|pattern2" file.txt

# 多个文件
grep "pattern" file1.txt file2.txt
```

### wc - 统计

```bash
# 统计行数、单词数、字节数
wc file.txt

# 只统计行数
wc -l file.txt

# 只统计单词数
wc -w file.txt

# 只统计字节数
wc -c file.txt

# 统计多个文件
wc -l *.txt
```

### sort - 排序

```bash
# 按字母排序
sort file.txt

# 逆序
sort -r file.txt

# 按数字排序
sort -n file.txt

# 按指定列排序
sort -k 2 file.txt

# 去重排序
sort -u file.txt

# 按分隔符指定列
sort -t ':' -k 3 -n /etc/passwd
```

### uniq - 去重

```bash
# 去除连续重复行（需先排序）
sort file.txt | uniq

# 只显示重复行
sort file.txt | uniq -d

# 只显示不重复行
sort file.txt | uniq -u

# 统计重复次数
sort file.txt | uniq -c
```

### cut - 截取列

```bash
# 按字符截取
cut -c 1-5 file.txt

# 按分隔符截取列
cut -d ':' -f 1 /etc/passwd

# 截取多列
cut -d ':' -f 1,3,7 /etc/passwd

# 截取范围
cut -d ':' -f 1-3 /etc/passwd
```

### awk - 文本处理

```bash
# 打印指定列
awk '{print $1}' file.txt

# 指定分隔符
awk -F ':' '{print $1, $7}' /etc/passwd

# 条件过滤
awk '$3 > 1000' /etc/passwd

# 格式化输出
awk -F ':' '{printf "%-10s %s\n", $1, $7}' /etc/passwd

# 统计求和
awk '{sum += $1} END {print sum}' numbers.txt
```

### sed - 流编辑器

```bash
# 替换（第一个匹配）
sed 's/old/new/' file.txt

# 全局替换
sed 's/old/new/g' file.txt

# 直接修改文件
sed -i 's/old/new/g' file.txt

# 删除行
sed '3d' file.txt          # 删除第 3 行
sed '/pattern/d' file.txt  # 删除匹配行

# 插入行
sed '2i new line' file.txt  # 在第 2 行前插入
sed '2a new line' file.txt  # 在第 2 行后插入
```

## 链接

### 硬链接

```bash
# 创建硬链接
ln source.txt hardlink.txt

# 特点：
# - 共享 inode
# - 不能跨文件系统
# - 不能链接目录
# - 删除原文件不影响链接
```

### 软链接（符号链接）

```bash
# 创建软链接
ln -s /path/to/source linkname

# 特点：
# - 类似快捷方式
# - 可以跨文件系统
# - 可以链接目录
# - 删除原文件链接失效

# 查看链接指向
ls -l linkname
readlink linkname
```

## 压缩与解压

### tar

```bash
# 打包（不压缩）
tar -cvf archive.tar files/

# 打包并 gzip 压缩
tar -czvf archive.tar.gz files/

# 打包并 bzip2 压缩
tar -cjvf archive.tar.bz2 files/

# 打包并 xz 压缩
tar -cJvf archive.tar.xz files/

# 解包
tar -xvf archive.tar

# 解压 gzip
tar -xzvf archive.tar.gz

# 解压 bzip2
tar -xjvf archive.tar.bz2

# 解压到指定目录
tar -xzvf archive.tar.gz -C /path/to/dir/

# 查看内容（不解压）
tar -tvf archive.tar.gz

# 参数说明：
# c  创建归档
# x  解压归档
# v  显示过程
# f  指定文件名
# z  gzip 压缩
# j  bzip2 压缩
# J  xz 压缩
# t  列出内容
```

### gzip/gunzip

```bash
# 压缩（删除原文件）
gzip file.txt

# 保留原文件
gzip -k file.txt

# 解压
gunzip file.txt.gz
gzip -d file.txt.gz
```

### zip/unzip

```bash
# 压缩文件
zip archive.zip file1.txt file2.txt

# 压缩目录
zip -r archive.zip directory/

# 解压
unzip archive.zip

# 解压到指定目录
unzip archive.zip -d /path/to/dir/

# 查看内容
unzip -l archive.zip
```

## 常用命令总结

| 命令  | 功能         | 常用选项            |
| :---- | :----------- | :------------------ |
| ls    | 列出目录     | -l, -a, -h, -t      |
| cd    | 切换目录     | -, ~, ..            |
| pwd   | 显示当前目录 |                     |
| mkdir | 创建目录     | -p                  |
| rm    | 删除         | -r, -f              |
| cp    | 复制         | -r, -a, -i          |
| mv    | 移动/重命名  | -i, -f              |
| cat   | 查看文件     | -n                  |
| less  | 分页查看     |                     |
| head  | 查看开头     | -n                  |
| tail  | 查看结尾     | -n, -f              |
| find  | 查找文件     | -name, -type, -size |
| grep  | 搜索文本     | -i, -r, -n, -v      |
| tar   | 打包压缩     | -czvf, -xzvf        |

::: tip 提示
1. 使用 Tab 键自动补全命令和路径
2. 使用上下箭头浏览历史命令
3. 使用 `man command` 查看命令手册
4. 危险操作前先用 `ls` 或 `-i` 确认
:::
