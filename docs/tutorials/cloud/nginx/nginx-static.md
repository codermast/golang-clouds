---
order : 2
---
# Nginx - 静态资源服务

## 概述

Nginx 最基础的功能就是作为静态资源服务器，用于托管 HTML、CSS、JavaScript、图片等静态文件。相比其他 Web 服务器，Nginx 在处理静态资源方面具有极高的性能。

## 基本配置

### 最简单的静态网站

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    
    # 网站根目录
    root /var/www/html;
    
    # 默认首页
    index index.html index.htm;
    
    # 处理所有请求
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 配置说明

| 指令        | 说明               |
| :---------- | :----------------- |
| listen      | 监听端口           |
| server_name | 域名               |
| root        | 网站根目录         |
| index       | 默认首页文件       |
| try_files   | 尝试按顺序查找文件 |

## 目录结构

创建一个典型的静态网站目录：

```bash
sudo mkdir -p /var/www/mysite
sudo chown -R $USER:$USER /var/www/mysite
```

```
/var/www/mysite/
├── index.html
├── about.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── images/
│   ├── logo.png
│   └── banner.jpg
└── fonts/
    └── custom.woff2
```

## Location 匹配规则

location 指令用于匹配 URL 路径，支持多种匹配方式：

### 匹配语法

```nginx
# 精确匹配
location = /path {
    # 只匹配 /path
}

# 前缀匹配（优先级高于正则）
location ^~ /images/ {
    # 匹配以 /images/ 开头的 URL
}

# 正则匹配（区分大小写）
location ~ \.php$ {
    # 匹配以 .php 结尾的 URL
}

# 正则匹配（不区分大小写）
location ~* \.(jpg|jpeg|png|gif)$ {
    # 匹配图片文件
}

# 普通前缀匹配
location /api/ {
    # 匹配以 /api/ 开头的 URL
}

# 默认匹配
location / {
    # 匹配所有 URL
}
```

### 匹配优先级

1. `=` 精确匹配（最高优先级）
2. `^~` 前缀匹配
3. `~` / `~*` 正则匹配（按配置顺序）
4. 普通前缀匹配（最长匹配优先）
5. `/` 默认匹配

### 匹配示例

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # 精确匹配首页
    location = / {
        index index.html;
    }
    
    # 静态资源目录
    location ^~ /static/ {
        alias /var/www/static/;
        expires 30d;
    }
    
    # 图片文件
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # CSS 和 JS 文件
    location ~* \.(css|js)$ {
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # 默认处理
    location / {
        try_files $uri $uri/ =404;
    }
}
```

## 常用指令

### root vs alias

```nginx
# root：将 location 路径追加到 root 后
location /images/ {
    root /var/www;
    # 请求 /images/logo.png -> /var/www/images/logo.png
}

# alias：用 alias 路径替换 location 匹配的部分
location /images/ {
    alias /var/www/static/;
    # 请求 /images/logo.png -> /var/www/static/logo.png
}
```

### try_files

```nginx
# 按顺序尝试查找文件
location / {
    try_files $uri $uri/ /index.html;
    # 1. 尝试 $uri 对应的文件
    # 2. 尝试 $uri/ 目录下的默认文件
    # 3. 都不存在则返回 /index.html（适用于 SPA）
}

# 返回 404
location / {
    try_files $uri $uri/ =404;
}

# 转发到后端
location / {
    try_files $uri $uri/ @backend;
}

location @backend {
    proxy_pass http://127.0.0.1:8080;
}
```

### autoindex（目录浏览）

```nginx
location /downloads/ {
    alias /var/www/downloads/;
    autoindex on;                    # 开启目录浏览
    autoindex_exact_size off;        # 显示友好的文件大小
    autoindex_localtime on;          # 使用本地时间
    autoindex_format html;           # 输出格式: html, xml, json, jsonp
}
```

## 缓存配置

### expires 指令

```nginx
# 设置过期时间
location ~* \.(jpg|jpeg|png|gif|ico)$ {
    expires 30d;  # 30 天
}

location ~* \.(css|js)$ {
    expires 7d;   # 7 天
}

