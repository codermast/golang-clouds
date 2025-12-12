---
order : 7
---
# Nginx - 性能优化

## 概述

Nginx 本身已经是一个高性能的 Web 服务器，但通过合理的配置优化，可以进一步提升性能，充分发挥服务器资源。

### 优化目标

| 目标       | 说明                     |
| :--------- | :----------------------- |
| 高吞吐量   | 处理更多并发请求         |
| 低延迟     | 减少请求响应时间         |
| 低资源消耗 | 减少 CPU、内存、带宽占用 |
| 高可用性   | 稳定运行，快速故障恢复   |

## 工作进程优化

### worker_processes

```nginx
# 自动设置为 CPU 核心数
worker_processes auto;

# 或手动指定
worker_processes 4;
```

### worker_connections

```nginx
events {
    # 每个工作进程的最大连接数
    worker_connections 10240;
    
    # 一次性接受所有新连接
    multi_accept on;
    
    # 使用高效的事件模型
    use epoll;  # Linux
    # use kqueue;  # FreeBSD/macOS
}
```

### 进程资源限制

```nginx
# 每个进程可打开的最大文件描述符数
worker_rlimit_nofile 65535;

# CPU 亲和性（绑定进程到特定 CPU）
worker_cpu_affinity auto;
# 或手动指定
# worker_cpu_affinity 0001 0010 0100 1000;
```

### 系统限制调整

```bash
# 查看当前限制
ulimit -n

# 临时修改
ulimit -n 65535

# 永久修改 /etc/security/limits.conf
nginx soft nofile 65535
nginx hard nofile 65535

# 或 /etc/sysctl.conf
fs.file-max = 65535
net.core.somaxconn = 65535
net.ipv4.tcp_max_tw_buckets = 1440000
```

## 连接优化

### Keepalive

```nginx
http {
    # 客户端连接保持时间
    keepalive_timeout 65;
    
    # 单个连接最大请求数
    keepalive_requests 1000;
    
    # 后端连接池（upstream）
    upstream backend {
        server 127.0.0.1:8080;
        keepalive 32;
        keepalive_requests 100;
        keepalive_timeout 60s;
    }
}
```

### TCP 优化

```nginx
http {
    # 开启 sendfile
    sendfile on;
    
    # 优化发送
    tcp_nopush on;   # 减少网络包数量
    tcp_nodelay on;  # 减少延迟
    
    # 重置超时连接
    reset_timedout_connection on;
}
```

### 超时设置

```nginx
http {
    # 客户端超时
    client_header_timeout 15s;
    client_body_timeout 15s;
    send_timeout 15s;
    
    # 代理超时
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;
}
```

## 缓冲区优化

### 客户端缓冲区

```nginx
http {
    # 请求体缓冲区
    client_body_buffer_size 16k;
    client_max_body_size 100m;
    
    # 请求头缓冲区
    client_header_buffer_size 4k;
    large_client_header_buffers 4 32k;
}
```

### 代理缓冲区

```nginx
http {
    # 代理缓冲
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 24k;
    
    # 临时文件
    proxy_temp_file_write_size 64k;
    proxy_max_temp_file_size 1024m;
}
```

### FastCGI 缓冲区

```nginx
http {
    fastcgi_buffer_size 64k;
    fastcgi_buffers 4 64k;
    fastcgi_busy_buffers_size 128k;
}
```

## Gzip 压缩

### 基础配置

```nginx
http {
    # 开启压缩
    gzip on;
    
    # 最小压缩文件大小
    gzip_min_length 1024;
    
    # 压缩级别 (1-9)，推荐 5-6
    gzip_comp_level 5;
    
    # 压缩类型
    gzip_types
        text/plain
        text/css
        text/javascript
        text/xml
        application/json
        application/javascript
        application/xml
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # 为代理请求启用压缩
    gzip_proxied any;
    
    # 添加 Vary 头
    gzip_vary on;
    
    # 禁用 IE6 压缩
    gzip_disable "msie6";
    
    # 缓冲区
    gzip_buffers 16 8k;
}
```

### 预压缩

```nginx
# 使用预压缩的 .gz 文件
location /static/ {
    gzip_static on;
    expires max;
}
```

预压缩脚本：

```bash
#!/bin/bash
# 压缩静态资源
find /var/www/static -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" \) -exec gzip -9 -k {} \;
```

### Brotli 压缩

Brotli 比 Gzip 压缩率更高，需要额外安装模块：

```nginx
# 需要 ngx_brotli 模块
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
```

## 缓存优化

### 静态资源缓存

