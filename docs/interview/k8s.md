---
order: 6
icon: simple-icons:kubernetes
---

# Kubernetes 面试题

Kubernetes（K8s）面试高频考点，覆盖架构原理、核心资源、网络存储、调度策略、运维监控等核心知识。

---

## 一、基础概念

### Q1: Kubernetes 是什么？

**Kubernetes 是一个开源的容器编排平台**，用于自动化部署、扩展和管理容器化应用。

**核心能力：**
- 自动化部署与回滚
- 服务发现与负载均衡
- 自我修复（容器重启、替换）
- 水平扩缩容
- 配置管理与密钥管理
- 存储编排

---

### Q2: Kubernetes 的整体架构是怎样的？

**K8s 采用 Master-Worker 架构：**

| 组件 | 位置 | 说明 |
| :--- | :--- | :--- |
| **kube-apiserver** | Control Plane | 集群的 API 入口，所有操作都通过它 |
| **etcd** | Control Plane | 分布式 KV 存储，保存集群所有状态 |
| **kube-scheduler** | Control Plane | 负责 Pod 调度 |
| **kube-controller-manager** | Control Plane | 运行各种控制器 |
| **kubelet** | Worker Node | 管理节点上的 Pod |
| **kube-proxy** | Worker Node | 负责 Service 的网络代理 |
| **Container Runtime** | Worker Node | 运行容器（如 containerd） |

---

### Q3: etcd 在 K8s 中的作用是什么？

**etcd 是 Kubernetes 的"大脑"，存储集群的所有状态数据。**

**特点：**
- 分布式键值存储
- 使用 Raft 协议保证一致性
- 存储 Pod、Service、ConfigMap 等所有资源信息
- 只有 API Server 直接与 etcd 交互

**重要性：**
- etcd 数据丢失 = 集群完全失效
- 生产环境必须做好 etcd 的备份和高可用

---

### Q4: kube-apiserver 的作用？

**API Server 是 Kubernetes 控制平面的核心组件。**

**主要职责：**
1. 提供 RESTful API 接口
2. 认证、授权和准入控制
3. 集群网关，所有组件通信的枢纽
4. 唯一直接操作 etcd 的组件
5. 提供 watch 机制，支持事件通知

```bash
# 所有 kubectl 命令都通过 API Server
kubectl get pods
# 等同于调用 GET /api/v1/namespaces/default/pods
```

---

### Q5: kube-scheduler 如何进行调度？

**Scheduler 负责将 Pod 分配到合适的 Node 上。**

**调度流程：**
1. **过滤（Filtering）**：筛选满足条件的节点
   - 资源是否充足（CPU、内存）
   - 节点是否有污点（Taints）
   - 亲和性规则是否满足
2. **打分（Scoring）**：对候选节点打分
   - 资源利用率均衡
   - 节点亲和性优先级
3. **选择**：选择得分最高的节点

---

### Q6: kube-controller-manager 包含哪些控制器？

**Controller Manager 运行多个控制器，维护集群期望状态。**

| 控制器 | 作用 |
| :--- | :--- |
| Node Controller | 监控节点状态，处理节点故障 |
| Replication Controller | 维护 Pod 副本数 |
| Deployment Controller | 管理 Deployment 资源 |
| StatefulSet Controller | 管理有状态应用 |
| Endpoints Controller | 填充 Endpoints 对象 |
| Service Account Controller | 创建默认 ServiceAccount |
| Namespace Controller | 管理命名空间生命周期 |

---

### Q7: kubelet 的作用是什么？

**kubelet 是每个 Node 上的代理进程，负责管理 Pod 的生命周期。**

**主要职责：**
1. **Pod 管理**：接收 PodSpec，确保容器正常运行
2. **健康检查**：执行 Liveness 和 Readiness 探针
3. **状态上报**：定期向 API Server 汇报节点和 Pod 状态
4. **资源监控**：收集节点资源使用情况
5. **容器日志**：管理容器日志

