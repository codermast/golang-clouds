---
order : 10
---
# Kubernetes - 网络与安全

## 概述

Kubernetes 网络和安全是生产环境中的重要主题。本文介绍 Kubernetes 的网络模型、网络策略以及安全最佳实践。

## Kubernetes 网络模型

Kubernetes 网络遵循以下基本原则：

1. 所有 Pod 可以相互通信，无需 NAT
2. 所有节点可以与所有 Pod 通信，无需 NAT
3. Pod 看到的自己的 IP 与其他 Pod 看到的一致

### 网络通信类型

| 类型           | 说明                                 |
| :------------- | :----------------------------------- |
| Pod 内部通信   | 同一 Pod 内容器通过 localhost 通信   |
| Pod 间通信     | 不同 Pod 通过 Pod IP 直接通信        |
| Pod 到 Service | 通过 Service ClusterIP 和 DNS        |
| 外部到集群     | 通过 NodePort、LoadBalancer、Ingress |

### CNI 网络插件

Kubernetes 使用 CNI（Container Network Interface）插件来实现网络功能。

**常见 CNI 插件：**

| 插件    | 特点                         |
| :------ | :--------------------------- |
| Calico  | 功能全面，支持 NetworkPolicy |
| Flannel | 简单易用，适合入门           |
| Cilium  | 基于 eBPF，高性能            |
| Weave   | 简单，支持加密               |
| Canal   | Flannel + Calico 的结合      |

### 安装 Calico

```bash
# 使用 kubectl 安装
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.0/manifests/calico.yaml

# 或使用 Helm
helm repo add projectcalico https://docs.tigera.io/calico/charts
helm install calico projectcalico/tigera-operator -n tigera-operator --create-namespace
```

## NetworkPolicy

NetworkPolicy 是 Kubernetes 原生的网络安全策略，用于控制 Pod 之间的网络流量。

### 默认行为

- 默认情况下，Pod 之间没有网络隔离
- 一旦应用 NetworkPolicy，未被允许的流量将被拒绝

### 基本结构

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: example-policy
  namespace: default
spec:
  podSelector:          # 选择策略应用的 Pod
    matchLabels:
      app: web
  policyTypes:          # 策略类型
  - Ingress             # 入站规则
  - Egress              # 出站规则
  ingress:              # 入站规则列表
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 80
  egress:               # 出站规则列表
  - to:
    - podSelector:
        matchLabels:
          role: database
    ports:
    - protocol: TCP
      port: 5432
```

### 示例：默认拒绝所有入站流量

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: default
spec:
  podSelector: {}  # 选择所有 Pod
  policyTypes:
  - Ingress
  # 没有定义 ingress 规则，表示拒绝所有
```

### 示例：默认拒绝所有出站流量

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: default
spec:
  podSelector: {}
  policyTypes:
  - Egress
```

### 示例：允许特定 Pod 访问

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # 允许来自 frontend 的流量
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  # 允许访问 database
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  # 允许 DNS 查询
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

### 示例：跨命名空间访问

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-monitoring
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
      podSelector:
        matchLabels:
          app: prometheus
    ports:
    - protocol: TCP
      port: 9090
```

### 示例：允许外部 IP 访问

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Ingress
  ingress:
  - from:
    - ipBlock:
        cidr: 10.0.0.0/8
        except:
        - 10.0.0.0/24
    ports:
    - protocol: TCP
      port: 443
```

## RBAC 权限控制

RBAC（Role-Based Access Control）是 Kubernetes 的授权机制。

### 核心概念

| 资源               | 说明                                        |
| :----------------- | :------------------------------------------ |
| Role               | 命名空间级别的权限定义                      |
| ClusterRole        | 集群级别的权限定义                          |
| RoleBinding        | 将 Role 绑定到用户/组/ServiceAccount        |
| ClusterRoleBinding | 将 ClusterRole 绑定到用户/组/ServiceAccount |

### 创建 Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
```

### 创建 ClusterRole

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch"]
```

### 创建 RoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: ServiceAccount
  name: my-service-account
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### 创建 ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-secrets-global
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

### ServiceAccount

```yaml
# 创建 ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: default

