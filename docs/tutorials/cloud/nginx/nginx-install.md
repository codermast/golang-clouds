---
order : 1
---
# Nginx - 安装与配置

## 概述

Nginx（发音为 "engine-x"）是一个高性能的 HTTP 和反向代理服务器。它以高并发、低内存消耗著称，被广泛用于 Web 服务器、反向代理、负载均衡等场景。

### Nginx 的特点

| 特点       | 说明                           |
| :--------- | :----------------------------- |
| 高性能     | 事件驱动架构，支持数万并发连接 |
| 低内存消耗 | 相比 Apache，内存占用更少      |
| 热部署     | 支持不停机更新配置和升级       |
| 高可靠性   | 主进程+工作进程架构，稳定性高  |
| 模块化     | 丰富的模块生态，易于扩展       |
| 反向代理   | 原生支持反向代理和负载均衡     |

## 安装 Nginx

### Ubuntu/Debian

```bash
# 更新包索引
sudo apt update

# 安装 Nginx
sudo apt install nginx -y

# 启动 Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### CentOS/RHEL

```bash
# 安装 EPEL 仓库
sudo yum install epel-release -y

# 安装 Nginx
sudo yum install nginx -y

# 启动 Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx
```

### macOS

```bash
# 使用 Homebrew 安装
brew install nginx

# 启动 Nginx
brew services start nginx

# 或者前台运行
nginx
```

### Docker

```bash
# 拉取镜像
docker pull nginx:latest

# 运行容器
docker run -d \
  --name nginx \
  -p 80:80 \
  -v /path/to/html:/usr/share/nginx/html \
  -v /path/to/nginx.conf:/etc/nginx/nginx.conf \
  nginx:latest
```

### 从源码编译

```bash
# 安装依赖
sudo apt install build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev libgeoip-dev -y

# 下载源码
wget http://nginx.org/download/nginx-1.24.0.tar.gz
tar -zxvf nginx-1.24.0.tar.gz
cd nginx-1.24.0

# 配置编译选项
./configure \
  --prefix=/etc/nginx \
  --sbin-path=/usr/sbin/nginx \
  --modules-path=/usr/lib64/nginx/modules \
  --conf-path=/etc/nginx/nginx.conf \
  --error-log-path=/var/log/nginx/error.log \
  --http-log-path=/var/log/nginx/access.log \
  --pid-path=/var/run/nginx.pid \
  --with-http_ssl_module \
  --with-http_v2_module \
  --with-http_realip_module \
  --with-http_gzip_static_module

# 编译安装
make && sudo make install
```

## 目录结构

安装完成后，Nginx 的主要目录结构如下：

```
/etc/nginx/                 # 配置目录
├── nginx.conf              # 主配置文件
├── conf.d/                 # 额外配置目录
│   └── default.conf        # 默认站点配置
├── sites-available/        # 可用站点配置（Ubuntu）
├── sites-enabled/          # 启用的站点配置（Ubuntu）
├── mime.types              # MIME 类型映射
├── fastcgi_params          # FastCGI 参数
├── uwsgi_params            # uWSGI 参数
└── snippets/               # 配置片段

/var/log/nginx/             # 日志目录
├── access.log              # 访问日志
└── error.log               # 错误日志

/usr/share/nginx/html/      # 默认网站根目录
├── index.html              # 默认首页
└── 50x.html                # 错误页面

/var/run/nginx.pid          # 进程 ID 文件
```

## 基本命令

### 服务管理

```bash
# 启动 Nginx
sudo systemctl start nginx
sudo nginx

# 停止 Nginx
sudo systemctl stop nginx
sudo nginx -s stop      # 快速停止
sudo nginx -s quit      # 优雅停止（等待请求处理完成）

# 重启 Nginx
sudo systemctl restart nginx

# 重新加载配置（不中断服务）
sudo systemctl reload nginx
sudo nginx -s reload

# 查看状态
sudo systemctl status nginx
```

### 配置管理

```bash
# 测试配置文件语法
sudo nginx -t

# 测试配置并显示配置内容
sudo nginx -T

# 查看 Nginx 版本
nginx -v

# 查看 Nginx 版本及编译参数
nginx -V

# 指定配置文件启动
sudo nginx -c /path/to/nginx.conf
```

### 进程管理

```bash
# 查看 Nginx 进程
ps aux | grep nginx

# 查看主进程 ID
cat /var/run/nginx.pid

# 发送信号
kill -HUP $(cat /var/run/nginx.pid)   # 重新加载配置
kill -USR1 $(cat /var/run/nginx.pid)  # 重新打开日志文件
kill -USR2 $(cat /var/run/nginx.pid)  # 平滑升级
```

## 配置文件详解

### 主配置文件结构

```nginx
# /etc/nginx/nginx.conf