```bash
# kubelet 通过 CRI 与容器运行时交互
kubelet → CRI → containerd → 容器
```

---

### Q8: kube-proxy 的工作模式有哪些？

**kube-proxy 实现 Service 的负载均衡。**

| 模式 | 说明 | 优缺点 |
| :--- | :--- | :--- |
| **userspace** | 用户空间代理 | 性能差，已弃用 |
| **iptables** | 使用 iptables 规则转发 | 默认模式，规则多时性能下降 |
| **IPVS** | 使用 Linux IPVS | 高性能，支持更多负载均衡算法 |

```bash
# 查看 kube-proxy 模式
kubectl logs -n kube-system -l k8s-app=kube-proxy | grep "Using"
```

---

### Q9: Pod 是什么？为什么是最小调度单位？

**Pod 是 K8s 中最小的调度和部署单元。**

**Pod 特点：**
- 一个 Pod 可包含一个或多个容器
- Pod 内容器共享网络和存储
- Pod 内容器通过 localhost 通信
- Pod 是原子调度单位

**为什么不直接调度容器？**
1. 某些应用需要多容器紧密协作（如 sidecar 模式）
2. Pod 提供了容器组的抽象
3. 简化网络和存储的共享

---

### Q10: Pod 的生命周期有哪些阶段？

| 阶段 | 说明 |
| :--- | :--- |
| **Pending** | Pod 已创建，等待调度或容器镜像下载 |
| **Running** | Pod 已调度到节点，至少一个容器运行中 |
| **Succeeded** | 所有容器成功终止，不会重启 |
| **Failed** | 所有容器终止，至少一个容器失败 |
| **Unknown** | 无法获取 Pod 状态（通常是通信问题） |

---

## 二、核心资源

### Q11: Pod 的重启策略有哪些？

```yaml
spec:
  restartPolicy: Always  # 可选：Always、OnFailure、Never
```

| 策略 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| **Always** | 容器退出时总是重启 | 长期运行的服务 |
| **OnFailure** | 只在失败时重启 | Job、CronJob |
| **Never** | 从不重启 | 一次性任务 |

---

### Q12: Liveness 和 Readiness 探针的区别？

| 探针 | 作用 | 失败后果 |
| :--- | :--- | :--- |
| **Liveness** | 检测容器是否存活 | 重启容器 |
| **Readiness** | 检测容器是否就绪 | 从 Service 中移除 |
| **Startup** | 检测应用是否启动 | 延迟其他探针 |

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

### Q13: Deployment 和 ReplicaSet 的关系？

**Deployment 管理 ReplicaSet，ReplicaSet 管理 Pod。**

```
Deployment
    │
    ├── ReplicaSet (v1) ── Pod, Pod, Pod
    └── ReplicaSet (v2) ── Pod, Pod, Pod  (滚动更新时)
```

**Deployment 的能力：**
- 声明式更新
- 滚动更新和回滚
- 版本历史管理
- 暂停和恢复部署

---

### Q14: Deployment 如何实现滚动更新？

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # 最多超出期望数量的比例
      maxUnavailable: 25%   # 最多不可用的比例
```

**滚动更新流程：**
1. 创建新的 ReplicaSet
2. 逐步增加新 RS 的 Pod 数量
3. 同时减少旧 RS 的 Pod 数量
4. 直到新 RS 达到期望数量

```bash
# 查看滚动更新状态
kubectl rollout status deployment/nginx

# 回滚到上一版本
kubectl rollout undo deployment/nginx

