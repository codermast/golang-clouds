---
order : 2
---

# os

在Go语言中，`os` 包是一个非常重要且常用的标准库，它提供了与操作系统交互的功能，包括文件操作、环境变量管理、进程管理等。下面是一些 `os` 包中常用的功能和API：

## 文件和目录操作

1. **文件操作**
   - `func Create(name string) (*File, error)`: 创建一个文件。
   - `func Open(name string) (*File, error)`: 打开一个文件。
   - `func Remove(name string) error`: 删除一个文件。
   - `func Rename(oldpath, newpath string) error`: 重命名一个文件。

   ```go
   package main

   import (
       "os"
       "log"
   )

   func main() {
       // 创建文件
       file, err := os.Create("test.txt")
       if err != nil {
           log.Fatal(err)
       }
       defer file.Close()

       // 打开文件
       file, err = os.Open("test.txt")
       if err != nil {
           log.Fatal(err)
       }
       defer file.Close()

       // 删除文件
       err = os.Remove("test.txt")
       if err != nil {
           log.Fatal(err)
       }
   }
   ```

2. **目录操作**
   - `func Mkdir(name string, perm FileMode) error`: 创建一个目录。
   - `func MkdirAll(path string, perm FileMode) error`: 递归创建多层目录。
   - `func RemoveAll(path string) error`: 递归删除一个目录及其子目录。

   ```go
   // 创建目录
   err := os.Mkdir("mydir", 0755)
   if err != nil {
       log.Fatal(err)
   }

   // 递归创建目录
   err = os.MkdirAll("path/to/mydir", 0755)
   if err != nil {
       log.Fatal(err)
   }

   // 递归删除目录
   err = os.RemoveAll("path/to/mydir")
   if err != nil {
       log.Fatal(err)
   }
   ```

## 环境变量

- `func Getenv(key string) string`: 获取环境变量的值。
- `func Setenv(key, value string) error`: 设置环境变量的值。
- `func Unsetenv(key string) error`: 删除指定的环境变量。

```go
// 获取环境变量
value := os.Getenv("HOME")
fmt.Println("Home directory:", value)

// 设置环境变量
err := os.Setenv("MYAPP_DB_URL", "localhost:5432")
if err != nil {
    log.Fatal(err)
}
```

## 进程操作

- `func Exit(code int)`: 终止当前进程并返回指定的状态码。
- `func Getpid() int`: 获取当前进程的ID。
- `func Getppid() int`: 获取当前进程的父进程ID。

```go
// 获取当前进程ID和父进程ID
pid := os.Getpid()
ppid := os.Getppid()
fmt.Printf("PID: %d, PPID: %d\n", pid, ppid)

// 终止当前进程
os.Exit(1)
```

## 其他常用功能

- `func Chdir(dir string) error`: 改变当前工作目录。
- `func Hostname() (name string, err error)`: 获取主机名。
- `func Getwd() (dir string, err error)`: 获取当前工作目录。

```go
// 改变当前工作目录
err := os.Chdir("/tmp")
if err != nil {
    log.Fatal(err)
}

// 获取主机名
hostname, err := os.Hostname()
if err != nil {
    log.Fatal(err)
}
fmt.Println("Hostname:", hostname)

// 获取当前工作目录
wd, err := os.Getwd()
if err != nil {
    log.Fatal(err)
}
fmt.Println("Current working directory:", wd)
```

通过学习和使用 `os` 包，你可以很方便地管理文件、目录、环境变量以及进程等操作系统相关的资源和信息。这使得Go语言在系统级编程和文件处理方面非常强大和灵活。