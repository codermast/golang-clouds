# 前端环境搭建

## Windows

::: tip 视频教程
https://www.bilibili.com/video/BV1TP411v7v6/?p=5
:::

## MacOs

1. 前端资料下载

::: tip 前端资料
下载地址：https://pan.baidu.com/s/1ga3Cy_CPANj7dTDLFni7mw?pwd=6cyn0
提取码: 6cyn 
:::

点击上面的前端资料下载链接，即可下载。下载之后解压，解压完成以后的文件如下。

![](/assets/project/FrontEnd-Dev-Build/2024-03-03-12-33-06.png)

2. 安装 Nginx 服务

在 MacOs 上安装 Nginx 服务，主要使用 Homebrew 工具进行安装。

- 安装 brew 

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
- 使用 brew 安装 nginx

```sh
brew install nginx
```

3. 配置 Nginx

- 更改 nginx 配置文件

```sh
vim /usr/local/etc/nginx/nginx.conf
```
将其中的内容删除，然后替换为

:::: details 代码详情
```conf
#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;
	
	map $http_upgrade $connection_upgrade{
		default upgrade;
		'' close;
	}

	upstream webservers{
	  server 127.0.0.1:8080 weight=90 ;
	  #server 127.0.0.1:8088 weight=10 ;
	}

    server {
        listen       80;
        server_name  localhost;

        location / {
            root   html/sky;
            index  index.html index.htm;
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # 反向代理,处理管理端发送的请求
        location /api/ {
			proxy_pass   http://localhost:8080/admin/;
            #proxy_pass   http://webservers/admin/;
        }
		
		# 反向代理,处理用户端发送的请求
        location /user/ {
            proxy_pass   http://webservers/user/;
        }
		
		# WebSocket
		location /ws/ {
            proxy_pass   http://webservers/ws/;
			proxy_http_version 1.1;
			proxy_read_timeout 3600s;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection "$connection_upgrade";
        }
    }
}
```
::::

- 将 sky 文件夹移动至 `/usr/local/var/www` 目录下

可以使用如下指令打开对应的文件夹，然后拖动即可。

```sh
open /usr/local/var/www
```

4. 启动 Nginx

```sh
brew services start nginx
```

5. 访问项目

访问 localhost:80 即可，默认为 80 端口，也可以直接访问 localhost

![](/assets/project/readme/2024-03-03-11-41-05.png)