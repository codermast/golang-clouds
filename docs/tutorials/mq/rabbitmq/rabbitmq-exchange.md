---
order: 2
---

# RabbitMQ Exchange 详解

Exchange（交换机）是 RabbitMQ 的核心组件，负责接收生产者发送的消息，并根据规则将消息路由到一个或多个队列。

## Exchange 工作原理

```
Producer → Exchange → Binding → Queue → Consumer
              ↓
         Routing Key 匹配规则
```

生产者发送消息时：
1. 消息先到达 Exchange
2. Exchange 根据类型和 Routing Key 决定路由规则
3. 消息被路由到匹配的 Queue
4. Consumer 从 Queue 中获取消息

## Direct Exchange（直连交换机）

### 工作原理

消息的 Routing Key 与 Binding Key **完全匹配**时，消息才会被路由到对应队列。

```
                    ┌─────────────┐
                    │   Direct    │
Producer ────────── │  Exchange   │
  Routing Key:      │             │
    "error"         └─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ Queue1  │      │ Queue2  │      │ Queue3  │
   │ Key:    │      │ Key:    │      │ Key:    │
   │ "info"  │      │ "error" │      │ "debug" │
   └─────────┘      └─────────┘      └─────────┘
        ✗                 ✓                 ✗
```

### 代码示例

```java
// 生产者
public class DirectProducer {
    private static final String EXCHANGE_NAME = "direct_logs";
    
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {
            
            // 声明直连交换机
            channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.DIRECT);
            
            // 发送不同级别的日志
            String[] severities = {"info", "warning", "error"};
            for (String severity : severities) {
                String message = "Log level: " + severity;
                channel.basicPublish(EXCHANGE_NAME, severity, null, message.getBytes());
                System.out.println("发送 [" + severity + "]: " + message);
            }
        }
    }
}

// 消费者（只接收 error 级别）
public class DirectConsumer {
    private static final String EXCHANGE_NAME = "direct_logs";
    
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        // 声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.DIRECT);
        
        // 创建临时队列
        String queueName = channel.queueDeclare().getQueue();
        
        // 只绑定 error 级别
        channel.queueBind(queueName, EXCHANGE_NAME, "error");
        
        System.out.println("等待 error 消息...");
        
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到 [" + delivery.getEnvelope().getRoutingKey() + "]: " + message);
        };
        
        channel.basicConsume(queueName, true, deliverCallback, consumerTag -> {});
    }
}
```

## Fanout Exchange（扇形交换机）

### 工作原理

**广播模式**，忽略 Routing Key，将消息发送到所有绑定的队列。

```
                    ┌─────────────┐
                    │   Fanout    │
Producer ────────── │  Exchange   │
                    │             │
                    └─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ Queue1  │      │ Queue2  │      │ Queue3  │
   └─────────┘      └─────────┘      └─────────┘
        ✓                 ✓                 ✓
```

### 代码示例

```java
// 生产者
public class FanoutProducer {
    private static final String EXCHANGE_NAME = "logs";
    
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {
            
            // 声明扇形交换机
            channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.FANOUT);
            
            String message = "广播消息：Hello Everyone!";
            // Routing Key 为空，因为 Fanout 会忽略它
            channel.basicPublish(EXCHANGE_NAME, "", null, message.getBytes());
            System.out.println("发送广播: " + message);
        }
    }
}

// 消费者
public class FanoutConsumer {
    private static final String EXCHANGE_NAME = "logs";
    
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        // 声明交换机
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.FANOUT);
        
        // 创建临时队列
        String queueName = channel.queueDeclare().getQueue();
        
        // 绑定（不需要 Routing Key）
        channel.queueBind(queueName, EXCHANGE_NAME, "");
        
        System.out.println("等待广播消息...");
        
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到广播: " + message);
        };
        
        channel.basicConsume(queueName, true, deliverCallback, consumerTag -> {});
    }
}
```

## Topic Exchange（主题交换机）

### 工作原理

**模糊匹配**，Routing Key 和 Binding Key 通过通配符匹配。

通配符规则：
- `*`（星号）：匹配一个单词
- `#`（井号）：匹配零个或多个单词
- 单词之间用 `.` 分隔

