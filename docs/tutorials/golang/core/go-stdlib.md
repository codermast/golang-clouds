---
order: 10
---

# Go - 标准库

Go 的标准库非常丰富，涵盖了大部分常见的开发需求。

## fmt - 格式化 I/O

```go
import "fmt"

// 打印
fmt.Print("Hello")      // 不换行
fmt.Println("Hello")    // 换行
fmt.Printf("%s\n", "Hello")  // 格式化

// 格式化为字符串
s := fmt.Sprintf("Name: %s, Age: %d", "张三", 25)

// 扫描输入
var name string
var age int
fmt.Scan(&name, &age)
fmt.Scanf("%s %d", &name, &age)
```

### 格式化占位符

| 占位符 | 说明             |
| :----- | :--------------- |
| %v     | 默认格式         |
| %+v    | 带字段名的结构体 |
| %#v    | Go 语法表示      |
| %T     | 类型             |
| %d     | 十进制整数       |
| %b     | 二进制           |
| %o     | 八进制           |
| %x     | 十六进制         |
| %f     | 浮点数           |
| %e     | 科学计数法       |
| %s     | 字符串           |
| %q     | 带引号的字符串   |
| %p     | 指针             |
| %t     | 布尔值           |

## strings - 字符串操作

```go
import "strings"

s := "Hello, World!"

// 查找
strings.Contains(s, "World")     // true
strings.HasPrefix(s, "Hello")    // true
strings.HasSuffix(s, "!")        // true
strings.Index(s, "W")            // 7
strings.Count(s, "l")            // 3

// 转换
strings.ToUpper(s)               // HELLO, WORLD!
strings.ToLower(s)               // hello, world!
strings.Title("hello world")     // Hello World

// 修剪
strings.TrimSpace("  hello  ")   // "hello"
strings.Trim("!!hello!!", "!")   // "hello"
strings.TrimPrefix("hello", "he")// "llo"
strings.TrimSuffix("hello", "lo")// "hel"

// 分割和连接
strings.Split("a,b,c", ",")      // ["a", "b", "c"]
strings.Join([]string{"a", "b"}, "-")  // "a-b"

// 替换
strings.Replace(s, "o", "0", -1) // Hell0, W0rld!
strings.ReplaceAll(s, "o", "0")  // Hell0, W0rld!

// 构建
var builder strings.Builder
builder.WriteString("Hello")
builder.WriteString(" ")
builder.WriteString("World")
result := builder.String()
```

## strconv - 字符串转换

```go
import "strconv"

// 字符串 <-> 整数
i, _ := strconv.Atoi("42")       // string -> int
s := strconv.Itoa(42)            // int -> string

// 解析
i64, _ := strconv.ParseInt("42", 10, 64)
f64, _ := strconv.ParseFloat("3.14", 64)
b, _ := strconv.ParseBool("true")

// 格式化
s := strconv.FormatInt(42, 10)
s := strconv.FormatFloat(3.14, 'f', 2, 64)
s := strconv.FormatBool(true)
```

## time - 时间处理

```go
import "time"

// 当前时间
now := time.Now()

// 创建时间
t := time.Date(2024, 1, 1, 12, 0, 0, 0, time.Local)

// 时间格式化（使用参考时间 2006-01-02 15:04:05）
s := now.Format("2006-01-02 15:04:05")
s := now.Format(time.RFC3339)

// 解析时间
t, _ := time.Parse("2006-01-02", "2024-01-01")
t, _ := time.ParseInLocation("2006-01-02 15:04:05", "2024-01-01 12:00:00", time.Local)

// 时间运算
tomorrow := now.Add(24 * time.Hour)
yesterday := now.Add(-24 * time.Hour)
duration := tomorrow.Sub(now)

// 时间比较
now.Before(tomorrow)  // true
now.After(yesterday)  // true
now.Equal(now)        // true

// 提取组件
year := now.Year()
month := now.Month()
day := now.Day()
hour := now.Hour()
weekday := now.Weekday()

// 定时器
timer := time.NewTimer(2 * time.Second)
<-timer.C  // 等待 2 秒

// 周期定时
ticker := time.NewTicker(time.Second)
for t := range ticker.C {
    fmt.Println("Tick at", t)
}

// 休眠
time.Sleep(time.Second)
```

## os - 操作系统

```go
import "os"

// 环境变量
os.Getenv("HOME")
os.Setenv("MY_VAR", "value")
os.Environ()  // 所有环境变量

// 命令行参数
os.Args  // []string

// 工作目录
wd, _ := os.Getwd()
os.Chdir("/path/to/dir")

// 文件操作
file, _ := os.Create("file.txt")
file, _ := os.Open("file.txt")
file, _ := os.OpenFile("file.txt", os.O_RDWR|os.O_CREATE, 0644)
file.Write([]byte("Hello"))
file.WriteString("World")
file.Close()

// 读取文件
data, _ := os.ReadFile("file.txt")

// 写入文件
os.WriteFile("file.txt", []byte("Hello"), 0644)

// 文件信息
info, _ := os.Stat("file.txt")
info.Name()      // 文件名
info.Size()      // 大小
info.IsDir()     // 是否目录
info.ModTime()   // 修改时间

// 删除
os.Remove("file.txt")
os.RemoveAll("dir")

// 重命名
os.Rename("old.txt", "new.txt")

// 目录操作
os.Mkdir("dir", 0755)
os.MkdirAll("a/b/c", 0755)
entries, _ := os.ReadDir(".")

// 退出
os.Exit(0)
```

