---
order: 3
---

# RabbitMQ 消息可靠性

消息可靠性是消息队列的核心要求，RabbitMQ 提供了多种机制来保证消息不丢失。

## 消息丢失的三个环节

```
Producer ───→ Exchange ───→ Queue ───→ Consumer
    ①             ②           ③
```

1. **生产者到 Exchange**：消息发送失败
2. **Exchange 到 Queue**：路由失败（无匹配队列）
3. **Queue 到 Consumer**：消费者处理失败

## 生产者确认机制

### Publisher Confirm（发布确认）

确保消息成功到达 Exchange。

```java
public class ConfirmProducer {
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {
            
            // 开启发布确认
            channel.confirmSelect();
            
            String queueName = "confirm_queue";
            channel.queueDeclare(queueName, true, false, false, null);
            
            String message = "Hello Confirm!";
            channel.basicPublish("", queueName, null, message.getBytes());
            
            // 等待确认（同步方式）
            if (channel.waitForConfirms()) {
                System.out.println("消息发送成功");
            } else {
                System.out.println("消息发送失败");
            }
        }
    }
}
```

### 异步确认

```java
public class AsyncConfirmProducer {
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        channel.confirmSelect();
        
        // 记录未确认的消息
        ConcurrentSkipListMap<Long, String> outstandingConfirms = new ConcurrentSkipListMap<>();
        
        // 确认回调
        ConfirmCallback ackCallback = (deliveryTag, multiple) -> {
            if (multiple) {
                // 批量确认
                ConcurrentNavigableMap<Long, String> confirmed = 
                    outstandingConfirms.headMap(deliveryTag, true);
                confirmed.clear();
            } else {
                outstandingConfirms.remove(deliveryTag);
            }
            System.out.println("消息确认: " + deliveryTag);
        };
        
        // 未确认回调
        ConfirmCallback nackCallback = (deliveryTag, multiple) -> {
            String message = outstandingConfirms.get(deliveryTag);
            System.out.println("消息未确认: " + deliveryTag + ", 内容: " + message);
            // 可以在这里重发消息
        };
        
        channel.addConfirmListener(ackCallback, nackCallback);
        
        String queueName = "async_confirm_queue";
        channel.queueDeclare(queueName, true, false, false, null);
        
        // 发送消息
        for (int i = 0; i < 100; i++) {
            String message = "消息 " + i;
            // 记录消息
            outstandingConfirms.put(channel.getNextPublishSeqNo(), message);
            channel.basicPublish("", queueName, null, message.getBytes());
        }
    }
}
```

### Return 机制

当消息无法路由到任何队列时触发。

```java
public class ReturnProducer {
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        // 添加 Return 监听器
        channel.addReturnListener((replyCode, replyText, exchange, routingKey, properties, body) -> {
            System.out.println("消息被退回:");
            System.out.println("  replyCode: " + replyCode);
            System.out.println("  replyText: " + replyText);
            System.out.println("  exchange: " + exchange);
            System.out.println("  routingKey: " + routingKey);
            System.out.println("  body: " + new String(body));
        });
        
        // 发送消息（mandatory = true 表示无法路由时退回）
        String message = "Hello Return!";
        channel.basicPublish("", "non_existent_queue", true, null, message.getBytes());
        
        Thread.sleep(1000);
    }
}
```

## 消息持久化

### 交换机持久化

```java
// durable = true 表示持久化
channel.exchangeDeclare("durable_exchange", BuiltinExchangeType.DIRECT, true);
```

### 队列持久化

```java
// durable = true 表示持久化
channel.queueDeclare("durable_queue", true, false, false, null);
```

### 消息持久化

```java
// 设置消息持久化
AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
        .deliveryMode(2)  // 2 表示持久化
        .build();

channel.basicPublish("", "durable_queue", props, message.getBytes());
```

### 三者都要设置

```java
// 交换机持久化
channel.exchangeDeclare("my_exchange", BuiltinExchangeType.DIRECT, true);

// 队列持久化
channel.queueDeclare("my_queue", true, false, false, null);

// 绑定
channel.queueBind("my_queue", "my_exchange", "my_routing_key");

// 消息持久化
AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
        .deliveryMode(2)
        .build();

channel.basicPublish("my_exchange", "my_routing_key", props, message.getBytes());
```

