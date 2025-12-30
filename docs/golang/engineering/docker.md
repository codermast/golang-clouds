---
order: 4
---

# Go - Docker 部署

使用 Docker 容器化部署 Go 应用。

## Dockerfile

### 基础 Dockerfile

```dockerfile
FROM golang:1.21

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main .

EXPOSE 8080

CMD ["./main"]
```

### 多阶段构建（推荐）

```dockerfile
# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源码
COPY . .

# 编译
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 运行阶段
FROM alpine:latest

# 安装证书（HTTPS 请求需要）
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/main .
COPY --from=builder /app/configs ./configs

# 设置时区
ENV TZ=Asia/Shanghai

EXPOSE 8080

CMD ["./main"]
```

### 更小的镜像

```dockerfile
# 使用 scratch（最小镜像）
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# 静态编译
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o main .

# 使用 scratch 基础镜像
FROM scratch

COPY --from=builder /app/main /main
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080

ENTRYPOINT ["/main"]
```

### 带版本信息

```dockerfile
FROM golang:1.21-alpine AS builder

ARG VERSION=dev
ARG BUILD_TIME
ARG GIT_COMMIT

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build \
    -ldflags="-X main.Version=${VERSION} -X main.BuildTime=${BUILD_TIME} -X main.GitCommit=${GIT_COMMIT}" \
    -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
```

```go
// main.go
package main

var (
    Version   = "dev"
    BuildTime = "unknown"
    GitCommit = "unknown"
)

func main() {
    fmt.Printf("Version: %s\n", Version)
    fmt.Printf("Build Time: %s\n", BuildTime)
    fmt.Printf("Git Commit: %s\n", GitCommit)
    // ...
}
```

```bash
# 构建
docker build \
    --build-arg VERSION=v1.0.0 \
    --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
    --build-arg GIT_COMMIT=$(git rev-parse HEAD) \
    -t myapp:v1.0.0 .
```

## Docker Compose

### 基础配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - APP_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    networks:
      - app-network

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: mydb
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mysql-data:
```

### 开发环境

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    volumes:
      - .:/app
    environment:
      - APP_ENV=development
      - GIN_MODE=debug
    command: air  # 热重载

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: mydb

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

```dockerfile
# Dockerfile.dev
FROM golang:1.21

WORKDIR /app

# 安装 air（热重载工具）
RUN go install github.com/cosmtrek/air@latest

COPY go.mod go.sum ./
RUN go mod download

CMD ["air"]
```

### 生产环境

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: myapp:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    ports:
      - "8080:8080"
    environment:
      - APP_ENV=production
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 优化技巧

### 1. 利用缓存

```dockerfile
# 先复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 再复制源码
COPY . .

# 这样源码变化时，不需要重新下载依赖
```

### 2. 使用 .dockerignore

```
# .dockerignore
.git
.gitignore
*.md
Dockerfile
docker-compose*.yml
.env*
tmp/
logs/
*.test
*_test.go
```

### 3. 减小镜像大小

```dockerfile
# 使用 alpine 镜像
FROM golang:1.21-alpine

# 删除不需要的文件
RUN rm -rf /var/cache/apk/*

# 使用 -ldflags 减小二进制大小
RUN go build -ldflags="-w -s" -o main .

# -w 去除调试信息
# -s 去除符号表
```

### 4. 非 root 用户运行

```dockerfile
FROM alpine:latest

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/main .

# 切换用户
USER appuser

EXPOSE 8080

CMD ["./main"]
```

### 5. 健康检查

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/health || exit 1
```

```go
// 健康检查接口
r.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{
        "status": "ok",
        "time":   time.Now().Format(time.RFC3339),
    })
})
```

## 常用命令

```bash
# 构建镜像
docker build -t myapp:latest .

# 运行容器
docker run -d -p 8080:8080 --name myapp myapp:latest

# 查看日志
docker logs -f myapp

# 进入容器
docker exec -it myapp sh

# Docker Compose
docker-compose up -d
docker-compose down
docker-compose logs -f app

# 清理
docker system prune -a
docker volume prune
```

## CI/CD 集成

### GitHub Actions

```yaml
# .github/workflows/docker.yml
name: Docker Build

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            myrepo/myapp:latest
            myrepo/myapp:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```