# 回滚到指定版本
kubectl rollout undo deployment/nginx --to-revision=2
```

---

### Q15: StatefulSet 和 Deployment 的区别？

| 特性 | Deployment | StatefulSet |
| :--- | :--- | :--- |
| Pod 名称 | 随机后缀 | 有序编号（-0, -1, -2） |
| 启动顺序 | 并行 | 顺序启动 |
| 网络标识 | 无稳定标识 | 稳定的网络标识 |
| 存储 | 共享 PVC | 每个 Pod 独立 PVC |
| 适用场景 | 无状态服务 | 有状态服务（数据库、消息队列） |

---

### Q16: DaemonSet 的作用和使用场景？

**DaemonSet 确保每个节点（或符合条件的节点）运行一个 Pod 副本。**

**使用场景：**
- 日志收集（Fluentd、Filebeat）
- 监控代理（Node Exporter）
- 网络插件（Calico、Flannel）
- 存储守护进程

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    spec:
      containers:
      - name: fluentd
        image: fluentd:v1.14
```

---

### Q17: Job 和 CronJob 的区别？

| 资源 | 作用 | 使用场景 |
| :--- | :--- | :--- |
| **Job** | 一次性任务 | 数据处理、迁移任务 |
| **CronJob** | 定时任务 | 定期备份、报表生成 |

```yaml
# CronJob 示例
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-job
spec:
  schedule: "0 2 * * *"  # 每天凌晨 2 点
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: backup:latest
          restartPolicy: OnFailure
```

---

### Q18: Service 有哪些类型？

| 类型 | 说明 | 访问方式 |
| :--- | :--- | :--- |
| **ClusterIP** | 集群内部访问 | 只能在集群内部访问 |
| **NodePort** | 节点端口暴露 | NodeIP:NodePort |
| **LoadBalancer** | 云负载均衡 | 外部 LB IP |
| **ExternalName** | DNS 映射 | 返回 CNAME 记录 |

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: NodePort
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080  # 30000-32767
```

---

### Q19: Service 如何实现服务发现？

**K8s 提供两种服务发现机制：**

**1. 环境变量**
```bash
# 自动注入的环境变量
MY_SERVICE_SERVICE_HOST=10.96.0.1
MY_SERVICE_SERVICE_PORT=80
```

**2. DNS（推荐）**
```bash
# Service DNS 格式
<service-name>.<namespace>.svc.cluster.local

# 示例
curl http://my-service.default.svc.cluster.local
```

---

### Q20: Ingress 和 Service 的区别？

| 特性 | Service | Ingress |
| :--- | :--- | :--- |
| 协议 | TCP/UDP | HTTP/HTTPS |
| 功能 | 负载均衡 | 路由、TLS 终止、虚拟主机 |
| 暴露方式 | NodePort/LB | 7 层负载均衡 |
| 使用场景 | 服务间通信 | 对外暴露 HTTP 服务 |

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
```

---

### Q21: Headless Service 是什么？

**Headless Service 是没有 ClusterIP 的 Service（设置 clusterIP: None）。**

**特点：**
- 不分配 ClusterIP
- DNS 直接返回 Pod IP 列表
- 用于有状态服务的直接访问

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None  # Headless
  selector:
    app: mysql
  ports:
  - port: 3306
```

**使用场景：** StatefulSet 中访问特定 Pod

---

### Q22: Namespace 的作用是什么？

**Namespace 用于逻辑隔离集群资源。**

**默认 Namespace：**
- `default`：默认命名空间
- `kube-system`：系统组件
- `kube-public`：公开资源
- `kube-node-lease`：节点心跳

**最佳实践：**
- 按环境隔离（dev、staging、prod）
- 按团队隔离
- 配合 ResourceQuota 限制资源
- 配合 NetworkPolicy 网络隔离

---

## 三、配置与存储

### Q23: ConfigMap 和 Secret 的区别？

| 特性 | ConfigMap | Secret |
| :--- | :--- | :--- |
| 用途 | 非敏感配置 | 敏感数据 |
| 存储 | 明文 | Base64 编码 |
| 典型内容 | 配置文件、环境变量 | 密码、证书、密钥 |

```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  config.yaml: |
    database:
      host: mysql
      port: 3306

