---
order: 5
---

# Go - Kubernetes 部署

在 Kubernetes 上部署和管理 Go 应用。

## 基础资源

### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
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
      - name: myapp
        image: myrepo/myapp:latest
        ports:
        - containerPort: 8080
        env:
        - name: APP_ENV
          value: production
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: myapp-config
              key: db_host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: myapp-secret
              key: db_password
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
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

### Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

### Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp-service
            port:
              number: 80
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
```

### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  db_host: "mysql-service"
  redis_host: "redis-service"
  config.yaml: |
    server:
      port: 8080
    database:
      host: mysql-service
      port: 3306
```

### Secret

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secret
type: Opaque
data:
  db_password: cGFzc3dvcmQ=  # base64 encoded
  jwt_secret: bXktc2VjcmV0LWtleQ==
```

## 高级配置

### HPA（自动扩缩容）

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### PDB（Pod 中断预算）

```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: myapp
```

### NetworkPolicy

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myapp-network-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: mysql
    ports:
    - protocol: TCP
      port: 3306
```

## Helm

### Chart 结构

```
myapp/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── hpa.yaml
│   └── _helpers.tpl
```

### Chart.yaml

```yaml
apiVersion: v2
name: myapp
description: My Go Application
version: 0.1.0
appVersion: "1.0.0"
```

### values.yaml

```yaml
replicaCount: 3

image:
  repository: myrepo/myapp
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  host: myapp.example.com

resources:
  requests:
    memory: 128Mi
    cpu: 100m
  limits:
    memory: 256Mi
    cpu: 500m

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilization: 70

config:
  dbHost: mysql-service
  redisHost: redis-service
```

### 模板示例

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: 8080
        resources:
          {{- toYaml .Values.resources | nindent 12 }}
```

### Helm 命令

```bash
# 安装
helm install myapp ./myapp

# 升级
helm upgrade myapp ./myapp

# 使用自定义 values
helm install myapp ./myapp -f values-prod.yaml

# 设置值
helm install myapp ./myapp --set image.tag=v1.0.0

# 卸载
helm uninstall myapp

# 查看渲染结果
helm template myapp ./myapp
```

## 健康检查接口

```go
package main

import (
    "net/http"
    "sync/atomic"
    "github.com/gin-gonic/gin"
)

var (
    healthy int32 = 1
    ready   int32 = 0
)

func main() {
    r := gin.Default()
    
    // 存活检查
    r.GET("/health", func(c *gin.Context) {
        if atomic.LoadInt32(&healthy) == 1 {
            c.JSON(http.StatusOK, gin.H{"status": "healthy"})
        } else {
            c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy"})
        }
    })
    
    // 就绪检查
    r.GET("/ready", func(c *gin.Context) {
        if atomic.LoadInt32(&ready) == 1 {
            c.JSON(http.StatusOK, gin.H{"status": "ready"})
        } else {
            c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not ready"})
        }
    })
    
    // 初始化完成后设置就绪
    go func() {
        // 初始化数据库、缓存等...
        initDB()
        initCache()
        atomic.StoreInt32(&ready, 1)
    }()
    
    r.Run(":8080")
}

// 优雅关闭
func gracefulShutdown() {
    // 设置为不健康，停止接收新请求
    atomic.StoreInt32(&healthy, 0)
    
    // 等待现有请求完成
    time.Sleep(5 * time.Second)
    
    // 清理资源
    cleanup()
}
```

## 监控

### Prometheus 指标

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    requestCount = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "path", "status"},
    )
    
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path"},
    )
)

func init() {
    prometheus.MustRegister(requestCount, requestDuration)
}

// 中间件
func PrometheusMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        
        c.Next()
        
        duration := time.Since(start).Seconds()
        status := strconv.Itoa(c.Writer.Status())
        
        requestCount.WithLabelValues(c.Request.Method, c.FullPath(), status).Inc()
        requestDuration.WithLabelValues(c.Request.Method, c.FullPath()).Observe(duration)
    }
}

func main() {
    r := gin.Default()
    r.Use(PrometheusMiddleware())
    
    // Prometheus 指标端点
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))
    
    r.Run(":8080")
}
```

### ServiceMonitor

```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-monitor
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
```

## 常用命令

```bash
# 应用配置
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# 查看资源
kubectl get pods
kubectl get deployments
kubectl get services

# 查看日志
kubectl logs -f deployment/myapp

# 进入容器
kubectl exec -it pod/myapp-xxx -- sh

# 扩缩容
kubectl scale deployment myapp --replicas=5

# 滚动更新
kubectl set image deployment/myapp myapp=myrepo/myapp:v2.0.0

# 回滚
kubectl rollout undo deployment/myapp

# 查看部署状态
kubectl rollout status deployment/myapp

# 端口转发（本地调试）
kubectl port-forward service/myapp-service 8080:80
```
