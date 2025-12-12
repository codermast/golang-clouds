---
order: 5
---
# Linux - 服务管理

## 概述

Linux 服务（也称为守护进程 daemon）是在后台运行的程序。现代 Linux 发行版主要使用 systemd 来管理服务。

## systemd 基础

systemd 是现代 Linux 的系统和服务管理器，提供了并行启动、按需激活、服务监控等功能。

### 核心概念

| 概念    | 说明                             |
| :------ | :------------------------------- |
| Unit    | systemd 管理的基本单元           |
| Target  | 一组 Unit 的集合（类似运行级别） |
| Service | 服务类型的 Unit                  |
| Timer   | 定时任务类型的 Unit              |

### Unit 类型

| 类型    | 扩展名   | 说明         |
| :------ | :------- | :----------- |
| service | .service | 系统服务     |
| socket  | .socket  | 套接字       |
| target  | .target  | 目标（组）   |
| timer   | .timer   | 定时器       |
| mount   | .mount   | 挂载点       |
| path    | .path    | 文件路径监控 |
| device  | .device  | 设备         |

## systemctl 命令

### 服务管理

```bash
# 启动服务
sudo systemctl start nginx

# 停止服务
sudo systemctl stop nginx

# 重启服务
sudo systemctl restart nginx

# 重新加载配置（不重启）
sudo systemctl reload nginx

# 重载或重启
sudo systemctl reload-or-restart nginx

# 查看服务状态
systemctl status nginx

# 检查服务是否运行
systemctl is-active nginx

# 检查服务是否开机启动
systemctl is-enabled nginx
```

### 开机启动

```bash
# 设置开机启动
sudo systemctl enable nginx

# 取消开机启动
sudo systemctl disable nginx

# 启动并设置开机启动
sudo systemctl enable --now nginx

# 停止并取消开机启动
sudo systemctl disable --now nginx

# 屏蔽服务（禁止启动）
sudo systemctl mask nginx

# 取消屏蔽
sudo systemctl unmask nginx
```

### 查看服务

```bash
# 列出所有运行中的服务
systemctl list-units --type=service

# 列出所有服务（包括未运行）
systemctl list-units --type=service --all

# 列出开机启动的服务
systemctl list-unit-files --type=service --state=enabled

# 列出失败的服务
systemctl list-units --type=service --state=failed

# 显示服务依赖
systemctl list-dependencies nginx

# 查看服务配置文件
systemctl cat nginx
```

### 系统控制

```bash
# 重启系统
sudo systemctl reboot

# 关机
sudo systemctl poweroff

# 挂起
sudo systemctl suspend

# 休眠
sudo systemctl hibernate

# 进入救援模式
sudo systemctl rescue

# 进入紧急模式
sudo systemctl emergency
```

### Target（运行级别）

```bash
# 查看当前目标
systemctl get-default

# 设置默认目标
sudo systemctl set-default multi-user.target    # 命令行
sudo systemctl set-default graphical.target     # 图形界面

# 切换目标
sudo systemctl isolate multi-user.target

# 常用目标
# poweroff.target    关机
# rescue.target      救援模式
# multi-user.target  多用户命令行
# graphical.target   图形界面
# reboot.target      重启
```

## 创建自定义服务

### 服务文件位置

```bash
# 系统服务
/etc/systemd/system/           # 自定义服务（优先）
/lib/systemd/system/           # 包管理器安装的服务
/usr/lib/systemd/system/       # 发行版提供的服务

# 用户服务
~/.config/systemd/user/
```

### 服务文件结构

```ini
# /etc/systemd/system/myapp.service

[Unit]
Description=My Application Service
Documentation=https://example.com/docs
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/myapp
ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -TERM $MAINPID
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### [Unit] 部分

```ini
[Unit]
# 服务描述
Description=My Application

# 文档链接
Documentation=https://example.com

# 在指定服务之后启动
After=network.target mysql.service

# 在指定服务之前启动
Before=nginx.service

# 需要的服务（启动失败则本服务也失败）
Requires=mysql.service

# 想要的服务（可选依赖）
Wants=redis.service

# 冲突的服务
Conflicts=other.service
```

### [Service] 部分

```ini
[Service]
# 服务类型
Type=simple       # 默认，主进程就是服务进程
Type=forking      # 主进程 fork 后退出，子进程是服务
Type=oneshot      # 一次性任务
Type=notify       # 服务就绪后发送通知
Type=idle         # 空闲时启动

# 运行用户和组
User=myapp
Group=myapp

# 工作目录
WorkingDirectory=/opt/myapp

# 启动命令
ExecStart=/opt/myapp/bin/start.sh

# 启动前执行
ExecStartPre=/opt/myapp/bin/pre-start.sh

# 启动后执行
ExecStartPost=/opt/myapp/bin/post-start.sh

# 重载配置命令
ExecReload=/bin/kill -HUP $MAINPID

# 停止命令
ExecStop=/opt/myapp/bin/stop.sh

# 环境变量
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/etc/myapp/env

# 重启策略
Restart=no             # 不重启
Restart=always         # 总是重启
Restart=on-success     # 正常退出时重启
Restart=on-failure     # 异常退出时重启
Restart=on-abnormal    # 被信号终止或超时时重启

