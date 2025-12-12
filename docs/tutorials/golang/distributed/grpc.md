---
order: 3
---

# Go - gRPC

gRPC 是 Google 开发的高性能 RPC 框架，使用 Protocol Buffers 作为序列化协议。

## 安装

```bash
# 安装 protoc 编译器
# macOS
brew install protobuf

# 安装 Go 插件
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# 安装 gRPC
go get google.golang.org/grpc
```

## 定义服务

### Proto 文件

```protobuf
// api/user.proto
syntax = "proto3";

package api;
option go_package = "myproject/api";

// 用户服务
service UserService {
    // 获取用户
    rpc GetUser(GetUserRequest) returns (User);
    // 创建用户
    rpc CreateUser(CreateUserRequest) returns (User);
    // 用户列表
    rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
    // 服务端流
    rpc WatchUsers(WatchUsersRequest) returns (stream User);
    // 客户端流
    rpc UploadUsers(stream User) returns (UploadUsersResponse);
    // 双向流
    rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message User {
    int64 id = 1;
    string name = 2;
    string email = 3;
    int32 age = 4;
}

message GetUserRequest {
    int64 id = 1;
}

message CreateUserRequest {
    string name = 1;
    string email = 2;
    int32 age = 3;
}

message ListUsersRequest {
    int32 page = 1;
    int32 page_size = 2;
}

message ListUsersResponse {
    repeated User users = 1;
    int64 total = 2;
}

message WatchUsersRequest {}

message UploadUsersResponse {
    int32 count = 1;
}

message ChatMessage {
    string user = 1;
    string content = 2;
}
```

### 生成代码

```bash
protoc --go_out=. --go-grpc_out=. api/user.proto
```

## 服务端实现

```go
package main

import (
    "context"
    "io"
    "log"
    "net"
    
    "google.golang.org/grpc"
    pb "myproject/api"
)

type userService struct {
    pb.UnimplementedUserServiceServer
}

// 一元 RPC
func (s *userService) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    // 模拟查询数据库
    user := &pb.User{
        Id:    req.Id,
        Name:  "张三",
        Email: "zhangsan@example.com",
        Age:   25,
    }
    return user, nil
}

func (s *userService) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.User, error) {
    user := &pb.User{
        Id:    1,
        Name:  req.Name,
        Email: req.Email,
        Age:   req.Age,
    }
    return user, nil
}

func (s *userService) ListUsers(ctx context.Context, req *pb.ListUsersRequest) (*pb.ListUsersResponse, error) {
    users := []*pb.User{
        {Id: 1, Name: "张三", Email: "zhangsan@example.com"},
        {Id: 2, Name: "李四", Email: "lisi@example.com"},
    }
    return &pb.ListUsersResponse{
        Users: users,
        Total: 2,
    }, nil
}

// 服务端流
func (s *userService) WatchUsers(req *pb.WatchUsersRequest, stream pb.UserService_WatchUsersServer) error {
    users := []*pb.User{
        {Id: 1, Name: "张三"},
        {Id: 2, Name: "李四"},
        {Id: 3, Name: "王五"},
    }
    
    for _, user := range users {
        if err := stream.Send(user); err != nil {
            return err
        }
    }
    
    return nil
}

// 客户端流
func (s *userService) UploadUsers(stream pb.UserService_UploadUsersServer) error {
    count := 0
    for {
        user, err := stream.Recv()
        if err == io.EOF {
            return stream.SendAndClose(&pb.UploadUsersResponse{
                Count: int32(count),
            })
        }
        if err != nil {
            return err
        }
        log.Printf("Received user: %s\n", user.Name)
        count++
    }
}

// 双向流
func (s *userService) Chat(stream pb.UserService_ChatServer) error {
    for {
        msg, err := stream.Recv()
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }
        
        log.Printf("Received: %s: %s\n", msg.User, msg.Content)
        
        // 回复消息
        reply := &pb.ChatMessage{
            User:    "Server",
            Content: "收到: " + msg.Content,
        }
        if err := stream.Send(reply); err != nil {
            return err
        }
    }
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatal(err)
    }
    
    server := grpc.NewServer()
    pb.RegisterUserServiceServer(server, &userService{})
    
    log.Println("gRPC server listening on :50051")
    if err := server.Serve(lis); err != nil {
        log.Fatal(err)
    }
}
```

## 客户端实现

