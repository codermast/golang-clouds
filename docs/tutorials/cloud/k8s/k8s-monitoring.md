---
order : 9
---
# Kubernetes - 监控与日志

## 概述

在生产环境中，监控和日志是确保 Kubernetes 集群稳定运行的关键。本文介绍 Kubernetes 的监控和日志解决方案。

**核心组件：**
- **Metrics Server**：集群资源指标收集
- **Prometheus**：监控数据采集和存储
- **Grafana**：可视化监控面板
- **EFK/ELK Stack**：日志收集和分析

## Metrics Server

Metrics Server 是 Kubernetes 内置的资源监控组件，提供 CPU 和内存使用数据。

### 安装 Metrics Server

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

如果是本地测试环境（如 Minikube），可能需要添加参数：

```yaml
# 编辑 Deployment，添加启动参数
spec:
  containers:
  - args:
    - --kubelet-insecure-tls
    - --kubelet-preferred-address-types=InternalIP
```

### 使用 Metrics Server

```bash
# 查看节点资源使用
kubectl top nodes

# 查看 Pod 资源使用
kubectl top pods

# 查看特定命名空间
kubectl top pods -n kube-system

# 按内存排序
kubectl top pods --sort-by=memory

# 按 CPU 排序
kubectl top pods --sort-by=cpu

# 查看容器级别的指标
kubectl top pods --containers
```

输出示例：

```
NAME       CPU(cores)   MEMORY(bytes)
node-1     250m         1500Mi
node-2     180m         1200Mi

NAME                      CPU(cores)   MEMORY(bytes)
nginx-7c45b84548-abc12    10m          50Mi
redis-5f6f7d8b9-xyz34     25m          100Mi
```

## Prometheus 监控

Prometheus 是 CNCF 项目，是 Kubernetes 生态中最流行的监控解决方案。

### 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     Prometheus 架构                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Prometheus Server                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │ Retrieval   │  │   TSDB      │  │   HTTP Server   │   │   │
│  │  │ (抓取数据)   │  │ (时序数据库) │  │   (查询接口)     │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ▲                                       │               │
│         │ Pull                                  │ Query         │
│         │                                       ▼               │
│  ┌──────────────────┐                    ┌──────────────┐       │
│  │    Exporters     │                    │   Grafana    │       │
│  │ (Node/Pod/App)   │                    │   (可视化)    │       │
│  └──────────────────┘                    └──────────────┘       │
│         ▲                                       │               │
│         │                                       │               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Kubernetes Cluster                     │   │
│  │   [Node] [Node] [Pod] [Pod] [Service] [Deployment]       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 使用 Helm 安装

```bash
# 添加 Prometheus 仓库
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 创建命名空间
kubectl create namespace monitoring

# 安装 kube-prometheus-stack（包含 Prometheus、Grafana、AlertManager）
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f prometheus-values.yaml
```

`prometheus-values.yaml` 示例：

```yaml
# Prometheus 配置
prometheus:
  prometheusSpec:
    retention: 15d
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi

# Grafana 配置
grafana:
  adminPassword: admin123
  persistence:
    enabled: true
    size: 10Gi
  
# AlertManager 配置
alertmanager:
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          resources:
            requests:
              storage: 10Gi
```

### 访问 Prometheus

```bash
# 端口转发访问 Prometheus
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090

# 端口转发访问 Grafana
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80

# 端口转发访问 AlertManager
kubectl port-forward svc/prometheus-kube-prometheus-alertmanager -n monitoring 9093:9093
```

### PromQL 查询示例

```promql
# CPU 使用率
rate(container_cpu_usage_seconds_total{namespace="default"}[5m])

# 内存使用
container_memory_usage_bytes{namespace="default"}

# Pod 重启次数
kube_pod_container_status_restarts_total

# 请求延迟 P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# 节点可用内存百分比
(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
```

## Grafana 可视化

Grafana 提供强大的数据可视化能力。

### 配置数据源

1. 访问 Grafana（默认用户名/密码：admin/admin）
2. 进入 Configuration → Data Sources
3. 添加 Prometheus 数据源
4. URL 设置为 `http://prometheus-kube-prometheus-prometheus:9090`

### 导入 Dashboard

常用的 Dashboard ID：
- **315**：Kubernetes cluster monitoring
- **6417**：Kubernetes Cluster (Prometheus)
- **11455**：Kubernetes pods monitoring
- **1860**：Node Exporter Full

导入步骤：
1. 进入 Dashboards → Import
2. 输入 Dashboard ID
3. 选择 Prometheus 数据源
4. 点击 Import

### 自定义 Dashboard

```json
{
  "panels": [
    {
      "title": "CPU Usage",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(container_cpu_usage_seconds_total{namespace=\"default\"}[5m])",
          "legendFormat": "{{pod}}"
        }
      ]
    }
  ]
}
```

## 告警配置

### Prometheus 告警规则

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: custom-alerts
  namespace: monitoring
spec:
  groups:
  - name: kubernetes-apps
    rules:
    # Pod 频繁重启告警
    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
        description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is restarting frequently"
    
    # 高 CPU 使用率告警
    - alert: HighCPUUsage
      expr: (sum(rate(container_cpu_usage_seconds_total[5m])) by (pod) / sum(container_spec_cpu_quota/container_spec_cpu_period) by (pod)) > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage detected"
        description: "Pod {{ $labels.pod }} CPU usage is above 80%"
    
    # 高内存使用率告警
    - alert: HighMemoryUsage
      expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage detected"
        description: "Pod {{ $labels.pod }} memory usage is above 90%"
    
    # Pod 不在 Ready 状态
    - alert: PodNotReady
      expr: kube_pod_status_phase{phase!="Running",phase!="Succeeded"} == 1
      for: 10m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is not ready"
