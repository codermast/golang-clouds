---
order : 8
---

# Docker - 仓库管理

仓库是集中存放资源的地方，代码仓库是存放代码的，那么Docker 中的仓库就是存放 Docker 镜像的。

和 GitHub 类似，Docker Hub 是 Docker 官方维护的一个免费的公共仓库，不但可以下载需要的镜像，而且还可以上传自己的镜像。

::: tip 提示
本文主要以 Docker Hub 为例子进行说明，其他仓库同理。
:::

## 登录和退出

在需要使用 Docker Hub 中管理自己的镜像时，需要先进行登录。

- 登录

```sh
docker login 
```

- 退出登录

```sh
docker logout
```

## 推送镜像

用户登录后，可以通过 docker push 命令将自己的镜像推送到 Docker Hub。

```sh
docker tag ubuntu:20.04 codermast/ubuntu:20.04
docker push codermast/ubuntu:20.04
```

codermast 改为你的 username 便于管理