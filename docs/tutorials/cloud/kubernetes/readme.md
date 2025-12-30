---
index: false
icon: simple-icons:kubernetes
dir:
    order: 2
    link: true
    icon: simple-icons:kubernetes
---

# Kubernetes

Kubernetes（K8s）是一个开源的容器编排平台，用于自动化部署、扩展和管理容器化应用。

## 目录

<Catalog hideHeading='false'/>

## 为什么要学 Kubernetes？

在容器化时代，Docker 解决了应用打包和运行的问题，但在生产环境中，我们还需要解决：

- **服务扩缩容**：如何根据负载自动扩展或缩减服务实例？
- **服务发现与负载均衡**：如何让服务互相发现并均衡负载？
- **滚动更新与回滚**：如何实现零停机更新？
- **自我修复**：服务挂了怎么自动恢复？
- **配置管理**：如何统一管理配置和密钥？

Kubernetes 完美地解决了这些问题，是云原生时代必备的技能。

## 学习路线

### 基础篇
1. [K8s 简介与架构](./k8s-introduction.md) - 了解 Kubernetes 的核心概念和整体架构
2. [集群安装](./k8s-install.md) - 学习使用 Minikube、kubeadm 等工具安装集群
3. [kubectl 命令行工具](./k8s-kubectl.md) - 掌握 Kubernetes 的命令行操作

### 核心概念
4. [工作负载资源](./k8s-workload.md) - Pod、ReplicaSet、Deployment、StatefulSet、DaemonSet
5. [Service 与 Ingress](./k8s-service.md) - 服务发现、负载均衡与外部访问
6. [ConfigMap 与 Secret](./k8s-config.md) - 配置管理与敏感数据存储
7. [持久化存储](./k8s-storage.md) - PV、PVC 与 StorageClass

### 进阶篇
8. [Helm 包管理](./k8s-helm.md) - Kubernetes 的包管理工具
9. [监控与日志](./k8s-monitoring.md) - Prometheus、Grafana 与 EFK
10. [网络与安全](./k8s-network-security.md) - NetworkPolicy、RBAC 与安全最佳实践

## 前置知识

学习 Kubernetes 之前，建议先掌握：

- **Docker 基础**：了解容器、镜像、Dockerfile 等概念
- **Linux 基础**：熟悉基本的 Linux 命令操作
- **网络基础**：了解 TCP/IP、DNS、负载均衡等概念
- **YAML 语法**：Kubernetes 的配置文件使用 YAML 格式
