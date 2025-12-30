---
order : 8
---
# Kubernetes - Helm 包管理

## 概述

Helm 是 Kubernetes 的包管理工具，类似于 apt/yum/npm。它允许开发者打包、配置和部署 Kubernetes 应用，大大简化了复杂应用的部署和管理。

### 核心概念

| 概念       | 说明                                |
| :--------- | :---------------------------------- |
| Chart      | Helm 包，包含 Kubernetes 资源的模板 |
| Repository | 存放 Chart 的仓库                   |
| Release    | Chart 的一次部署实例                |
| Values     | Chart 的配置参数                    |

## 安装 Helm

### macOS

```bash
brew install helm
```

### Linux

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Windows

```powershell
choco install kubernetes-helm
```

### 验证安装

```bash
helm version
```

## 基本使用

### 添加仓库

```bash
# 添加官方仓库
helm repo add stable https://charts.helm.sh/stable

# 添加 Bitnami 仓库
helm repo add bitnami https://charts.bitnami.com/bitnami

# 更新仓库索引
helm repo update

# 查看已添加的仓库
helm repo list

# 删除仓库
helm repo remove stable
```

### 搜索 Chart

```bash
# 在仓库中搜索
helm search repo nginx

# 在 Artifact Hub 搜索
helm search hub nginx

# 查看所有版本
helm search repo nginx --versions
```

### 安装 Chart

```bash
# 基本安装
helm install my-nginx bitnami/nginx

# 指定命名空间
helm install my-nginx bitnami/nginx -n production

# 指定版本
helm install my-nginx bitnami/nginx --version 15.0.0

# 自定义配置
helm install my-nginx bitnami/nginx --set service.type=NodePort

# 使用 values 文件
helm install my-nginx bitnami/nginx -f custom-values.yaml

# 生成名称
helm install bitnami/nginx --generate-name

# 模拟安装（不实际执行）
helm install my-nginx bitnami/nginx --dry-run
```

### 查看 Release

```bash
# 查看所有 Release
helm list
helm ls

# 查看所有命名空间
helm list -A

# 查看特定状态
helm list --pending
helm list --failed

# 查看 Release 详情
helm status my-nginx

# 查看 Release 历史
helm history my-nginx
```

### 升级 Release

```bash
# 升级
helm upgrade my-nginx bitnami/nginx

# 升级并安装（不存在则安装）
helm upgrade --install my-nginx bitnami/nginx

# 升级并修改配置
helm upgrade my-nginx bitnami/nginx --set replicaCount=3

# 重用上次的配置
helm upgrade my-nginx bitnami/nginx --reuse-values

# 重置所有配置
helm upgrade my-nginx bitnami/nginx --reset-values
```

### 回滚 Release

```bash
# 查看历史
helm history my-nginx

# 回滚到上一版本
helm rollback my-nginx

# 回滚到指定版本
helm rollback my-nginx 2
```

### 卸载 Release

```bash
# 卸载
helm uninstall my-nginx

# 保留历史记录
helm uninstall my-nginx --keep-history
```

## 配置管理

### 查看默认配置

```bash
# 查看 Chart 的默认 values
helm show values bitnami/nginx

# 保存到文件
helm show values bitnami/nginx > values.yaml
```

### 自定义配置

创建 `custom-values.yaml`：

```yaml
# 副本数
replicaCount: 3

# 镜像配置
image:
  registry: docker.io
  repository: bitnami/nginx
  tag: 1.25.0

# 服务配置
service:
  type: NodePort
  port: 80
  nodePort: 30080

# 资源限制
resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

# 启用 Ingress
ingress:
  enabled: true
  hostname: nginx.example.com
  annotations:
    kubernetes.io/ingress.class: nginx
```

安装时使用：

```bash
helm install my-nginx bitnami/nginx -f custom-values.yaml
```

### 多个 Values 文件

```bash
# 后面的文件优先级更高
helm install my-nginx bitnami/nginx \
  -f base-values.yaml \
  -f production-values.yaml
```

### 命令行覆盖

```bash
# --set 优先级最高
helm install my-nginx bitnami/nginx \
  -f values.yaml \
  --set replicaCount=5 \
  --set service.type=LoadBalancer
```

## 创建 Chart

### 初始化 Chart

```bash
# 创建新 Chart
helm create mychart

# 目录结构
mychart/
├── Chart.yaml          # Chart 元信息
├── values.yaml         # 默认配置
├── charts/             # 依赖的 Chart
├── templates/          # Kubernetes 资源模板
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── serviceaccount.yaml
│   ├── _helpers.tpl    # 模板辅助函数
│   ├── NOTES.txt       # 安装后的提示信息
│   └── tests/          # 测试
└── .helmignore         # 忽略文件
```

### Chart.yaml

