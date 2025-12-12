---
order: 3
---

# Spring Boot 整合 RocketMQ

Spring Boot 提供了对 RocketMQ 的便捷集成，通过 `rocketmq-spring-boot-starter` 简化开发。

## 添加依赖

```xml
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-spring-boot-starter</artifactId>
    <version>2.2.3</version>
</dependency>
```

## 配置文件

```yaml
rocketmq:
  name-server: localhost:9876
  producer:
    group: my-producer-group
    send-message-timeout: 3000
    retry-times-when-send-failed: 2
    retry-times-when-send-async-failed: 2
```

## 生产者

### 简单发送

```java
@Service
@Slf4j
public class RocketMQProducer {
    
    @Autowired
    private RocketMQTemplate rocketMQTemplate;
    
    /**
     * 发送普通消息
     */
    public void sendMessage(String topic, String message) {
        rocketMQTemplate.convertAndSend(topic, message);
        log.info("发送消息: {}", message);
    }
    
    /**
     * 发送带 Tag 的消息
     */
    public void sendWithTag(String topic, String tag, String message) {
        rocketMQTemplate.convertAndSend(topic + ":" + tag, message);
    }
    
    /**
     * 发送对象
     */
    public void sendObject(String topic, User user) {
        rocketMQTemplate.convertAndSend(topic, user);
    }
}
```

### 同步发送

```java
@Service
@Slf4j
public class SyncProducerService {
    
    @Autowired
    private RocketMQTemplate rocketMQTemplate;
    
    public SendResult sendSync(String topic, String message) {
        SendResult result = rocketMQTemplate.syncSend(topic, message);
        log.info("同步发送结果: {}", result.getSendStatus());
        return result;
    }
    
    /**
     * 同步发送（带超时）
     */
    public SendResult sendSyncWithTimeout(String topic, String message, long timeout) {
        return rocketMQTemplate.syncSend(topic, message, timeout);
    }
}
```

### 异步发送

```java
@Service
@Slf4j
public class AsyncProducerService {
    
    @Autowired
    private RocketMQTemplate rocketMQTemplate;
    
    public void sendAsync(String topic, String message) {
        rocketMQTemplate.asyncSend(topic, message, new SendCallback() {
            @Override
            public void onSuccess(SendResult sendResult) {
                log.info("异步发送成功: {}", sendResult.getMsgId());
            }
            
            @Override
            public void onException(Throwable e) {
                log.error("异步发送失败", e);
            }
        });
    }
}
```

### 单向发送

```java
public void sendOneway(String topic, String message) {
    rocketMQTemplate.sendOneWay(topic, message);
}
```

### 发送延迟消息

```java
@Service
@Slf4j
public class DelayProducerService {
    
    @Autowired
    private RocketMQTemplate rocketMQTemplate;
    
    /**
     * 发送延迟消息
     * @param delayLevel 延迟级别 1-18
     */
    public void sendDelayMessage(String topic, String message, int delayLevel) {
        Message<String> msg = MessageBuilder.withPayload(message).build();
        // 延迟级别：1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
        rocketMQTemplate.syncSend(topic, msg, 3000, delayLevel);
        log.info("发送延迟消息，级别: {}", delayLevel);
    }
}
```

### 发送顺序消息

```java
@Service
@Slf4j
public class OrderedProducerService {
    
    @Autowired
    private RocketMQTemplate rocketMQTemplate;
    
    /**
     * 发送顺序消息
     * @param hashKey 用于选择队列的 key，相同 key 发送到同一队列
     */
    public void sendOrderedMessage(String topic, String message, String hashKey) {
        rocketMQTemplate.syncSendOrderly(topic, message, hashKey);
        log.info("发送顺序消息: hashKey={}", hashKey);
    }
    
    /**
     * 发送订单状态变更消息（保证同一订单的消息顺序）
     */
    public void sendOrderStatus(String orderId, String status) {
        String message = orderId + ":" + status;
        rocketMQTemplate.syncSendOrderly("OrderStatusTopic", message, orderId);
    }
}
```

### 发送事务消息

