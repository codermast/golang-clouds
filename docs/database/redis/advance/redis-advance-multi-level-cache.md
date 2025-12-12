---
order : 19
---
# Redis进阶 - 多级缓存

## 安装OpenResty

在正式安装 OpenResty 之前，我们需要了解它是干什么的。

OpenResty® 是一个基于 Nginx 与 Lua 的高性能 Web 平台，其内部集成了大量精良的 Lua 库、第三方模块以及大多数的依赖项。用于方便地搭建能够处理超高并发、扩展性极高的动态 Web 应用、Web 服务和动态网关。

OpenResty® 通过汇聚各种设计精良的 Nginx 模块（主要由 OpenResty 团队自主开发），从而将 Nginx 有效地变成一个强大的通用 Web 应用平台。这样，Web 开发人员和系统工程师可以使用 Lua 脚本语言调动 Nginx 支持的各种 C 以及 Lua 模块，快速构造出足以胜任 10K 乃至 1000K 以上单机并发连接的高性能 Web 应用系统。

OpenResty® 的目标是让你的Web服务直接跑在 Nginx 服务内部，充分利用 Nginx 的非阻塞 I/O 模型，不仅仅对 HTTP 客户端请求,甚至于对远程后端诸如 MySQL、PostgreSQL、Memcached 以及 Redis 等都进行一致的高性能响应。

OpenResty官网：https://openresty.org/cn/

### 1.安装

首先你的Linux虚拟机必须联网

1. **安装开发库**

首先要安装OpenResty的依赖开发库，执行命令：

```sh
yum install -y pcre-devel openssl-devel gcc --skip-broken
```



2. **安装OpenResty仓库**

你可以在你的 CentOS 系统中添加 `openresty` 仓库，这样就可以便于未来安装或更新我们的软件包（通过 `yum check-update` 命令）。运行下面的命令就可以添加我们的仓库：

```sh
yum-config-manager --add-repo https://openresty.org/package/centos/openresty.repo
```



如果提示说命令不存在，则运行：

```sh
yum install -y yum-utils 
```

然后再重复上面的命令



3. **安装OpenResty**

然后就可以像下面这样安装软件包，比如 `openresty`：

```sh
yum install -y openresty
```



4. **安装opm工具**

opm是OpenResty的一个管理工具，可以帮助我们安装一个第三方的Lua模块。

如果你想安装命令行工具 `opm`，那么可以像下面这样安装 `openresty-opm` 包：

```bash
yum install -y openresty-opm
```



5. **目录结构**

默认情况下，OpenResty安装的目录是：/usr/local/openresty

![](/assets/database/redis/redis-advance-multi-level-cache/2023-08-27-09-32-10.png)

看到里面的nginx目录了吗，OpenResty就是在Nginx基础上集成了一些Lua模块。


6. **配置nginx的环境变量**

打开配置文件：

```sh
vi /etc/profile
```

在最下面加入两行：

```sh
export NGINX_HOME=/usr/local/openresty/nginx
export PATH=${NGINX_HOME}/sbin:$PATH
```

NGINX_HOME：后面是OpenResty安装目录下的nginx的目录

然后让配置生效：

```sh
source /etc/profile
```



### 2.启动和运行

OpenResty底层是基于Nginx的，查看OpenResty目录的nginx目录，结构与windows中安装的nginx基本一致：

![](/assets/database/redis/redis-advance-multi-level-cache/2023-08-27-09-36-04.png)

所以运行方式与nginx基本一致：

```sh
# 启动nginx
nginx
# 重新加载配置
nginx -s reload
# 停止
nginx -s stop
```

nginx的默认配置文件注释太多，影响后续我们的编辑，这里将nginx.conf中的注释部分删除，保留有效部分。

修改`/usr/local/openresty/nginx/conf/nginx.conf`文件，内容如下：

```nginx
#user  nobody;
worker_processes  1;
error_log  logs/error.log;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       8081;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```



在Linux的控制台输入命令以启动nginx：

```sh
nginx
```

然后访问页面：http://192.168.150.101:8081，注意ip地址替换为你自己的虚拟机IP：

### 3.备注

- **加载OpenResty的lua模块**

```nginx
#lua 模块
lua_package_path "/usr/local/openresty/lualib/?.lua;;";
#c模块     
lua_package_cpath "/usr/local/openresty/lualib/?.so;;";  
```

