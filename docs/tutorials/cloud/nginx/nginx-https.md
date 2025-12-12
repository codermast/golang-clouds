---
order : 6
---
# Nginx - HTTPS 配置

## 概述

HTTPS（HTTP Secure）通过 SSL/TLS 加密 HTTP 通信，保护数据传输安全。配置 HTTPS 是现代网站的标准要求。

### HTTPS 的优势

| 优势       | 说明                        |
| :--------- | :-------------------------- |
| 数据加密   | 防止数据在传输中被窃听      |
| 身份验证   | 确认服务器身份，防止钓鱼    |
| 数据完整性 | 防止数据在传输中被篡改      |
| SEO 加分   | 搜索引擎对 HTTPS 网站有加分 |
| 浏览器信任 | 避免"不安全"警告            |

## 证书获取

### 自签名证书（测试用）

```bash
# 生成私钥
openssl genrsa -out server.key 2048

# 生成证书签名请求
openssl req -new -key server.key -out server.csr

# 生成自签名证书
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

# 或者一步生成
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/server.key \
  -out /etc/nginx/ssl/server.crt \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Example/CN=example.com"
```

### Let's Encrypt（免费证书）

使用 Certbot 自动获取和续期证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书（自动配置 Nginx）
sudo certbot --nginx -d example.com -d www.example.com

# 仅获取证书（手动配置）
sudo certbot certonly --webroot -w /var/www/html -d example.com

# 测试自动续期
sudo certbot renew --dry-run

# 设置自动续期（通常已自动配置）
sudo systemctl enable certbot.timer
```

证书位置：
```
/etc/letsencrypt/live/example.com/
├── fullchain.pem   # 证书链
├── privkey.pem     # 私钥
├── cert.pem        # 证书
└── chain.pem       # 中间证书
```

### 商业证书

从 CA 机构（如 DigiCert、Comodo）购买后：

```bash
# 合并证书链
cat your_domain.crt intermediate.crt root.crt > fullchain.crt

# 放置到安全位置
sudo mkdir -p /etc/nginx/ssl
sudo cp fullchain.crt /etc/nginx/ssl/
sudo cp your_domain.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

## 基本配置

### 最简 HTTPS 配置

```nginx
server {
    listen 443 ssl;
    server_name example.com;
    
    # SSL 证书
    ssl_certificate /etc/nginx/ssl/fullchain.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

### 完整 HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    # 证书配置
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # SSL 协议和加密套件
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    
    # SSL 会话缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    root /var/www/example.com;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

## SSL/TLS 优化

### 协议版本

```nginx
# 推荐配置：仅支持 TLS 1.2 和 1.3
ssl_protocols TLSv1.2 TLSv1.3;

# 如需兼容旧客户端（不推荐）
# ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
```

### 加密套件

```nginx
# 现代安全配置
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;

# 优先使用服务器的加密套件顺序
ssl_prefer_server_ciphers on;

# DH 参数（增强前向安全性）
ssl_dhparam /etc/nginx/ssl/dhparam.pem;
```

生成 DH 参数：

```bash
# 生成 DH 参数（需要几分钟）
sudo openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
```

### 会话缓存

```nginx
# 共享会话缓存
ssl_session_cache shared:SSL:10m;  # 10MB，约 40000 个会话

# 会话超时
ssl_session_timeout 1d;

# 禁用会话票证（更安全）
ssl_session_tickets off;
```

### OCSP Stapling

OCSP Stapling 让服务器主动提供证书状态，减少客户端查询开销：

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;

# DNS 解析器
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

## HTTP/2 配置

HTTP/2 提供多路复用、头部压缩等优化，显著提升性能：

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    # HTTP/2 特定配置
    http2_max_concurrent_streams 128;
    http2_idle_timeout 3m;
    
    # ...其他配置
}
```

::: tip 注意
HTTP/2 需要 HTTPS，无法在纯 HTTP 上使用。
:::

## 安全头

### HSTS（HTTP 严格传输安全）

```nginx
# 强制浏览器使用 HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

参数说明：
- `max-age`：HSTS 有效期（秒）
- `includeSubDomains`：包含所有子域名
- `preload`：可提交到浏览器预加载列表

### 其他安全头

```nginx
# 防止点击劫持
add_header X-Frame-Options "SAMEORIGIN" always;

