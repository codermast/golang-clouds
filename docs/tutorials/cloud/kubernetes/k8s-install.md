---
order : 2
---
# Kubernetes - 集群安装

## 概述

本文将介绍三种常用的 Kubernetes 集群安装方式：
- **Minikube**：适合本地开发和学习
- **kubeadm**：官方推荐的生产级安装工具
- **Kind**：基于 Docker 的轻量级方案

## 环境准备

### 系统要求

| 要求项 |      最低配置       |   推荐配置    |
| :----: | :-----------------: | :-----------: |
|  CPU   |        2 核         |     4 核      |
|  内存  |        2 GB         |     8 GB      |
|  磁盘  |        20 GB        |     50 GB     |
|  系统  | Linux/macOS/Windows | Ubuntu 20.04+ |

### 前置条件

1. **禁用 Swap**（Linux）

```bash
# 临时禁用
sudo swapoff -a

# 永久禁用（注释 swap 行）
sudo vim /etc/fstab
```

2. **配置内核参数**（Linux）

```bash
# 加载必要的内核模块
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# 设置网络参数
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system
```

## 方式一：Minikube 安装

Minikube 是最简单的本地 Kubernetes 环境，适合学习和开发。

### 安装 Minikube

**macOS**

```bash
# 使用 Homebrew 安装
brew install minikube

# 或者直接下载
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
```

**Linux**

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

**Windows**

```powershell
# 使用 Chocolatey
choco install minikube

# 或者使用 winget
winget install minikube
```

### 启动集群

```bash
# 使用默认驱动启动
minikube start

# 指定驱动和资源
minikube start --driver=docker --cpus=4 --memory=8192

# 指定 Kubernetes 版本
minikube start --kubernetes-version=v1.28.0
```

### 验证安装

```bash
# 查看集群状态
minikube status

# 查看节点
kubectl get nodes

# 打开 Dashboard
minikube dashboard
```

### 常用命令

```bash
# 停止集群
minikube stop

# 删除集群
minikube delete

# SSH 到节点
minikube ssh

# 查看 IP
minikube ip

# 启用插件
minikube addons enable ingress
minikube addons enable metrics-server
```

## 方式二：kubeadm 安装

kubeadm 是 Kubernetes 官方提供的集群引导工具，适合生产环境。

### 安装容器运行时（containerd）

```bash
# 安装 containerd
sudo apt-get update
sudo apt-get install -y containerd

# 创建默认配置
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml

# 修改 cgroup 驱动为 systemd
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

# 重启 containerd
sudo systemctl restart containerd
sudo systemctl enable containerd
```

### 安装 kubeadm、kubelet 和 kubectl

```bash
# 添加 Kubernetes apt 仓库
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl

# 下载签名密钥
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# 添加仓库
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

# 安装组件
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl

# 锁定版本
sudo apt-mark hold kubelet kubeadm kubectl
```

### 初始化 Master 节点

```bash
# 初始化控制平面
sudo kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --apiserver-advertise-address=<master-ip>

# 配置 kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### 安装网络插件（Calico）

```bash
# 安装 Calico
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.0/manifests/calico.yaml

# 或者使用 Flannel
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

### 加入 Worker 节点

在 Master 节点初始化后，会输出加入命令：

```bash
# 在 Worker 节点执行（命令由 kubeadm init 输出）
sudo kubeadm join <master-ip>:6443 --token <token> \
    --discovery-token-ca-cert-hash sha256:<hash>
```

如果忘记了加入命令，可以重新生成：

```bash
# 在 Master 节点重新生成 token
kubeadm token create --print-join-command
```

### 验证集群

```bash
# 查看节点状态
kubectl get nodes

# 查看所有 Pod
kubectl get pods -A

# 查看集群信息
kubectl cluster-info
```

## 方式三：Kind 安装

Kind（Kubernetes in Docker）使用 Docker 容器作为节点，非常适合 CI/CD 和本地测试。

### 安装 Kind

**macOS**

```bash
brew install kind
```

**Linux**

```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

### 创建集群

```bash
# 创建默认集群
kind create cluster

# 创建指定名称的集群
kind create cluster --name my-cluster
```

### 创建多节点集群

创建配置文件 `kind-config.yaml`：

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker
```

```bash
# 使用配置创建集群
kind create cluster --config kind-config.yaml
```

### 常用命令

```bash
# 查看集群列表
kind get clusters

# 删除集群
kind delete cluster --name my-cluster

# 加载本地镜像到集群
kind load docker-image my-image:tag --name my-cluster
```

## 安装 kubectl

kubectl 是 Kubernetes 的命令行工具，所有安装方式都需要它。

### 安装方式

**macOS**

```bash
brew install kubectl
```

**Linux**

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**Windows**

```powershell
choco install kubernetes-cli
```

### 配置自动补全

```bash
# Bash
echo 'source <(kubectl completion bash)' >> ~/.bashrc

# Zsh
echo 'source <(kubectl completion zsh)' >> ~/.zshrc

# 配置别名
echo 'alias k=kubectl' >> ~/.bashrc
echo 'complete -o default -F __start_kubectl k' >> ~/.bashrc
```

## 常见问题

### 1. 节点 NotReady

```bash
# 检查 kubelet 状态
sudo systemctl status kubelet

# 查看日志
sudo journalctl -xeu kubelet

# 常见原因：网络插件未安装
```

### 2. Pod 一直 Pending

```bash
# 查看 Pod 详情
kubectl describe pod <pod-name>

# 常见原因：资源不足、调度约束
```

### 3. 镜像拉取失败

```bash
# 配置镜像加速
# 修改 /etc/containerd/config.toml
[plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
  endpoint = ["https://registry.docker-cn.com"]
```

### 4. API Server 无法访问

```bash
# 检查 API Server 状态
sudo crictl ps | grep kube-apiserver

# 检查证书
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text -noout
```

## 安装方式对比

|    特性    |   Minikube   | kubeadm  |    Kind    |
| :--------: | :----------: | :------: | :--------: |
|  适用场景  | 本地开发学习 | 生产环境 | CI/CD 测试 |
|  安装难度  |     简单     |   中等   |    简单    |
|  资源占用  |     中等     |    高    |     低     |
| 多节点支持 |     有限     |   完整   |    支持    |
|   持久化   |     支持     |   支持   |   不推荐   |
|    网络    |     简化     |   完整   | Docker网络 |

::: tip 推荐
- **初学者**：使用 Minikube，一键启动，自带 Dashboard
- **生产环境**：使用 kubeadm 或托管的 Kubernetes 服务（EKS、GKE、AKS）
- **CI/CD**：使用 Kind，快速创建和销毁
:::
