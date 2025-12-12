---
order : 3
---
# Kubernetes - kubectl 命令行工具

## 概述

kubectl 是 Kubernetes 的命令行工具，用于与 Kubernetes 集群进行交互。通过 kubectl，你可以部署应用、检查和管理集群资源、查看日志等。

## 基本语法

```bash
kubectl [command] [TYPE] [NAME] [flags]
```

- **command**：指定要执行的操作，如 `get`、`create`、`delete`
- **TYPE**：资源类型，如 `pods`、`services`、`deployments`
- **NAME**：资源名称（可选）
- **flags**：可选参数，如 `-n namespace`

## 常用命令速查表

### 集群信息

```bash
# 查看集群信息
kubectl cluster-info

# 查看 API 版本
kubectl api-versions

# 查看 API 资源
kubectl api-resources

# 查看组件状态
kubectl get componentstatuses

# 查看配置
kubectl config view
```

### 上下文管理

```bash
# 查看所有上下文
kubectl config get-contexts

# 查看当前上下文
kubectl config current-context

# 切换上下文
kubectl config use-context <context-name>

# 设置默认命名空间
kubectl config set-context --current --namespace=<namespace>
```

## 资源查看（get）

### 基本查看

```bash
# 查看所有 Pod
kubectl get pods

# 查看所有命名空间的 Pod
kubectl get pods -A
kubectl get pods --all-namespaces

# 查看指定命名空间的 Pod
kubectl get pods -n kube-system

# 查看更多信息（IP、节点）
kubectl get pods -o wide

# 查看 YAML 格式
kubectl get pod <pod-name> -o yaml

# 查看 JSON 格式
kubectl get pod <pod-name> -o json
```

### 使用标签选择器

```bash
# 按标签筛选
kubectl get pods -l app=nginx

# 多条件筛选
kubectl get pods -l app=nginx,env=production

# 标签不等于
kubectl get pods -l app!=nginx

# 标签存在
kubectl get pods -l 'app'

# 标签在集合中
kubectl get pods -l 'env in (dev,test)'
```

### 查看所有资源类型

```bash
# 常用资源类型
kubectl get nodes           # 节点
kubectl get pods            # Pod
kubectl get deployments     # 部署
kubectl get services        # 服务
kubectl get configmaps      # 配置
kubectl get secrets         # 密钥
kubectl get pv              # 持久卷
kubectl get pvc             # 持久卷声明
kubectl get ingress         # 入口
kubectl get namespaces      # 命名空间

# 简写形式
kubectl get no    # nodes
kubectl get po    # pods
kubectl get deploy # deployments
kubectl get svc   # services
kubectl get cm    # configmaps
kubectl get ns    # namespaces
kubectl get ing   # ingress
```

## 资源详情（describe）

```bash
# 查看 Pod 详情
kubectl describe pod <pod-name>

# 查看 Node 详情
kubectl describe node <node-name>

# 查看 Service 详情
kubectl describe svc <service-name>

# 查看 Deployment 详情
kubectl describe deployment <deployment-name>
```

`describe` 输出包括：
- 基本信息（名称、命名空间、标签）
- 状态信息
- 事件（Events）- 对于调试非常有用

## 资源创建（create/apply）

### 使用 YAML 文件

```bash
# 创建资源
kubectl create -f deployment.yaml

# 创建或更新资源（推荐）
kubectl apply -f deployment.yaml

# 从目录创建
kubectl apply -f ./configs/

# 从 URL 创建
kubectl apply -f https://example.com/deployment.yaml
```

### 快速创建（命令行）

```bash
# 创建 Deployment
kubectl create deployment nginx --image=nginx:1.21

# 创建 Service
kubectl create service clusterip nginx --tcp=80:80

# 创建 ConfigMap
kubectl create configmap my-config --from-literal=key1=value1

# 创建 Secret
kubectl create secret generic my-secret --from-literal=password=123456

# 创建 Namespace
kubectl create namespace dev
```

### 生成 YAML 模板

```bash
# 不实际创建，只输出 YAML
kubectl create deployment nginx --image=nginx --dry-run=client -o yaml

# 保存到文件
kubectl create deployment nginx --image=nginx --dry-run=client -o yaml > nginx-deploy.yaml
```

## 资源更新

### 使用 apply

```bash
# 更新资源（声明式）
kubectl apply -f deployment.yaml
```

### 使用 edit

```bash
# 在线编辑资源
kubectl edit deployment nginx

# 使用指定编辑器
KUBE_EDITOR="code --wait" kubectl edit deployment nginx
```

### 使用 patch

```bash
# 部分更新
kubectl patch deployment nginx -p '{"spec":{"replicas":3}}'

# 使用 JSON Patch
kubectl patch deployment nginx --type='json' -p='[{"op": "replace", "path": "/spec/replicas", "value":5}]'
```

### 使用 set

```bash
# 更新镜像
kubectl set image deployment/nginx nginx=nginx:1.22

# 更新资源限制
kubectl set resources deployment/nginx -c=nginx --limits=cpu=200m,memory=256Mi
```

## 资源删除（delete）

```bash
# 删除 Pod
kubectl delete pod <pod-name>

# 删除 Deployment
kubectl delete deployment nginx

# 使用 YAML 文件删除
kubectl delete -f deployment.yaml

# 删除指定标签的资源
kubectl delete pods -l app=nginx

# 删除命名空间（包括其中所有资源）
kubectl delete namespace dev

# 强制删除（不等待）
kubectl delete pod <pod-name> --force --grace-period=0
```

## 日志查看（logs）

