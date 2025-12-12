---
index: false
icon: simple-icons:nginx
dir:
    order: 4
    link: true
    icon: simple-icons:nginx
---

# Nginx

Nginx 是一个高性能的 HTTP 和反向代理服务器，广泛用于负载均衡、静态资源服务、API 网关等场景。

## 目录

<Catalog hideHeading='false'/>

## 为什么要学 Nginx？

在现代 Web 开发中，Nginx 几乎是必不可少的基础设施组件：

- **高性能**：事件驱动架构，轻松支持数万并发连接
- **低资源消耗**：相比传统 Web 服务器，内存占用更少
- **功能丰富**：静态资源服务、反向代理、负载均衡、HTTPS 等一应俱全
- **热部署**：支持不停机更新配置和升级
- **生态完善**：丰富的模块和广泛的社区支持

无论是小型网站还是大型分布式系统，Nginx 都是不可或缺的组件。

## 学习路线

### 基础篇
1. [安装与配置](./nginx-install.md) - Nginx 安装、目录结构、基本命令
2. [静态资源服务](./nginx-static.md) - 托管静态文件、缓存配置、Gzip 压缩
3. [虚拟主机配置](./nginx-vhost.md) - 多站点托管、域名配置、访问控制

### 进阶篇
4. [反向代理](./nginx-proxy.md) - 代理配置、WebSocket、缓存代理
5. [负载均衡](./nginx-loadbalance.md) - 均衡策略、健康检查、会话保持
6. [HTTPS 配置](./nginx-https.md) - SSL/TLS 配置、Let's Encrypt、安全优化
7. [性能优化](./nginx-optimization.md) - 连接优化、缓存策略、限流防护

## 快速上手

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# macOS
brew install nginx
```

### 常用命令

```bash
# 启动
sudo systemctl start nginx

# 停止
sudo systemctl stop nginx

# 重载配置
sudo nginx -s reload

# 测试配置
sudo nginx -t
```

### 简单配置示例

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

## 适用场景

| 场景       | 说明                           |
| :--------- | :----------------------------- |
| 静态网站   | 高效托管 HTML、CSS、JS、图片等 |
| 反向代理   | 隐藏后端服务，统一入口         |
| 负载均衡   | 分发请求到多个后端服务器       |
| API 网关   | 路由、限流、认证               |
| HTTPS 终端 | SSL/TLS 卸载，简化后端配置     |
| 缓存服务器 | 缓存后端响应，减少压力         |
