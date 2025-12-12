---
order : 4
---
# Nginx - 反向代理

## 概述

反向代理是 Nginx 最常用的功能之一。客户端请求发送到 Nginx，由 Nginx 转发到后端服务器，再将响应返回给客户端。

### 正向代理 vs 反向代理

| 类型     | 代理对象 | 隐藏对象 | 典型场景           |
| :------- | :------- | :------- | :----------------- |
| 正向代理 | 客户端   | 客户端   | VPN、科学上网      |
| 反向代理 | 服务端   | 服务端   | 负载均衡、API 网关 |

```
正向代理：
客户端 → [代理服务器] → 目标服务器
         (知道客户端)    (不知道客户端)

反向代理：
客户端 → [Nginx 反向代理] → 后端服务器
         (不知道后端)       (隐藏在后面)
```

## 基本配置

### 简单反向代理

```nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

### proxy_pass 路径规则

```nginx
# 情况 1：proxy_pass 不带路径
location /api/ {
    proxy_pass http://backend;
    # 请求 /api/users → 转发到 http://backend/api/users
}

# 情况 2：proxy_pass 带路径（末尾无斜杠）
location /api/ {
    proxy_pass http://backend/v1;
    # 请求 /api/users → 转发到 http://backend/v1users（注意没有斜杠）
}

# 情况 3：proxy_pass 带路径（末尾有斜杠）
location /api/ {
    proxy_pass http://backend/v1/;
    # 请求 /api/users → 转发到 http://backend/v1/users
}

# 情况 4：替换路径
location /old-api/ {
    proxy_pass http://backend/new-api/;
    # 请求 /old-api/users → 转发到 http://backend/new-api/users
}
```

::: warning 注意
proxy_pass 末尾是否有斜杠 `/` 会影响路径的拼接方式，需要特别注意。
:::

## 代理头设置

### 常用代理头

```nginx
location / {
    proxy_pass http://backend;
    
    # 传递客户端真实信息
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}
```

### 头部说明

| 头部              | 说明                       |
| :---------------- | :------------------------- |
| Host              | 原始请求的 Host 头         |
| X-Real-IP         | 客户端真实 IP              |
| X-Forwarded-For   | 代理链路中的 IP 列表       |
| X-Forwarded-Proto | 原始请求协议（http/https） |
| X-Forwarded-Host  | 原始请求的主机名           |
| X-Forwarded-Port  | 原始请求端口               |

### 完整代理配置

```nginx
location / {
    proxy_pass http://backend;
    
    # 代理头
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # 缓冲设置
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 24k;
    
    # 错误处理
    proxy_next_upstream error timeout http_500 http_502 http_503;
    proxy_next_upstream_tries 3;
    proxy_next_upstream_timeout 10s;
}
```

## 超时配置

```nginx
# 连接超时（与后端建立连接）
proxy_connect_timeout 60s;

# 发送超时（向后端发送请求）
proxy_send_timeout 60s;

# 读取超时（从后端读取响应）
proxy_read_timeout 60s;

