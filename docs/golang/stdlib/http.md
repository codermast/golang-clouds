---
order : 8
---
# net/http

在 Go 语言中，`net/http` 包提供了用于构建 HTTP 客户端和服务器的强大工具。以下是一些常用的 `net/http` 包的 API 及其详细说明：

## 1. HTTP 服务器

### 创建一个简单的 HTTP 服务器
使用 `http.HandleFunc` 和 `http.ListenAndServe` 创建一个基本的 HTTP 服务器。
```go
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
}

func main() {
    http.HandleFunc("/", handler)
    fmt.Println("Server started at http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

### 使用路由器
通过 `http.ServeMux` 实现简单的路由功能。
```go
package main

import (
    "fmt"
    "net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "This is the about page.")
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", helloHandler)
    mux.HandleFunc("/about", aboutHandler)

    fmt.Println("Server started at http://localhost:8080")
    http.ListenAndServe(":8080", mux)
}
```

## 2. HTTP 客户端

### 发起 GET 请求
使用 `http.Get` 发起一个 GET 请求并读取响应。
```go
package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {
    resp, err := http.Get("http://example.com")
    if err != nil {
        fmt.Println(err)
        return
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println(string(body))
}
```

### 发起 POST 请求
使用 `http.Post` 发起一个 POST 请求并读取响应。
```go
package main

import (
    "bytes"
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {
    data := []byte(`{"name":"Alice"}`)
    resp, err := http.Post("http://example.com", "application/json", bytes.NewBuffer(data))
    if err != nil {
        fmt.Println(err)
        return
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println(string(body))
}
```

## 3. 自定义 HTTP 客户端

### 使用自定义配置
通过 `http.Client` 和 `http.Transport` 实现自定义 HTTP 客户端。
```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

func main() {
    client := &http.Client{
        Timeout: 10 * time.Second,
        Transport: &http.Transport{
            MaxIdleConns: 10,
        },
    }

    resp, err := client.Get("http://example.com")
    if err != nil {
        fmt.Println(err)
        return
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println(string(body))
}
```

## 4. 处理表单数据

### 解析表单数据
在处理表单提交时解析表单数据。
```go
package main

import (
    "fmt"
    "net/http"
)

func formHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == http.MethodPost {
        r.ParseForm()
        fmt.Fprintf(w, "Post from website! r.PostFrom = %v\n", r.PostForm)
    } else {
        http.ServeFile(w, r, "form.html")
    }
}

func main() {
    http.HandleFunc("/form", formHandler)
    fmt.Println("Server started at http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```
创建一个简单的 `form.html` 文件来测试表单提交。
```html
<!DOCTYPE html>
<html>
<body>

<form action="/form" method="post">
  Name: <input type="text" name="name"><br>
  Age: <input type="text" name="age"><br>
  <input type="submit">
</form>

</body>
</html>
```

## 5. 中间件

### 创建简单的中间件
通过创建一个函数包装器实现中间件功能。
```go
package main

import (
    "fmt"
    "net/http"
)

func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Println("Request received:", r.URL.Path)
        next.ServeHTTP(w, r)
    })
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", helloHandler)

    loggedMux := loggingMiddleware(mux)

    fmt.Println("Server started at http://localhost:8080")
    http.ListenAndServe(":8080", loggedMux)
}
```

## 6. 处理静态文件

### 提供静态文件服务
使用 `http.FileServer` 提供静态文件服务。
```go
package main

import (
    "net/http"
)

func main() {
    fs := http.FileServer(http.Dir("./static"))
    http.Handle("/", fs)

    http.ListenAndServe(":8080", nil)
}
```
在项目目录下创建一个 `static` 文件夹，并放入一些静态文件（如 HTML、CSS、JS 文件）进行测试。

## 7. 错误处理

### 返回自定义错误
自定义 HTTP 错误响应。
```go
package main

import (
    "fmt"
    "net/http"
)

func errorHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusNotFound)
    fmt.Fprintf(w, "Custom 404 Page Not Found")
}

func main() {
    http.HandleFunc("/", errorHandler)
    fmt.Println("Server started at http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

通过掌握这些 `net/http` 包中的基本 API，你可以轻松构建功能强大且灵活的 HTTP 客户端和服务器应用程序。根据具体需求，还可以进一步扩展和自定义这些功能。