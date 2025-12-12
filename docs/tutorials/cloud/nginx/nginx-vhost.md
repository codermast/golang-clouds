---
order : 3
---
# Nginx - 虚拟主机配置

## 概述

虚拟主机（Virtual Host）允许在一台服务器上运行多个网站。Nginx 支持三种类型的虚拟主机：

| 类型     | 说明                 | 示例             |
| :------- | :------------------- | :--------------- |
| 基于域名 | 通过不同域名区分     | a.com、b.com     |
| 基于端口 | 通过不同端口区分     | :80、:8080       |
| 基于 IP  | 通过不同 IP 地址区分 | 192.168.1.1、1.2 |

## 基于域名的虚拟主机

这是最常用的虚拟主机类型。

### 配置示例

```nginx
# 站点 A - example.com
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com;
    index index.html;
    
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

# 站点 B - blog.example.com
server {
    listen 80;
    server_name blog.example.com;
    root /var/www/blog;
    index index.html;
    
    access_log /var/log/nginx/blog.access.log;
    error_log /var/log/nginx/blog.error.log;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

# 站点 C - api.example.com
server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

### server_name 匹配规则

```nginx
# 精确匹配
server_name example.com www.example.com;

# 通配符（前缀）
server_name *.example.com;

# 通配符（后缀）
server_name www.*;

# 正则表达式
server_name ~^www\d+\.example\.com$;

# 捕获组（可在后续使用）
server_name ~^(?<subdomain>.+)\.example\.com$;
```

### 匹配优先级

1. 精确匹配：`example.com`
2. 以 `*` 开头的最长通配符：`*.example.com`
3. 以 `*` 结尾的最长通配符：`mail.*`
4. 按配置顺序匹配的正则表达式

### 默认服务器

```nginx
# 使用 default_server 标记默认服务器
server {
    listen 80 default_server;
    server_name _;  # 通配所有
    
    # 处理无法匹配的请求
    return 444;  # 关闭连接
    # 或者重定向
    # return 301 https://example.com$request_uri;
}
```

## 基于端口的虚拟主机

在同一 IP 上使用不同端口区分服务。

```nginx
# 端口 80 - 主站
server {
    listen 80;
    server_name example.com;
    root /var/www/main;
}

# 端口 8080 - 测试站
server {
    listen 8080;
    server_name example.com;
    root /var/www/test;
}

# 端口 8081 - 管理后台
server {
    listen 8081;
    server_name example.com;
    root /var/www/admin;
    
    # 限制访问 IP
    allow 192.168.1.0/24;
    deny all;
}
```

## 基于 IP 的虚拟主机

服务器有多个 IP 地址时使用。

```nginx
# IP 192.168.1.100
server {
    listen 192.168.1.100:80;
    server_name site-a.com;
    root /var/www/site-a;
}

# IP 192.168.1.101
server {
    listen 192.168.1.101:80;
    server_name site-b.com;
    root /var/www/site-b;
}
```

## 配置文件组织

### 推荐目录结构

```
/etc/nginx/
├── nginx.conf              # 主配置文件
├── conf.d/                 # 通用配置
│   ├── gzip.conf
│   └── security.conf
├── sites-available/        # 所有站点配置
│   ├── example.com.conf
│   ├── blog.conf
│   └── api.conf
└── sites-enabled/          # 启用的站点（符号链接）
    ├── example.com.conf -> ../sites-available/example.com.conf
    └── blog.conf -> ../sites-available/blog.conf
```

### 主配置文件

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    keepalive_timeout 65;
    
    # 包含通用配置
    include /etc/nginx/conf.d/*.conf;
    
    # 包含站点配置
    include /etc/nginx/sites-enabled/*;
}
```

### 站点配置文件

```nginx
# /etc/nginx/sites-available/example.com.conf
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com/public;
    index index.html;
    
    # 包含通用配置片段
    include /etc/nginx/snippets/ssl-params.conf;
    include /etc/nginx/snippets/security-headers.conf;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 管理站点

```bash
# 创建站点配置
sudo vim /etc/nginx/sites-available/newsite.conf

# 启用站点
sudo ln -s /etc/nginx/sites-available/newsite.conf /etc/nginx/sites-enabled/

# 禁用站点
sudo rm /etc/nginx/sites-enabled/newsite.conf

# 测试配置
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

## 通用配置片段

### SSL 参数