```yaml
apiVersion: v2
name: mychart
description: A Helm chart for my application
type: application
version: 0.1.0        # Chart 版本
appVersion: "1.0.0"   # 应用版本

keywords:
  - web
  - nginx

home: https://github.com/example/mychart
sources:
  - https://github.com/example/mychart

maintainers:
  - name: John Doe
    email: john@example.com

dependencies:
  - name: mysql
    version: "9.0.0"
    repository: https://charts.bitnami.com/bitnami
    condition: mysql.enabled
```

### values.yaml

```yaml
# 应用名称
nameOverride: ""
fullnameOverride: ""

# 副本数
replicaCount: 1

# 镜像配置
image:
  repository: nginx
  tag: "1.21"
  pullPolicy: IfNotPresent

# 服务配置
service:
  type: ClusterIP
  port: 80

# Ingress 配置
ingress:
  enabled: false
  className: nginx
  hosts:
    - host: chart-example.local
      paths:
        - path: /
          pathType: Prefix

# 资源配置
resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 50m
    memory: 64Mi

# 自动扩缩
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

# 节点选择
nodeSelector: {}

# 容忍
tolerations: []

# 亲和性
affinity: {}
```

### 模板语法

#### 基本语法

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "mychart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "mychart.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: 80
        {{- if .Values.resources }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
        {{- end }}
```

#### 条件判断

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "mychart.fullname" . }}
spec:
  # ...
{{- end }}
```

#### 循环

```yaml
{{- range .Values.ingress.hosts }}
- host: {{ .host }}
  http:
    paths:
    {{- range .paths }}
    - path: {{ .path }}
      pathType: {{ .pathType }}
    {{- end }}
{{- end }}
```

#### 辅助模板

```yaml
# templates/_helpers.tpl
{{- define "mychart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "mychart.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ include "mychart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
```

### 内置对象

| 对象          | 说明                               |
| :------------ | :--------------------------------- |
| .Values       | values.yaml 中的配置               |
| .Release      | Release 信息（Name、Namespace 等） |
| .Chart        | Chart.yaml 中的信息                |
| .Files        | 访问 Chart 中的文件                |
| .Capabilities | 集群能力信息                       |
| .Template     | 当前模板信息                       |

## Chart 打包和发布

### 验证 Chart

```bash
# 语法检查
helm lint mychart

# 模板渲染预览
helm template my-release mychart

# 模拟安装
helm install my-release mychart --dry-run --debug
```

### 打包 Chart

```bash
# 打包
helm package mychart

# 输出：mychart-0.1.0.tgz
```

### 发布到仓库

```bash
# 创建本地仓库
helm repo index . --url https://charts.example.com

# 上传到 GitHub Pages、S3 等
```

## 依赖管理

### 定义依赖

在 `Chart.yaml` 中：

```yaml
dependencies:
  - name: mysql
    version: "9.x.x"
    repository: https://charts.bitnami.com/bitnami
  - name: redis
    version: "17.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

### 管理依赖

```bash
# 下载依赖
helm dependency update mychart

# 查看依赖
helm dependency list mychart

# 重新构建依赖
helm dependency build mychart
```

## 实用技巧

### 查看实际渲染的资源

```bash
# 查看将要部署的资源
helm get manifest my-release

# 查看安装时的 values
helm get values my-release

# 查看所有信息
helm get all my-release
```

### 调试模板

```bash
# 详细输出
helm install my-release mychart --debug

# 只渲染特定模板
helm template my-release mychart -s templates/deployment.yaml
```

### 从 Release 导出

```bash
# 导出当前配置
helm get values my-release > current-values.yaml
```

## 常用 Chart 推荐

| Chart         | 仓库                            | 用途           |
| :------------ | :------------------------------ | :------------- |
| nginx         | bitnami/nginx                   | Web 服务器     |
| mysql         | bitnami/mysql                   | 数据库         |
| redis         | bitnami/redis                   | 缓存           |
| prometheus    | prometheus-community/prometheus | 监控           |
| grafana       | grafana/grafana                 | 可视化         |
| cert-manager  | jetstack/cert-manager           | 证书管理       |
| ingress-nginx | ingress-nginx/ingress-nginx     | Ingress 控制器 |

## 总结

|       命令       | 作用              |
| :--------------: | :---------------- |
|  helm repo add   | 添加仓库          |
| helm search repo | 搜索 Chart        |
|   helm install   | 安装 Release      |
|   helm upgrade   | 升级 Release      |
|  helm rollback   | 回滚 Release      |
|  helm uninstall  | 卸载 Release      |
|    helm list     | 查看 Release 列表 |
|   helm create    | 创建 Chart        |
|   helm package   | 打包 Chart        |
|    helm lint     | 检查 Chart        |

::: tip 最佳实践
1. 始终使用版本锁定 `--version`
2. 使用 values 文件而非 `--set`
3. 为不同环境创建不同的 values 文件
4. 定期更新仓库索引 `helm repo update`
5. 生产环境升级前先 `--dry-run`
:::
