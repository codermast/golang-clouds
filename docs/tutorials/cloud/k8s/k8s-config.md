---
order : 6
---
# Kubernetes - ConfigMap 与 Secret

## 概述

在 Kubernetes 中，应用配置的最佳实践是将配置与容器镜像分离。Kubernetes 提供了两种资源来管理配置：

- **ConfigMap**：存储非敏感配置数据
- **Secret**：存储敏感数据（如密码、密钥、证书）

## ConfigMap

ConfigMap 用于存储非敏感的配置数据，以键值对的形式存储。

### 创建 ConfigMap

#### 方式一：从字面量创建

```bash
kubectl create configmap app-config \
  --from-literal=APP_ENV=production \
  --from-literal=APP_DEBUG=false \
  --from-literal=APP_PORT=8080
```

#### 方式二：从文件创建

```bash
# 从单个文件创建
kubectl create configmap nginx-config --from-file=nginx.conf

# 从目录创建（目录中的每个文件成为一个键）
kubectl create configmap app-config --from-file=config/

# 指定键名
kubectl create configmap app-config --from-file=my-key=config.properties
```

#### 方式三：从 YAML 文件创建

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # 简单键值对
  APP_ENV: production
  APP_DEBUG: "false"
  APP_PORT: "8080"
  
  # 多行配置文件
  application.properties: |
    server.port=8080
    spring.datasource.url=jdbc:mysql://localhost:3306/mydb
    spring.datasource.username=root
    
  # JSON 配置
  config.json: |
    {
      "database": {
        "host": "localhost",
        "port": 3306
      }
    }
```

```bash
kubectl apply -f configmap.yaml
```

### 使用 ConfigMap

#### 方式一：作为环境变量

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    env:
    # 引用单个键
    - name: APP_ENVIRONMENT
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: APP_ENV
    # 引用多个键
    - name: DEBUG_MODE
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: APP_DEBUG
```

#### 方式二：一次性注入所有配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    envFrom:
    - configMapRef:
        name: app-config
      prefix: CONFIG_  # 可选：添加前缀
```

#### 方式三：挂载为文件

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    volumeMounts:
    - name: config-volume
      mountPath: /etc/nginx/conf.d
      readOnly: true
  volumes:
  - name: config-volume
    configMap:
      name: nginx-config
      # 可选：设置文件权限
      defaultMode: 0644
```

#### 方式四：挂载特定的键

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
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      items:
      - key: application.properties
        path: app.properties  # 挂载后的文件名
      - key: config.json
        path: config.json
```

### ConfigMap 热更新

当 ConfigMap 以卷的形式挂载时，更新 ConfigMap 后，挂载的文件会自动更新（有延迟）。

```bash
# 更新 ConfigMap
kubectl edit configmap app-config

# 或使用 apply
kubectl apply -f configmap.yaml
```

::: warning 注意
- 环境变量不会自动更新，需要重启 Pod
- 卷挂载的更新有延迟（通常几秒到一分钟）
- 使用 subPath 挂载的文件不会自动更新
:::

## Secret

Secret 用于存储敏感数据，数据以 Base64 编码存储。

### Secret 类型

| 类型                                | 说明                |
| :---------------------------------- | :------------------ |
| Opaque                              | 通用密钥（默认）    |
| kubernetes.io/service-account-token | ServiceAccount 令牌 |
| kubernetes.io/dockerconfigjson      | Docker 镜像仓库认证 |
| kubernetes.io/tls                   | TLS 证书            |
| kubernetes.io/basic-auth            | 基本认证            |
| kubernetes.io/ssh-auth              | SSH 认证            |

### 创建 Secret

#### 方式一：从字面量创建

```bash
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=secret123
```

#### 方式二：从文件创建

```bash
# 从文件创建
kubectl create secret generic ssh-secret --from-file=id_rsa=~/.ssh/id_rsa

# 创建 TLS Secret
kubectl create secret tls tls-secret \
  --cert=path/to/cert.crt \
  --key=path/to/cert.key

# 创建 Docker 仓库认证
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=password \
  --docker-email=user@example.com
```

#### 方式三：从 YAML 文件创建

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  # 值必须是 Base64 编码
  username: YWRtaW4=      # echo -n 'admin' | base64
  password: c2VjcmV0MTIz  # echo -n 'secret123' | base64
```

