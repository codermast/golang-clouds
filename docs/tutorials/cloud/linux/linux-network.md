---
order: 6
---
# Linux - 网络配置

## 概述

网络配置是 Linux 系统管理的重要内容，包括查看网络信息、配置 IP 地址、管理网络连接、配置防火墙等。

## 查看网络信息

### ip 命令

ip 命令是现代 Linux 推荐的网络配置工具。

```bash
# 查看所有网络接口
ip addr
ip a

# 查看指定接口
ip addr show eth0

# 查看链路层信息
ip link
ip link show eth0

# 查看路由表
ip route
ip r

# 查看 ARP 缓存
ip neigh

# 查看统计信息
ip -s link

# 显示详细信息
ip -d addr
```

### ifconfig（传统）

```bash
# 安装
sudo apt install net-tools

# 查看所有接口
ifconfig

# 查看指定接口
ifconfig eth0

# 简略信息
ifconfig -s
```

### 网络连通性测试

```bash
# ping 测试
ping google.com
ping -c 4 google.com      # 发送 4 个包
ping -i 0.5 google.com    # 0.5 秒间隔

# 路由跟踪
traceroute google.com
tracepath google.com

# DNS 查询
nslookup google.com
dig google.com
host google.com

# 端口连通测试
telnet host 80
nc -zv host 80
nc -zv host 1-1000        # 扫描端口范围
```

### 端口和连接

```bash
# 查看监听端口
ss -tlnp
netstat -tlnp

# 查看所有连接
ss -a
netstat -a

# 按状态过滤
ss -t state established
ss -t state time-wait

# 按端口过滤
ss -tlnp | grep :80
lsof -i :80

# 选项说明
# -t  TCP
# -u  UDP
# -l  监听
# -n  数字格式
# -p  显示进程
# -a  所有
```

### 网络统计

```bash
# 接口统计
ip -s link

# 网络连接统计
ss -s

# 网络流量
iftop
nload
vnstat
```

## 配置 IP 地址

### 临时配置

```bash
# 添加 IP 地址
sudo ip addr add 192.168.1.100/24 dev eth0

# 删除 IP 地址
sudo ip addr del 192.168.1.100/24 dev eth0

# 启用/禁用接口
sudo ip link set eth0 up
sudo ip link set eth0 down

# 设置默认网关
sudo ip route add default via 192.168.1.1

# 添加静态路由
sudo ip route add 10.0.0.0/8 via 192.168.1.1
```

### 永久配置（Netplan - Ubuntu 18.04+）

```yaml
# /etc/netplan/01-network-config.yaml

# DHCP 配置
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: true

# 静态 IP 配置
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
# 应用配置
sudo netplan apply

# 测试配置
sudo netplan try

# 生成配置
sudo netplan generate
```

### 永久配置（NetworkManager）

```bash
# 查看连接
nmcli connection show

# 创建连接（DHCP）
nmcli connection add type ethernet con-name "my-conn" ifname eth0

# 创建连接（静态 IP）
nmcli connection add type ethernet con-name "my-conn" ifname eth0 \
  ip4 192.168.1.100/24 gw4 192.168.1.1

# 修改 DNS
nmcli connection modify "my-conn" ipv4.dns "8.8.8.8 8.8.4.4"

# 启用连接
nmcli connection up "my-conn"

# 禁用连接
nmcli connection down "my-conn"

# 删除连接
nmcli connection delete "my-conn"

# 图形界面
nmtui
```

### 永久配置（传统方式 - RHEL/CentOS）

```bash
# /etc/sysconfig/network-scripts/ifcfg-eth0

TYPE=Ethernet
BOOTPROTO=static
NAME=eth0
DEVICE=eth0
ONBOOT=yes
IPADDR=192.168.1.100
NETMASK=255.255.255.0
GATEWAY=192.168.1.1
DNS1=8.8.8.8
DNS2=8.8.4.4
```

```bash
# 重启网络
sudo systemctl restart network
sudo systemctl restart NetworkManager
```

## DNS 配置

### 临时配置

```bash
# /etc/resolv.conf
nameserver 8.8.8.8
nameserver 8.8.4.4
search example.com
```

### 永久配置

```bash
# 使用 systemd-resolved
# /etc/systemd/resolved.conf
[Resolve]
DNS=8.8.8.8 8.8.4.4
FallbackDNS=1.1.1.1

# 重启服务
sudo systemctl restart systemd-resolved
```

### 本地 DNS 映射

```bash
# /etc/hosts
127.0.0.1       localhost
192.168.1.100   myserver.local myserver
10.0.0.1        db.local
```

## 防火墙配置

### UFW（Ubuntu）