```go
package main

import (
    "context"
    "io"
    "log"
    "time"
    
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    pb "myproject/api"
)

func main() {
    // 连接服务端
    conn, err := grpc.Dial("localhost:50051",
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()
    
    client := pb.NewUserServiceClient(conn)
    ctx := context.Background()
    
    // 一元 RPC
    user, err := client.GetUser(ctx, &pb.GetUserRequest{Id: 1})
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("GetUser: %v\n", user)
    
    // 服务端流
    stream, err := client.WatchUsers(ctx, &pb.WatchUsersRequest{})
    if err != nil {
        log.Fatal(err)
    }
    for {
        user, err := stream.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatal(err)
        }
        log.Printf("WatchUsers: %v\n", user)
    }
    
    // 客户端流
    uploadStream, err := client.UploadUsers(ctx)
    if err != nil {
        log.Fatal(err)
    }
    users := []*pb.User{
        {Name: "张三"},
        {Name: "李四"},
        {Name: "王五"},
    }
    for _, user := range users {
        if err := uploadStream.Send(user); err != nil {
            log.Fatal(err)
        }
    }
    resp, err := uploadStream.CloseAndRecv()
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("UploadUsers: %d\n", resp.Count)
    
    // 双向流
    chatStream, err := client.Chat(ctx)
    if err != nil {
        log.Fatal(err)
    }
    
    go func() {
        for {
            msg, err := chatStream.Recv()
            if err == io.EOF {
                return
            }
            if err != nil {
                log.Fatal(err)
            }
            log.Printf("Chat received: %s: %s\n", msg.User, msg.Content)
        }
    }()
    
    messages := []string{"Hello", "World", "Bye"}
    for _, content := range messages {
        if err := chatStream.Send(&pb.ChatMessage{
            User:    "Client",
            Content: content,
        }); err != nil {
            log.Fatal(err)
        }
        time.Sleep(time.Second)
    }
    chatStream.CloseSend()
}
```

## 拦截器

### 服务端拦截器

```go
// 一元拦截器
func unaryInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    
    // 调用实际处理函数
    resp, err := handler(ctx, req)
    
    // 记录日志
    log.Printf("Method: %s, Duration: %v, Error: %v\n",
        info.FullMethod, time.Since(start), err)
    
    return resp, err
}

// 流拦截器
func streamInterceptor(
    srv interface{},
    ss grpc.ServerStream,
    info *grpc.StreamServerInfo,
    handler grpc.StreamHandler,
) error {
    start := time.Now()
    
    err := handler(srv, ss)
    
    log.Printf("Stream: %s, Duration: %v, Error: %v\n",
        info.FullMethod, time.Since(start), err)
    
    return err
}

// 使用
server := grpc.NewServer(
    grpc.UnaryInterceptor(unaryInterceptor),
    grpc.StreamInterceptor(streamInterceptor),
)
```

### 客户端拦截器

```go
// 一元拦截器
func clientUnaryInterceptor(
    ctx context.Context,
    method string,
    req, reply interface{},
    cc *grpc.ClientConn,
    invoker grpc.UnaryInvoker,
    opts ...grpc.CallOption,
) error {
    start := time.Now()
    
    err := invoker(ctx, method, req, reply, cc, opts...)
    
    log.Printf("Method: %s, Duration: %v\n", method, time.Since(start))
    
    return err
}

// 使用
conn, err := grpc.Dial("localhost:50051",
    grpc.WithUnaryInterceptor(clientUnaryInterceptor),
)
```

## 元数据

```go
import "google.golang.org/grpc/metadata"

// 客户端发送元数据
md := metadata.Pairs(
    "authorization", "Bearer token",
    "request-id", "12345",
)
ctx := metadata.NewOutgoingContext(context.Background(), md)
resp, err := client.GetUser(ctx, req)

// 服务端获取元数据
func (s *userService) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    md, ok := metadata.FromIncomingContext(ctx)
    if ok {
        if tokens := md.Get("authorization"); len(tokens) > 0 {
            log.Printf("Token: %s\n", tokens[0])
        }
    }
    // ...
}

// 服务端发送元数据
func (s *userService) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    header := metadata.Pairs("response-id", "12345")
    grpc.SendHeader(ctx, header)
    // ...
}
```

## 错误处理

```go
import (
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

// 服务端返回错误
func (s *userService) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    if req.Id <= 0 {
        return nil, status.Error(codes.InvalidArgument, "无效的用户 ID")
    }
    
    user := findUser(req.Id)
    if user == nil {
        return nil, status.Error(codes.NotFound, "用户不存在")
    }
    
    return user, nil
}

// 客户端处理错误
resp, err := client.GetUser(ctx, req)
if err != nil {
    st, ok := status.FromError(err)
    if ok {
        switch st.Code() {
        case codes.NotFound:
            log.Println("用户不存在")
        case codes.InvalidArgument:
            log.Println("参数错误:", st.Message())
        default:
            log.Println("未知错误:", st.Message())
        }
    }
}
```

## 健康检查

```go
import (
    "google.golang.org/grpc/health"
    healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
    server := grpc.NewServer()
    
    // 注册健康检查服务
    healthServer := health.NewServer()
    healthpb.RegisterHealthServer(server, healthServer)
    
    // 设置服务状态
    healthServer.SetServingStatus("myservice", healthpb.HealthCheckResponse_SERVING)
    
    // ...
}
```
