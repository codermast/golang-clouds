---
order: 8
---
# Linux - 常用脚本示例

## 概述

本文提供一些实用的 Shell 脚本示例，涵盖系统管理、文件处理、监控告警等常见场景。

## 系统信息

### 系统概览脚本

```bash
#!/bin/bash
# system-info.sh - 显示系统信息

echo "==================== 系统信息 ===================="
echo "主机名: $(hostname)"
echo "系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "内核: $(uname -r)"
echo "运行时间: $(uptime -p)"
echo ""

echo "==================== CPU 信息 ===================="
echo "CPU 型号: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d':' -f2)"
echo "CPU 核心: $(nproc) 核"
echo "负载均衡: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

echo "==================== 内存信息 ===================="
free -h | awk '
    NR==1 {printf "%-10s %10s %10s %10s\n", "", $1, $2, $3}
    NR==2 {printf "%-10s %10s %10s %10s\n", "内存:", $2, $3, $4}
    NR==3 {printf "%-10s %10s %10s %10s\n", "Swap:", $2, $3, $4}
'
echo ""

echo "==================== 磁盘信息 ===================="
df -h | grep -E '^/dev/' | awk '{printf "%-20s %10s %10s %10s %10s\n", $1, $2, $3, $4, $5}'
echo ""

echo "==================== 网络信息 ===================="
ip -4 addr | grep inet | awk '{print $NF": "$2}'
echo ""

echo "==================== 登录用户 ===================="
who
```

## 备份脚本

### 目录备份

```bash
#!/bin/bash
# backup.sh - 备份目录

# 配置
SOURCE_DIR="/var/www"
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.tar.gz"
KEEP_DAYS=7

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
echo "开始备份: $SOURCE_DIR"
tar -czvf "${BACKUP_DIR}/${BACKUP_FILE}" "$SOURCE_DIR"

if [ $? -eq 0 ]; then
    echo "备份成功: ${BACKUP_DIR}/${BACKUP_FILE}"
else
    echo "备份失败!" >&2
    exit 1
fi

# 清理旧备份
echo "清理 ${KEEP_DAYS} 天前的备份..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +${KEEP_DAYS} -delete

echo "备份完成!"
```

### MySQL 数据库备份

```bash
#!/bin/bash
# mysql-backup.sh - 备份 MySQL 数据库

# 配置
DB_HOST="localhost"
DB_USER="root"
DB_PASS="password"
DB_NAME="mydb"
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"

echo "开始备份数据库: $DB_NAME"
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "备份成功: $BACKUP_FILE"
    echo "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "备份失败!" >&2
    exit 1
fi

# 清理旧备份
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +${KEEP_DAYS} -delete

echo "备份完成!"
```

## 监控脚本

### 磁盘空间监控

```bash
#!/bin/bash
# disk-monitor.sh - 磁盘空间监控

THRESHOLD=80
EMAIL="admin@example.com"

check_disk() {
    df -h | grep -E '^/dev/' | while read line; do
        partition=$(echo $line | awk '{print $1}')
        usage=$(echo $line | awk '{print $5}' | tr -d '%')
        mount=$(echo $line | awk '{print $6}')
        
        if [ $usage -ge $THRESHOLD ]; then
            message="警告: $partition ($mount) 使用率 ${usage}%，超过阈值 ${THRESHOLD}%"
            echo "$message"
            # 发送邮件（需配置 mail）
            # echo "$message" | mail -s "磁盘空间告警" "$EMAIL"
        fi
    done
}

check_disk
```

### 进程监控

```bash
#!/bin/bash
# process-monitor.sh - 进程监控

PROCESS_NAME="nginx"
LOG_FILE="/var/log/process-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

check_process() {
    if pgrep -x "$PROCESS_NAME" > /dev/null; then
        log "$PROCESS_NAME 正在运行"
    else
        log "$PROCESS_NAME 未运行，尝试重启..."
        systemctl start "$PROCESS_NAME"
        
        sleep 5
        
        if pgrep -x "$PROCESS_NAME" > /dev/null; then
            log "$PROCESS_NAME 重启成功"
        else
            log "$PROCESS_NAME 重启失败!"
        fi
    fi
}

check_process
```

### 资源监控

