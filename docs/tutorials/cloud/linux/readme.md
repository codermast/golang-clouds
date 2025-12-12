---
index: false
icon: simple-icons:linux
dir:
    order: 3
    link: true
    icon: simple-icons:linux
---

# Linux 基础

Linux 是服务器端最常用的操作系统，掌握 Linux 是后端开发和运维的必备技能。

## 目录

<Catalog hideHeading='false'/>

## 为什么要学 Linux？

在后端开发和运维领域，Linux 几乎是必备技能：

- **服务器首选**：超过 90% 的服务器运行 Linux 系统
- **开源免费**：没有授权费用，社区活跃
- **稳定可靠**：长时间运行不需重启
- **安全性高**：权限控制严格，漏洞修复及时
- **资源占用少**：无需图形界面，资源利用率高
- **容器化基础**：Docker、Kubernetes 都基于 Linux

## 学习路线

### 基础命令
1. [文件与目录操作](./linux-file-directory.md) - ls、cd、cp、mv、rm、find、grep 等
2. [用户与权限管理](./linux-user-permission.md) - 用户、组、chmod、chown、sudo
3. [进程管理](./linux-process.md) - ps、top、kill、后台进程、优先级

### 系统管理
4. [软件包管理](./linux-package.md) - apt、yum、dpkg、rpm、编译安装
5. [服务管理](./linux-service.md) - systemd、systemctl、定时任务
6. [网络配置](./linux-network.md) - IP 配置、防火墙、SSH

### Shell 脚本
7. [Bash 基础语法](./linux-bash.md) - 变量、条件、循环、函数
8. [常用脚本示例](./linux-scripts.md) - 备份、监控、部署脚本

## 常用命令速查

| 类别     | 命令示例                      |
| :------- | :---------------------------- |
| 文件操作 | `ls`、`cd`、`cp`、`mv`、`rm`  |
| 文件查看 | `cat`、`less`、`head`、`tail` |
| 搜索查找 | `find`、`grep`、`locate`      |
| 权限管理 | `chmod`、`chown`、`sudo`      |
| 进程管理 | `ps`、`top`、`kill`、`htop`   |
| 网络工具 | `ping`、`curl`、`ss`、`ip`    |
| 压缩解压 | `tar`、`gzip`、`zip`、`unzip` |
| 服务管理 | `systemctl`、`journalctl`     |
