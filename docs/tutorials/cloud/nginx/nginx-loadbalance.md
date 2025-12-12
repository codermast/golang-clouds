---
order : 5
---
# Nginx - 负载均衡

## 概述

负载均衡是将请求分发到多个后端服务器的技术，可以提高系统的可用性、扩展性和性能。Nginx 提供了强大的负载均衡功能。

### 负载均衡的优势

| 优势     | 说明                           |
| :------- | :----------------------------- |
| 高可用   | 单点故障时自动切换到其他服务器 |
| 可扩展   | 轻松添加或移除后端服务器       |
| 高性能   | 分散请求压力，提高整体吞吐     |
| 灵活部署 | 支持滚动更新，零停机发布       |

## 基本配置

### upstream 定义

```nginx
# 定义后端服务器组
upstream backend {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### server 参数

```nginx
upstream backend {
    # 权重
    server 192.168.1.101:8080 weight=5;
    server 192.168.1.102:8080 weight=3;
    server 192.168.1.103:8080 weight=2;
    
    # 备份服务器（其他都不可用时启用）
    server 192.168.1.104:8080 backup;
    
    # 标记为不可用
    server 192.168.1.105:8080 down;
    
    # 故障检测
    server 192.168.1.106:8080 max_fails=3 fail_timeout=30s;
    
    # 最大连接数
    server 192.168.1.107:8080 max_conns=100;
}
```

### 参数说明

| 参数         | 说明                     |
| :----------- | :----------------------- |
| weight       | 权重，默认为 1           |
| max_fails    | 最大失败次数，默认为 1   |
| fail_timeout | 失败超时时间，默认为 10s |
| backup       | 备份服务器               |
| down         | 标记为永久不可用         |
| max_conns    | 最大并发连接数（商业版） |

## 负载均衡策略

### 轮询（Round Robin）

默认策略，按顺序将请求分发到各服务器。

```nginx
upstream backend {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}
```

### 加权轮询（Weighted Round Robin）

按权重比例分配请求。

```nginx
upstream backend {
    server 192.168.1.101:8080 weight=5;  # 50% 请求
    server 192.168.1.102:8080 weight=3;  # 30% 请求
    server 192.168.1.103:8080 weight=2;  # 20% 请求
}
```

### IP Hash

同一客户端 IP 始终访问同一服务器，适用于需要会话保持的场景。

```nginx
upstream backend {
    ip_hash;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}
```

::: warning 注意
使用 ip_hash 时，如果需要临时移除某个服务器，使用 `down` 而非直接删除，以保持 hash 一致性。
:::

### 最少连接（Least Connections）

将请求分发到当前连接数最少的服务器。

```nginx
upstream backend {
    least_conn;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}