- **common.lua**

```lua
-- 封装函数，发送http请求，并解析响应
local function read_http(path, params)
    local resp = ngx.location.capture(path,{
        method = ngx.HTTP_GET,
        args = params,
    })
    if not resp then
        -- 记录错误信息，返回404
        ngx.log(ngx.ERR, "http not found, path: ", path , ", args: ", args)
        ngx.exit(404)
    end
    return resp.body
end
-- 将方法导出
local _M = {  
    read_http = read_http
}  
return _M
```



- **释放Redis连接API：**

```lua
-- 关闭redis连接的工具方法，其实是放入连接池
local function close_redis(red)
    local pool_max_idle_time = 10000 -- 连接的空闲时间，单位是毫秒
    local pool_size = 100 --连接池大小
    local ok, err = red:set_keepalive(pool_max_idle_time, pool_size)
    if not ok then
        ngx.log(ngx.ERR, "放入redis连接池失败: ", err)
    end
end
```

- **读取Redis数据的API：**

```lua
-- 查询redis的方法 ip和port是redis地址，key是查询的key
local function read_redis(ip, port, key)
    -- 获取一个连接
    local ok, err = red:connect(ip, port)
    if not ok then
        ngx.log(ngx.ERR, "连接redis失败 : ", err)
        return nil
    end
    -- 查询redis
    local resp, err = red:get(key)
    -- 查询失败处理
    if not resp then
        ngx.log(ngx.ERR, "查询Redis失败: ", err, ", key = " , key)
    end
    --得到的数据为空处理
    if resp == ngx.null then
        resp = nil
        ngx.log(ngx.ERR, "查询Redis数据为空, key = ", key)
    end
    close_redis(red)
    return resp
end
```



- **开启共享词典：**

```nginx
# 共享字典，也就是本地缓存，名称叫做：item_cache，大小150m
lua_shared_dict item_cache 150m; 
```


## OpenResty快速入门

> 这里我们使用 nginx 拦截 http 请求，处理后返回数据。

### 步骤1 修改nginx.conf文件

1. 在 nginx.conf 的 http 下面，添加对 OpenResty 的 Lua 模块支持
```nginx
# 加载 lua 模块
lua_package_path "/usr/local/openresty/lualib/?.lua;;";
# 加载 c 模块
lua_package_cpath "/usr/local/openresty/lualib/?.so;;";
```

2. 在 nginx.conf 的 serevr 下面，添加对 /api/item 这个路径的监听：

```nginx
location /api/item {
    # 响应类型，这里返回 json
    default_type application/json

    # 响应数据由 lua/item.lua 这个文件来决定
    content_by_lua_file lua/item.lua;
}
```

### 步骤2 编写item.lua文件

1. 在 nginx 目录创建文件夹：lua

```sh
mkdir lua
```
2. 在 lua 文件夹下，新建文件：item.lua
```sh
touch lua/item.lua
```
3. 内容如下
```lua
-- 返回假数据，这里的 ngx.say() 函数，就是写数据到 Response 中
ngx.say('{"id": 10001, "name" : "Coder Mast"}');
```
4. 重新加载配置
```sh
nginx -s reload
```

## OpenResty获取请求参数

OpenResty 提供了各种 API 用来获取不同类型的请求参数：

|参数格式|参数示例|参数解析代码示例|
|:---:|:---:|:---:|
|路径占位符|/item/1001|![](/assets/database/redis/redis-advance-multi-level-cache/2023-08-27-11-37-02.png)|
|请求头|id:1001|
|Get请求参数|?id=1001|
|Post表单参数|id=1001|
|Json参数|\{"id":1001\}|

::: details 代码详情

```nginx
- 路径占位符
# 1. 正则表达式匹配：
location ~ /item/(\d+) {
    content_by_lua_file lua/item.lua;
}
```
```lua
-- 2. 匹配到的参数会存入 ngx.var 数组中，可以使用角标获取
lcoal id = ngx.var[1]
```
- 请求头

- Get请求参数

- Post表单参数

- Json参数
:::
## 封装Http请求工具

## 向Tomcat发送http请求

## 根据商品id对Tomcat集群负载均衡

## Redis缓存预热

## 查询Redis

## Nginx本地缓存