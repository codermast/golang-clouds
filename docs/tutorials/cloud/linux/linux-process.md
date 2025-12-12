---
order: 3
---
# Linux - 进程管理

## 概述

进程是正在运行的程序实例。Linux 提供了丰富的工具来查看、管理和控制进程。

## 进程基础

### 进程与程序

| 概念 | 说明             |
| :--- | :--------------- |
| 程序 | 静态的可执行文件 |
| 进程 | 运行中的程序实例 |
| PID  | 进程唯一标识符   |
| PPID | 父进程 ID        |
| 线程 | 进程内的执行单元 |

### 进程状态

| 状态 | 符号 | 说明                    |
| :--- | :--- | :---------------------- |
| 运行 | R    | 正在运行或就绪          |
| 睡眠 | S    | 可中断睡眠（等待事件）  |
| 睡眠 | D    | 不可中断睡眠（等待I/O） |
| 停止 | T    | 被暂停                  |
| 僵尸 | Z    | 已终止但未被回收        |

## 查看进程

### ps - 查看进程快照

```bash
# 查看当前终端进程
ps

# 查看所有进程（标准格式）
ps -ef

# 查看所有进程（BSD格式）
ps aux

# 查看指定用户的进程
ps -u username

# 查看指定进程
ps -p 1234

# 查看进程树
ps -ejH
ps axjf

# 自定义输出列
ps -eo pid,ppid,user,%cpu,%mem,cmd

# 按 CPU 使用率排序
ps aux --sort=-%cpu | head -10

# 按内存使用率排序
ps aux --sort=-%mem | head -10

# 查看线程
ps -eLf
```

**ps aux 输出说明：**

```
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 168936 11852 ?        Ss   Dec09   0:03 /sbin/init
│            │   │    │     │     │   │         │     │      │      │
│            │   │    │     │     │   │         │     │      │      └── 命令
│            │   │    │     │     │   │         │     │      └── CPU 时间
│            │   │    │     │     │   │         │     └── 启动时间
│            │   │    │     │     │   │         └── 进程状态
│            │   │    │     │     │   └── 终端
│            │   │    │     │     └── 物理内存 (KB)
│            │   │    │     └── 虚拟内存 (KB)
│            │   │    └── 内存使用率
│            │   └── CPU 使用率
│            └── 进程 ID
└── 用户
```

### top - 实时监控

```bash
# 启动 top
top

# 常用交互命令：
# q     退出
# h     帮助
# k     杀死进程
# r     调整优先级
# u     按用户过滤
# M     按内存排序
# P     按 CPU 排序
# c     显示完整命令
# 1     显示每个 CPU
# s     设置刷新间隔

# 指定刷新间隔（秒）
top -d 2

# 指定次数后退出
top -n 5

# 批处理模式（用于脚本）
top -bn1

# 监控指定进程
top -p 1234,5678
```

**top 输出说明：**

```
top - 10:30:45 up 5 days, 12:30,  2 users,  load average: 0.15, 0.10, 0.05
Tasks: 120 total,   1 running, 119 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  1.0 sy,  0.0 ni, 96.5 id,  0.2 wa,  0.0 hi,  0.0 si
MiB Mem :   7976.4 total,   2345.6 free,   3456.7 used,   2174.1 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   4123.4 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1234 root      20   0  123456  12345   6789 S   2.3   0.2   0:12.34 nginx
```

### htop - 增强版 top

```bash
# 安装
sudo apt install htop

# 运行
htop

# 特点：
# - 彩色显示
# - 可以用鼠标
# - 可以垂直/水平滚动
# - 更直观的 CPU/内存显示
```

### pgrep - 查找进程 ID

```bash
# 按名称查找
pgrep nginx

# 显示进程名
pgrep -l nginx

# 精确匹配
pgrep -x nginx

# 按用户查找
pgrep -u root

# 最新进程
pgrep -n nginx

# 最老进程
pgrep -o nginx
```

### pstree - 进程树

```bash
# 显示进程树
pstree

# 显示 PID
pstree -p

# 显示指定进程的树
pstree -p 1234

# 高亮当前进程
pstree -h
```

## 控制进程

### 前台与后台

```bash
# 后台运行
command &

# 将前台进程放到后台
# Ctrl + Z（暂停并放入后台）
bg          # 在后台继续运行

# 查看后台任务
jobs
jobs -l     # 显示 PID

# 将后台任务调到前台
fg
fg %1       # 指定任务号

# 后台运行且不受终端影响
nohup command &
nohup command > output.log 2>&1 &
```

### kill - 发送信号

```bash
# 常用信号
# 1  (HUP)   挂起，重新加载配置
# 2  (INT)   中断，相当于 Ctrl+C
# 9  (KILL)  强制终止
# 15 (TERM)  正常终止（默认）
# 18 (CONT)  继续
# 19 (STOP)  暂停

# 发送默认信号（TERM）
kill 1234

# 发送指定信号
kill -9 1234
kill -KILL 1234
kill -SIGKILL 1234

# 终止多个进程
kill 1234 5678 9012

# 查看所有信号
kill -l
```