```

### 加权最少连接

结合权重和连接数。

```nginx
upstream backend {
    least_conn;
    server 192.168.1.101:8080 weight=5;
    server 192.168.1.102:8080 weight=3;
    server 192.168.1.103:8080 weight=2;
}
```

### Hash

基于指定的 key 进行 hash 分配。

```nginx
# 基于 URI 的 hash
upstream backend {
    hash $request_uri consistent;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

# 基于请求参数的 hash
upstream backend {
    hash $arg_user_id consistent;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}
```

`consistent` 参数启用一致性 hash，在添加/移除服务器时减少重新映射。

### Random

随机分配请求。

```nginx
upstream backend {
    random;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

# 结合最少连接
upstream backend {
    random two least_conn;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}
```

## 策略对比

| 策略     | 适用场景           | 优点                 | 缺点                 |
| :------- | :----------------- | :------------------- | :------------------- |
| 轮询     | 服务器性能相近     | 简单均匀             | 不考虑服务器负载     |
| 加权轮询 | 服务器性能不均     | 考虑服务器能力差异   | 不考虑实时负载       |
| IP Hash  | 需要会话保持       | 会话亲和             | 负载可能不均         |
| 最少连接 | 请求处理时间差异大 | 动态均衡负载         | 新服务器可能突增请求 |
| Hash     | 缓存友好场景       | 相同请求到同一服务器 | 配置复杂             |

## 会话保持

### 基于 Cookie

```nginx
upstream backend {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    
    # Nginx Plus 功能
    # sticky cookie srv_id expires=1h domain=.example.com path=/;
}

# 开源版替代方案：使用 ip_hash 或 hash
upstream backend {
    hash $cookie_session_id consistent;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}
```

### 基于请求头

```nginx
upstream backend {
    hash $http_x_session_id consistent;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}
```

## 健康检查

### 被动健康检查

```nginx
upstream backend {
    server 192.168.1.101:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.102:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.103:8080 max_fails=3 fail_timeout=30s;
}

server {
    location / {
        proxy_pass http://backend;
        
        # 触发故障转移的条件
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
}
```

### 主动健康检查（Nginx Plus）

```nginx
# Nginx Plus 功能
upstream backend {
    zone backend_zone 64k;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    
    health_check interval=5s passes=2 fails=3 uri=/health;
}
```

### 开源版替代方案

使用 nginx_upstream_check_module 模块：

```nginx
upstream backend {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    
    check interval=3000 rise=2 fall=5 timeout=1000 type=http;
    check_http_send "HEAD /health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}
```

## 连接池

### keepalive 连接

```nginx
upstream backend {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    
    # 保持的空闲连接数
    keepalive 32;
    
    # 单个连接最大请求数
    keepalive_requests 100;
    
    # 空闲连接超时
    keepalive_timeout 60s;
}

server {
    location / {
        proxy_pass http://backend;
        
        # 必须使用 HTTP/1.1
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

## 完整配置示例

### 多应用负载均衡

```nginx
# 用户服务
upstream user_service {
    least_conn;
    server 192.168.1.101:8001 weight=3;
    server 192.168.1.102:8001 weight=2;
    server 192.168.1.103:8001 backup;
    
    keepalive 16;
}

# 订单服务
upstream order_service {
    ip_hash;
    server 192.168.1.101:8002;
    server 192.168.1.102:8002;
    
    keepalive 16;
}

# 商品服务
upstream product_service {
    hash $request_uri consistent;
    server 192.168.1.101:8003;
    server 192.168.1.102:8003;
    server 192.168.1.103:8003;
    
    keepalive 16;
}

server {
    listen 80;
    server_name api.example.com;
    
    # 通用代理设置
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
    proxy_next_upstream error timeout http_500 http_502 http_503;
    
    location /users/ {
        proxy_pass http://user_service/;
    }
    
    location /orders/ {
        proxy_pass http://order_service/;
    }
    
    location /products/ {
        proxy_pass http://product_service/;
    }
}
```

### 蓝绿部署

```nginx
# 定义环境
upstream blue {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

upstream green {
    server 192.168.1.103:8080;
    server 192.168.1.104:8080;
}

# 使用变量切换
map $cookie_version $backend {
    default "blue";
    "green" "green";
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://$backend;
    }
}
```

### 金丝雀发布

```nginx
upstream stable {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

upstream canary {
    server 192.168.1.103:8080;
}

# 基于权重分流（5% 流量到金丝雀）
split_clients "${remote_addr}" $backend {
    5%     canary;
    *      stable;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://$backend;
    }
}
```

### 灰度发布

```nginx
upstream v1 {
    server 192.168.1.101:8080;
}

upstream v2 {
    server 192.168.1.102:8080;
}

map $http_x_version $backend {
    default "v1";
    "v2"    "v2";
}

# 或者基于用户 ID
map $cookie_user_id $backend {
    default         "v1";
    ~^[0-9]*[0-1]$  "v2";  # 用户 ID 末位是 0 或 1 的用户访问 v2
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://$backend;
    }
}
```

## 监控与调试

### 添加调试信息

```nginx
server {
    location / {
        proxy_pass http://backend;
        
        # 响应头中添加调试信息
        add_header X-Upstream-Addr $upstream_addr always;
        add_header X-Upstream-Status $upstream_status always;
        add_header X-Upstream-Response-Time $upstream_response_time always;
    }
}
```

### 日志格式

```nginx
log_format upstream_log '$remote_addr - [$time_local] '
                        '"$request" $status '
                        'upstream: $upstream_addr '
                        'upstream_status: $upstream_status '
                        'upstream_time: $upstream_response_time';

access_log /var/log/nginx/upstream.log upstream_log;
```

### 状态监控（Nginx Plus）

```nginx
server {
    listen 8080;
    
    location /api {
        api;
    }
    
    location /dashboard.html {
        root /usr/share/nginx/html;
    }
}
```

## 常见问题

### 服务器频繁被标记为不可用

```nginx
upstream backend {
    # 增加容错
    server 192.168.1.101:8080 max_fails=5 fail_timeout=10s;
    server 192.168.1.102:8080 max_fails=5 fail_timeout=10s;
}
```

### 连接耗尽

```nginx
upstream backend {
    server 192.168.1.101:8080;
    
    # 增加连接池大小
    keepalive 64;
    keepalive_requests 1000;
}
```

### 请求排队

```nginx
upstream backend {
    server 192.168.1.101:8080;
    
    # 设置队列（Nginx Plus）
    # queue 100 timeout=70s;
}
```

## 总结

| 策略       | 指令                | 适用场景       |
| :--------- | :------------------ | :------------- |
| 轮询       | (默认)              | 通用场景       |
| 加权轮询   | weight              | 服务器性能不均 |
| IP Hash    | ip_hash             | 会话保持       |
| 最少连接   | least_conn          | 请求时间差异大 |
| 一致性Hash | hash ... consistent | 缓存场景       |

::: tip 最佳实践
1. 生产环境至少配置 2 台后端服务器
2. 合理设置 `max_fails` 和 `fail_timeout`
3. 使用 `keepalive` 减少连接开销
4. 添加调试头便于问题排查
5. 配置健康检查确保高可用
:::