## io - I/O 操作

```go
import (
    "io"
    "bufio"
)

// 复制
io.Copy(dst, src)
io.CopyN(dst, src, 1024)

// 读取全部
data, _ := io.ReadAll(reader)

// 缓冲读取
reader := bufio.NewReader(file)
line, _ := reader.ReadString('\n')
line, _, _ := reader.ReadLine()

// 缓冲写入
writer := bufio.NewWriter(file)
writer.WriteString("Hello")
writer.Flush()

// Scanner
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    line := scanner.Text()
    fmt.Println(line)
}
```

## path/filepath - 路径操作

```go
import "path/filepath"

// 路径操作
filepath.Join("a", "b", "c")     // a/b/c
filepath.Dir("/a/b/c.txt")       // /a/b
filepath.Base("/a/b/c.txt")      // c.txt
filepath.Ext("file.txt")         // .txt
filepath.Abs(".")                // 绝对路径

// 遍历目录
filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
    fmt.Println(path)
    return nil
})

// 模式匹配
matches, _ := filepath.Glob("*.txt")
```

## encoding/json - JSON 处理

```go
import "encoding/json"

type User struct {
    Name  string `json:"name"`
    Age   int    `json:"age"`
    Email string `json:"email,omitempty"`
}

// 序列化
user := User{Name: "张三", Age: 25}
data, _ := json.Marshal(user)
// {"name":"张三","age":25}

// 格式化输出
data, _ := json.MarshalIndent(user, "", "  ")

// 反序列化
var user User
json.Unmarshal(data, &user)

// 流式处理
encoder := json.NewEncoder(writer)
encoder.Encode(user)

decoder := json.NewDecoder(reader)
decoder.Decode(&user)
```

## net/http - HTTP 客户端和服务器

### HTTP 客户端

```go
import "net/http"

// GET 请求
resp, _ := http.Get("https://api.example.com/users")
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)

// POST 请求
resp, _ := http.Post("https://api.example.com/users",
    "application/json",
    strings.NewReader(`{"name":"张三"}`))

// 自定义请求
client := &http.Client{Timeout: 10 * time.Second}
req, _ := http.NewRequest("GET", "https://api.example.com/users", nil)
req.Header.Set("Authorization", "Bearer token")
resp, _ := client.Do(req)
```

### HTTP 服务器

```go
import "net/http"

// 简单服务器
http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
})
http.ListenAndServe(":8080", nil)

// 路由处理
mux := http.NewServeMux()
mux.HandleFunc("/users", handleUsers)
mux.HandleFunc("/users/", handleUser)
http.ListenAndServe(":8080", mux)

// 获取请求参数
r.URL.Query().Get("id")      // 查询参数
r.FormValue("name")          // 表单参数
r.Header.Get("Content-Type") // 请求头

// 返回 JSON
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(data)
```

## log - 日志

```go
import "log"

// 基本日志
log.Print("普通日志")
log.Printf("格式化: %s", "message")
log.Println("带换行")

// 致命错误（打印后退出）
log.Fatal("致命错误")
log.Fatalf("致命错误: %v", err)

// Panic（打印后 panic）
log.Panic("panic")

// 自定义 Logger
logger := log.New(os.Stdout, "[APP] ", log.LstdFlags|log.Lshortfile)
logger.Println("自定义日志")
```

## sync - 同步原语

```go
import "sync"

// 互斥锁
var mu sync.Mutex
mu.Lock()
// 临界区
mu.Unlock()

// 读写锁
var rw sync.RWMutex
rw.RLock()   // 读锁
rw.RUnlock()
rw.Lock()    // 写锁
rw.Unlock()

// WaitGroup
var wg sync.WaitGroup
wg.Add(1)
go func() {
    defer wg.Done()
    // 工作
}()
wg.Wait()

// Once
var once sync.Once
once.Do(func() {
    // 只执行一次
})

// Map（并发安全）
var m sync.Map
m.Store("key", "value")
value, ok := m.Load("key")
m.Delete("key")
m.Range(func(key, value interface{}) bool {
    fmt.Println(key, value)
    return true
})
```

## regexp - 正则表达式

```go
import "regexp"

// 编译正则
re := regexp.MustCompile(`\d+`)

// 匹配
re.MatchString("abc123")     // true

// 查找
re.FindString("abc123def")   // "123"
re.FindAllString("a1b2c3", -1) // ["1", "2", "3"]

// 替换
re.ReplaceAllString("a1b2c3", "X") // "aXbXcX"

// 分组
re := regexp.MustCompile(`(\w+)@(\w+)\.(\w+)`)
matches := re.FindStringSubmatch("test@example.com")
// ["test@example.com", "test", "example", "com"]
```