# Secret
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  password: cGFzc3dvcmQxMjM=  # base64 encoded
```

---

### Q24: 如何在 Pod 中使用 ConfigMap？

**三种使用方式：**

```yaml
# 1. 环境变量
env:
- name: DATABASE_HOST
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: database_host

# 2. 全部注入环境变量
envFrom:
- configMapRef:
    name: app-config

# 3. 挂载为文件
volumes:
- name: config-volume
  configMap:
    name: app-config
volumeMounts:
- name: config-volume
  mountPath: /etc/config
```

---

### Q25: PV、PVC、StorageClass 的关系？

```
StorageClass (动态供应策略)
      │
      ↓
PersistentVolume (存储资源)
      │
      ↓ (绑定)
PersistentVolumeClaim (存储请求)
      │
      ↓ (挂载)
Pod
```

| 概念 | 说明 |
| :--- | :--- |
| **PV** | 集群级别的存储资源 |
| **PVC** | 用户对存储的请求 |
| **StorageClass** | 动态供应 PV 的模板 |

---

### Q26: PV 的访问模式有哪些？

| 模式 | 缩写 | 说明 |
| :--- | :--- | :--- |
| ReadWriteOnce | RWO | 单节点读写 |
| ReadOnlyMany | ROX | 多节点只读 |
| ReadWriteMany | RWX | 多节点读写 |
| ReadWriteOncePod | RWOP | 单 Pod 读写（K8s 1.22+） |

---

### Q27: PV 的回收策略有哪些？

| 策略 | 说明 |
| :--- | :--- |
| **Retain** | 保留数据，需手动处理 |
| **Delete** | 删除 PV 和底层存储 |
| **Recycle** | 清空数据（已弃用） |

---

### Q28: 什么是动态存储供应？

**动态供应：通过 StorageClass 自动创建 PV。**

```yaml
# StorageClass
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-storage
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
reclaimPolicy: Delete

# PVC（自动创建 PV）
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: fast-storage
  resources:
    requests:
      storage: 10Gi
```

---

## 四、调度与扩缩容

### Q29: nodeSelector 如何工作？

**nodeSelector 通过标签匹配将 Pod 调度到特定节点。**

```yaml
# 给节点打标签
kubectl label nodes node1 disktype=ssd

# Pod 中使用 nodeSelector
spec:
  nodeSelector:
    disktype: ssd
```

---

### Q30: Node Affinity 和 nodeSelector 的区别？

| 特性 | nodeSelector | Node Affinity |
| :--- | :--- | :--- |
| 表达能力 | 简单匹配 | 支持复杂表达式 |
| 软硬约束 | 硬约束 | 支持软硬约束 |
| 操作符 | 只有 In | In、NotIn、Exists 等 |

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:  # 硬约束
      nodeSelectorTerms:
      - matchExpressions:
        - key: disktype
          operator: In
          values: ["ssd"]
    preferredDuringSchedulingIgnoredDuringExecution:  # 软约束
      - weight: 1
        preference:
          matchExpressions:
          - key: zone
            operator: In
            values: ["zone-a"]
```

---

### Q31: Pod Affinity 和 Anti-Affinity 的作用？

| 类型 | 作用 | 使用场景 |
| :--- | :--- | :--- |
| **Pod Affinity** | Pod 调度到一起 | 关联服务就近部署 |
| **Pod Anti-Affinity** | Pod 分散调度 | 高可用、故障隔离 |

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchExpressions:
        - key: app
          operator: In
          values: ["web"]
      topologyKey: "kubernetes.io/hostname"  # 不同节点
```

---

### Q32: Taints 和 Tolerations 如何工作？

**Taints（污点）**：阻止 Pod 调度到节点
**Tolerations（容忍）**：允许 Pod 调度到有污点的节点

```bash
# 给节点添加污点
kubectl taint nodes node1 gpu=true:NoSchedule
```

```yaml
# Pod 添加容忍
tolerations:
- key: "gpu"
  operator: "Equal"
  value: "true"
  effect: "NoSchedule"