```bash
# 查看 Pod 日志
kubectl logs <pod-name>

# 查看指定容器的日志（多容器 Pod）
kubectl logs <pod-name> -c <container-name>

# 实时跟踪日志
kubectl logs -f <pod-name>

# 查看最近 N 行
kubectl logs --tail=100 <pod-name>

# 查看最近 N 秒的日志
kubectl logs --since=5m <pod-name>

# 查看之前容器的日志
kubectl logs <pod-name> --previous
```

## 执行命令（exec）

```bash
# 在 Pod 中执行命令
kubectl exec <pod-name> -- ls /

# 进入 Pod 交互式终端
kubectl exec -it <pod-name> -- /bin/bash
kubectl exec -it <pod-name> -- /bin/sh

# 在指定容器中执行
kubectl exec -it <pod-name> -c <container-name> -- /bin/bash
```

## 端口转发（port-forward）

```bash
# 将本地端口转发到 Pod
kubectl port-forward pod/<pod-name> 8080:80

# 转发到 Service
kubectl port-forward svc/<service-name> 8080:80

# 转发到 Deployment
kubectl port-forward deployment/<deployment-name> 8080:80

# 指定监听地址（允许外部访问）
kubectl port-forward --address 0.0.0.0 pod/<pod-name> 8080:80
```

## 文件复制（cp）

```bash
# 从 Pod 复制到本地
kubectl cp <pod-name>:/path/to/file ./local-file

# 从本地复制到 Pod
kubectl cp ./local-file <pod-name>:/path/to/file

# 指定命名空间
kubectl cp <namespace>/<pod-name>:/path/to/file ./local-file
```

## 扩缩容（scale）

```bash
# 扩展副本数
kubectl scale deployment nginx --replicas=5

# 条件扩展
kubectl scale deployment nginx --replicas=3 --current-replicas=5

# 扩展多个资源
kubectl scale deployment nginx redis --replicas=3
```

## 滚动更新

```bash
# 查看更新状态
kubectl rollout status deployment/nginx

# 查看更新历史
kubectl rollout history deployment/nginx

# 回滚到上一版本
kubectl rollout undo deployment/nginx

# 回滚到指定版本
kubectl rollout undo deployment/nginx --to-revision=2

# 暂停更新
kubectl rollout pause deployment/nginx

# 恢复更新
kubectl rollout resume deployment/nginx

# 重启 Deployment
kubectl rollout restart deployment/nginx
```

## 资源管理

### 资源配额查看

```bash
# 查看节点资源使用
kubectl top nodes

# 查看 Pod 资源使用
kubectl top pods

# 按内存排序
kubectl top pods --sort-by=memory
```

### 标签管理

```bash
# 添加标签
kubectl label pod <pod-name> env=production

# 更新标签
kubectl label pod <pod-name> env=staging --overwrite

# 删除标签
kubectl label pod <pod-name> env-

# 添加注解
kubectl annotate pod <pod-name> description="My pod"
```

### 污点和容忍

```bash
# 给节点添加污点
kubectl taint nodes <node-name> key=value:NoSchedule

# 删除污点
kubectl taint nodes <node-name> key=value:NoSchedule-
```

## 调试技巧

### 查看事件

```bash
# 查看所有事件
kubectl get events

# 按时间排序
kubectl get events --sort-by='.lastTimestamp'

# 查看指定命名空间的事件
kubectl get events -n <namespace>
```

### 资源诊断

```bash
# 检查 Pod 为什么没有运行
kubectl describe pod <pod-name>

# 查看调度失败原因
kubectl get events | grep <pod-name>

# 调试运行中的容器
kubectl debug -it <pod-name> --image=busybox
```

### 网络诊断

```bash
# 在临时 Pod 中运行网络诊断
kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash

# 查看 Service 的 Endpoints
kubectl get endpoints <service-name>
```

## 输出格式化

### 自定义列

```bash
# 自定义输出列
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,IP:.status.podIP

# 使用模板文件
kubectl get pods -o custom-columns-file=columns.txt
```

### JSONPath

```bash
# 获取特定字段
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# 获取所有 Pod 的 IP
kubectl get pods -o jsonpath='{.items[*].status.podIP}'

# 带换行格式化
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
```

## 常用别名配置

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
# 基本别名
alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias ke='kubectl exec -it'
alias ka='kubectl apply -f'
alias kdel='kubectl delete'

# 快捷命令
alias kgp='kubectl get pods'
alias kgd='kubectl get deployments'
alias kgs='kubectl get services'
alias kgn='kubectl get nodes'

# 命名空间切换
alias kns='kubectl config set-context --current --namespace'

# 开启自动补全
source <(kubectl completion bash)
complete -o default -F __start_kubectl k
```

## 总结

| 操作类型 |      命令      |                       示例                        |
| :------: | :------------: | :-----------------------------------------------: |
| 查看资源 |      get       |            `kubectl get pods -o wide`             |
| 查看详情 |    describe    |           `kubectl describe pod nginx`            |
| 创建资源 |  create/apply  |          `kubectl apply -f deploy.yaml`           |
| 更新资源 | edit/patch/set | `kubectl set image deploy/nginx nginx=nginx:1.22` |
| 删除资源 |     delete     |            `kubectl delete pod nginx`             |
| 查看日志 |      logs      |              `kubectl logs -f nginx`              |
| 执行命令 |      exec      |       `kubectl exec -it nginx -- /bin/bash`       |
| 端口转发 |  port-forward  |     `kubectl port-forward pod/nginx 8080:80`      |
|  扩缩容  |     scale      |     `kubectl scale deploy nginx --replicas=3`     |
| 滚动更新 |    rollout     |      `kubectl rollout restart deploy/nginx`       |

::: tip 学习建议
1. 多使用 `--help` 查看命令帮助
2. 善用 `-o yaml` 和 `--dry-run=client` 学习资源定义
3. 配置命令自动补全提高效率
4. 熟练使用 `describe` 和 `logs` 进行问题排查
:::
