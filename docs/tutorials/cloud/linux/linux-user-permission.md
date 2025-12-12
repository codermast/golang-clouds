---
order: 2
---
# Linux - 用户与权限管理

## 概述

Linux 是多用户操作系统，通过用户和权限机制来保护系统安全。理解用户、组和权限的概念是系统管理的基础。

## 用户类型

| 类型     | UID 范围 | 说明                     |
| :------- | :------- | :----------------------- |
| root     | 0        | 超级管理员，拥有最高权限 |
| 系统用户 | 1-999    | 系统服务使用的用户       |
| 普通用户 | 1000+    | 一般登录用户             |

## 用户管理

### 查看用户信息

```bash
# 查看当前用户
whoami

# 查看用户 ID
id
id username

# 查看登录用户
who
w

# 查看用户信息
finger username

# 查看 /etc/passwd
cat /etc/passwd

# 用户信息格式：
# username:password:UID:GID:comment:home:shell
# root:x:0:0:root:/root:/bin/bash
```

### useradd - 创建用户

```bash
# 创建用户（使用默认设置）
sudo useradd username

# 创建用户并指定主目录
sudo useradd -m username

# 指定主目录路径
sudo useradd -m -d /home/custom username

# 指定 shell
sudo useradd -s /bin/bash username

# 指定用户 ID
sudo useradd -u 1500 username

# 指定主组
sudo useradd -g groupname username

# 指定附加组
sudo useradd -G group1,group2 username

# 设置账户过期时间
sudo useradd -e 2024-12-31 username

# 添加注释
sudo useradd -c "John Doe" username

# 完整示例
sudo useradd -m -s /bin/bash -c "New User" -G sudo,docker newuser
```

### usermod - 修改用户

```bash
# 修改用户名
sudo usermod -l newname oldname

# 修改主目录
sudo usermod -d /new/home -m username

# 修改 shell
sudo usermod -s /bin/zsh username

# 修改主组
sudo usermod -g newgroup username

# 添加到附加组
sudo usermod -aG groupname username

# 锁定用户
sudo usermod -L username

# 解锁用户
sudo usermod -U username

# 设置过期时间
sudo usermod -e 2024-12-31 username
```

### userdel - 删除用户

```bash
# 删除用户（保留主目录）
sudo userdel username

# 删除用户及主目录
sudo userdel -r username

# 强制删除（即使用户登录中）
sudo userdel -f username
```

### passwd - 管理密码

```bash
# 修改当前用户密码
passwd

# 修改指定用户密码
sudo passwd username

# 锁定用户密码
sudo passwd -l username

# 解锁用户密码
sudo passwd -u username

# 删除密码（无密码登录）
sudo passwd -d username

# 设置密码过期
sudo passwd -e username

# 查看密码状态
sudo passwd -S username
```

## 组管理

### 查看组信息

```bash
# 查看当前用户的组
groups

# 查看指定用户的组
groups username

# 查看组文件
cat /etc/group

# 组信息格式：
# groupname:password:GID:members
# sudo:x:27:user1,user2
```

### groupadd - 创建组

```bash
# 创建组
sudo groupadd groupname

# 指定 GID
sudo groupadd -g 2000 groupname
```

### groupmod - 修改组

```bash
# 修改组名
sudo groupmod -n newname oldname

# 修改 GID
sudo groupmod -g 3000 groupname
```

### groupdel - 删除组

```bash
sudo groupdel groupname
```

### gpasswd - 组成员管理

```bash
# 添加用户到组
sudo gpasswd -a username groupname

# 从组中移除用户
sudo gpasswd -d username groupname

# 设置组管理员
sudo gpasswd -A username groupname
```

## 权限管理

### 权限类型

| 权限 | 字母 | 数字 | 对文件的含义 | 对目录的含义  |
| :--- | :--- | :--- | :----------- | :------------ |
| 读   | r    | 4    | 读取内容     | 列出目录内容  |
| 写   | w    | 2    | 修改内容     | 创建/删除文件 |
| 执行 | x    | 1    | 执行文件     | 进入目录      |

### 权限表示

```bash
# 符号表示
-rwxr-xr--
│└┬┘└┬┘└┬┘
│ │  │  └── 其他用户权限 (r--)
│ │  └───── 组权限 (r-x)
│ └──────── 所有者权限 (rwx)
└────────── 文件类型

# 数字表示
rwx = 4+2+1 = 7
r-x = 4+0+1 = 5
r-- = 4+0+0 = 4
所以 rwxr-xr-- = 754
```

### chmod - 修改权限

**符号模式：**

```bash
# 用户类别
# u: 所有者 (user)
# g: 所属组 (group)
# o: 其他人 (others)
# a: 所有人 (all)

# 操作符
# +: 添加权限
# -: 移除权限
# =: 设置权限

# 示例
chmod u+x file.txt        # 所有者添加执行权限
chmod g-w file.txt        # 组移除写权限
chmod o=r file.txt        # 其他人只有读权限
chmod a+x file.txt        # 所有人添加执行权限
chmod u+x,g-w file.txt    # 组合操作
chmod ug=rw,o=r file.txt  # 设置多个
```

**数字模式：**