```
示例：
Routing Key: "order.create.success"

Binding Key           匹配结果
order.*.*             ✓
order.#               ✓
*.create.*            ✓
#.success             ✓
order.create          ✗（缺少一个单词）
*.*.error             ✗（最后一个单词不匹配）
```

### 代码示例

```java
// 生产者
public class TopicProducer {
    private static final String EXCHANGE_NAME = "topic_logs";
    
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {
            
            // 声明主题交换机
            channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.TOPIC);
            
            // 发送不同主题的消息
            Map<String, String> messages = new HashMap<>();
            messages.put("order.create.success", "订单创建成功");
            messages.put("order.pay.success", "订单支付成功");
            messages.put("user.login.success", "用户登录成功");
            messages.put("user.register.failed", "用户注册失败");
            
            for (Map.Entry<String, String> entry : messages.entrySet()) {
                channel.basicPublish(EXCHANGE_NAME, entry.getKey(), null, entry.getValue().getBytes());
                System.out.println("发送 [" + entry.getKey() + "]: " + entry.getValue());
            }
        }
    }
}

// 消费者（订阅所有 order 相关消息）
public class TopicConsumer {
    private static final String EXCHANGE_NAME = "topic_logs";
    
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.TOPIC);
        
        String queueName = channel.queueDeclare().getQueue();
        
        // 绑定：订阅所有 order 开头的消息
        channel.queueBind(queueName, EXCHANGE_NAME, "order.#");
        
        System.out.println("等待 order.# 消息...");
        
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到 [" + delivery.getEnvelope().getRoutingKey() + "]: " + message);
        };
        
        channel.basicConsume(queueName, true, deliverCallback, consumerTag -> {});
    }
}
```

## Headers Exchange（头部交换机）

### 工作原理

根据消息的 Headers 属性进行匹配，不依赖 Routing Key。

匹配规则：
- `x-match = all`：所有 Header 都要匹配
- `x-match = any`：任意一个 Header 匹配即可

### 代码示例

```java
// 生产者
public class HeadersProducer {
    private static final String EXCHANGE_NAME = "headers_test";
    
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {
            
            channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.HEADERS);
            
            // 设置消息头
            Map<String, Object> headers = new HashMap<>();
            headers.put("format", "pdf");
            headers.put("type", "report");
            
            AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
                    .headers(headers)
                    .build();
            
            String message = "PDF报告内容";
            channel.basicPublish(EXCHANGE_NAME, "", props, message.getBytes());
            System.out.println("发送消息: " + message);
        }
    }
}

// 消费者
public class HeadersConsumer {
    private static final String EXCHANGE_NAME = "headers_test";
    
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        channel.exchangeDeclare(EXCHANGE_NAME, BuiltinExchangeType.HEADERS);
        
        String queueName = channel.queueDeclare().getQueue();
        
        // 设置绑定参数
        Map<String, Object> bindingArgs = new HashMap<>();
        bindingArgs.put("x-match", "all");  // 所有 header 都要匹配
        bindingArgs.put("format", "pdf");
        bindingArgs.put("type", "report");
        
        channel.queueBind(queueName, EXCHANGE_NAME, "", bindingArgs);
        
        System.out.println("等待匹配消息...");
        
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("收到消息: " + message);
        };
        
        channel.basicConsume(queueName, true, deliverCallback, consumerTag -> {});
    }
}
```

## Exchange 类型对比

| 类型    | 路由规则    | 使用场景             |
| ------- | ----------- | -------------------- |
| Direct  | 完全匹配    | 精确路由，如日志分级 |
| Fanout  | 广播        | 广播消息，如系统通知 |
| Topic   | 模糊匹配    | 灵活路由，如事件订阅 |
| Headers | Header 匹配 | 复杂路由规则         |

## 小结

- **Direct**：适用于精确路由场景，一对一或一对多
- **Fanout**：适用于广播场景，如系统通知、日志广播
- **Topic**：适用于灵活订阅场景，如事件驱动系统
- **Headers**：适用于需要根据消息属性路由的复杂场景
- 实际项目中 Topic 最常用，兼顾灵活性和性能
