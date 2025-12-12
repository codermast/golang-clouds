---
order: 1
---

# RabbitMQ 简介与安装

## 什么是 RabbitMQ

RabbitMQ 是一个开源的消息代理和队列服务器，用来通过普通协议在不同的应用之间共享数据，或者简单地将作业队列排队以便让分布式服务器处理。

### 核心特性

- **可靠性**：支持持久化、传输确认、发布确认
- **灵活的路由**：通过 Exchange 进行消息路由
- **集群**：多个 RabbitMQ 服务器组成集群
- **高可用**：队列可以在集群中进行镜像
- **多协议**：支持 AMQP、STOMP、MQTT 等协议
- **多语言客户端**：Java、Python、Go 等
- **管理界面**：提供 Web 管理界面
- **插件机制**：支持多种插件扩展

## 核心概念

### AMQP 协议

AMQP（Advanced Message Queuing Protocol）是一种消息队列协议，定义了消息的格式和工作方式。

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                       RabbitMQ Broker                       │
│  ┌─────────┐    ┌───────────┐    ┌─────────────────────┐   │
│  │ Virtual │    │           │    │       Queue         │   │
│  │  Host   │ →  │  Exchange │ →  ├─────────────────────┤   │
│  └─────────┘    │           │    │       Queue         │   │
│                 └───────────┘    └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
       ↑                                      ↓
   Producer                               Consumer
```

| 组件             | 说明                               |
| ---------------- | ---------------------------------- |
| **Broker**       | 消息队列服务器实体                 |
| **Virtual Host** | 虚拟主机，用于逻辑隔离             |
| **Connection**   | 生产者/消费者与 Broker 的 TCP 连接 |
| **Channel**      | 轻量级连接，建立在 Connection 上   |
| **Exchange**     | 交换机，接收消息并路由到队列       |
| **Queue**        | 消息队列，存储消息                 |
| **Binding**      | 交换机与队列的绑定关系             |
| **Routing Key**  | 路由键，用于消息路由               |

### Exchange 类型

| 类型        | 说明       | 路由规则             |
| ----------- | ---------- | -------------------- |
| **Direct**  | 直连交换机 | 完全匹配 Routing Key |
| **Fanout**  | 扇形交换机 | 广播到所有绑定队列   |
| **Topic**   | 主题交换机 | 模糊匹配 Routing Key |
| **Headers** | 头部交换机 | 根据消息头属性匹配   |

## Docker 安装

### 拉取镜像

```bash
# 拉取带管理界面的镜像
docker pull rabbitmq:3.12-management
```

### 运行容器

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3.12-management
```

### 端口说明

| 端口  | 说明          |
| ----- | ------------- |
| 5672  | AMQP 协议端口 |
| 15672 | 管理界面端口  |
| 25672 | 集群通信端口  |

### 访问管理界面

浏览器访问：`http://localhost:15672`

默认账号密码：`admin / admin123`

## Linux 安装

### 安装 Erlang

RabbitMQ 依赖 Erlang 运行时。

```bash
# CentOS/RHEL
yum install -y erlang

# Ubuntu/Debian
apt-get install -y erlang
```

### 安装 RabbitMQ

```bash
# CentOS/RHEL
yum install -y rabbitmq-server

# Ubuntu/Debian
apt-get install -y rabbitmq-server
```

### 启动服务

```bash
# 启动服务
systemctl start rabbitmq-server

# 开机自启
systemctl enable rabbitmq-server

# 查看状态
systemctl status rabbitmq-server
```

### 启用管理插件

```bash
rabbitmq-plugins enable rabbitmq_management
```

### 创建用户

```bash
# 创建用户
rabbitmqctl add_user admin admin123

# 设置管理员权限
rabbitmqctl set_user_tags admin administrator

# 设置虚拟主机权限
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

## 管理命令

### 用户管理

```bash
# 查看用户列表
rabbitmqctl list_users

# 添加用户
rabbitmqctl add_user username password

# 删除用户
rabbitmqctl delete_user username

# 修改密码
rabbitmqctl change_password username newpassword

# 设置用户角色
rabbitmqctl set_user_tags username administrator
```

### 虚拟主机管理

```bash
# 查看虚拟主机
rabbitmqctl list_vhosts

# 添加虚拟主机
rabbitmqctl add_vhost vhost_name

# 删除虚拟主机
rabbitmqctl delete_vhost vhost_name
```

### 权限管理

```bash
# 查看权限
rabbitmqctl list_permissions -p /

# 设置权限
rabbitmqctl set_permissions -p / username ".*" ".*" ".*"

# 清除权限
rabbitmqctl clear_permissions -p / username
```

### 队列管理

```bash
# 查看队列
rabbitmqctl list_queues

# 查看队列详情
rabbitmqctl list_queues name messages consumers

# 清空队列
rabbitmqctl purge_queue queue_name
```

## Java 客户端

### 添加依赖

```xml
<dependency>
    <groupId>com.rabbitmq</groupId>
    <artifactId>amqp-client</artifactId>
    <version>5.18.0</version>
</dependency>
```

### 生产者示例

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class Producer {
    private static final String QUEUE_NAME = "hello";
    
    public static void main(String[] args) throws Exception {
        // 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("admin");
        factory.setPassword("admin123");
        
        // 创建连接和通道
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {
            
            // 声明队列
            channel.queueDeclare(QUEUE_NAME, false, false, false, null);
            
            // 发送消息
            String message = "Hello RabbitMQ!";
            channel.basicPublish("", QUEUE_NAME, null, message.getBytes());
            System.out.println("发送消息：" + message);
        }
    }
}
```

### 消费者示例

```java
import com.rabbitmq.client.*;

public class Consumer {
    private static final String QUEUE_NAME = "hello";
    
    public static void main(String[] args) throws Exception {
        // 创建连接工厂
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("admin");
        factory.setPassword("admin123");
        
        // 创建连接和通道
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        // 声明队列
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        System.out.println("等待接收消息...");
        
        // 消费消息
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到消息：" + message);
        };
        
        channel.basicConsume(QUEUE_NAME, true, deliverCallback, consumerTag -> {});
    }
}
```

## 小结

- RabbitMQ 是基于 AMQP 协议的消息队列
- 核心组件：Broker、Exchange、Queue、Binding
- 四种 Exchange 类型：Direct、Fanout、Topic、Headers
- 推荐使用 Docker 快速安装
- 提供 Web 管理界面，端口 15672
