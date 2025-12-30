---
order : 7
---
# Kubernetes - 持久化存储

## 概述

容器是短暂的，容器中的数据会随着容器的销毁而丢失。Kubernetes 提供了持久化存储机制，确保数据在 Pod 重启或调度后仍然可用。

**核心概念：**
- **Volume**：Pod 级别的存储卷
- **PersistentVolume (PV)**：集群级别的存储资源
- **PersistentVolumeClaim (PVC)**：用户对存储的请求
- **StorageClass**：动态供应存储的模板

## Volume（卷）

Volume 是 Pod 中容器可以访问的目录，生命周期与 Pod 相同。

### emptyDir

临时存储，Pod 删除后数据丢失。适用于同一 Pod 内容器间共享数据。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: shared-data-pod
spec:
  containers:
  - name: writer
    image: busybox
    command: ["/bin/sh", "-c"]
    args:
    - while true; do
        echo "$(date)" >> /data/log.txt;
        sleep 5;
      done
    volumeMounts:
    - name: shared-volume
      mountPath: /data
  - name: reader
    image: busybox
    command: ["/bin/sh", "-c", "tail -f /data/log.txt"]
    volumeMounts:
    - name: shared-volume
      mountPath: /data
  volumes:
  - name: shared-volume
    emptyDir: {}
```

**使用内存存储：**

```yaml
volumes:
- name: cache-volume
  emptyDir:
    medium: Memory
    sizeLimit: 500Mi
```

### hostPath

挂载节点主机的文件或目录。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: host-data
      mountPath: /data
  volumes:
  - name: host-data
    hostPath:
      path: /var/data
      type: DirectoryOrCreate  # 如果不存在则创建
```

**hostPath 类型：**

| type              | 说明             |
| :---------------- | :--------------- |
| DirectoryOrCreate | 目录不存在则创建 |
| Directory         | 目录必须存在     |
| FileOrCreate      | 文件不存在则创建 |
| File              | 文件必须存在     |
| Socket            | UNIX Socket      |

::: warning 注意
hostPath 仅适用于单节点测试，不推荐在生产环境使用。
:::

### configMap 和 secret

将 ConfigMap 和 Secret 作为卷挂载：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: config-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: config-volume
    configMap:
      name: app-config
  - name: secret-volume
    secret:
      secretName: app-secret
```

### nfs

挂载 NFS 共享存储：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nfs-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: nfs-volume
      mountPath: /data
  volumes:
  - name: nfs-volume
    nfs:
      server: 192.168.1.100
      path: /exports/data
```

## PersistentVolume (PV)

PV 是集群级别的存储资源，由管理员创建或通过 StorageClass 动态供应。

### PV 定义

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs-data
  labels:
    type: nfs
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: nfs-storage
  nfs:
    server: 192.168.1.100
    path: /exports/data
```

### PV 访问模式

| 模式             | 缩写  | 说明                     |
| :--------------- | :---: | :----------------------- |
| ReadWriteOnce    |  RWO  | 单节点读写               |
| ReadOnlyMany     |  ROX  | 多节点只读               |
| ReadWriteMany    |  RWX  | 多节点读写               |
| ReadWriteOncePod | RWOP  | 单 Pod 读写（K8s 1.22+） |

### PV 回收策略

| 策略    | 说明                       |
| :------ | :------------------------- |
| Retain  | 保留数据，手动处理         |
| Recycle | 简单清除（rm -rf），已弃用 |
| Delete  | 删除存储资源               |

### PV 状态

```
Available ──► Bound ──► Released ──► Failed
                              │
                              └──► Available（回收后）
```

- **Available**：可用，未绑定
- **Bound**：已绑定到 PVC
- **Released**：PVC 已删除，资源未回收
- **Failed**：回收失败

## PersistentVolumeClaim (PVC)

PVC 是用户对存储的请求，Kubernetes 会自动将 PVC 绑定到满足需求的 PV。

### PVC 定义

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: nfs-storage
  selector:
    matchLabels:
      type: nfs
```

### 在 Pod 中使用 PVC

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: data-volume
      mountPath: /data
  volumes:
  - name: data-volume
    persistentVolumeClaim:
      claimName: data-pvc
