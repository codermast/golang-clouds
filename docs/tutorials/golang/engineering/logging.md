---
order: 2
---

# Go - 日志系统

使用 zap 和 logrus 构建高性能结构化日志系统。

## zap

zap 是 Uber 开发的高性能日志库。

### 安装

```bash
go get -u go.uber.org/zap
```

### 快速使用

```go
import "go.uber.org/zap"

func main() {
    // 开发环境（人类可读格式）
    logger, _ := zap.NewDevelopment()
    defer logger.Sync()
    
    logger.Info("hello world",
        zap.String("key", "value"),
        zap.Int("count", 42),
    )
    
    // 生产环境（JSON 格式）
    logger, _ = zap.NewProduction()
    defer logger.Sync()
    
    logger.Info("hello world",
        zap.String("key", "value"),
    )
}
```

### Sugar Logger

```go
// Sugar logger 更易用，但性能略低
logger, _ := zap.NewDevelopment()
sugar := logger.Sugar()

// printf 风格
sugar.Infof("user %s logged in", username)

// 键值对
sugar.Infow("user logged in",
    "username", username,
    "ip", ip,
)
```

### 自定义配置

```go
import (
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

func NewLogger() *zap.Logger {
    config := zap.Config{
        Level:       zap.NewAtomicLevelAt(zap.InfoLevel),
        Development: false,
        Encoding:    "json",
        EncoderConfig: zapcore.EncoderConfig{
            TimeKey:        "time",
            LevelKey:       "level",
            NameKey:        "logger",
            CallerKey:      "caller",
            MessageKey:     "msg",
            StacktraceKey:  "stacktrace",
            LineEnding:     zapcore.DefaultLineEnding,
            EncodeLevel:    zapcore.LowercaseLevelEncoder,
            EncodeTime:     zapcore.ISO8601TimeEncoder,
            EncodeDuration: zapcore.SecondsDurationEncoder,
            EncodeCaller:   zapcore.ShortCallerEncoder,
        },
        OutputPaths:      []string{"stdout", "/var/log/app.log"},
        ErrorOutputPaths: []string{"stderr"},
    }
    
    logger, _ := config.Build()
    return logger
}
```

### 日志分割

```go
import (
    "gopkg.in/natefinch/lumberjack.v2"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

func NewLoggerWithRotation() *zap.Logger {
    // 日志分割配置
    writer := &lumberjack.Logger{
        Filename:   "/var/log/app.log",
        MaxSize:    100, // MB
        MaxBackups: 3,
        MaxAge:     28,  // days
        Compress:   true,
    }
    
    encoderConfig := zapcore.EncoderConfig{
        TimeKey:      "time",
        LevelKey:     "level",
        MessageKey:   "msg",
        EncodeLevel:  zapcore.LowercaseLevelEncoder,
        EncodeTime:   zapcore.ISO8601TimeEncoder,
    }
    
    core := zapcore.NewCore(
        zapcore.NewJSONEncoder(encoderConfig),
        zapcore.AddSync(writer),
        zap.InfoLevel,
    )
    
    return zap.New(core, zap.AddCaller())
}
```

### 全局 Logger

```go
var logger *zap.Logger

func Init() {
    logger, _ = zap.NewProduction()
}

func Info(msg string, fields ...zap.Field) {
    logger.Info(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
    logger.Error(msg, fields...)
}

// 使用
func main() {
    Init()
    defer logger.Sync()
    
    Info("user created",
        zap.Int("user_id", 1),
        zap.String("username", "张三"),
    )
}
```

## logrus

logrus 是功能丰富的结构化日志库。

### 安装

```bash
go get -u github.com/sirupsen/logrus
```

### 基本使用

```go
import log "github.com/sirupsen/logrus"

func main() {
    // 设置格式
    log.SetFormatter(&log.JSONFormatter{})
    
    // 设置级别
    log.SetLevel(log.InfoLevel)
    
    // 设置输出
    log.SetOutput(os.Stdout)
    
    // 记录日志
    log.Info("hello world")
    
    log.WithFields(log.Fields{
        "user_id":  1,
        "username": "张三",
    }).Info("user created")
}
```

### 自定义格式

```go
// JSON 格式
log.SetFormatter(&log.JSONFormatter{
    TimestampFormat: "2006-01-02 15:04:05",
    PrettyPrint:     true,
})

// 文本格式
log.SetFormatter(&log.TextFormatter{
    FullTimestamp:   true,
    TimestampFormat: "2006-01-02 15:04:05",
    DisableColors:   false,
})
```

### Hook

```go
import (
    "github.com/sirupsen/logrus"
)

// 自定义 Hook
type ErrorHook struct{}

func (h *ErrorHook) Levels() []logrus.Level {
    return []logrus.Level{logrus.ErrorLevel, logrus.FatalLevel}
}

func (h *ErrorHook) Fire(entry *logrus.Entry) error {
    // 发送告警
    sendAlert(entry.Message)
    return nil
}

// 使用
log.AddHook(&ErrorHook{})
```

## 日志最佳实践

### 1. 结构化日志

```go
// 不好
log.Printf("user %s logged in from %s", username, ip)

// 好
logger.Info("user logged in",
    zap.String("username", username),
    zap.String("ip", ip),
)
```

### 2. 日志级别

| 级别  | 用途                   |
| :---- | :--------------------- |
| Debug | 调试信息，生产环境关闭 |
| Info  | 重要业务流程           |
| Warn  | 潜在问题               |
| Error | 错误，需要关注         |
| Fatal | 致命错误，程序退出     |

### 3. 请求追踪

```go
// 中间件添加 request_id
func RequestIDMiddleware(logger *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        requestID := c.GetHeader("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }
        
        // 创建带 request_id 的 logger
        reqLogger := logger.With(zap.String("request_id", requestID))
        c.Set("logger", reqLogger)
        
        c.Header("X-Request-ID", requestID)
        c.Next()
    }
}

// 使用
func Handler(c *gin.Context) {
    logger := c.MustGet("logger").(*zap.Logger)
    logger.Info("handling request")
}
```

### 4. 错误日志

```go
// 记录错误堆栈
logger.Error("failed to process",
    zap.Error(err),
    zap.String("user_id", userID),
    zap.Any("request", request),
)

// 使用 zap 的 AddStacktrace
logger, _ := zap.NewProduction(
    zap.AddStacktrace(zap.ErrorLevel),
)
```

### 5. 敏感信息脱敏

```go
// 自定义类型进行脱敏
type SensitiveString string

func (s SensitiveString) String() string {
    if len(s) <= 4 {
        return "****"
    }
    return string(s)[:2] + "****" + string(s)[len(s)-2:]
}

// 使用
logger.Info("user info",
    zap.Stringer("phone", SensitiveString("13812345678")),
)
// 输出：phone: 13****78
```

### 6. 日志采样

```go
// 高频日志采样
config := zap.NewProductionConfig()
config.Sampling = &zap.SamplingConfig{
    Initial:    100, // 每秒前 100 条
    Thereafter: 100, // 之后每 100 条采样 1 条
}
logger, _ := config.Build()
```