```java
@Service
@Slf4j
public class TransactionProducerService {
    
    @Autowired
    private RocketMQTemplate rocketMQTemplate;
    
    public void sendTransactionMessage(String topic, String message, Object arg) {
        Message<String> msg = MessageBuilder.withPayload(message).build();
        TransactionSendResult result = rocketMQTemplate.sendMessageInTransaction(topic, msg, arg);
        log.info("事务消息发送结果: {}", result.getSendStatus());
    }
}

// 事务监听器
@RocketMQTransactionListener
@Slf4j
public class TransactionListenerImpl implements RocketMQLocalTransactionListener {
    
    @Autowired
    private OrderService orderService;
    
    @Override
    public RocketMQLocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            // 执行本地事务
            String orderId = (String) arg;
            orderService.createOrder(orderId);
            
            log.info("本地事务执行成功");
            return RocketMQLocalTransactionState.COMMIT;
        } catch (Exception e) {
            log.error("本地事务执行失败", e);
            return RocketMQLocalTransactionState.ROLLBACK;
        }
    }
    
    @Override
    public RocketMQLocalTransactionState checkLocalTransaction(Message msg) {
        // 事务回查
        String orderId = msg.getHeaders().get("orderId", String.class);
        
        if (orderService.existsOrder(orderId)) {
            return RocketMQLocalTransactionState.COMMIT;
        }
        return RocketMQLocalTransactionState.ROLLBACK;
    }
}
```

## 消费者

### 简单消费

```java
@Component
@RocketMQMessageListener(
    topic = "TestTopic",
    consumerGroup = "my-consumer-group"
)
@Slf4j
public class SimpleConsumer implements RocketMQListener<String> {
    
    @Override
    public void onMessage(String message) {
        log.info("收到消息: {}", message);
        // 处理业务逻辑
    }
}
```

### 消费对象

```java
@Component
@RocketMQMessageListener(
    topic = "UserTopic",
    consumerGroup = "user-consumer-group"
)
@Slf4j
public class UserConsumer implements RocketMQListener<User> {
    
    @Override
    public void onMessage(User user) {
        log.info("收到用户: {}", user);
    }
}
```

### 带 Tag 过滤

```java
@Component
@RocketMQMessageListener(
    topic = "OrderTopic",
    consumerGroup = "order-consumer-group",
    selectorExpression = "TagA || TagB"  // 只消费 TagA 和 TagB
)
@Slf4j
public class TagFilterConsumer implements RocketMQListener<String> {
    
    @Override
    public void onMessage(String message) {
        log.info("收到消息: {}", message);
    }
}
```

### SQL92 过滤

```java
@Component
@RocketMQMessageListener(
    topic = "FilterTopic",
    consumerGroup = "filter-consumer-group",
    selectorType = SelectorType.SQL92,
    selectorExpression = "price > 100 AND region = 'shanghai'"
)
@Slf4j
public class SqlFilterConsumer implements RocketMQListener<String> {
    
    @Override
    public void onMessage(String message) {
        log.info("收到消息: {}", message);
    }
}
```

### 顺序消费

```java
@Component
@RocketMQMessageListener(
    topic = "OrderStatusTopic",
    consumerGroup = "order-status-consumer-group",
    consumeMode = ConsumeMode.ORDERLY  // 顺序消费
)
@Slf4j
public class OrderedConsumer implements RocketMQListener<String> {
    
    @Override
    public void onMessage(String message) {
        log.info("顺序消费: {}", message);
        // 处理业务逻辑
    }
}
```

### 获取消息扩展信息

```java
@Component
@RocketMQMessageListener(
    topic = "TestTopic",
    consumerGroup = "ext-consumer-group"
)
@Slf4j
public class ExtConsumer implements RocketMQListener<MessageExt> {
    
    @Override
    public void onMessage(MessageExt messageExt) {
        String msgId = messageExt.getMsgId();
        String topic = messageExt.getTopic();
        String tags = messageExt.getTags();
        int reconsumeTimes = messageExt.getReconsumeTimes();
        String body = new String(messageExt.getBody());
        
        log.info("消息ID: {}, Topic: {}, Tags: {}, 重试次数: {}, 内容: {}",
            msgId, topic, tags, reconsumeTimes, body);
    }
}
```

### 批量消费

```java
@Component
@RocketMQMessageListener(
    topic = "BatchTopic",
    consumerGroup = "batch-consumer-group",
    consumeMessageBatchMaxSize = 10  // 批量大小
)
@Slf4j
public class BatchConsumer implements RocketMQListener<List<String>> {
    
    @Override
    public void onMessage(List<String> messages) {
        log.info("批量收到 {} 条消息", messages.size());
        for (String message : messages) {
            // 处理每条消息
        }
    }
}
```

## 消息重试

### 消费重试

消费失败时自动重试，默认最多 16 次：

```java
@Component
@RocketMQMessageListener(
    topic = "RetryTopic",
    consumerGroup = "retry-consumer-group",
    maxReconsumeTimes = 3  // 最大重试次数
)
@Slf4j
public class RetryConsumer implements RocketMQListener<String> {
    
    @Override
    public void onMessage(String message) {
        try {
            // 处理消息
            processMessage(message);
        } catch (Exception e) {
            log.error("处理失败，将重试", e);
            throw new RuntimeException(e);  // 抛出异常触发重试
        }
    }
}
```