```

**Effect 类型：**
- `NoSchedule`：不调度新 Pod
- `PreferNoSchedule`：尽量不调度
- `NoExecute`：驱逐现有 Pod

---

### Q33: 什么是 Pod 优先级和抢占？

**优先级和抢占用于资源紧张时的调度决策。**

```yaml
# PriorityClass
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000
globalDefault: false
description: "高优先级任务"

# Pod 使用
spec:
  priorityClassName: high-priority
```

**抢占机制：** 当高优先级 Pod 无法调度时，会驱逐低优先级 Pod

---

### Q34: HPA 如何实现自动扩缩容？

**HPA（Horizontal Pod Autoscaler）根据指标自动调整 Pod 副本数。**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

```bash
# 快速创建 HPA
kubectl autoscale deployment nginx --min=2 --max=10 --cpu-percent=70
```

---

### Q35: HPA 和 VPA 的区别？

| 特性 | HPA | VPA |
| :--- | :--- | :--- |
| 扩展方式 | 水平扩展（增加 Pod 数量） | 垂直扩展（调整资源配额） |
| 使用场景 | 无状态服务 | 有状态服务、单实例应用 |
| 成熟度 | 内置稳定 | 需要额外安装 |

---

## 五、网络与安全

### Q36: Kubernetes 网络模型的基本原则？

**K8s 网络模型要求：**
1. **Pod 间通信**：所有 Pod 可以直接通信（无 NAT）
2. **Node 与 Pod 通信**：节点可以直接与所有 Pod 通信
3. **Pod IP 一致**：Pod 看到的自己 IP 与其他 Pod 看到的一致

**常见 CNI 插件：**
- Calico
- Flannel
- Cilium
- Weave Net

---

### Q37: Pod 之间如何通信？

| 场景 | 通信方式 |
| :--- | :--- |
| **同 Pod 内容器** | localhost |
| **同 Node 的 Pod** | 直接通过 Pod IP |
| **跨 Node 的 Pod** | 通过 CNI 网络插件 |
| **通过 Service** | ClusterIP / DNS |

---

### Q38: NetworkPolicy 的作用？

**NetworkPolicy 用于控制 Pod 间的网络访问。**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  podSelector: {}  # 应用到所有 Pod
  policyTypes:
  - Ingress
  - Egress
  # 不定义规则 = 拒绝所有

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    ports:
    - port: 8080
```

---

### Q39: RBAC 权限控制如何工作？

**RBAC（Role-Based Access Control）基于角色的权限控制。**

| 资源 | 作用 | 作用域 |
| :--- | :--- | :--- |
| Role | 定义权限 | 命名空间级别 |
| ClusterRole | 定义权限 | 集群级别 |
| RoleBinding | 绑定用户和 Role | 命名空间级别 |
| ClusterRoleBinding | 绑定用户和 ClusterRole | 集群级别 |

```yaml
# Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]

# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

### Q40: ServiceAccount 的作用？

**ServiceAccount 为 Pod 提供身份认证。**

**用途：**
1. Pod 访问 API Server 的身份
2. 拉取私有镜像的凭证
3. RBAC 权限绑定的主体

```yaml
# 创建 ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-sa
  
# Pod 使用 ServiceAccount
spec:
  serviceAccountName: my-sa
```

---

### Q41: Pod Security 如何配置？

**Pod Security 控制 Pod 的安全上下文。**

```yaml
spec:
  securityContext:
    runAsUser: 1000          # 运行用户
    runAsGroup: 3000         # 运行组
    fsGroup: 2000            # 文件系统组
    runAsNonRoot: true       # 禁止 root 运行
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false  # 禁止提权
      readOnlyRootFilesystem: true     # 只读根文件系统
      capabilities:
        drop: ["ALL"]
```

---

## 六、运维与监控

### Q42: kubectl 常用命令有哪些？

```bash
# 资源查看
kubectl get pods -o wide
kubectl describe pod nginx
kubectl logs nginx -f --tail=100