```bash
chmod 755 file.txt    # rwxr-xr-x
chmod 644 file.txt    # rw-r--r--
chmod 700 file.txt    # rwx------
chmod 777 file.txt    # rwxrwxrwx（不推荐）
```

**递归修改：**

```bash
# 递归修改目录及其内容
chmod -R 755 directory/
```

**常用权限组合：**

| 权限 | 说明               |
| :--- | :----------------- |
| 755  | 目录/可执行文件    |
| 644  | 普通文件           |
| 600  | 私密文件（如密钥） |
| 700  | 私密目录           |

### chown - 修改所有者

```bash
# 修改所有者
sudo chown user file.txt

# 修改所有者和组
sudo chown user:group file.txt

# 只修改组
sudo chown :group file.txt

# 递归修改
sudo chown -R user:group directory/

# 参考其他文件
sudo chown --reference=ref_file target_file
```

### chgrp - 修改所属组

```bash
# 修改组
sudo chgrp group file.txt

# 递归修改
sudo chgrp -R group directory/
```

## 特殊权限

### SUID（Set User ID）

文件执行时以所有者身份运行。

```bash
# 设置 SUID
chmod u+s file
chmod 4755 file

# 查看（s 在所有者执行位）
-rwsr-xr-x

# 典型例子
ls -l /usr/bin/passwd
# -rwsr-xr-x 1 root root ... /usr/bin/passwd
```

### SGID（Set Group ID）

- 文件：执行时以组身份运行
- 目录：新建文件继承目录的组

```bash
# 设置 SGID
chmod g+s file
chmod 2755 file

# 查看（s 在组执行位）
-rwxr-sr-x
drwxr-sr-x

# 目录 SGID 示例
sudo mkdir /shared
sudo chown :developers /shared
sudo chmod 2775 /shared
# 新建文件自动属于 developers 组
```

### Sticky Bit

目录中的文件只能由所有者删除。

```bash
# 设置 Sticky Bit
chmod +t directory
chmod 1777 directory

# 查看（t 在其他用户执行位）
drwxrwxrwt

# 典型例子
ls -ld /tmp
# drwxrwxrwt 1 root root ... /tmp
```

## 默认权限

### umask

umask 决定新建文件/目录的默认权限。

```bash
# 查看 umask
umask

# 设置 umask
umask 022

# 计算默认权限
# 文件：666 - umask = 666 - 022 = 644
# 目录：777 - umask = 777 - 022 = 755

# 常见 umask 值
# 022: 文件 644，目录 755（默认）
# 027: 文件 640，目录 750
# 077: 文件 600，目录 700

# 永久设置（添加到 ~/.bashrc）
echo "umask 027" >> ~/.bashrc
```

## sudo 权限

### 配置 sudo

```bash
# 编辑 sudoers 文件（使用 visudo）
sudo visudo

# 配置格式
# 用户 主机=(运行身份) 命令
username ALL=(ALL) ALL              # 完全权限
username ALL=(ALL) NOPASSWD: ALL    # 无需密码
username ALL=(ALL) /usr/bin/apt     # 只能执行特定命令

# 组配置（% 表示组）
%sudo ALL=(ALL) ALL
%admin ALL=(ALL) NOPASSWD: ALL
```

### 使用 sudo

```bash
# 以 root 执行命令
sudo command

# 以指定用户执行
sudo -u username command

# 切换到 root shell
sudo -i
sudo su -

# 编辑文件
sudo -e /etc/config

# 查看 sudo 权限
sudo -l
```

## 切换用户

### su - 切换用户

```bash
# 切换到 root
su
su -

# 切换到指定用户
su username
su - username    # 同时加载环境变量

# 以用户身份执行命令
su - username -c "command"
```

### 区别

| 命令    | 说明                   |
| :------ | :--------------------- |
| su      | 只切换用户             |
| su -    | 切换用户并加载环境     |
| sudo    | 以其他用户身份执行命令 |
| sudo -i | 切换到 root 并加载环境 |

## ACL（访问控制列表）

ACL 提供更细粒度的权限控制。

```bash
# 查看 ACL
getfacl file.txt

# 设置用户 ACL
setfacl -m u:username:rw file.txt

# 设置组 ACL
setfacl -m g:groupname:rx file.txt

# 设置默认 ACL（对目录新建文件生效）
setfacl -d -m u:username:rw directory/

# 移除 ACL
setfacl -x u:username file.txt

# 移除所有 ACL
setfacl -b file.txt

# 递归设置
setfacl -R -m u:username:rx directory/
```

## 常用命令总结

| 命令     | 功能       | 常用选项    |
| :------- | :--------- | :---------- |
| useradd  | 创建用户   | -m, -s, -G  |
| usermod  | 修改用户   | -aG, -L, -U |
| userdel  | 删除用户   | -r          |
| passwd   | 修改密码   | -l, -u      |
| groupadd | 创建组     | -g          |
| chmod    | 修改权限   | -R          |
| chown    | 修改所有者 | -R          |
| su       | 切换用户   | -           |
| sudo     | 提权执行   | -i, -u      |

::: tip 最佳实践
1. 遵循最小权限原则
2. 避免直接使用 root 登录
3. 敏感文件权限设为 600
4. 可执行文件权限设为 755
5. 使用 sudo 代替 su
:::