---
# 在 Pod 中使用
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  serviceAccountName: app-service-account
  containers:
  - name: app
    image: myapp:1.0
```

## Pod 安全标准

### PodSecurityContext

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
    runAsNonRoot: true
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
```

### Pod Security Standards

Kubernetes 1.25+ 支持 Pod Security Standards：

```yaml
# 在命名空间上设置安全策略
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**安全级别：**

| 级别       | 说明                         |
| :--------- | :--------------------------- |
| privileged | 无限制，用于系统级工作负载   |
| baseline   | 最小限制，防止已知的权限提升 |
| restricted | 最严格，遵循最佳安全实践     |

## Secret 安全

### 加密 Secret

配置 etcd 加密：

```yaml
# encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <base64-encoded-key>
  - identity: {}
```

### 外部密钥管理

使用 External Secrets Operator 集成外部密钥管理：

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: db-credentials
  data:
  - secretKey: password
    remoteRef:
      key: secret/data/db
      property: password
```

## 网络安全最佳实践

### 1. 最小权限原则

```yaml
# 仅允许必要的网络访问
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: minimal-access
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - port: 5432
  - to:  # DNS
    - namespaceSelector: {}
    ports:
    - port: 53
      protocol: UDP
```

### 2. 命名空间隔离

```yaml
# 禁止跨命名空间访问
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-from-other-namespaces
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}  # 只允许同命名空间
```

### 3. 限制出站流量

```yaml
# 限制只能访问特定外部服务
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-egress
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Egress
  egress:
  - to:
    - ipBlock:
        cidr: 10.0.0.0/8  # 内部网络
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 0.0.0.0/8
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
    ports:
    - port: 443  # 只允许 HTTPS 出站
```

## 镜像安全

### 镜像拉取策略

```yaml
spec:
  containers:
  - name: app
    image: myapp:v1.2.3  # 使用固定版本，避免 latest
    imagePullPolicy: Always  # 始终拉取
```

### 私有仓库认证

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: private-image-pod
spec:
  containers:
  - name: app
    image: registry.example.com/myapp:1.0
  imagePullSecrets:
  - name: regcred
```

### 镜像扫描

使用 Trivy 扫描镜像：

```bash
# 扫描镜像漏洞
trivy image nginx:1.21

# 在 CI/CD 中集成
trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest
```

## 审计日志

### 配置审计策略

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets", "configmaps"]
- level: Request
  resources:
  - group: ""
    resources: ["pods"]
  verbs: ["create", "update", "delete"]
- level: RequestResponse
  resources:
  - group: "rbac.authorization.k8s.io"
  verbs: ["create", "update", "delete"]
```

### 审计日志级别

| 级别            | 说明                       |
| :-------------- | :------------------------- |
| None            | 不记录                     |
| Metadata        | 只记录请求元数据           |
| Request         | 记录元数据和请求体         |
| RequestResponse | 记录元数据、请求体和响应体 |

## 安全检查清单

### 集群安全

- [ ] 启用 RBAC
- [ ] 配置 API Server 认证
- [ ] 启用审计日志
- [ ] 定期轮换证书
- [ ] 限制 kubelet 权限

### 工作负载安全

- [ ] 使用非 root 用户运行容器
- [ ] 设置只读根文件系统
- [ ] 禁用特权容器
- [ ] 配置资源限制
- [ ] 使用 NetworkPolicy

### 数据安全

- [ ] 启用 etcd 加密
- [ ] 使用 Secret 存储敏感数据
- [ ] 考虑使用外部密钥管理
- [ ] 定期备份

### 镜像安全

- [ ] 使用可信基础镜像
- [ ] 定期扫描漏洞
- [ ] 使用固定版本标签
- [ ] 配置镜像拉取策略

::: tip 总结
1. 使用 NetworkPolicy 实现网络隔离
2. 使用 RBAC 控制访问权限
3. 配置 Pod 安全上下文
4. 保护敏感数据（Secret 加密）
5. 定期进行安全审计
:::
