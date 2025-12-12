---
order : 5
---
# Kubernetes - Service 与 Ingress

## 概述

在 Kubernetes 中，Pod 是短暂的，它们的 IP 地址可能随时变化。Service 提供了一种抽象方式，定义了一组 Pod 的访问策略。Ingress 则提供了从集群外部访问集群内服务的 HTTP/HTTPS 路由。

## Service

Service 是一种将运行在一组 Pod 上的应用程序公开为网络服务的抽象方法。

### Service 类型

Kubernetes 提供了四种 Service 类型：

|     类型     | 说明                   | 使用场景         |
| :----------: | :--------------------- | :--------------- |
|  ClusterIP   | 默认类型，集群内部访问 | 内部服务通信     |
|   NodePort   | 通过节点端口暴露服务   | 开发测试环境     |
| LoadBalancer | 使用云平台负载均衡器   | 生产环境外部访问 |
| ExternalName | 映射到外部 DNS 名称    | 访问集群外部服务 |

### ClusterIP Service

ClusterIP 是默认的 Service 类型，只能在集群内部访问。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: ClusterIP  # 默认类型，可省略
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80        # Service 端口
    targetPort: 80  # Pod 端口
```

**访问方式：**

```bash
# 在集群内部通过 Service 名称访问
curl http://nginx-service
curl http://nginx-service.default
curl http://nginx-service.default.svc.cluster.local

# 通过 ClusterIP 访问
curl http://10.96.123.45
```

### NodePort Service

NodePort 在每个节点上开放一个端口，外部可以通过 `<NodeIP>:<NodePort>` 访问。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-nodeport
spec:
  type: NodePort
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80        # Service 端口
    targetPort: 80  # Pod 端口
    nodePort: 30080 # 节点端口（30000-32767）
```

**访问方式：**

```bash
# 通过任意节点 IP 访问
curl http://<node-ip>:30080
```

**工作原理：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   NodePort Service                        │   │
│  │                   Port: 80, NodePort: 30080               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│          ┌───────────────────┼───────────────────┐              │
│          ▼                   ▼                   ▼              │
│    ┌──────────┐        ┌──────────┐        ┌──────────┐        │
│    │ Node 1   │        │ Node 2   │        │ Node 3   │        │
│    │ :30080   │        │ :30080   │        │ :30080   │        │
│    │ ┌──────┐ │        │ ┌──────┐ │        │ ┌──────┐ │        │
│    │ │ Pod  │ │        │ │ Pod  │ │        │ │ Pod  │ │        │
│    │ └──────┘ │        │ └──────┘ │        │ └──────┘ │        │
│    └──────────┘        └──────────┘        └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    外部访问任意节点 :30080
```

### LoadBalancer Service

LoadBalancer 类型会自动创建云平台的负载均衡器（如 AWS ELB、GCP LB）。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-lb
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
```

**查看外部 IP：**

```bash
kubectl get svc nginx-lb
# NAME       TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
# nginx-lb   LoadBalancer   10.96.123.45    203.0.113.100   80:32145/TCP   1m
```

### ExternalName Service

ExternalName 将 Service 映射到外部 DNS 名称。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: database.example.com
```

**使用场景：**
- 访问集群外部的数据库
- 逐步迁移服务到 Kubernetes

### Headless Service

当不需要负载均衡和单一 Service IP 时，可以创建 Headless Service。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-headless
spec:
  clusterIP: None  # Headless Service
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
```

**特点：**
- 不分配 ClusterIP
- DNS 直接返回所有 Pod 的 IP
- 适用于 StatefulSet

### 多端口 Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: multi-port-service
spec:
  selector:
    app: myapp
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 8080
  - name: https
    protocol: TCP
    port: 443
    targetPort: 8443
```

### Service 会话保持

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-session
spec:
  selector:
    app: nginx
  sessionAffinity: ClientIP  # 基于客户端 IP 的会话保持
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800  # 3 小时
  ports:
  - port: 80
    targetPort: 80
```

## Endpoints

Service 通过 Endpoints 关联 Pod。当 Pod 创建或删除时，Endpoints 自动更新。

```bash
# 查看 Endpoints
kubectl get endpoints nginx-service

# 输出示例
NAME            ENDPOINTS                                   AGE
nginx-service   10.244.1.5:80,10.244.2.6:80,10.244.3.7:80   5m
```

### 手动创建 Endpoints

可以创建没有选择器的 Service，手动管理 Endpoints：