# 对于长连接应用（如 WebSocket）
location /ws/ {
    proxy_pass http://backend;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```

## 缓冲配置

```nginx
# 开启响应缓冲
proxy_buffering on;

# 响应头缓冲区大小
proxy_buffer_size 4k;

# 响应体缓冲区（数量 大小）
proxy_buffers 8 16k;

# 忙碌状态下可用的缓冲区大小
proxy_busy_buffers_size 24k;

# 临时文件大小限制
proxy_max_temp_file_size 1024m;
proxy_temp_file_write_size 16k;

# 关闭缓冲（流式传输场景）
location /stream/ {
    proxy_pass http://backend;
    proxy_buffering off;
}
```

## WebSocket 代理

```nginx
# WebSocket 需要特殊的头部支持
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name example.com;
    
    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        
        # WebSocket 必需的头部
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        
        # 长连接超时
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

## 缓存配置

### 启用代理缓存

```nginx
http {
    # 定义缓存区域
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m 
                     max_size=1g inactive=60m use_temp_path=off;
    
    server {
        listen 80;
        server_name example.com;
        
        location / {
            proxy_pass http://backend;
            
            # 使用缓存
            proxy_cache my_cache;
            proxy_cache_key $scheme$host$request_uri;
            
            # 缓存有效期
            proxy_cache_valid 200 302 10m;
            proxy_cache_valid 404 1m;
            proxy_cache_valid any 5m;
            
            # 添加缓存状态头
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```

### 缓存控制

```nginx
location /api/ {
    proxy_pass http://backend;
    proxy_cache my_cache;
    
    # 绕过缓存条件
    proxy_cache_bypass $http_cache_control $cookie_nocache;
    
    # 不缓存条件
    proxy_no_cache $http_pragma $http_authorization;
    
    # 过期资源的处理
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
    
    # 锁定：防止缓存击穿
    proxy_cache_lock on;
    proxy_cache_lock_timeout 5s;
}

# 不缓存的路径
location /api/user/ {
    proxy_pass http://backend;
    proxy_cache off;
}
```

### 缓存状态

| 状态        | 说明             |
| :---------- | :--------------- |
| MISS        | 缓存未命中       |
| HIT         | 缓存命中         |
| EXPIRED     | 缓存已过期       |
| STALE       | 使用过期缓存     |
| UPDATING    | 正在更新缓存     |
| REVALIDATED | 缓存重新验证成功 |
| BYPASS      | 绕过缓存         |

## 常见代理场景

### 前后端分离

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/frontend/dist;
    
    # 前端静态资源
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 微服务网关

```nginx
server {
    listen 80;
    server_name api.example.com;
    
    # 用户服务
    location /users/ {
        proxy_pass http://user-service:8001/;
    }
    
    # 订单服务
    location /orders/ {
        proxy_pass http://order-service:8002/;
    }
    
    # 商品服务
    location /products/ {
        proxy_pass http://product-service:8003/;
    }
    
    # 通用代理设置
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
}
```

### 跨域代理

```nginx
server {
    listen 80;
    server_name example.com;
    
    location /external-api/ {
        # 代理到外部 API
        proxy_pass https://api.external.com/;
        
        # 添加 CORS 头
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # 处理预检请求
        if ($request_method = OPTIONS) {
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            return 204;
        }
    }
}
```

### 代理 Unix Socket

```nginx
# 代理 PHP-FPM
location ~ \.php$ {
    fastcgi_pass unix:/run/php/php8.1-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}

# 代理 Docker Socket
location /docker/ {
    proxy_pass http://unix:/var/run/docker.sock:/;
    proxy_set_header Host $host;
}

# 代理应用 Socket
location / {
    proxy_pass http://unix:/tmp/app.sock;
    proxy_set_header Host $host;
}
```

## 健康检查

Nginx 开源版不支持主动健康检查，但可以配置被动检查：

```nginx
upstream backend {
    server 127.0.0.1:8001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8002 max_fails=3 fail_timeout=30s;
}

server {
    location / {
        proxy_pass http://backend;
        
        # 失败时尝试下一个服务器
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_next_upstream_tries 2;
    }
}
```

## 调试与排查

### 添加调试头

```nginx
location / {
    proxy_pass http://backend;
    
    # 添加代理信息到响应头
    add_header X-Upstream-Addr $upstream_addr always;
    add_header X-Upstream-Status $upstream_status always;
    add_header X-Upstream-Response-Time $upstream_response_time always;
}
```

### 记录代理日志

```nginx
log_format proxy_log '$remote_addr - $remote_user [$time_local] '
                     '"$request" $status $body_bytes_sent '
                     '"$http_referer" "$http_user_agent" '
                     'upstream: $upstream_addr '
                     'response_time: $upstream_response_time '
                     'status: $upstream_status';

access_log /var/log/nginx/proxy.log proxy_log;
```

### 常见问题

**502 Bad Gateway**
```bash
# 检查后端服务是否运行
curl http://127.0.0.1:8080/health

# 检查 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

**504 Gateway Timeout**
```nginx
# 增加超时时间
proxy_connect_timeout 300s;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

## 总结

| 配置项                | 作用                   |
| :-------------------- | :--------------------- |
| proxy_pass            | 指定后端服务器地址     |
| proxy_set_header      | 设置传递给后端的请求头 |
| proxy_connect_timeout | 连接超时               |
| proxy_read_timeout    | 读取超时               |
| proxy_buffering       | 响应缓冲               |
| proxy_cache           | 响应缓存               |
| proxy_next_upstream   | 故障转移               |

::: tip 最佳实践
1. 始终设置 `Host`、`X-Real-IP`、`X-Forwarded-For` 头
2. 根据业务需求合理设置超时时间
3. 对静态资源启用缓存
4. 配置故障转移提高可用性
5. 记录详细的代理日志便于排查问题
:::