```

### AlertManager 配置

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-config
  namespace: monitoring
type: Opaque
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
    
    route:
      group_by: ['alertname', 'namespace']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 12h
      receiver: 'slack-notifications'
      routes:
      - match:
          severity: critical
        receiver: 'pagerduty'
    
    receivers:
    - name: 'slack-notifications'
      slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx'
        channel: '#alerts'
        text: '{{ .CommonAnnotations.description }}'
    
    - name: 'pagerduty'
      pagerduty_configs:
      - service_key: 'your-pagerduty-key'
```

## 日志管理

### 查看 Pod 日志

```bash
# 查看 Pod 日志
kubectl logs <pod-name>

# 实时跟踪
kubectl logs -f <pod-name>

# 查看最近 N 行
kubectl logs --tail=100 <pod-name>

# 查看多容器 Pod 的特定容器
kubectl logs <pod-name> -c <container-name>

# 查看之前容器的日志
kubectl logs <pod-name> --previous

# 查看最近 1 小时的日志
kubectl logs --since=1h <pod-name>
```

### EFK Stack（Elasticsearch + Fluentd + Kibana）

EFK 是 Kubernetes 最流行的日志收集方案。

**架构：**

```
┌─────────────────────────────────────────────────────────────────┐
│                        EFK Stack 架构                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Kibana                               │   │
│  │                    (可视化查询)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ▲                                   │
│                              │ Query                             │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Elasticsearch                           │   │
│  │                   (日志存储和索引)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ▲                                   │
│                              │ Push                              │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Fluentd/Fluent Bit                      │   │
│  │                   (日志采集 DaemonSet)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ▲               ▲               ▲                       │
│         │               │               │                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Node 1  │    │  Node 2  │    │  Node 3  │                  │
│  │ [Pod]    │    │ [Pod]    │    │ [Pod]    │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### 安装 EFK

```bash
# 安装 Elasticsearch
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch -n logging

# 安装 Kibana
helm install kibana elastic/kibana -n logging

# 安装 Fluent Bit
helm repo add fluent https://fluent.github.io/helm-charts
helm install fluent-bit fluent/fluent-bit -n logging
```

### Fluent Bit 配置

```yaml
# fluent-bit-values.yaml
config:
  service: |
    [SERVICE]
        Flush         5
        Daemon        Off
        Log_Level     info
        Parsers_File  parsers.conf
  
  inputs: |
    [INPUT]
        Name              tail
        Path              /var/log/containers/*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
        Mem_Buf_Limit     5MB
        Skip_Long_Lines   On
  
  filters: |
    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Merge_Log           On
        Keep_Log            Off
        K8S-Logging.Parser  On
        K8S-Logging.Exclude On
  
  outputs: |
    [OUTPUT]
        Name            es
        Match           *
        Host            elasticsearch-master
        Port            9200
        Logstash_Format On
        Logstash_Prefix kubernetes
        Retry_Limit     False
```

### Loki（轻量级日志方案）

Loki 是 Grafana Labs 推出的轻量级日志系统：

```bash
# 安装 Loki Stack
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack -n logging \
  --set grafana.enabled=true \
  --set promtail.enabled=true
```

## 应用级日志

### 日志格式标准化

建议应用使用 JSON 格式日志：

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "user-service",
  "trace_id": "abc123",
  "message": "User login successful",
  "user_id": "12345"
}
```

### 日志级别控制

通过 ConfigMap 控制日志级别：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "debug"  # trace, debug, info, warn, error
```

## 监控最佳实践

### 1. 黄金指标（Golden Signals）

- **延迟**：请求响应时间
- **流量**：请求数量
- **错误**：错误率
- **饱和度**：资源使用率

### 2. USE 方法

- **Utilization**：资源使用率
- **Saturation**：资源饱和度
- **Errors**：错误数量

### 3. 告警设置原则

```yaml
# 多级告警
- name: api-alerts
  rules:
  - alert: HighLatency
    expr: http_request_duration_seconds_p99 > 0.5
    for: 5m
    labels:
      severity: warning
  
  - alert: VeryHighLatency
    expr: http_request_duration_seconds_p99 > 1
    for: 2m
    labels:
      severity: critical
```

## 常用监控指标

| 类别 | 指标     | PromQL 示例                                       |
| :--- | :------- | :------------------------------------------------ |
| CPU  | 使用率   | `rate(container_cpu_usage_seconds_total[5m])`     |
| 内存 | 使用量   | `container_memory_usage_bytes`                    |
| 网络 | 接收流量 | `rate(container_network_receive_bytes_total[5m])` |
| 磁盘 | IO       | `rate(container_fs_writes_bytes_total[5m])`       |
| Pod  | 重启次数 | `kube_pod_container_status_restarts_total`        |
| 节点 | 状态     | `kube_node_status_condition`                      |

::: tip 总结
1. 使用 Metrics Server 获取基本指标
2. 使用 Prometheus + Grafana 进行深度监控
3. 使用 EFK/Loki 收集和分析日志
4. 合理设置告警，避免告警疲劳
5. 遵循黄金指标和 USE 方法
:::
