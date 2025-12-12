---
order: 4
---
# Linux - 软件包管理

## 概述

Linux 使用包管理器来安装、更新和删除软件。不同的发行版使用不同的包管理系统。

| 发行版             | 包格式 | 包管理器    |
| :----------------- | :----- | :---------- |
| Debian/Ubuntu      | .deb   | apt/dpkg    |
| RHEL/CentOS/Fedora | .rpm   | yum/dnf/rpm |
| Arch Linux         | .pkg   | pacman      |

## APT（Debian/Ubuntu）

APT（Advanced Package Tool）是 Debian 系发行版的包管理工具。

### 更新软件源

```bash
# 更新软件包列表
sudo apt update

# 升级所有软件包
sudo apt upgrade

# 更新并升级（推荐）
sudo apt update && sudo apt upgrade -y

# 完全升级（可能删除包）
sudo apt full-upgrade

# 升级发行版
sudo apt dist-upgrade
```

### 安装软件

```bash
# 安装软件包
sudo apt install package-name

# 安装多个软件包
sudo apt install pkg1 pkg2 pkg3

# 安装指定版本
sudo apt install package-name=version

# 安装本地 .deb 文件
sudo apt install ./package.deb
sudo dpkg -i package.deb

# 自动修复依赖
sudo apt install -f

# 安装时不提示确认
sudo apt install -y package-name

# 只下载不安装
sudo apt install -d package-name

# 模拟安装
sudo apt install -s package-name
```

### 删除软件

```bash
# 删除软件包（保留配置）
sudo apt remove package-name

# 删除软件包和配置
sudo apt purge package-name

# 删除不再需要的依赖
sudo apt autoremove

# 清理下载的包文件
sudo apt clean
sudo apt autoclean
```

### 搜索软件

```bash
# 搜索软件包
apt search keyword

# 显示软件包信息
apt show package-name

# 列出已安装的包
apt list --installed

# 列出可升级的包
apt list --upgradable

# 查看包是否已安装
dpkg -l | grep package-name
```

### 软件源配置

```bash
# 软件源配置文件
/etc/apt/sources.list
/etc/apt/sources.list.d/

# 添加 PPA 源
sudo add-apt-repository ppa:user/ppa-name
sudo apt update

# 删除 PPA 源
sudo add-apt-repository --remove ppa:user/ppa-name

# 添加第三方源
sudo sh -c 'echo "deb http://example.com/repo stable main" >> /etc/apt/sources.list.d/example.list'

# 添加 GPG 密钥
wget -qO - https://example.com/key.gpg | sudo apt-key add -
# 或新方式
wget -qO - https://example.com/key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/example.gpg
```

### 国内镜像源

编辑 `/etc/apt/sources.list`：

```bash
# Ubuntu 22.04 阿里云镜像
deb http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse
```

## YUM/DNF（RHEL/CentOS）

YUM（Yellowdog Updater Modified）是 RHEL 系发行版的包管理工具。DNF 是 YUM 的下一代版本。

### 更新软件源

```bash
# 检查更新
yum check-update
dnf check-update

# 更新所有软件包
sudo yum update
sudo dnf upgrade

# 更新指定软件包
sudo yum update package-name
```

### 安装软件

```bash
# 安装软件包
sudo yum install package-name
sudo dnf install package-name

# 安装多个包
sudo yum install pkg1 pkg2 pkg3

# 安装本地 RPM 文件
sudo yum localinstall package.rpm
sudo rpm -ivh package.rpm

# 安装时不提示
sudo yum install -y package-name

# 只下载不安装
sudo yum install --downloadonly --downloaddir=/path package-name

# 安装开发工具组
sudo yum groupinstall "Development Tools"
```

### 删除软件

```bash
# 删除软件包
sudo yum remove package-name
sudo dnf remove package-name

# 删除不再需要的依赖
sudo yum autoremove
sudo dnf autoremove

# 清理缓存
sudo yum clean all
sudo dnf clean all
```

### 搜索软件

```bash
# 搜索软件包
yum search keyword

# 显示软件包信息
yum info package-name

# 列出已安装的包
yum list installed

# 查找提供某个文件的包
yum provides /path/to/file
yum whatprovides "*bin/nginx"

# 列出可用的包
yum list available
```

### 软件源配置

```bash
# 源配置目录
/etc/yum.repos.d/

# 列出所有源
yum repolist
yum repolist all

# 启用/禁用源
sudo yum-config-manager --enable repo-name
sudo yum-config-manager --disable repo-name

# 添加 EPEL 源
sudo yum install epel-release

# 添加源
sudo yum-config-manager --add-repo https://example.com/repo.repo
```