# 重启间隔
RestartSec=5

# 启动超时
TimeoutStartSec=30

# 停止超时
TimeoutStopSec=30

# PID 文件
PIDFile=/run/myapp.pid

# 资源限制
LimitNOFILE=65535
LimitNPROC=4096
```

### [Install] 部分

```ini
[Install]
# 安装目标
WantedBy=multi-user.target

# 别名
Alias=myapp.service
```

### 示例：Node.js 应用

```ini
# /etc/systemd/system/nodeapp.service
[Unit]
Description=Node.js Application
After=network.target

[Service]
Type=simple
User=nodeapp
WorkingDirectory=/var/www/nodeapp
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=nodeapp
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
```

### 示例：Java 应用

```ini
# /etc/systemd/system/javaapp.service
[Unit]
Description=Java Application
After=network.target

[Service]
Type=simple
User=javaapp
WorkingDirectory=/opt/javaapp
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -jar app.jar
ExecStop=/bin/kill -TERM $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 应用服务文件

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start myapp

# 设置开机启动
sudo systemctl enable myapp

# 查看状态
systemctl status myapp
```

## 日志管理

### journalctl 查看日志

```bash
# 查看所有日志
journalctl

# 查看指定服务日志
journalctl -u nginx

# 实时跟踪日志
journalctl -u nginx -f

# 查看最近日志
journalctl -u nginx -n 50

# 查看今天的日志
journalctl -u nginx --since today

# 查看指定时间范围
journalctl -u nginx --since "2024-01-01" --until "2024-01-02"

# 查看内核日志
journalctl -k

# 查看启动日志
journalctl -b

# 查看上次启动日志
journalctl -b -1

# 按优先级过滤
journalctl -p err        # 错误及以上
journalctl -p warning    # 警告及以上

# 输出为 JSON
journalctl -u nginx -o json-pretty

# 查看日志占用空间
journalctl --disk-usage

# 清理日志
sudo journalctl --vacuum-size=1G
sudo journalctl --vacuum-time=7d
```

## 定时任务（Timer）

systemd Timer 可以替代 cron。

### 创建定时任务

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily Backup Timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Backup Service

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
```

### Timer 配置选项

```ini
[Timer]
# 基于时间
OnCalendar=daily                    # 每天
OnCalendar=weekly                   # 每周
OnCalendar=*-*-* 02:00:00          # 每天 2:00
OnCalendar=Mon *-*-* 10:00:00      # 每周一 10:00
OnCalendar=*-*-01 00:00:00         # 每月 1 号

# 基于事件
OnBootSec=5min                     # 启动后 5 分钟
OnUnitActiveSec=1h                 # 上次激活后 1 小时
OnUnitInactiveSec=30min            # 上次停止后 30 分钟

# 持久化（错过的执行）
Persistent=true

# 随机延迟
RandomizedDelaySec=30min
```

### 管理定时器

```bash
# 启动定时器
sudo systemctl start backup.timer

# 开机启动
sudo systemctl enable backup.timer

# 列出所有定时器
systemctl list-timers

# 查看定时器状态
systemctl status backup.timer
```

## Cron 定时任务

传统的 cron 定时任务仍然广泛使用。

### crontab 命令

```bash
# 编辑当前用户的定时任务
crontab -e

# 列出定时任务
crontab -l

# 删除所有定时任务
crontab -r

# 编辑指定用户的任务
sudo crontab -u username -e
```

### Cron 表达式

```
┌───────────── 分钟 (0-59)
│ ┌───────────── 小时 (0-23)
│ │ ┌───────────── 日 (1-31)
│ │ │ ┌───────────── 月 (1-12)
│ │ │ │ ┌───────────── 星期 (0-7，0和7都是周日)
│ │ │ │ │
* * * * * command

# 示例
0 2 * * * /opt/scripts/backup.sh           # 每天 2:00
*/5 * * * * /opt/scripts/check.sh          # 每 5 分钟
0 9 * * 1-5 /opt/scripts/weekday.sh        # 工作日 9:00
0 0 1 * * /opt/scripts/monthly.sh          # 每月 1 号
@reboot /opt/scripts/startup.sh            # 开机执行
```

### 系统级定时任务

```bash
# 系统级任务目录
/etc/crontab
/etc/cron.d/
/etc/cron.hourly/
/etc/cron.daily/
/etc/cron.weekly/
/etc/cron.monthly/
```

## 常用命令总结

| 命令                      | 功能              |
| :------------------------ | :---------------- |
| systemctl start service   | 启动服务          |
| systemctl stop service    | 停止服务          |
| systemctl restart service | 重启服务          |
| systemctl reload service  | 重载配置          |
| systemctl status service  | 查看状态          |
| systemctl enable service  | 开机启动          |
| systemctl disable service | 取消开机启动      |
| systemctl daemon-reload   | 重载 systemd 配置 |
| journalctl -u service     | 查看服务日志      |
| journalctl -u service -f  | 实时跟踪日志      |

::: tip 最佳实践
1. 使用 systemd 管理长期运行的服务
2. 服务文件中指定运行用户，避免使用 root
3. 配置合适的重启策略
4. 使用 journalctl 查看日志排查问题
5. 定时任务优先使用 systemd timer
:::
