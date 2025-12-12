---
order: 3
---

# Spring Boot 整合 Kafka

Spring Kafka 提供了对 Apache Kafka 的便捷集成。

## 添加依赖

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

## 配置文件

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    # 生产者配置
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      retries: 3
      batch-size: 16384
      buffer-memory: 33554432
    # 消费者配置
    consumer:
      group-id: my-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      auto-offset-reset: earliest
      enable-auto-commit: false
      properties:
        spring.json.trusted.packages: "*"
    # 监听器配置
    listener:
      ack-mode: manual
      concurrency: 3
```

## 生产者

### 简单发送

```java
@Service
@Slf4j
public class KafkaProducerService {
    
    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    /**
     * 发送消息
     */
    public void sendMessage(String topic, String message) {
        kafkaTemplate.send(topic, message);
        log.info("发送消息: {}", message);
    }
    
    /**
     * 发送消息（带 Key）
     */
    public void sendMessage(String topic, String key, String message) {
        kafkaTemplate.send(topic, key, message);
    }
    
    /**
     * 发送对象
     */
    public void sendObject(String topic, User user) {
        kafkaTemplate.send(topic, user.getId(), user);
    }
}
```

### 带回调的发送

```java
@Service
@Slf4j
public class KafkaProducerService {
    
    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    public void sendWithCallback(String topic, String message) {
        CompletableFuture<SendResult<String, Object>> future = 
            kafkaTemplate.send(topic, message);
        
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("发送成功: partition={}, offset={}",
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
            } else {
                log.error("发送失败", ex);
            }
        });
    }
    
    /**
     * 同步发送
     */
    public void sendSync(String topic, String message) throws Exception {
        SendResult<String, Object> result = kafkaTemplate.send(topic, message).get();
        log.info("发送成功: offset={}", result.getRecordMetadata().offset());
    }
}
```

### 发送到指定分区

```java
public void sendToPartition(String topic, int partition, String key, String message) {
    kafkaTemplate.send(topic, partition, key, message);
}
```

## 消费者

### 简单消费

```java
@Component
@Slf4j
public class KafkaConsumerService {
    
    @KafkaListener(topics = "test-topic", groupId = "my-group")
    public void listen(String message) {
        log.info("收到消息: {}", message);
    }
}
```

### 手动确认

```java
@Component
@Slf4j
public class KafkaConsumerService {
    
    @KafkaListener(topics = "test-topic", groupId = "my-group")
    public void listen(String message, Acknowledgment ack) {
        try {
            log.info("收到消息: {}", message);
            // 处理业务逻辑
            processMessage(message);
            // 手动确认
            ack.acknowledge();
        } catch (Exception e) {
            log.error("处理失败", e);
            // 不确认，消息会重新投递
        }
    }
}
```

### 获取消息元数据

```java
@KafkaListener(topics = "test-topic", groupId = "my-group")
public void listen(ConsumerRecord<String, String> record, Acknowledgment ack) {
    log.info("收到消息: topic={}, partition={}, offset={}, key={}, value={}",
        record.topic(),
        record.partition(),
        record.offset(),
        record.key(),
        record.value());
    
    ack.acknowledge();
}
```

### 接收对象

```java
@KafkaListener(topics = "user-topic", groupId = "my-group",
    properties = {"spring.json.value.default.type=com.example.User"})
public void listenUser(User user, Acknowledgment ack) {
    log.info("收到用户: {}", user);
    ack.acknowledge();
}
```

### 批量消费

```java
@KafkaListener(topics = "test-topic", groupId = "my-group",
    containerFactory = "batchFactory")
public void listenBatch(List<String> messages, Acknowledgment ack) {
    log.info("收到 {} 条消息", messages.size());
    for (String message : messages) {
        processMessage(message);
    }
    ack.acknowledge();
}

// 配置批量消费
@Configuration
public class KafkaConfig {
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> batchFactory(
            ConsumerFactory<String, String> consumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setBatchListener(true);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        return factory;
    }
}
```

### 指定分区消费

```java
@KafkaListener(topicPartitions = {
    @TopicPartition(topic = "test-topic", partitions = {"0", "1"}),
    @TopicPartition(topic = "test-topic2", partitions = {"0"})
})
public void listenPartition(ConsumerRecord<String, String> record, Acknowledgment ack) {
    log.info("收到消息: partition={}, value={}", record.partition(), record.value());
    ack.acknowledge();
}
```

### 指定初始偏移量

```java
@KafkaListener(topicPartitions = @TopicPartition(
    topic = "test-topic",
    partitionOffsets = {
        @PartitionOffset(partition = "0", initialOffset = "100"),
        @PartitionOffset(partition = "1", initialOffset = "0")
    }
))
public void listenWithOffset(ConsumerRecord<String, String> record, Acknowledgment ack) {
    log.info("收到消息: offset={}", record.offset());
    ack.acknowledge();
}
```

## 错误处理

### 全局错误处理

```java
@Configuration
public class KafkaConfig {
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            ConsumerFactory<String, String> consumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setCommonErrorHandler(new DefaultErrorHandler(
            new DeadLetterPublishingRecoverer(kafkaTemplate()),
            new FixedBackOff(1000L, 3L)  // 重试 3 次，间隔 1 秒
        ));
        return factory;
    }
}
```

### 监听器级别错误处理

```java
@KafkaListener(topics = "test-topic", groupId = "my-group", errorHandler = "myErrorHandler")
public void listen(String message) {
    // ...
}

@Bean
public KafkaListenerErrorHandler myErrorHandler() {
    return (message, exception) -> {
        log.error("消息处理失败: {}", message.getPayload(), exception);
        // 可以发送到死信队列
        return null;
    };
}
```

## 事务

### 配置

```yaml
spring:
  kafka:
    producer:
      transaction-id-prefix: tx-
```

### 使用事务

```java
@Service
public class TransactionalProducer {
    
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    
    @Transactional
    public void sendInTransaction(String topic, List<String> messages) {
        for (String message : messages) {
            kafkaTemplate.send(topic, message);
        }
        // 事务自动提交或回滚
    }
    
    // 手动控制事务
    public void sendWithManualTransaction(String topic, String message) {
        kafkaTemplate.executeInTransaction(operations -> {
            operations.send(topic, message);
            // 如果抛出异常，事务会回滚
            return true;
        });
    }
}
```

## 动态监听器

```java
@Service
public class DynamicListenerService {
    
    @Autowired
    private KafkaListenerEndpointRegistry registry;
    
    /**
     * 启动监听器
     */
    public void startListener(String listenerId) {
        MessageListenerContainer container = registry.getListenerContainer(listenerId);
        if (container != null && !container.isRunning()) {
            container.start();
        }
    }
    
    /**
     * 停止监听器
     */
    public void stopListener(String listenerId) {
        MessageListenerContainer container = registry.getListenerContainer(listenerId);
        if (container != null && container.isRunning()) {
            container.stop();
        }
    }
}

// 带 ID 的监听器
@KafkaListener(id = "myListener", topics = "test-topic", autoStartup = "false")
public void listen(String message) {
    // ...
}
```

## 小结

- 使用 `@KafkaListener` 注解消费消息
- 使用 `KafkaTemplate` 发送消息
- 推荐使用手动确认模式
- 支持批量消费、指定分区、错误处理
- 支持事务和动态监听器控制