# 资源创建
kubectl apply -f deployment.yaml
kubectl create deployment nginx --image=nginx

# 资源编辑
kubectl edit deployment nginx
kubectl patch deployment nginx -p '{"spec":{"replicas":3}}'

# 资源删除
kubectl delete pod nginx
kubectl delete -f deployment.yaml

# 调试命令
kubectl exec -it nginx -- /bin/sh
kubectl port-forward pod/nginx 8080:80
kubectl cp nginx:/var/log/app.log ./app.log

# 集群管理
kubectl get nodes
kubectl cordon node1        # 禁止调度
kubectl drain node1         # 驱逐并禁止调度
kubectl uncordon node1      # 恢复调度
```

---

### Q43: 如何排查 Pod 启动失败？

**排查步骤：**

```bash
# 1. 查看 Pod 状态
kubectl get pod nginx -o wide

# 2. 查看详细事件
kubectl describe pod nginx

# 3. 查看容器日志
kubectl logs nginx
kubectl logs nginx --previous  # 上一次容器日志

# 4. 进入容器调试
kubectl exec -it nginx -- /bin/sh
```

**常见问题：**
| 状态 | 可能原因 |
| :--- | :--- |
| ImagePullBackOff | 镜像拉取失败 |
| CrashLoopBackOff | 容器启动后立即退出 |
| Pending | 资源不足或调度失败 |
| Init:Error | Init 容器失败 |

---

### Q44: 如何查看集群事件？

```bash
# 查看所有事件
kubectl get events --sort-by=.metadata.creationTimestamp

# 查看特定命名空间事件
kubectl get events -n kube-system

# 以 watch 模式查看
kubectl get events -w
```

---

### Q45: Prometheus 和 Grafana 如何监控 K8s？

**监控架构：**

```
Node Exporter  → Prometheus → Grafana
kube-state-metrics ↗
cAdvisor ↗
```

**核心组件：**
- **Prometheus**：指标采集和存储
- **Grafana**：可视化展示
- **kube-state-metrics**：集群状态指标
- **Node Exporter**：节点指标
- **cAdvisor**：容器资源指标

---

### Q46: 如何收集 Pod 日志？

**日志收集方案：**

| 方案 | 组件 | 特点 |
| :--- | :--- | :--- |
| EFK | Elasticsearch + Fluentd + Kibana | 功能强大 |
| ELK | Elasticsearch + Logstash + Kibana | 经典方案 |
| Loki | Loki + Promtail + Grafana | 轻量级 |

**Fluentd DaemonSet 方式：**
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  template:
    spec:
      containers:
      - name: fluentd
        image: fluentd
        volumeMounts:
        - name: varlog
          mountPath: /var/log
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
```

---

### Q47: Init Container 的作用？

**Init Container 在主容器启动前运行，用于初始化工作。**

**使用场景：**
- 等待依赖服务就绪
- 初始化配置文件
- 下载依赖文件
- 执行数据库迁移

```yaml
spec:
  initContainers:
  - name: wait-mysql
    image: busybox
    command: ['sh', '-c', 'until nc -z mysql 3306; do sleep 2; done']
  containers:
  - name: app
    image: myapp
```

---

### Q48: Sidecar 模式是什么？

**Sidecar 是与主容器共同运行的辅助容器。**

**常见用途：**
- **日志收集**：收集主容器日志
- **代理**：Service Mesh 数据面代理（Envoy）
- **配置同步**：从配置中心同步配置

```yaml
spec:
  containers:
  - name: app
    image: myapp
  - name: log-collector
    image: fluentd
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
```

---

### Q49: 什么是 Helm？

**Helm 是 Kubernetes 的包管理工具。**

**核心概念：**
- **Chart**：应用包，包含 K8s 资源模板
- **Release**：Chart 的一次安装实例
- **Repository**：Chart 仓库