## 消费者确认机制

### 自动确认（不推荐）

```java
// autoAck = true，消息一旦投递就确认
channel.basicConsume(queueName, true, deliverCallback, consumerTag -> {});
```

问题：消费者收到消息后如果处理失败，消息就丢失了。

### 手动确认（推荐）

```java
public class ManualAckConsumer {
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        String queueName = "ack_queue";
        channel.queueDeclare(queueName, true, false, false, null);
        
        // 一次只处理一条消息
        channel.basicQos(1);
        
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            try {
                String message = new String(delivery.getBody(), "UTF-8");
                System.out.println("收到消息: " + message);
                
                // 处理业务逻辑
                processMessage(message);
                
                // 手动确认
                channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
                System.out.println("消息已确认");
                
            } catch (Exception e) {
                // 处理失败，拒绝消息，重新入队
                channel.basicNack(delivery.getEnvelope().getDeliveryTag(), false, true);
                System.out.println("消息处理失败，重新入队");
            }
        };
        
        // autoAck = false，手动确认
        channel.basicConsume(queueName, false, deliverCallback, consumerTag -> {});
    }
    
    private static void processMessage(String message) {
        // 模拟业务处理
    }
}
```

### 确认方法

| 方法                                        | 说明                             |
| ------------------------------------------- | -------------------------------- |
| `basicAck(deliveryTag, multiple)`           | 确认消息，multiple=true 批量确认 |
| `basicNack(deliveryTag, multiple, requeue)` | 拒绝消息，requeue=true 重新入队  |
| `basicReject(deliveryTag, requeue)`         | 拒绝单条消息                     |

## 死信队列

当消息无法被正常消费时，可以进入死信队列（DLQ）。

### 消息成为死信的条件

1. 消息被拒绝（basicNack/basicReject）且 requeue=false
2. 消息 TTL 过期
3. 队列达到最大长度

### 配置死信队列

```java
public class DeadLetterQueue {
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {
            
            // 1. 声明死信交换机和队列
            channel.exchangeDeclare("dlx_exchange", BuiltinExchangeType.DIRECT, true);
            channel.queueDeclare("dlx_queue", true, false, false, null);
            channel.queueBind("dlx_queue", "dlx_exchange", "dlx_routing_key");
            
            // 2. 声明业务队列，设置死信参数
            Map<String, Object> arguments = new HashMap<>();
            arguments.put("x-dead-letter-exchange", "dlx_exchange");
            arguments.put("x-dead-letter-routing-key", "dlx_routing_key");
            arguments.put("x-message-ttl", 10000);  // 消息 TTL 10秒
            arguments.put("x-max-length", 100);     // 队列最大长度
            
            channel.queueDeclare("business_queue", true, false, false, arguments);
            
            System.out.println("死信队列配置完成");
        }
    }
}
```

### 死信消费者

```java
public class DeadLetterConsumer {
    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            String message = new String(delivery.getBody(), "UTF-8");
            System.out.println("死信消息: " + message);
            
            // 记录日志、发送告警等
            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
        };
        
        // 消费死信队列
        channel.basicConsume("dlx_queue", false, deliverCallback, consumerTag -> {});
    }
}
```

## 消息可靠性保障流程

```
┌─────────────────────────────────────────────────────────────┐
│                       消息可靠性保障                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 生产者                                                   │
│     ├── 开启 Publisher Confirm                              │
│     ├── 开启 Return 机制                                    │
│     └── 消息持久化                                          │
│                                                             │
│  2. Broker                                                  │
│     ├── 交换机持久化                                        │
│     ├── 队列持久化                                          │
│     └── 镜像队列（集群）                                    │
│                                                             │
│  3. 消费者                                                   │
│     ├── 手动确认                                            │
│     ├── 处理失败重试                                        │
│     └── 死信队列兜底                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 小结

- **生产者确认**：Publisher Confirm + Return 机制
- **消息持久化**：Exchange、Queue、Message 都要持久化
- **消费者确认**：使用手动确认，处理失败时合理处理
- **死信队列**：作为兜底方案，处理异常消息
- 可靠性和性能是权衡关系，根据业务需求选择合适的策略