或使用 `stringData`（明文，Kubernetes 自动编码）：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  username: admin
  password: secret123
```

### 使用 Secret

#### 方式一：作为环境变量

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
```

#### 方式二：一次性注入所有密钥

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    envFrom:
    - secretRef:
        name: db-secret
```

#### 方式三：挂载为文件

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
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: db-secret
      defaultMode: 0400  # 只读权限
```

#### 使用 Docker 仓库认证

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

### TLS Secret 示例

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
```

在 Ingress 中使用：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
spec:
  tls:
  - hosts:
    - example.com
    secretName: tls-secret
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

## 管理命令

### ConfigMap 命令

```bash
# 查看 ConfigMap
kubectl get configmaps
kubectl get cm

# 查看详情
kubectl describe configmap app-config

# 查看 YAML
kubectl get configmap app-config -o yaml

# 编辑
kubectl edit configmap app-config

# 删除
kubectl delete configmap app-config
```

### Secret 命令

```bash
# 查看 Secret
kubectl get secrets

# 查看详情（值不显示）
kubectl describe secret db-secret

# 查看 YAML（值 Base64 编码）
kubectl get secret db-secret -o yaml

# 解码查看值
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d

# 删除
kubectl delete secret db-secret
```

## 实战示例

### 完整的应用配置示例

```yaml
# 1. ConfigMap - 应用配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: production
  LOG_LEVEL: info
  application.yml: |
    server:
      port: 8080
    spring:
      application:
        name: myapp
      datasource:
        driver-class-name: com.mysql.cj.jdbc.Driver

---
# 2. Secret - 敏感信息
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
stringData:
  DB_HOST: mysql-service
  DB_PORT: "3306"
  DB_NAME: mydb
  DB_USERNAME: app_user
  DB_PASSWORD: super_secret_password

---
# 3. Deployment - 使用配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:1.0
        ports:
        - containerPort: 8080
        # 环境变量来自 ConfigMap
        envFrom:
        - configMapRef:
            name: app-config
        # 环境变量来自 Secret
        - secretRef:
            name: app-secret
        volumeMounts:
        # 配置文件挂载
        - name: config-volume
          mountPath: /app/config
        # 密钥文件挂载
        - name: secret-volume
          mountPath: /app/secrets
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: app-config
          items:
          - key: application.yml
            path: application.yml
      - name: secret-volume
        secret:
          secretName: app-secret
```

### 不同环境的配置

```yaml
# dev-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: dev
data:
  APP_ENV: development
  LOG_LEVEL: debug
  
---
# prod-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  APP_ENV: production
  LOG_LEVEL: warn
```

## 最佳实践

### 1. 配置分离

```
├── base/
│   ├── deployment.yaml
│   └── service.yaml
├── overlays/
│   ├── dev/
│   │   ├── configmap.yaml
│   │   └── secret.yaml
│   └── prod/
│       ├── configmap.yaml
│       └── secret.yaml
```

### 2. Secret 安全

- 使用 RBAC 限制 Secret 访问
- 考虑使用外部密钥管理系统（Vault、AWS Secrets Manager）
- 启用静态加密
- 避免在 Git 中存储明文 Secret

### 3. 配置版本化

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-v2  # 带版本号
  labels:
    version: "2"
data:
  # ...
```

### 4. 不可变配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
immutable: true  # 创建后不可修改
data:
  # ...
```

## ConfigMap vs Secret 对比

|   特性   | ConfigMap  |    Secret     |
| :------: | :--------: | :-----------: |
| 存储内容 | 非敏感配置 |   敏感数据    |
| 数据格式 |    明文    |  Base64 编码  |
| 大小限制 |    1MB     |      1MB      |
|   传输   |    明文    |   内存存储    |
| 访问控制 | 标准 RBAC  | 更严格的 RBAC |

::: tip 使用建议
1. 配置项较多时，优先使用配置文件而非环境变量
2. 敏感信息一定要用 Secret，不要用 ConfigMap
3. 生产环境考虑使用外部密钥管理系统
4. 使用 Kustomize 或 Helm 管理不同环境的配置
:::