### 国内镜像源

创建 `/etc/yum.repos.d/CentOS-Base.repo`：

```ini
# CentOS 7 阿里云镜像
[base]
name=CentOS-$releasever - Base
baseurl=https://mirrors.aliyun.com/centos/$releasever/os/$basearch/
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/centos/RPM-GPG-KEY-CentOS-7

[updates]
name=CentOS-$releasever - Updates
baseurl=https://mirrors.aliyun.com/centos/$releasever/updates/$basearch/
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/centos/RPM-GPG-KEY-CentOS-7
```

## DPKG（底层工具）

dpkg 是 Debian 包管理的底层工具。

```bash
# 安装 .deb 包
sudo dpkg -i package.deb

# 删除软件包
sudo dpkg -r package-name

# 删除软件包和配置
sudo dpkg -P package-name

# 列出已安装的包
dpkg -l
dpkg -l | grep keyword

# 查看包信息
dpkg -s package-name

# 列出包中的文件
dpkg -L package-name

# 查找文件属于哪个包
dpkg -S /path/to/file

# 解压（不安装）
dpkg -x package.deb /path/to/dir

# 重新配置包
sudo dpkg-reconfigure package-name
```

## RPM（底层工具）

rpm 是 RHEL 系包管理的底层工具。

```bash
# 安装 RPM 包
sudo rpm -ivh package.rpm

# 升级 RPM 包
sudo rpm -Uvh package.rpm

# 删除软件包
sudo rpm -e package-name

# 查询已安装的包
rpm -qa
rpm -qa | grep keyword

# 查看包信息
rpm -qi package-name

# 列出包中的文件
rpm -ql package-name

# 查找文件属于哪个包
rpm -qf /path/to/file

# 验证包签名
rpm -K package.rpm

# 导入 GPG 密钥
sudo rpm --import https://example.com/RPM-GPG-KEY
```

## 编译安装

当软件包不在仓库中时，可能需要从源码编译安装。

### 基本流程

```bash
# 1. 安装编译工具
sudo apt install build-essential    # Debian/Ubuntu
sudo yum groupinstall "Development Tools"  # RHEL/CentOS

# 2. 下载源码
wget https://example.com/software-1.0.tar.gz
tar -xzvf software-1.0.tar.gz
cd software-1.0

# 3. 配置
./configure --prefix=/usr/local

# 4. 编译
make

# 5. 安装
sudo make install

# 6. 添加到 PATH（如需要）
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
```

### 常用配置选项

```bash
# 指定安装目录
./configure --prefix=/opt/software

# 启用/禁用特性
./configure --enable-feature
./configure --disable-feature

# 指定依赖位置
./configure --with-openssl=/usr/local/openssl

# 查看所有选项
./configure --help
```

### checkinstall

使用 checkinstall 可以将编译的软件生成包文件。

```bash
# 安装 checkinstall
sudo apt install checkinstall

# 使用 checkinstall 代替 make install
sudo checkinstall
# 会生成 .deb 文件，方便管理
```

## Snap/Flatpak

### Snap

```bash
# 安装 snap
sudo apt install snapd

# 搜索软件
snap find keyword

# 安装软件
sudo snap install package-name

# 列出已安装
snap list

# 更新软件
sudo snap refresh package-name

# 删除软件
sudo snap remove package-name
```

### Flatpak

```bash
# 安装 flatpak
sudo apt install flatpak

# 添加 Flathub 源
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# 安装软件
flatpak install flathub com.example.App

# 运行软件
flatpak run com.example.App

# 列出已安装
flatpak list

# 删除软件
flatpak uninstall com.example.App
```

## 常用命令对比

| 操作     | APT (Debian/Ubuntu)     | YUM/DNF (RHEL/CentOS)   |
| :------- | :---------------------- | :---------------------- |
| 更新源   | apt update              | yum check-update        |
| 升级     | apt upgrade             | yum update              |
| 安装     | apt install pkg         | yum install pkg         |
| 删除     | apt remove pkg          | yum remove pkg          |
| 搜索     | apt search keyword      | yum search keyword      |
| 信息     | apt show pkg            | yum info pkg            |
| 已安装   | apt list --installed    | yum list installed      |
| 清理     | apt autoremove && clean | yum autoremove && clean |
| 本地安装 | dpkg -i file.deb        | rpm -ivh file.rpm       |

::: tip 最佳实践
1. 定期更新系统：`apt update && apt upgrade`
2. 安装前先搜索确认包名
3. 使用国内镜像源加速下载
4. 编译安装时使用 checkinstall 便于管理
5. 保持系统干净：定期清理不需要的包
:::