location ~* \.(html|htm)$ {
    expires -1;   # 不缓存
    # 或者
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### Cache-Control 头

```nginx
location /static/ {
    # 长期缓存（带版本号的资源）
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location /api/ {
    # 禁止缓存
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
}
```

### ETag 和 Last-Modified

```nginx
# 默认开启
etag on;

# 关闭 ETag
etag off;

# Last-Modified 通常自动设置
```

## Gzip 压缩

### 基本配置

```nginx
http {
    # 开启 Gzip
    gzip on;
    
    # 最小压缩文件大小
    gzip_min_length 1024;
    
    # 压缩级别 (1-9)
    gzip_comp_level 5;
    
    # 需要压缩的 MIME 类型
    gzip_types
        text/plain
        text/css
        text/javascript
        text/xml
        application/json
        application/javascript
        application/xml
        application/xml+rss
        image/svg+xml;
    
    # 为代理请求启用压缩
    gzip_proxied any;
    
    # 添加 Vary 头
    gzip_vary on;
    
    # 禁用 IE6 的 Gzip
    gzip_disable "msie6";
}
```

### 预压缩（gzip_static）

```nginx
# 使用预压缩的 .gz 文件
location /static/ {
    gzip_static on;
    # 如果存在 file.js.gz，则直接返回，无需实时压缩
}
```

预先压缩文件：

```bash
# 压缩所有 JS 和 CSS 文件
find /var/www/static -name "*.js" -exec gzip -9 -k {} \;
find /var/www/static -name "*.css" -exec gzip -9 -k {} \;
```

## 安全配置

### 防止目录遍历

```nginx
# 禁止访问隐藏文件
location ~ /\. {
    deny all;
}

# 禁止访问特定文件
location ~* \.(git|svn|htaccess|env|config)$ {
    deny all;
}
```

### 防盗链

```nginx
location ~* \.(jpg|jpeg|png|gif|webp)$ {
    valid_referers none blocked server_names
                   *.example.com example.com
                   ~\.google\.;
    
    if ($invalid_referer) {
        return 403;
        # 或者返回一张防盗链图片
        # rewrite ^/ /images/forbidden.png break;
    }
}
```

### 限制请求方法

```nginx
location / {
    # 只允许 GET 和 HEAD 请求
    limit_except GET HEAD {
        deny all;
    }
}
```

### 安全响应头

```nginx
# 添加安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 对于静态资源
location /static/ {
    add_header Cross-Origin-Resource-Policy "same-origin";
}
```

## 日志配置

### 访问日志

```nginx
# 自定义日志格式
log_format detailed '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    '$request_time $upstream_response_time';

# 使用日志格式
access_log /var/log/nginx/access.log detailed;

# 按站点分离日志
server {
    server_name example.com;
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
}
```

### 关闭日志

```nginx
# 对静态资源关闭日志
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    access_log off;
}

# 对健康检查关闭日志
location = /health {
    access_log off;
    return 200 "OK";
}
```

## 完整配置示例

### 静态网站配置

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com;
    index index.html;
    
    # 字符集
    charset utf-8;
    
    # 日志
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1024;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
    
    # 静态资源缓存
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
    
    # 主页面
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### SPA 应用配置

```nginx
server {
    listen 80;
    server_name app.example.com;
    root /var/www/spa-app/dist;
    index index.html;
    
    # 所有路由都返回 index.html（前端路由）
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
    }
    
    # 静态资源（带 hash 的文件）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # index.html 不缓存
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

## 常用变量

| 变量              | 说明                 |
| :---------------- | :------------------- |
| $uri              | 当前请求的 URI       |
| $args             | 查询字符串参数       |
| $request_uri      | 完整的原始请求 URI   |
| $document_root    | 当前请求的 root 目录 |
| $document_uri     | 同 $uri              |
| $host             | 请求的主机名         |
| $remote_addr      | 客户端 IP            |
| $request_method   | 请求方法             |
| $request_filename | 请求的文件路径       |

::: tip 总结
1. 使用 `root` 或 `alias` 指定静态文件目录
2. 合理配置 `location` 匹配规则
3. 使用 `expires` 和 `Cache-Control` 优化缓存
4. 开启 `gzip` 压缩减少传输大小
5. 添加安全响应头增强安全性
:::