```

### PV 和 PVC 绑定规则

PV 和 PVC 会根据以下条件自动绑定：

1. **容量**：PV 容量 >= PVC 请求
2. **访问模式**：PV 支持 PVC 请求的访问模式
3. **StorageClass**：相同的 StorageClass
4. **标签选择器**：匹配 PVC 的 selector（如果有）

## StorageClass

StorageClass 提供动态供应存储的能力，无需管理员手动创建 PV。

### StorageClass 定义

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-storage
provisioner: kubernetes.io/aws-ebs  # 存储供应商
parameters:
  type: gp3
  iopsPerGB: "10"
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

### 常见 Provisioner

| 云平台     | Provisioner                  |
| :--------- | :--------------------------- |
| AWS EBS    | kubernetes.io/aws-ebs        |
| GCP PD     | kubernetes.io/gce-pd         |
| Azure Disk | kubernetes.io/azure-disk     |
| NFS        | 需要外部 provisioner         |
| Local      | kubernetes.io/no-provisioner |

### 动态供应示例

```yaml
# 1. StorageClass
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
reclaimPolicy: Delete
allowVolumeExpansion: true

---
# 2. PVC（自动创建 PV）
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard
  resources:
    requests:
      storage: 10Gi

---
# 3. Pod
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: dynamic-pvc
```

### 设置默认 StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: kubernetes.io/aws-ebs
```

## StatefulSet 与持久化存储

StatefulSet 使用 volumeClaimTemplates 为每个 Pod 创建独立的 PVC：

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
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
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: standard
      resources:
        requests:
          storage: 10Gi
```

**创建的 PVC：**
- data-mysql-0
- data-mysql-1
- data-mysql-2

## 存储扩容

### 扩展 PVC

如果 StorageClass 允许扩容：

```bash
# 编辑 PVC，修改 storage
kubectl edit pvc data-pvc
```

或使用 patch：

```bash
kubectl patch pvc data-pvc -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'
```

### 扩容条件

1. StorageClass 必须设置 `allowVolumeExpansion: true`
2. 只能扩大，不能缩小
3. 部分存储类型需要重启 Pod 才能生效

## 存储快照

### VolumeSnapshot

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: data-snapshot
spec:
  volumeSnapshotClassName: csi-hostpath-snapclass
  source:
    persistentVolumeClaimName: data-pvc
```

### 从快照恢复

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: restored-pvc
spec:
  storageClassName: standard
  dataSource:
    name: data-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## 实战示例

### MySQL 持久化部署

```yaml
# 1. StorageClass（使用默认即可）
---
# 2. PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi

---
# 3. Secret
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
type: Opaque
stringData:
  MYSQL_ROOT_PASSWORD: rootpassword
  MYSQL_DATABASE: myapp
  MYSQL_USER: appuser
  MYSQL_PASSWORD: apppassword

---
# 4. Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1
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
        envFrom:
        - secretRef:
            name: mysql-secret
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1"
      volumes:
      - name: mysql-data
        persistentVolumeClaim:
          claimName: mysql-pvc

---
# 5. Service
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```

## 管理命令

```bash
# 查看 PV
kubectl get pv
kubectl describe pv <pv-name>

# 查看 PVC
kubectl get pvc
kubectl describe pvc <pvc-name>

# 查看 StorageClass
kubectl get storageclass
kubectl get sc

# 查看绑定关系
kubectl get pv,pvc

# 删除 PVC（注意：可能删除 PV 中的数据）
kubectl delete pvc <pvc-name>
```

## 存储类型对比

|      类型      |    持久性    | 访问模式 | 适用场景             |
| :------------: | :----------: | :------: | :------------------- |
|    emptyDir    | Pod 生命周期 |   RWO    | 临时缓存、Pod 内共享 |
|    hostPath    | 节点生命周期 |   RWO    | 单节点测试           |
|      NFS       |     持久     |   RWX    | 多节点共享数据       |
| 云盘（EBS/PD） |     持久     |   RWO    | 数据库、有状态应用   |
|    Local PV    |     持久     |   RWO    | 高性能本地存储       |

::: tip 最佳实践
1. 生产环境使用动态供应（StorageClass）
2. 重要数据选择 Retain 回收策略
3. 数据库等有状态应用使用 StatefulSet
4. 定期备份重要数据（VolumeSnapshot）
5. 根据性能需求选择合适的存储类型
:::
