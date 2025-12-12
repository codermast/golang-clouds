---
order : 4
---
# Kubernetes - 工作负载资源

## 概述

工作负载（Workload）是在 Kubernetes 上运行的应用程序。Kubernetes 提供了多种内置的工作负载资源来管理 Pod：

- **Pod**：最小部署单元
- **ReplicaSet**：维护 Pod 副本数量
- **Deployment**：声明式更新 Pod 和 ReplicaSet
- **StatefulSet**：管理有状态应用
- **DaemonSet**：确保所有节点运行指定 Pod
- **Job/CronJob**：运行一次性或定时任务

## Pod

Pod 是 Kubernetes 中最小的可部署单元，代表集群中运行的一个进程。

### Pod 的特点

- 一个 Pod 可以包含一个或多个容器
- Pod 中的容器共享网络命名空间（IP 和端口）
- Pod 中的容器共享存储卷
- Pod 是短暂的，可能随时被终止和替换

### Pod 定义示例

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
    env: production
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 15
      periodSeconds: 20
    readinessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 10
```

### 多容器 Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    ports:
    - containerPort: 80
    volumeMounts:
    - name: shared-data
      mountPath: /usr/share/nginx/html
  - name: content-generator
    image: busybox
    command: ["/bin/sh", "-c"]
    args:
    - while true; do
        echo "<h1>Hello $(date)</h1>" > /data/index.html;
        sleep 10;
      done
    volumeMounts:
    - name: shared-data
      mountPath: /data
  volumes:
  - name: shared-data
    emptyDir: {}
```

### Pod 生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                         Pod 生命周期                             │
│                                                                  │
│  Pending ──► Running ──► Succeeded/Failed                       │
│     │           │                                                │
│     │           └──► CrashLoopBackOff（容器反复崩溃）             │
│     │                                                            │
│     └──► Unknown（节点通信失败）                                  │
│                                                                  │
│  状态说明：                                                       │
│  - Pending: Pod 已创建，但容器还未启动                           │
│  - Running: 至少一个容器正在运行                                  │
│  - Succeeded: 所有容器成功终止                                    │
│  - Failed: 至少一个容器以非零状态退出                             │
│  - Unknown: 无法获取 Pod 状态                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Init 容器

Init 容器在主容器启动之前运行，用于初始化工作：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-container-demo
spec:
  initContainers:
  - name: init-db
    image: busybox
    command: ['sh', '-c', 'until nc -z mysql-service 3306; do echo waiting for db; sleep 2; done']
  - name: init-config
    image: busybox
    command: ['sh', '-c', 'cp /config/* /app/config/']
  containers:
  - name: app
    image: myapp:1.0
```

## ReplicaSet

ReplicaSet 确保指定数量的 Pod 副本始终运行。

### ReplicaSet 定义

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx-replicaset
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
```

### ReplicaSet 工作原理

```
┌─────────────────────────────────────────────────────────────────┐
│                        ReplicaSet                                │
│                                                                  │
│   期望副本数: 3                                                   │
│                                                                  │
│   当前状态:                                                       │
│   ┌─────┐  ┌─────┐  ┌─────┐                                     │
│   │ Pod │  │ Pod │  │ Pod │  = 3 个运行中                        │
│   └─────┘  └─────┘  └─────┘                                     │
│                                                                  │
│   如果 Pod 被删除:                                                │
│   ┌─────┐  ┌─────┐  ┌─────┐                                     │
│   │ Pod │  │ Pod │  │ NEW │  ← 自动创建新 Pod                    │
│   └─────┘  └─────┘  └─────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

::: warning 注意
通常不直接使用 ReplicaSet，而是使用 Deployment 来管理 ReplicaSet。
:::

## Deployment

Deployment 是最常用的工作负载资源，提供声明式更新能力。

### Deployment 定义

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 250m
            memory: 256Mi
```

### 创建 Deployment

```bash
# 使用 YAML 文件
kubectl apply -f nginx-deployment.yaml

# 使用命令行快速创建
kubectl create deployment nginx --image=nginx:1.21 --replicas=3
```

### 更新 Deployment

```bash
# 更新镜像
kubectl set image deployment/nginx-deployment nginx=nginx:1.22

# 编辑 Deployment
kubectl edit deployment nginx-deployment

# 使用 patch
kubectl patch deployment nginx-deployment -p '{"spec":{"replicas":5}}'
```

### 滚动更新策略

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # 更新时最多可以超出期望副本数的比例
      maxUnavailable: 25%  # 更新时最多不可用的副本数比例
```

**更新过程：**

```
初始状态:  v1 v1 v1 v1 (4 replicas)

Step 1:    v1 v1 v1 v1 v2      (创建新版本 Pod)
Step 2:    v1 v1 v1 v2 v2      (继续创建，删除旧版本)
Step 3:    v1 v1 v2 v2 v2
Step 4:    v1 v2 v2 v2 v2
Step 5:    v2 v2 v2 v2         (更新完成)
```

### 回滚 Deployment

```bash
# 查看更新历史
kubectl rollout history deployment/nginx-deployment