```nginx
# 图片
location ~* \.(jpg|jpeg|png|gif|ico|webp|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# CSS/JS（带版本号）
location ~* \.(css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 字体
location ~* \.(woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}

# HTML（不缓存）
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 代理缓存

```nginx
http {
    # 定义缓存区域
    proxy_cache_path /var/cache/nginx 
        levels=1:2 
        keys_zone=my_cache:100m 
        max_size=10g 
        inactive=7d 
        use_temp_path=off;
    
    server {
        location /api/ {
            proxy_pass http://backend;
            proxy_cache my_cache;
            proxy_cache_key "$scheme$host$request_uri";
            
            # 缓存有效期
            proxy_cache_valid 200 302 1h;
            proxy_cache_valid 404 1m;
            
            # 缓存状态头
            add_header X-Cache-Status $upstream_cache_status;
            
            # 使用过期缓存（后端故障时）
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
            
            # 缓存锁（防止惊群）
            proxy_cache_lock on;
            proxy_cache_lock_timeout 5s;
        }
    }
}
```

### Open File Cache

```nginx
http {
    # 文件描述符缓存
    open_file_cache max=10000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

## 日志优化

### 缓冲日志

```nginx
http {
    # 日志缓冲（减少磁盘 IO）
    access_log /var/log/nginx/access.log main buffer=32k flush=5s;
    
    # 关闭不必要的日志
    location /health {
        access_log off;
        return 200 "OK";
    }
    
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        access_log off;
    }
}
```

### 条件日志

```nginx
http {
    # 只记录错误请求
    map $status $loggable {
        ~^[23] 0;
        default 1;
    }
    
    access_log /var/log/nginx/error.log combined if=$loggable;
}
```

## SSL/TLS 优化

### 会话复用

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
```

### OCSP Stapling

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
```

### HTTP/2

```nginx
server {
    listen 443 ssl http2;
    # ...
}
```

## 限流与防护

### 连接限制

```nginx
http {
    # 定义限制区域
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    
    server {
        # 每个 IP 最多 10 个连接
        limit_conn conn_limit 10;
        limit_conn_status 503;
    }
}
```

### 请求频率限制

```nginx
http {
    # 定义限流区域
    limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
    
    server {
        location /api/ {
            # 允许突发 20 个请求，无延迟
            limit_req zone=req_limit burst=20 nodelay;
            limit_req_status 429;
        }
    }
}
```

### 带宽限制

```nginx
location /downloads/ {
    # 限制下载速度
    limit_rate 500k;
    
    # 前 10MB 不限速
    limit_rate_after 10m;
}
```

## 完整优化配置

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 10240;
    multi_accept on;
    use epoll;
}

http {
    # 基本设置
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    charset utf-8;
    
    # 日志
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    '$request_time $upstream_response_time';
    access_log /var/log/nginx/access.log main buffer=32k flush=5s;
    
    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # 连接
    keepalive_timeout 65;
    keepalive_requests 1000;
    reset_timedout_connection on;
    
    # 超时
    client_header_timeout 15s;
    client_body_timeout 15s;
    send_timeout 15s;
    
    # 缓冲区
    client_body_buffer_size 16k;
    client_max_body_size 100m;
    client_header_buffer_size 4k;
    large_client_header_buffers 4 32k;
    
    # Gzip
    gzip on;
    gzip_min_length 1024;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript 
               text/xml application/xml application/xml+rss image/svg+xml;
    gzip_vary on;
    gzip_proxied any;
    
    # 文件缓存
    open_file_cache max=10000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # 限流
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
    
    # 代理缓存
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cache:100m 
                     max_size=10g inactive=7d use_temp_path=off;
    
    # 代理设置
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 16k;
    
    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

## 性能测试

### 使用 wrk

```bash
# 安装
sudo apt install wrk

# 基本测试
wrk -t12 -c400 -d30s http://example.com/

# 带脚本测试
wrk -t12 -c400 -d30s -s post.lua http://example.com/api/
```

### 使用 ab

```bash
# 10000 次请求，100 并发
ab -n 10000 -c 100 http://example.com/

# 带 POST 数据
ab -n 1000 -c 50 -p data.json -T application/json http://example.com/api/
```

### 监控指标

```bash
# 查看 Nginx 状态
curl http://localhost/nginx_status

# 查看连接数
ss -s
netstat -an | grep :80 | wc -l

# 查看进程资源
top -p $(pgrep -d',' nginx)
```

## 优化检查清单

| 类别 | 配置项                 | 推荐值                 |
| :--- | :--------------------- | :--------------------- |
| 进程 | worker_processes       | auto                   |
| 进程 | worker_connections     | 10240+                 |
| 连接 | keepalive_timeout      | 65                     |
| 连接 | sendfile               | on                     |
| 连接 | tcp_nopush/tcp_nodelay | on                     |
| 压缩 | gzip                   | on                     |
| 压缩 | gzip_comp_level        | 5-6                    |
| 缓存 | open_file_cache        | max=10000 inactive=20s |
| 缓存 | proxy_cache            | 根据需求配置           |
| 日志 | access_log buffer      | 32k+                   |
| 安全 | limit_conn/limit_req   | 根据业务配置           |

::: tip 总结
1. 根据服务器硬件调整 worker 配置
2. 开启 sendfile、tcp_nopush、tcp_nodelay
3. 合理配置 Gzip 压缩
4. 使用缓存减少后端压力
5. 配置限流防止过载
6. 使用压测工具验证优化效果
:::