# 全局块：配置影响 Nginx 全局的指令
user nginx;                          # 运行用户
worker_processes auto;               # 工作进程数
error_log /var/log/nginx/error.log;  # 错误日志
pid /run/nginx.pid;                  # 进程 ID 文件

# 事件块：配置影响 Nginx 服务器与用户的网络连接
events {
    worker_connections 1024;         # 每个进程最大连接数
    use epoll;                       # 使用 epoll 事件模型（Linux）
    multi_accept on;                 # 一次接受多个连接
}

# HTTP 块：配置 HTTP 服务器
http {
    # 基本设置
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    
    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # 包含其他配置文件
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
    
    # Server 块：配置虚拟主机
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Location 块：配置请求路由
        location / {
            try_files $uri $uri/ =404;
        }
        
        # 错误页面
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

### 配置块说明

| 配置块   | 作用范围 | 说明                             |
| :------- | :------- | :------------------------------- |
| main     | 全局     | 配置工作进程、日志、PID 等       |
| events   | 全局     | 配置事件模型和连接处理           |
| http     | HTTP     | 配置 HTTP 服务器通用选项         |
| server   | 虚拟主机 | 配置一个虚拟主机                 |
| location | URL 路径 | 配置特定 URL 的处理方式          |
| upstream | HTTP     | 配置后端服务器组（用于负载均衡） |

### 常用指令

#### 全局指令

```nginx
# 运行用户和用户组
user nginx nginx;

# 工作进程数（通常设为 CPU 核心数）
worker_processes auto;
# 或指定具体数字
worker_processes 4;

# 错误日志
error_log /var/log/nginx/error.log warn;
# 日志级别: debug, info, notice, warn, error, crit, alert, emerg

# 进程 ID 文件
pid /var/run/nginx.pid;

# 工作进程打开的最大文件描述符数
worker_rlimit_nofile 65535;
```

#### events 指令

```nginx
events {
    # 每个工作进程的最大连接数
    worker_connections 10240;
    
    # 事件驱动模型
    use epoll;  # Linux
    # use kqueue;  # FreeBSD/macOS
    
    # 是否一次接受多个连接
    multi_accept on;
    
    # 是否接受互斥锁
    accept_mutex on;
}
```

#### http 指令

```nginx
http {
    # MIME 类型
    include mime.types;
    default_type application/octet-stream;
    
    # 字符集
    charset utf-8;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';
    
    # 访问日志
    access_log /var/log/nginx/access.log main;
    
    # 高效文件传输
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # 连接超时
    keepalive_timeout 65;
    
    # 客户端请求体大小限制
    client_max_body_size 100m;
    
    # 请求头大小
    client_header_buffer_size 4k;
    large_client_header_buffers 4 32k;
}
```

## 验证安装

```bash
# 检查 Nginx 版本
nginx -v

# 检查配置语法
sudo nginx -t

# 查看 Nginx 进程
ps aux | grep nginx

# 访问默认页面
curl http://localhost
```

浏览器访问 `http://your-server-ip`，如果看到 Nginx 欢迎页面，说明安装成功。

## 常见问题

### 1. 端口被占用

```bash
# 查看 80 端口占用
sudo lsof -i:80
sudo netstat -tlnp | grep :80

# 杀掉占用进程
sudo kill -9 <PID>
```

### 2. 权限问题

```bash
# 检查目录权限
ls -la /usr/share/nginx/html

# 修改权限
sudo chown -R nginx:nginx /usr/share/nginx/html
sudo chmod -R 755 /usr/share/nginx/html
```

### 3. 配置语法错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 4. SELinux 问题（CentOS）

```bash
# 临时关闭 SELinux
sudo setenforce 0

# 或者允许 Nginx 网络连接
sudo setsebool -P httpd_can_network_connect 1
```

### 5. 防火墙问题

```bash
# Ubuntu (UFW)
sudo ufw allow 'Nginx Full'
sudo ufw status

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 总结

| 操作     | 命令                      |
| :------- | :------------------------ |
| 安装     | `apt install nginx`       |
| 启动     | `systemctl start nginx`   |
| 停止     | `systemctl stop nginx`    |
| 重启     | `systemctl restart nginx` |
| 重载配置 | `systemctl reload nginx`  |
| 测试配置 | `nginx -t`                |
| 查看版本 | `nginx -v`                |
| 查看进程 | `ps aux \| grep nginx`    |

::: tip 下一步
安装完成后，接下来学习如何配置 Nginx 来托管静态资源。
:::