```yaml
# Service（无选择器）
apiVersion: v1
kind: Service
metadata:
  name: external-service
spec:
  ports:
  - port: 80
    targetPort: 80
---
# 手动创建 Endpoints
apiVersion: v1
kind: Endpoints
metadata:
  name: external-service  # 必须与 Service 同名
subsets:
- addresses:
  - ip: 192.168.1.100
  - ip: 192.168.1.101
  ports:
  - port: 80
```

## Ingress

Ingress 是对集群中服务的外部访问进行管理的 API 对象，提供 HTTP/HTTPS 路由。

### Ingress 的优势

相比于每个服务都使用 LoadBalancer：
- 节省公网 IP 和负载均衡器成本
- 提供统一的入口点
- 支持基于路径和主机名的路由
- 支持 SSL/TLS 终止

### Ingress Controller

Ingress 资源本身不生效，需要安装 Ingress Controller：

```bash
# 安装 Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/cloud/deploy.yaml
```

常见的 Ingress Controller：
- **Nginx Ingress Controller**：最流行
- **Traefik**：云原生
- **HAProxy**：高性能
- **Kong**：API 网关功能

### 基本 Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: simple-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

### 多路径 Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-path-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
      - path: /admin
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 8081
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### 多主机 Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-host-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
  - host: www.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

### TLS/HTTPS 配置

首先创建 TLS Secret：

```bash
# 创建 TLS Secret
kubectl create secret tls example-tls \
  --cert=path/to/cert.crt \
  --key=path/to/cert.key
```

然后在 Ingress 中配置 TLS：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - example.com
    - www.example.com
    secretName: example-tls
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

### Ingress 注解

Nginx Ingress Controller 支持丰富的注解：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: annotated-ingress
  annotations:
    # 重写路径
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    # 限速
    nginx.ingress.kubernetes.io/limit-rps: "100"
    # 超时配置
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    # 上传大小限制
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    # CORS 配置
    nginx.ingress.kubernetes.io/enable-cors: "true"
    # 白名单
    nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/24"
spec:
  ingressClassName: nginx
  rules:
  - host: example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 8080
```

### Path 类型

Ingress 支持三种 Path 类型：

|        pathType        | 说明                       | 示例                           |
| :--------------------: | :------------------------- | :----------------------------- |
|         Exact          | 精确匹配                   | `/foo` 只匹配 `/foo`           |
|         Prefix         | 前缀匹配                   | `/foo` 匹配 `/foo`、`/foo/bar` |
| ImplementationSpecific | 由 Ingress Controller 决定 | 取决于具体实现                 |

## 服务发现

### DNS 服务发现

Kubernetes 集群内置 DNS 服务（CoreDNS），Pod 可以通过 DNS 名称发现服务：

```
<service-name>.<namespace>.svc.cluster.local
```

**示例：**

```bash
# 在 Pod 内部
# 同命名空间
curl http://nginx-service

# 跨命名空间
curl http://nginx-service.production

# 完整域名
curl http://nginx-service.production.svc.cluster.local
```

### 环境变量

Kubernetes 自动为每个 Service 注入环境变量：

```bash
# 在 Pod 内部查看
env | grep NGINX

# 输出示例
NGINX_SERVICE_SERVICE_HOST=10.96.123.45
NGINX_SERVICE_SERVICE_PORT=80
NGINX_SERVICE_PORT=tcp://10.96.123.45:80
```

## 网络策略（NetworkPolicy）

NetworkPolicy 用于控制 Pod 之间的网络流量。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

## 实战示例

### 完整的微服务暴露

```yaml
# 1. Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: nginx:1.21
        ports:
        - containerPort: 80
---
# 2. Service
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 80
---
# 3. Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - www.example.com
    secretName: web-tls
  rules:
  - host: www.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

## 总结

|     组件     |       作用       |      访问范围       |
| :----------: | :--------------: | :-----------------: |
|  ClusterIP   | 集群内部负载均衡 |      集群内部       |
|   NodePort   |   节点端口暴露   | 集群外部（节点 IP） |
| LoadBalancer | 云平台负载均衡器 |  集群外部（公网）   |
|   Ingress    | HTTP/HTTPS 路由  |  集群外部（域名）   |

::: tip 最佳实践
1. 内部服务使用 ClusterIP
2. 开发测试环境使用 NodePort
3. 生产环境使用 LoadBalancer 或 Ingress
4. HTTP/HTTPS 服务优先使用 Ingress，节省资源
5. 配置 NetworkPolicy 增强安全性
:::