```nginx
# /etc/nginx/snippets/ssl-params.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
```

### 安全头

```nginx
# /etc/nginx/snippets/security-headers.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 静态资源缓存

```nginx
# /etc/nginx/snippets/static-cache.conf
location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;
}

location ~* \.(css|js)$ {
    expires 7d;
    add_header Cache-Control "public";
}

location ~* \.(woff|woff2|ttf|eot)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

## 实用配置示例

### 多站点配置

```nginx
# 主站 - example.com
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com;
    
    include /etc/nginx/snippets/static-cache.conf;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

# 博客 - blog.example.com
server {
    listen 80;
    server_name blog.example.com;
    root /var/www/blog;
    
    location / {
        try_files $uri $uri/ /index.php?$args;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}

# API - api.example.com
server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 静态资源 CDN - static.example.com
server {
    listen 80;
    server_name static.example.com;
    root /var/www/static;
    
    # 开启目录浏览
    autoindex on;
    
    # 长期缓存
    expires 1y;
    add_header Cache-Control "public, immutable";
    
    # CORS
    add_header Access-Control-Allow-Origin "*";
}
```

### www 重定向

```nginx
# 将 www 重定向到非 www
server {
    listen 80;
    server_name www.example.com;
    return 301 http://example.com$request_uri;
}

server {
    listen 80;
    server_name example.com;
    root /var/www/example.com;
    # ...
}
```

```nginx
# 将非 www 重定向到 www
server {
    listen 80;
    server_name example.com;
    return 301 http://www.example.com$request_uri;
}

server {
    listen 80;
    server_name www.example.com;
    root /var/www/example.com;
    # ...
}
```

### 维护模式

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/example.com;
    
    # 检查维护模式文件
    if (-f /var/www/example.com/maintenance.html) {
        return 503;
    }
    
    error_page 503 @maintenance;
    
    location @maintenance {
        rewrite ^(.*)$ /maintenance.html break;
    }
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 多语言站点

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/example.com;
    
    # 根据语言重定向
    location = / {
        set $lang en;
        if ($http_accept_language ~* "^zh") {
            set $lang zh;
        }
        if ($http_accept_language ~* "^ja") {
            set $lang ja;
        }
        rewrite ^ /$lang/ redirect;
    }
    
    location /en/ {
        alias /var/www/example.com/en/;
        try_files $uri $uri/ /en/index.html;
    }
    
    location /zh/ {
        alias /var/www/example.com/zh/;
        try_files $uri $uri/ /zh/index.html;
    }
}
```

## 访问控制

### IP 白名单

```nginx
server {
    listen 80;
    server_name admin.example.com;
    
    # 只允许特定 IP 访问
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
    
    location / {
        # ...
    }
}
```

### 基本认证

```bash
# 创建密码文件
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

```nginx
server {
    listen 80;
    server_name admin.example.com;
    
    auth_basic "Restricted Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        # ...
    }
}
```

### 结合使用

```nginx
location /admin/ {
    # 满足任一条件即可访问
    satisfy any;
    
    # 内网 IP 直接放行
    allow 192.168.1.0/24;
    deny all;
    
    # 其他需要认证
    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

## 调试技巧

### 测试 server_name 匹配

```bash
# 查看请求会匹配到哪个 server
curl -H "Host: example.com" http://localhost/

# 查看响应头
curl -I -H "Host: blog.example.com" http://localhost/
```

### 添加调试头

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 添加调试信息到响应头
    add_header X-Server-Name $server_name;
    add_header X-Request-URI $request_uri;
    add_header X-Document-Root $document_root;
    
    # ...
}
```

### 查看配置

```bash
# 测试配置语法
sudo nginx -t

# 显示完整配置
sudo nginx -T

# 查看当前配置文件
sudo nginx -V 2>&1 | grep -o '\-\-conf-path=[^ ]*'
```

## 总结

| 虚拟主机类型 | 区分方式       | 适用场景     |
| :----------- | :------------- | :----------- |
| 基于域名     | server_name    | 多个独立网站 |
| 基于端口     | listen         | 同域名多服务 |
| 基于 IP      | listen IP:端口 | 多 IP 服务器 |

::: tip 最佳实践
1. 每个站点使用独立的配置文件
2. 使用 sites-available/sites-enabled 结构管理
3. 抽取通用配置到 snippets 目录
4. 为每个站点配置独立的日志
5. 设置 default_server 处理未知请求
:::