# 查看特定版本详情
kubectl rollout history deployment/nginx-deployment --revision=2

# 回滚到上一版本
kubectl rollout undo deployment/nginx-deployment

# 回滚到指定版本
kubectl rollout undo deployment/nginx-deployment --to-revision=2
```

### 暂停和恢复更新

```bash
# 暂停更新
kubectl rollout pause deployment/nginx-deployment

# 进行多次修改
kubectl set image deployment/nginx-deployment nginx=nginx:1.23
kubectl set resources deployment/nginx-deployment -c=nginx --limits=memory=256Mi

# 恢复更新（一次性应用所有修改）
kubectl rollout resume deployment/nginx-deployment
```

## StatefulSet

StatefulSet 用于管理有状态应用，如数据库、消息队列等。

### StatefulSet 特点

- Pod 拥有稳定的网络标识（固定的 Pod 名称）
- Pod 拥有稳定的持久化存储
- 有序部署、扩展和删除
- 有序滚动更新

### StatefulSet 定义

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: "mysql"
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
          name: mysql
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "standard"
      resources:
        requests:
          storage: 10Gi
```

### StatefulSet 网络标识

```
StatefulSet: mysql, replicas: 3

Pod 名称:
- mysql-0
- mysql-1
- mysql-2

DNS 名称（需要 Headless Service）:
- mysql-0.mysql.default.svc.cluster.local
- mysql-1.mysql.default.svc.cluster.local
- mysql-2.mysql.default.svc.cluster.local
```

### Headless Service

StatefulSet 需要配合 Headless Service 使用：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  clusterIP: None  # Headless Service
  selector:
    app: mysql
  ports:
  - port: 3306
    name: mysql
```

## DaemonSet

DaemonSet 确保所有（或部分）节点上运行一个 Pod 副本。

### 典型用途

- 运行集群存储守护程序（如 glusterd、ceph）
- 运行日志收集守护程序（如 fluentd、logstash）
- 运行节点监控守护程序（如 Prometheus Node Exporter）

### DaemonSet 定义

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
  labels:
    app: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        effect: NoSchedule
      containers:
      - name: fluentd
        image: fluentd:v1.14
        resources:
          limits:
            memory: 200Mi
          requests:
            cpu: 100m
            memory: 200Mi
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

### 仅在部分节点运行

使用节点选择器：

```yaml
spec:
  template:
    spec:
      nodeSelector:
        disk: ssd
```

## Job 和 CronJob

### Job

Job 用于运行一次性任务，确保任务成功完成。

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: backup-job
spec:
  completions: 1      # 需要成功完成的 Pod 数
  parallelism: 1      # 并行运行的 Pod 数
  backoffLimit: 4     # 失败重试次数
  activeDeadlineSeconds: 600  # 超时时间
  template:
    spec:
      restartPolicy: Never  # Job 必须设置为 Never 或 OnFailure
      containers:
      - name: backup
        image: backup-tool:1.0
        command: ["/bin/sh", "-c", "backup.sh"]
```

### 并行 Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: parallel-job
spec:
  completions: 10     # 需要完成 10 个任务
  parallelism: 3      # 同时运行 3 个 Pod
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: worker
        image: worker:1.0
```

### CronJob

CronJob 用于运行定时任务。

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"  # 每天凌晨 2 点执行
  concurrencyPolicy: Forbid  # 禁止并发执行
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: backup-tool:1.0
            command: ["/bin/sh", "-c", "backup.sh"]
```

**Cron 表达式：**

```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日 (1 - 31)
│ │ │ ┌───────────── 月 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6，0 是周日)
│ │ │ │ │
* * * * *

示例：
"0 * * * *"    每小时
"0 0 * * *"    每天午夜
"0 0 * * 0"    每周日午夜
"0 0 1 * *"    每月 1 日午夜
"*/5 * * * *"  每 5 分钟
```

## 工作负载对比

|   特性   | Deployment | StatefulSet |  DaemonSet   | Job/CronJob |
| :------: | :--------: | :---------: | :----------: | :---------: |
|   用途   | 无状态应用 | 有状态应用  | 节点守护程序 | 批处理任务  |
| Pod 标识 |    随机    |  固定顺序   |   节点绑定   |    随机     |
|   存储   |    共享    |    独立     |   节点本地   |    临时     |
|  扩缩容  |  任意顺序  |    有序     |  节点数决定  |     N/A     |
| 更新策略 | 滚动/重建  |    滚动     |     滚动     |     N/A     |

::: tip 选择指南
- **无状态 Web 应用** → Deployment
- **数据库、消息队列** → StatefulSet
- **日志收集、监控代理** → DaemonSet
- **数据处理、备份任务** → Job/CronJob
:::