### killall - 按名称终止

```bash
# 终止所有指定名称的进程
killall nginx

# 强制终止
killall -9 nginx

# 交互式确认
killall -i nginx

# 按用户终止
killall -u username
```

### pkill - 按模式终止

```bash
# 按名称终止
pkill nginx

# 按用户终止
pkill -u username

# 精确匹配
pkill -x nginx

# 发送指定信号
pkill -9 nginx
```

## 进程优先级

### nice 值

nice 值范围：-20（最高优先级）到 19（最低优先级），默认为 0。

```bash
# 以指定优先级启动
nice -n 10 command

# 以低优先级运行
nice command         # 默认 +10

# 以高优先级运行（需要 root）
sudo nice -n -10 command
```

### renice - 调整优先级

```bash
# 调整进程优先级
renice 10 -p 1234

# 调整用户所有进程
renice 5 -u username

# 调整组所有进程
renice 5 -g groupname

# 降低优先级（普通用户可以）
renice 10 -p 1234

# 提高优先级（需要 root）
sudo renice -10 -p 1234
```

## 监控工具

### vmstat - 虚拟内存统计

```bash
# 基本使用
vmstat

# 每秒刷新
vmstat 1

# 刷新 5 次后退出
vmstat 1 5

# 显示活动/非活动内存
vmstat -a

# 输出说明
# procs: r(运行) b(阻塞)
# memory: swpd free buff cache
# swap: si(换入) so(换出)
# io: bi(块读) bo(块写)
# system: in(中断) cs(上下文切换)
# cpu: us sy id wa st
```

### iostat - I/O 统计

```bash
# 安装
sudo apt install sysstat

# CPU 和 I/O 统计
iostat

# 每秒刷新
iostat 1

# 详细设备统计
iostat -x

# 以 MB 为单位
iostat -m
```

### free - 内存使用

```bash
# 查看内存
free

# 人性化显示
free -h

# 持续监控
free -s 1

# 显示总计
free -t
```

### uptime - 系统负载

```bash
uptime
# 10:30:45 up 5 days, 12:30,  2 users,  load average: 0.15, 0.10, 0.05
#   │           │              │                         │     │     │
#   │           │              │                         │     │     └── 15分钟平均
#   │           │              │                         │     └── 5分钟平均
#   │           │              │                         └── 1分钟平均
#   │           │              └── 登录用户数
#   │           └── 运行时间
#   └── 当前时间
```

## 系统资源限制

### ulimit - 用户限制

```bash
# 查看所有限制
ulimit -a

# 查看最大打开文件数
ulimit -n

# 设置最大打开文件数（临时）
ulimit -n 65535

# 查看最大进程数
ulimit -u

# 设置最大进程数
ulimit -u 4096

# 永久设置（编辑 /etc/security/limits.conf）
# username soft nofile 65535
# username hard nofile 65535
```

## 后台任务管理

### screen - 终端复用

```bash
# 安装
sudo apt install screen

# 创建新会话
screen

# 创建命名会话
screen -S mysession

# 列出会话
screen -ls

# 恢复会话
screen -r mysession

# 分离会话
# Ctrl + A, D

# 常用快捷键（Ctrl+A 后）：
# c     创建新窗口
# n     下一个窗口
# p     上一个窗口
# "     窗口列表
# d     分离
# k     关闭当前窗口
```

### tmux - 终端复用

```bash
# 安装
sudo apt install tmux

# 创建新会话
tmux

# 创建命名会话
tmux new -s mysession

# 列出会话
tmux ls

# 恢复会话
tmux attach -t mysession

# 分离会话
# Ctrl + B, D

# 常用快捷键（Ctrl+B 后）：
# c     创建新窗口
# n     下一个窗口
# p     上一个窗口
# %     水平分割
# "     垂直分割
# 方向键 切换面板
# d     分离
# x     关闭当前面板
```

### systemd 服务

```bash
# 以服务方式运行（推荐）
# 参见 linux-service.md
```

## 常用命令总结

| 命令    | 功能          | 常用选项 |
| :------ | :------------ | :------- |
| ps      | 查看进程      | aux, -ef |
| top     | 实时监控      | -d, -p   |
| htop    | 增强监控      |          |
| pgrep   | 查找进程      | -l, -u   |
| kill    | 发送信号      | -9, -15  |
| killall | 按名称终止    | -9       |
| nice    | 设置优先级    | -n       |
| renice  | 调整优先级    | -p       |
| jobs    | 查看后台任务  | -l       |
| bg/fg   | 后台/前台切换 |          |
| nohup   | 忽略挂断信号  |          |

::: tip 提示
1. 使用 `kill -9` 是最后手段，优先使用 `kill -15`
2. 僵尸进程需要终止其父进程来清理
3. 生产环境使用 systemd 管理服务
4. 长时间任务使用 screen/tmux 防止断开
:::