```bash
# 安装
sudo apt install ufw

# 启用/禁用
sudo ufw enable
sudo ufw disable

# 查看状态
sudo ufw status
sudo ufw status verbose

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许端口
sudo ufw allow 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许端口范围
sudo ufw allow 8000:9000/tcp

# 允许服务
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# 允许指定 IP
sudo ufw allow from 192.168.1.100
sudo ufw allow from 192.168.1.0/24 to any port 22

# 拒绝
sudo ufw deny 3306
sudo ufw deny from 192.168.1.100

# 删除规则
sudo ufw delete allow 80
sudo ufw delete 5        # 按编号删除

# 查看规则编号
sudo ufw status numbered

# 重置
sudo ufw reset
```

### firewalld（RHEL/CentOS）

```bash
# 启动/停止
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 查看状态
sudo firewall-cmd --state
sudo firewall-cmd --list-all

# 查看区域
sudo firewall-cmd --get-zones
sudo firewall-cmd --get-default-zone

# 添加服务（临时）
sudo firewall-cmd --add-service=http
sudo firewall-cmd --add-service=https

# 添加服务（永久）
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# 添加端口
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=5000-6000/tcp

# 删除服务/端口
sudo firewall-cmd --permanent --remove-service=http
sudo firewall-cmd --permanent --remove-port=8080/tcp

# 允许指定 IP
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.100" accept'

# 端口转发
sudo firewall-cmd --permanent --add-forward-port=port=80:proto=tcp:toport=8080
```

### iptables

```bash
# 查看规则
sudo iptables -L -n -v
sudo iptables -L -n --line-numbers

# 允许入站
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# 允许已建立的连接
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 允许本地回环
sudo iptables -A INPUT -i lo -j ACCEPT

# 默认策略
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# 删除规则
sudo iptables -D INPUT 3

# 清空规则
sudo iptables -F

# 保存规则
sudo iptables-save > /etc/iptables.rules

# 恢复规则
sudo iptables-restore < /etc/iptables.rules

# 使用 iptables-persistent（Ubuntu）
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

## SSH 配置

### 客户端

```bash
# 基本连接
ssh user@host

# 指定端口
ssh -p 2222 user@host

# 使用密钥
ssh -i ~/.ssh/mykey user@host

# 端口转发
ssh -L 8080:localhost:80 user@host    # 本地转发
ssh -R 8080:localhost:80 user@host    # 远程转发
ssh -D 1080 user@host                  # 动态转发（SOCKS）

# 后台运行
ssh -f -N -L 8080:localhost:80 user@host

# 生成密钥
ssh-keygen -t ed25519 -C "your_email@example.com"
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 复制公钥
ssh-copy-id user@host
```

### 客户端配置

```bash
# ~/.ssh/config
Host myserver
    HostName 192.168.1.100
    User admin
    Port 2222
    IdentityFile ~/.ssh/mykey

Host dev-*
    User developer
    IdentityFile ~/.ssh/dev_key

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### 服务端配置

```bash
# /etc/ssh/sshd_config

# 端口
Port 22

# 禁止 root 登录
PermitRootLogin no

# 禁止密码登录
PasswordAuthentication no

# 只允许密钥登录
PubkeyAuthentication yes

# 允许的用户
AllowUsers user1 user2

# 最大尝试次数
MaxAuthTries 3

# 空闲超时
ClientAliveInterval 300
ClientAliveCountMax 2
```

```bash
# 重启 SSH 服务
sudo systemctl restart sshd
```

## 常用网络命令

| 命令       | 功能         |
| :--------- | :----------- |
| ip addr    | 查看 IP 地址 |
| ip route   | 查看路由表   |
| ss -tlnp   | 查看监听端口 |
| ping       | 测试连通性   |
| traceroute | 路由跟踪     |
| nslookup   | DNS 查询     |
| curl       | HTTP 请求    |
| wget       | 下载文件     |
| nc         | 网络工具     |
| tcpdump    | 抓包         |

## 故障排查

```bash
# 检查接口状态
ip link show

# 检查 IP 配置
ip addr show

# 检查路由
ip route show

# 检查 DNS
cat /etc/resolv.conf
nslookup google.com

# 检查连通性
ping gateway
ping dns-server
ping external-host

# 检查端口
ss -tlnp
telnet host port

# 检查防火墙
sudo ufw status
sudo iptables -L

# 抓包分析
sudo tcpdump -i eth0 port 80
sudo tcpdump -i eth0 -w capture.pcap
```

::: tip 最佳实践
1. 修改网络配置前先备份
2. 远程配置时注意不要断开 SSH
3. 使用密钥认证代替密码
4. 最小化开放端口
5. 定期检查防火墙规则
:::