```bash
# 添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami

# 搜索 Chart
helm search repo nginx

# 安装 Chart
helm install my-nginx bitnami/nginx

# 查看 Release
helm list

# 升级
helm upgrade my-nginx bitnami/nginx --set replicaCount=3

# 卸载
helm uninstall my-nginx
```

---

### Q50: Helm Chart 的结构？

```
mychart/
├── Chart.yaml          # Chart 元数据
├── values.yaml         # 默认配置值
├── charts/             # 依赖的其他 Chart
├── templates/          # K8s 资源模板
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── _helpers.tpl    # 模板助手函数
│   └── NOTES.txt       # 安装后提示
└── .helmignore         # 忽略文件
```

---

## 七、高级主题

### Q51: 什么是 Operator？

**Operator 是一种封装运维知识的 K8s 扩展。**

**核心思想：**
- 将运维操作编码为 Controller
- 使用 CRD（Custom Resource Definition）扩展 API
- 自动化复杂应用的生命周期管理

**使用场景：**
- 数据库（MySQL Operator、Redis Operator）
- 消息队列（Kafka Operator）
- 监控系统（Prometheus Operator）

---

### Q52: CRD 是什么？

**CRD（Custom Resource Definition）用于扩展 Kubernetes API。**

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  names:
    kind: Database
    plural: databases
    singular: database
  scope: Namespaced
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              engine:
                type: string
              version:
                type: string
```

---

### Q53: 什么是 Service Mesh？

**Service Mesh 是微服务间通信的基础设施层。**

**功能：**
- 流量管理（路由、重试、熔断）
- 安全（mTLS、认证授权）
- 可观测性（指标、日志、链路追踪）

**常见实现：**
- **Istio**：功能最全，学习曲线陡峭
- **Linkerd**：轻量级，易于使用
- **Cilium**：基于 eBPF，高性能

---

### Q54: 什么是 GitOps？

**GitOps 是以 Git 为唯一真实来源的运维方式。**

**核心原则：**
1. 基础设施即代码（IaC）
2. Git 是唯一真实来源
3. 声明式配置
4. 自动同步和收敛

**常用工具：**
- **Argo CD**
- **Flux**

---

### Q55: 如何实现 K8s 的多集群管理？

**多集群管理方案：**

| 方案 | 说明 |
| :--- | :--- |
| **Rancher** | 统一管理多个 K8s 集群 |
| **KubeFed** | Kubernetes 联邦 |
| **Loft** | 虚拟集群和多租户 |
| **Argo CD** | GitOps 方式管理多集群 |

---

## 八、场景问题

### Q56: Pod 一直处于 Pending 状态怎么办？

**排查步骤：**

```bash
kubectl describe pod <pod-name>
```

**常见原因：**
| 原因 | 解决方法 |
| :--- | :--- |
| 资源不足 | 增加节点或调整资源请求 |
| nodeSelector 不匹配 | 检查标签或调整选择器 |
| 污点导致 | 添加容忍或移除污点 |
| PVC 未绑定 | 检查 PV 和 StorageClass |

---

### Q57: Pod 频繁重启（CrashLoopBackOff）怎么办？

**排查步骤：**

```bash
# 查看日志
kubectl logs <pod-name> --previous

# 查看退出码
kubectl describe pod <pod-name>
```

**常见原因：**
- 应用启动失败
- 配置错误
- 资源限制触发 OOMKilled
- 健康检查配置不当

---

### Q58: 如何优化 Pod 启动速度？

1. **使用轻量级基础镜像**（alpine）
2. **预拉取镜像**（使用 DaemonSet 预热）
3. **优化健康检查参数**
4. **减少 Init Container 数量**
5. **开启镜像缓存**
6. **使用 StartupProbe**

---

### Q59: 如何实现零停机部署？

1. **滚动更新策略**
   ```yaml
   strategy:
     type: RollingUpdate
     rollingUpdate:
       maxSurge: 1
       maxUnavailable: 0
   ```

2. **配置 Readiness 探针**
3. **使用 PodDisruptionBudget**
4. **配置 preStop 钩子**

---

### Q60: 如何限制容器资源使用？

```yaml
resources:
  requests:       # 调度时保证的资源
    memory: "256Mi"
    cpu: "250m"
  limits:         # 运行时的上限
    memory: "512Mi"
    cpu: "500m"