```bash
#!/bin/bash
# resource-monitor.sh - 系统资源监控

LOG_FILE="/var/log/resource-monitor.log"
CPU_THRESHOLD=80
MEM_THRESHOLD=80

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# CPU 使用率
get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}'
}

# 内存使用率
get_mem_usage() {
    free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}'
}

cpu_usage=$(get_cpu_usage)
mem_usage=$(get_mem_usage)

log "CPU: ${cpu_usage}%, 内存: ${mem_usage}%"

if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
    log "警告: CPU 使用率过高!"
fi

if [ $mem_usage -gt $MEM_THRESHOLD ]; then
    log "警告: 内存使用率过高!"
fi
```

## 日志处理

### 日志分析

```bash
#!/bin/bash
# log-analyzer.sh - Nginx 访问日志分析

LOG_FILE="/var/log/nginx/access.log"

echo "==================== 访问统计 ===================="
echo ""

echo "总请求数:"
wc -l "$LOG_FILE"
echo ""

echo "Top 10 IP:"
awk '{print $1}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
echo ""

echo "Top 10 URL:"
awk '{print $7}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
echo ""

echo "HTTP 状态码分布:"
awk '{print $9}' "$LOG_FILE" | sort | uniq -c | sort -rn
echo ""

echo "每小时请求分布:"
awk '{print $4}' "$LOG_FILE" | cut -d: -f2 | sort | uniq -c | sort -k2n
```

### 日志清理

```bash
#!/bin/bash
# log-cleanup.sh - 清理旧日志

LOG_DIRS=(
    "/var/log/nginx"
    "/var/log/app"
)
KEEP_DAYS=30
DRY_RUN=false

for dir in "${LOG_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "处理目录: $dir"
        
        if $DRY_RUN; then
            find "$dir" -name "*.log" -mtime +${KEEP_DAYS} -print
            find "$dir" -name "*.log.*" -mtime +${KEEP_DAYS} -print
        else
            find "$dir" -name "*.log" -mtime +${KEEP_DAYS} -delete
            find "$dir" -name "*.log.*" -mtime +${KEEP_DAYS} -delete
        fi
    fi
done

echo "日志清理完成!"
```

## 批量操作

### 批量重命名

```bash
#!/bin/bash
# batch-rename.sh - 批量重命名文件

# 用法: ./batch-rename.sh <目录> <旧模式> <新模式>
DIR=${1:-.}
OLD_PATTERN=$2
NEW_PATTERN=$3

if [ -z "$OLD_PATTERN" ] || [ -z "$NEW_PATTERN" ]; then
    echo "用法: $0 <目录> <旧模式> <新模式>"
    echo "示例: $0 ./images .jpeg .jpg"
    exit 1
fi

count=0
for file in "$DIR"/*"$OLD_PATTERN"*; do
    if [ -f "$file" ]; then
        new_name="${file//$OLD_PATTERN/$NEW_PATTERN}"
        echo "重命名: $file -> $new_name"
        mv "$file" "$new_name"
        ((count++))
    fi
done

echo "共重命名 $count 个文件"
```

### 批量压缩图片

```bash
#!/bin/bash
# compress-images.sh - 批量压缩图片

# 需要安装 imagemagick
QUALITY=80
SOURCE_DIR=${1:-.}
OUTPUT_DIR="${SOURCE_DIR}/compressed"

mkdir -p "$OUTPUT_DIR"

for img in "$SOURCE_DIR"/*.{jpg,jpeg,png}; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "压缩: $filename"
        convert "$img" -quality $QUALITY "${OUTPUT_DIR}/${filename}"
    fi
done 2>/dev/null

echo "压缩完成! 输出目录: $OUTPUT_DIR"
```

## 服务管理

### 应用部署脚本

```bash
#!/bin/bash
# deploy.sh - 应用部署脚本

set -euo pipefail

APP_NAME="myapp"
APP_DIR="/opt/$APP_NAME"
BACKUP_DIR="/opt/backup"
REPO_URL="git@github.com:user/myapp.git"
BRANCH="main"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# 备份当前版本
backup() {
    if [ -d "$APP_DIR" ]; then
        log "备份当前版本..."
        BACKUP_FILE="${BACKUP_DIR}/${APP_NAME}_$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czvf "$BACKUP_FILE" -C "$(dirname $APP_DIR)" "$(basename $APP_DIR)"
        log "备份完成: $BACKUP_FILE"
    fi
}

# 拉取代码
pull_code() {
    if [ -d "$APP_DIR/.git" ]; then
        log "更新代码..."
        cd "$APP_DIR"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    else
        log "克隆代码..."
        git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    fi
}

# 安装依赖
install_deps() {
    log "安装依赖..."
    cd "$APP_DIR"
    if [ -f "package.json" ]; then
        npm install --production
    elif [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    elif [ -f "pom.xml" ]; then
        mvn clean package -DskipTests
    fi
}

# 重启服务
restart_service() {
    log "重启服务..."
    systemctl restart "$APP_NAME"
    sleep 3
    if systemctl is-active --quiet "$APP_NAME"; then
        log "服务启动成功"
    else
        log "服务启动失败!" >&2
        exit 1
    fi
}

# 主流程
main() {
    mkdir -p "$BACKUP_DIR"
    backup
    pull_code
    install_deps
    restart_service
    log "部署完成!"
}

main
```

### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh - 服务健康检查

SERVICES=(
    "nginx"
    "mysql"
    "redis"
)

URLS=(
    "http://localhost/health"
    "http://localhost:8080/api/health"
)

check_services() {
    echo "==================== 服务状态 ===================="
    for service in "${SERVICES[@]}"; do
        if systemctl is-active --quiet "$service"; then
            echo "✓ $service 运行中"
        else
            echo "✗ $service 未运行"
        fi
    done
}

check_urls() {
    echo ""
    echo "==================== HTTP 检查 ===================="
    for url in "${URLS[@]}"; do
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        if [ "$status" = "200" ]; then
            echo "✓ $url [${status}]"
        else
            echo "✗ $url [${status}]"
        fi
    done
}

check_ports() {
    echo ""
    echo "==================== 端口检查 ===================="
    for port in 80 443 3306 6379; do
        if ss -tlnp | grep -q ":$port "; then
            echo "✓ 端口 $port 监听中"
        else
            echo "✗ 端口 $port 未监听"
        fi
    done
}

check_services
check_urls
check_ports
```

## 实用工具

### 快速创建项目结构

```bash
#!/bin/bash
# create-project.sh - 创建项目目录结构

PROJECT_NAME=${1:-myproject}

mkdir -p "$PROJECT_NAME"/{src,tests,docs,scripts,config}
touch "$PROJECT_NAME"/{README.md,.gitignore}
touch "$PROJECT_NAME"/src/.gitkeep
touch "$PROJECT_NAME"/tests/.gitkeep

cat > "$PROJECT_NAME/README.md" << EOF
# $PROJECT_NAME

## 简介

项目描述

## 安装

\`\`\`bash
# 安装说明
\`\`\`

## 使用

\`\`\`bash
# 使用说明
\`\`\`
EOF

cat > "$PROJECT_NAME/.gitignore" << EOF
*.log
*.tmp
node_modules/
__pycache__/
.env
EOF

echo "项目 $PROJECT_NAME 创建完成!"
tree "$PROJECT_NAME"
```

### 端口查找

```bash
#!/bin/bash
# find-port.sh - 查找可用端口

START_PORT=${1:-8000}
END_PORT=${2:-9000}

for port in $(seq $START_PORT $END_PORT); do
    if ! ss -tlnp | grep -q ":$port "; then
        echo "可用端口: $port"
        exit 0
    fi
done

echo "在 $START_PORT-$END_PORT 范围内没有可用端口"
exit 1
```

### 批量 SSH 执行

```bash
#!/bin/bash
# ssh-batch.sh - 批量 SSH 执行命令

HOSTS=(
    "user@server1"
    "user@server2"
    "user@server3"
)
COMMAND="$*"

if [ -z "$COMMAND" ]; then
    echo "用法: $0 <命令>"
    exit 1
fi

for host in "${HOSTS[@]}"; do
    echo "==================== $host ===================="
    ssh -o ConnectTimeout=5 "$host" "$COMMAND" 2>&1
    echo ""
done
```

## 定时任务示例

### Crontab 配置

```bash
# 编辑 crontab
crontab -e

# 常用示例
# 每天凌晨 2 点备份
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1

# 每 5 分钟检查进程
*/5 * * * * /opt/scripts/process-monitor.sh

# 每小时清理临时文件
0 * * * * find /tmp -type f -mtime +1 -delete

# 每周日凌晨清理日志
0 0 * * 0 /opt/scripts/log-cleanup.sh

# 每月 1 号生成报告
0 9 1 * * /opt/scripts/monthly-report.sh
```

::: tip 脚本使用建议
1. 测试环境先验证脚本
2. 添加详细的日志记录
3. 设置适当的错误处理
4. 定期检查脚本执行结果
5. 使用版本控制管理脚本
:::