# 防止 MIME 类型嗅探
add_header X-Content-Type-Options "nosniff" always;

# XSS 保护
add_header X-XSS-Protection "1; mode=block" always;

# 引用策略
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 内容安全策略
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;

# 权限策略
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## 配置片段复用

创建可复用的 SSL 配置片段：

```nginx
# /etc/nginx/snippets/ssl-params.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

```nginx
# /etc/nginx/snippets/ssl-example.com.conf
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
```

使用片段：

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    include /etc/nginx/snippets/ssl-example.com.conf;
    include /etc/nginx/snippets/ssl-params.conf;
    
    root /var/www/example.com;
    # ...
}
```

## 多域名证书

### 单证书多域名

```nginx
server {
    listen 443 ssl http2;
    server_name example.com www.example.com api.example.com;
    
    # SAN 证书包含所有域名
    ssl_certificate /etc/nginx/ssl/multi-domain.crt;
    ssl_certificate_key /etc/nginx/ssl/multi-domain.key;
    
    # ...
}
```

### 通配符证书

```nginx
server {
    listen 443 ssl http2;
    server_name *.example.com;
    
    # 通配符证书
    ssl_certificate /etc/nginx/ssl/wildcard.crt;
    ssl_certificate_key /etc/nginx/ssl/wildcard.key;
    
    # ...
}
```

### SNI（多证书）

```nginx
# 站点 A
server {
    listen 443 ssl http2;
    server_name a.example.com;
    
    ssl_certificate /etc/nginx/ssl/a.example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/a.example.com.key;
    
    # ...
}

# 站点 B
server {
    listen 443 ssl http2;
    server_name b.example.com;
    
    ssl_certificate /etc/nginx/ssl/b.example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/b.example.com.key;
    
    # ...
}
```

## Let's Encrypt 自动续期

### Webroot 验证

```nginx
server {
    listen 80;
    server_name example.com;
    
    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

### 自动续期脚本

```bash
#!/bin/bash
# /etc/cron.d/certbot-renew

certbot renew --quiet --post-hook "nginx -s reload"
```

### 使用 Docker

```yaml
# docker-compose.yml
version: '3'
services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./html:/usr/share/nginx/html
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: "/bin/sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"
  
  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

## SSL 测试

### 在线测试

- [SSL Labs](https://www.ssllabs.com/ssltest/)：全面的 SSL 安全评估
- [Security Headers](https://securityheaders.com/)：安全头检测

### 命令行测试

```bash
# 测试 SSL 连接
openssl s_client -connect example.com:443 -servername example.com

# 查看证书信息
openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -text

# 检查证书有效期
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates

# 测试特定协议
openssl s_client -connect example.com:443 -tls1_2
openssl s_client -connect example.com:443 -tls1_3
```

## 完整配置示例

```nginx
# HTTP 重定向
server {
    listen 80;
    server_name example.com www.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://example.com$request_uri;
    }
}

# www 重定向
server {
    listen 443 ssl http2;
    server_name www.example.com;
    
    include /etc/nginx/snippets/ssl-example.com.conf;
    include /etc/nginx/snippets/ssl-params.conf;
    
    return 301 https://example.com$request_uri;
}

# 主站
server {
    listen 443 ssl http2;
    server_name example.com;
    
    include /etc/nginx/snippets/ssl-example.com.conf;
    include /etc/nginx/snippets/ssl-params.conf;
    
    root /var/www/example.com;
    index index.html;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 静态资源缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

## 总结

| 配置项        | 推荐值           |
| :------------ | :--------------- |
| SSL 协议      | TLSv1.2 TLSv1.3  |
| 会话缓存      | shared:SSL:10m   |
| 会话超时      | 1d               |
| OCSP Stapling | 开启             |
| HSTS max-age  | 31536000（1 年） |
| HTTP/2        | 推荐开启         |

::: tip 最佳实践
1. 使用 Let's Encrypt 获取免费证书
2. 配置 HTTP 到 HTTPS 的自动重定向
3. 启用 HTTP/2 提升性能
4. 配置 HSTS 增强安全性
5. 定期检查证书有效期
6. 使用 SSL Labs 测试配置
:::
