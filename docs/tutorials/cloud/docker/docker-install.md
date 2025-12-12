---
order : 2
---
# Docker - 安装

## MacOS安装

**1.使用 Homebrew 安装**

```sh
brew install docker
```

![安装成功](/assets/cloud/docker/docker-install/2024-01-09-11-02-32.png)

如果你的电脑没有安装Docker，则会自动进行安装。

![已经安装](/assets/cloud/docker/docker-install/2024-01-09-11-00-51.png)

如果你的电脑已经安装了Docker，就显示已经安装。

::: tip
由于涉及到应用的安装，系统会进行拦截，在这期间可能会需要输入电脑的密码，输入即可。
:::

**2.手动下载安装**

手动下载的是 Docker 的桌面管理程序，安装打开后会自动检测系统当前的 Docker 环境。

下载地址：https://docs.docker.com/desktop/install/mac-install/

![](/assets/cloud/docker/docker-install/2024-01-09-10-58-05.png)

Docker官方提供了Intel、Apple芯片两种，选择自己电脑的版本下载即可。

> - M系列芯片，就选择Apple芯片。如：M1、M2、M3系列
> - Intel 系列芯片，就选择 Intel 芯片。如：i5、i3、i7系列

下载好的文件为 Docker.dmg，双击打开即可。

![下载好的文件](/assets/cloud/docker/docker-install/2024-01-09-11-05-24.png)

![双击安装](/assets/cloud/docker/docker-install/2024-01-09-11-05-58.png)

将 Docker 图标拖动至 Applications 文件夹，或者双击 Docker 图标即可进行安装。

## Windows安装

Docker 并不是一个通用的容器工具，它依赖于已存在并运行的 Linux 内核环境。

Docker 实质上是在已经运行的 Linux 下制造了一个隔离的文件环境，因此它执行的效率几乎等同于所部署的 Linux 主机。

因此，Docker 必须部署在 Linux 内核的系统上。如果其他系统想部署 Docker 就必须安装一个虚拟 Linux 环境。

::: note 
博客园上这篇安装教程写的比较详细，Windows安装遇到问题的朋友可以参考一下。
https://www.cnblogs.com/Can-daydayup/p/15468591.html
:::

下面的下载是 Docker 桌面管理程序的下载地址：

- 官网下载：https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

官网下载速度可能会比较慢，这里提供一个国内的下载镜像，速度会比较快。

- 国内镜像：https://smartidedl.blob.core.chinacloudapi.cn/docker/20210926/Docker-win.exe


::: warning
博主目前只有一台 MacOS 的电脑，无法制作更详细的 Windows 平台下的安装教程，后续会更新。
:::
## Linux安装

```sh
curl -fsSL https://test.docker.com -o test-docker.sh
sudo sh test-docker.sh
```

直接使用 Docker 官方提供的安装脚本安装即可。

## Docker官方安装教程

- Docker Desktop For Windows ：https://docs.docker.com/desktop/install/windows-install/
- Docker Desktop For MacOS：https://docs.docker.com/desktop/install/mac-install/
- Docker Desktop For Linux：https://docs.docker.com/desktop/install/linux-install/
