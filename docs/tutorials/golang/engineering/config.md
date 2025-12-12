---
order: 3
---

# Go - 配置管理

使用 viper 进行配置管理，支持多种配置格式和配置中心。

## Viper

### 安装

```bash
go get -u github.com/spf13/viper
```

### 基本使用

```go
import "github.com/spf13/viper"

func main() {
    // 设置配置文件
    viper.SetConfigName("config")     // 配置文件名（不带扩展名）
    viper.SetConfigType("yaml")        // 配置文件类型
    viper.AddConfigPath("./configs")   // 配置文件路径
    viper.AddConfigPath(".")           // 当前目录
    
    // 读取配置
    if err := viper.ReadInConfig(); err != nil {
        panic(err)
    }
    
    // 获取配置值
    port := viper.GetInt("server.port")
    host := viper.GetString("server.host")
    debug := viper.GetBool("server.debug")
}
```

### 配置文件示例

```yaml
# config.yaml
server:
  host: localhost
  port: 8080
  debug: true

database:
  driver: mysql
  host: localhost
  port: 3306
  user: root
  password: password
  dbname: mydb

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

jwt:
  secret: my-secret-key
  expire: 3600
```

### 绑定结构体

```go
type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
    Redis    RedisConfig    `mapstructure:"redis"`
    JWT      JWTConfig      `mapstructure:"jwt"`
}

type ServerConfig struct {
    Host  string `mapstructure:"host"`
    Port  int    `mapstructure:"port"`
    Debug bool   `mapstructure:"debug"`
}

type DatabaseConfig struct {
    Driver   string `mapstructure:"driver"`
    Host     string `mapstructure:"host"`
    Port     int    `mapstructure:"port"`
    User     string `mapstructure:"user"`
    Password string `mapstructure:"password"`
    DBName   string `mapstructure:"dbname"`
}

type RedisConfig struct {
    Host     string `mapstructure:"host"`
    Port     int    `mapstructure:"port"`
    Password string `mapstructure:"password"`
    DB       int    `mapstructure:"db"`
}

type JWTConfig struct {
    Secret string `mapstructure:"secret"`
    Expire int    `mapstructure:"expire"`
}

var Cfg Config

func LoadConfig(path string) error {
    viper.SetConfigFile(path)
    
    if err := viper.ReadInConfig(); err != nil {
        return err
    }
    
    if err := viper.Unmarshal(&Cfg); err != nil {
        return err
    }
    
    return nil
}
```

### 环境变量

```go
// 自动绑定环境变量
viper.AutomaticEnv()

// 设置环境变量前缀
viper.SetEnvPrefix("APP")

// 环境变量替换
viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

// 绑定特定环境变量
viper.BindEnv("database.password", "DB_PASSWORD")

// 使用
// 环境变量 APP_SERVER_PORT=9090 会覆盖 server.port
```

### 默认值

```go
// 设置默认值
viper.SetDefault("server.port", 8080)
viper.SetDefault("server.host", "localhost")
viper.SetDefault("database.driver", "mysql")

// 获取时如果没有配置会返回默认值
port := viper.GetInt("server.port")
```

### 监听配置变化

```go
import "github.com/fsnotify/fsnotify"

viper.WatchConfig()
viper.OnConfigChange(func(e fsnotify.Event) {
    fmt.Println("配置文件变化:", e.Name)
    
    // 重新加载配置
    if err := viper.Unmarshal(&Cfg); err != nil {
        fmt.Println("重新加载配置失败:", err)
    }
})
```

### 多环境配置

```go
// 根据环境加载不同配置
func LoadConfigByEnv() error {
    env := os.Getenv("APP_ENV")
    if env == "" {
        env = "dev"
    }
    
    // 加载基础配置
    viper.SetConfigFile("configs/config.yaml")
    if err := viper.ReadInConfig(); err != nil {
        return err
    }
    
    // 加载环境配置（覆盖）
    viper.SetConfigFile(fmt.Sprintf("configs/config.%s.yaml", env))
    if err := viper.MergeInConfig(); err != nil {
        // 环境配置文件可选
        if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
            return err
        }
    }
    
    return viper.Unmarshal(&Cfg)
}
```

## 命令行参数

### 使用 flag

