---
order : 7
---

# net

## 1. 网络地址解析

 `net.LookupHost`
解析主机名到 IP 地址。
```go
ips, err := net.LookupHost("example.com")
if err != nil {
    log.Fatal(err)
}
for _, ip := range ips {
    fmt.Println(ip)
}
```

 `net.LookupIP`
解析主机名到 IP 地址列表。
```go
ips, err := net.LookupIP("example.com")
if err != nil {
    log.Fatal(err)
}
for _, ip := range ips {
    fmt.Println(ip)
}
```

## 2. TCP 连接

 `net.Dial`
连接到指定网络地址（支持 "tcp", "udp", "unix"）。
```go
conn, err := net.Dial("tcp", "golang.org:80")
if err != nil {
    log.Fatal(err)
}
fmt.Fprintf(conn, "GET / HTTP/1.0\r\n\r\n")
status, err := bufio.NewReader(conn).ReadString('\n')
fmt.Println(status)
```

 `net.Listen`
监听指定网络地址的连接。
```go
ln, err := net.Listen("tcp", ":8080")
if err != nil {
    log.Fatal(err)
}
for {
    conn, err := ln.Accept()
    if err != nil {
        log.Fatal(err)
    }
    go handleConnection(conn)
}
```
处理连接的示例函数：
```go
func handleConnection(conn net.Conn) {
    defer conn.Close()
    for {
        message, _ := bufio.NewReader(conn).ReadString('\n')
        fmt.Print("Message Received:", string(message))
        conn.Write([]byte("Message received.\n"))
    }
}
```

## 3. UDP 连接

 `net.ListenUDP`
监听 UDP 地址。
```go
addr, err := net.ResolveUDPAddr("udp", ":8080")
if err != nil {
    log.Fatal(err)
}
conn, err := net.ListenUDP("udp", addr)
if err != nil {
    log.Fatal(err)
}
buffer := make([]byte, 1024)
for {
    n, addr, err := conn.ReadFromUDP(buffer)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Received %s from %s\n", string(buffer[:n]), addr)
    _, err = conn.WriteToUDP([]byte("Message received."), addr)
    if err != nil {
        log.Fatal(err)
    }
}
```

 `net.DialUDP`
连接到指定的 UDP 地址。
```go
addr, err := net.ResolveUDPAddr("udp", "localhost:8080")
if err != nil {
    log.Fatal(err)
}
conn, err := net.DialUDP("udp", nil, addr)
if err != nil {
    log.Fatal(err)
}
defer conn.Close()
_, err = conn.Write([]byte("Hello UDP server"))
if err != nil {
    log.Fatal(err)
}
buffer := make([]byte, 1024)
n, _, err := conn.ReadFromUDP(buffer)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Message from server: %s\n", string(buffer[:n]))
```

## 4. 网络接口

 `net.Interfaces`
返回系统的网络接口列表。
```go
interfaces, err := net.Interfaces()
if err != nil {
    log.Fatal(err)
}
for _, iface := range interfaces {
    fmt.Println(iface.Name, iface.HardwareAddr)
}
```

## 5. IP 地址处理

 `net.ParseIP`
将字符串形式的 IP 地址解析为 `net.IP` 类型。
```go
ip := net.ParseIP("192.0.2.1")
if ip == nil {
    log.Fatal("Invalid IP address")
}
fmt.Println("Parsed IP:", ip.String())
```

 `net.IP`
`net.IP` 类型用于表示 IP 地址。
```go
ip := net.ParseIP("192.0.2.1")
if ip.To4() != nil {
    fmt.Println("IPv4 address")
} else {
    fmt.Println("IPv6 address")
}
```

## 6. 域名解析

 `net.LookupCNAME`
解析并返回域名的规范名称。
```go
cname, err := net.LookupCNAME("www.example.com")
if err != nil {
    log.Fatal(err)
}
fmt.Println("CNAME:", cname)
```

 `net.LookupSRV`
解析指定服务的 SRV 记录。
```go
_, addrs, err := net.LookupSRV("xmpp-server", "tcp", "example.com")
if err != nil {
    log.Fatal(err)
}
for _, addr := range addrs {
    fmt.Println(addr.Target, addr.Port)
}
```

## 7. 自定义 Dialer

 `net.Dialer`
使用自定义配置进行网络连接。
```go
dialer := net.Dialer{
    Timeout: 5 * time.Second,
}
conn, err := dialer.Dial("tcp", "golang.org:80")
if err != nil {
    log.Fatal(err)
}
fmt.Fprintf(conn, "GET / HTTP/1.0\r\n\r\n")
status, err := bufio.NewReader(conn).ReadString('\n')
fmt.Println(status)
```

## 8. 错误处理

 `net.Error`

检查错误类型是否为临时错误或超时错误。
```go
conn, err := net.Dial("tcp", "example.com:80")
if err != nil {
    if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
        fmt.Println("Timeout error")
    } else {
        fmt.Println("Other error")
    }
    return
}
defer conn.Close()
```

通过以上这些 `net` 包中的 API，Go 语言可以方便地处理网络编程相关的任务。根据具体需求，可以进行更加复杂的网络应用开发。