### 死信队列处理

超过重试次数后，消息进入死信队列 `%DLQ%consumerGroup`：

```java
@Component
@RocketMQMessageListener(
    topic = "%DLQ%retry-consumer-group",  // 死信队列
    consumerGroup = "dlq-consumer-group"
)
@Slf4j
public class DeadLetterConsumer implements RocketMQListener<MessageExt> {
    
    @Override
    public void onMessage(MessageExt messageExt) {
        log.warn("死信消息: msgId={}, body={}",
            messageExt.getMsgId(), new String(messageExt.getBody()));
        
        // 记录日志、发送告警、人工处理等
    }
}
```

## 消息轨迹

### 启用消息轨迹

```yaml
rocketmq:
  name-server: localhost:9876
  producer:
    group: my-producer-group
    enable-msg-trace: true  # 启用消息轨迹
```

```java
@Component
@RocketMQMessageListener(
    topic = "TraceTopic",
    consumerGroup = "trace-consumer-group",
    enableMsgTrace = true  // 消费者启用轨迹
)
public class TraceConsumer implements RocketMQListener<String> {
    @Override
    public void onMessage(String message) {
        // ...
    }
}
```

## 配置详解

### 生产者配置

| 配置项                               | 说明                 | 默认值  |
| ------------------------------------ | -------------------- | ------- |
| `group`                              | 生产者组             | 无      |
| `send-message-timeout`               | 发送超时时间(ms)     | 3000    |
| `compress-message-body-threshold`    | 压缩阈值(byte)       | 4096    |
| `retry-times-when-send-failed`       | 同步发送失败重试次数 | 2       |
| `retry-times-when-send-async-failed` | 异步发送失败重试次数 | 2       |
| `max-message-size`                   | 最大消息大小(byte)   | 4194304 |
| `enable-msg-trace`                   | 启用消息轨迹         | false   |

### 消费者配置

| 配置项               | 说明           | 默认值       |
| -------------------- | -------------- | ------------ |
| `topic`              | 订阅主题       | 无           |
| `consumerGroup`      | 消费者组       | 无           |
| `selectorType`       | 过滤类型       | TAG          |
| `selectorExpression` | 过滤表达式     | *            |
| `consumeMode`        | 消费模式       | CONCURRENTLY |
| `messageModel`       | 消息模式       | CLUSTERING   |
| `consumeThreadMax`   | 最大消费线程数 | 64           |
| `maxReconsumeTimes`  | 最大重试次数   | 16           |

## 最佳实践

### 1. 消息幂等性

```java
@Component
@RocketMQMessageListener(topic = "OrderTopic", consumerGroup = "order-group")
@Slf4j
public class IdempotentConsumer implements RocketMQListener<MessageExt> {
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @Override
    public void onMessage(MessageExt messageExt) {
        String msgId = messageExt.getMsgId();
        
        // 使用 Redis 判断是否已处理
        Boolean isNew = redisTemplate.opsForValue()
            .setIfAbsent("msg:" + msgId, "1", 24, TimeUnit.HOURS);
        
        if (Boolean.FALSE.equals(isNew)) {
            log.info("消息已处理，跳过: {}", msgId);
            return;
        }
        
        try {
            // 处理业务逻辑
            processMessage(messageExt);
        } catch (Exception e) {
            // 处理失败，删除标记，允许重试
            redisTemplate.delete("msg:" + msgId);
            throw e;
        }
    }
}
```

### 2. 消息重试策略

```java
@Override
public void onMessage(MessageExt messageExt) {
    int reconsumeTimes = messageExt.getReconsumeTimes();
    
    if (reconsumeTimes >= 3) {
        // 超过 3 次重试，记录日志并跳过
        log.error("消息处理失败超过 3 次，放弃处理: {}", messageExt.getMsgId());
        // 发送到告警系统
        return;
    }
    
    try {
        processMessage(messageExt);
    } catch (Exception e) {
        log.error("处理失败，第 {} 次重试", reconsumeTimes + 1, e);
        throw new RuntimeException(e);
    }
}
```

## 小结

- 使用 `@RocketMQMessageListener` 注解消费消息
- 使用 `RocketMQTemplate` 发送消息
- 支持同步、异步、单向、延迟、顺序、事务消息
- 消费失败自动重试，超过次数进入死信队列
- 注意消息幂等性处理