```go
import "flag"

var (
    configPath string
    port       int
    debug      bool
)

func init() {
    flag.StringVar(&configPath, "config", "config.yaml", "配置文件路径")
    flag.IntVar(&port, "port", 8080, "服务端口")
    flag.BoolVar(&debug, "debug", false, "调试模式")
}

func main() {
    flag.Parse()
    
    // 命令行参数绑定到 viper
    viper.Set("server.port", port)
    viper.Set("server.debug", debug)
}
```

### 使用 cobra

```bash
go get -u github.com/spf13/cobra
```

```go
import "github.com/spf13/cobra"

var rootCmd = &cobra.Command{
    Use:   "myapp",
    Short: "My application",
    Run: func(cmd *cobra.Command, args []string) {
        // 主逻辑
    },
}

func init() {
    rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "配置文件")
    rootCmd.Flags().IntP("port", "p", 8080, "服务端口")
    
    // 绑定到 viper
    viper.BindPFlag("server.port", rootCmd.Flags().Lookup("port"))
}

func main() {
    if err := rootCmd.Execute(); err != nil {
        os.Exit(1)
    }
}
```

## 配置中心

### Nacos

```go
import (
    "github.com/nacos-group/nacos-sdk-go/v2/clients"
    "github.com/nacos-group/nacos-sdk-go/v2/common/constant"
    "github.com/nacos-group/nacos-sdk-go/v2/vo"
)

func LoadConfigFromNacos() error {
    // 服务端配置
    sc := []constant.ServerConfig{
        {
            IpAddr: "localhost",
            Port:   8848,
        },
    }
    
    // 客户端配置
    cc := constant.ClientConfig{
        NamespaceId: "public",
        TimeoutMs:   5000,
    }
    
    // 创建配置客户端
    client, err := clients.NewConfigClient(
        vo.NacosClientParam{
            ClientConfig:  &cc,
            ServerConfigs: sc,
        },
    )
    if err != nil {
        return err
    }
    
    // 获取配置
    content, err := client.GetConfig(vo.ConfigParam{
        DataId: "myapp",
        Group:  "DEFAULT_GROUP",
    })
    if err != nil {
        return err
    }
    
    // 解析配置
    viper.SetConfigType("yaml")
    if err := viper.ReadConfig(strings.NewReader(content)); err != nil {
        return err
    }
    
    // 监听配置变化
    client.ListenConfig(vo.ConfigParam{
        DataId: "myapp",
        Group:  "DEFAULT_GROUP",
        OnChange: func(namespace, group, dataId, data string) {
            fmt.Println("配置变化")
            viper.ReadConfig(strings.NewReader(data))
            viper.Unmarshal(&Cfg)
        },
    })
    
    return viper.Unmarshal(&Cfg)
}
```

## 配置加密

### 使用 Jasypt

```go
import "github.com/Luzifer/go-openssl/v4"

func DecryptPassword(encrypted string, passphrase string) (string, error) {
    o := openssl.New()
    dec, err := o.DecryptBytes(passphrase, []byte(encrypted), openssl.PBKDF2SHA256)
    if err != nil {
        return "", err
    }
    return string(dec), nil
}

// 配置文件中
// database:
//   password: ENC(U2FsdGVkX1+...)

// 加载时解密
func LoadConfig() error {
    if err := viper.ReadInConfig(); err != nil {
        return err
    }
    
    // 解密敏感配置
    encPassword := viper.GetString("database.password")
    if strings.HasPrefix(encPassword, "ENC(") {
        encrypted := encPassword[4 : len(encPassword)-1]
        password, err := DecryptPassword(encrypted, os.Getenv("CONFIG_KEY"))
        if err != nil {
            return err
        }
        viper.Set("database.password", password)
    }
    
    return viper.Unmarshal(&Cfg)
}
```

## 最佳实践

### 1. 配置分层

```
configs/
├── config.yaml          # 基础配置
├── config.dev.yaml      # 开发环境
├── config.test.yaml     # 测试环境
└── config.prod.yaml     # 生产环境
```

### 2. 敏感信息处理

```yaml
# 不要在配置文件中存储敏感信息
database:
  password: ${DB_PASSWORD}  # 使用环境变量

# 或使用加密
database:
  password: ENC(encrypted_value)
```

### 3. 配置验证

```go
import "github.com/go-playground/validator/v10"

type Config struct {
    Server struct {
        Port int `mapstructure:"port" validate:"required,min=1,max=65535"`
        Host string `mapstructure:"host" validate:"required"`
    } `mapstructure:"server"`
}

func ValidateConfig(cfg *Config) error {
    validate := validator.New()
    return validate.Struct(cfg)
}
```