```

**最佳实践：**
- 始终设置 requests 和 limits
- 使用 LimitRange 设置默认值
- 使用 ResourceQuota 限制命名空间总资源

---

### Q61: 如何实现配置热更新？

**方法一：ConfigMap 自动更新**
- 挂载为 Volume，kubelet 会自动同步
- 应用需要监听文件变化

**方法二：使用 Reloader**
```yaml
metadata:
  annotations:
    reloader.stakater.com/auto: "true"
```

**方法三：滚动重启**
```bash
kubectl rollout restart deployment my-app
```

---

### Q62: 如何处理节点故障？

**自动处理：**
1. kubelet 停止心跳上报
2. Node Controller 检测到节点不可达
3. 等待超时后标记 Pod 为 Terminating
4. Pod 被调度到其他节点

**手动处理：**
```bash
# 禁止调度新 Pod
kubectl cordon <node>

# 驱逐现有 Pod
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data

# 维护完成后恢复
kubectl uncordon <node>
```

---

### Q63: 如何备份和恢复 K8s 集群？

**备份内容：**
1. etcd 数据（最重要）
2. K8s 资源配置（YAML）
3. PV 数据

**备份工具：**
- **Velero**：备份 K8s 资源和 PV
- **etcdctl**：备份 etcd

```bash
# etcd 备份
ETCDCTL_API=3 etcdctl snapshot save backup.db

# Velero 备份
velero backup create my-backup --include-namespaces=production
```

---

### Q64: K8s 和 Docker Compose 的区别？

| 特性 | Docker Compose | Kubernetes |
| :--- | :--- | :--- |
| 规模 | 单机 | 集群 |
| 高可用 | 不支持 | 原生支持 |
| 服务发现 | 简单 | 完整 |
| 滚动更新 | 有限 | 完整支持 |
| 学习曲线 | 低 | 高 |
| 适用场景 | 开发测试 | 生产环境 |

---

### Q65: 生产环境 K8s 最佳实践？

| 方面 | 最佳实践 |
| :--- | :--- |
| **资源配置** | 始终设置 requests 和 limits |
| **健康检查** | 配置 Liveness 和 Readiness 探针 |
| **安全** | 启用 RBAC，使用非 root 用户运行 |
| **网络** | 配置 NetworkPolicy |
| **日志监控** | 部署完整的日志和监控方案 |
| **备份** | 定期备份 etcd 和重要数据 |
| **更新策略** | 使用滚动更新，配置 PDB |
| **GitOps** | 采用 GitOps 工作流 |

---

## 九、高频考点清单

### 必考

- [ ] K8s 架构（Control Plane / Worker Node）
- [ ] Pod 概念和生命周期
- [ ] Deployment 滚动更新原理
- [ ] Service 类型和服务发现
- [ ] ConfigMap 和 Secret 使用
- [ ] PV/PVC 存储
- [ ] 调度策略（nodeSelector、Affinity、Taints）

### 常考

- [ ] StatefulSet vs Deployment
- [ ] HPA 自动扩缩容
- [ ] Ingress 与 Ingress Controller
- [ ] RBAC 权限控制
- [ ] NetworkPolicy
- [ ] Pod 健康检查（Liveness/Readiness）
- [ ] kubectl 常用命令

### 进阶

- [ ] Operator 和 CRD
- [ ] Service Mesh（Istio）
- [ ] Helm 包管理
- [ ] GitOps（Argo CD）
- [ ] 多集群管理
- [ ] etcd 原理
- [ ] CNI 网络插件

