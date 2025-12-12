---
order: 4
---

# Spring Boot 整合 RabbitMQ

Spring AMQP 提供了对 RabbitMQ 的便捷集成，大大简化了开发工作。

## 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

## 配置文件

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: admin
    password: admin123
    virtual-host: /
    # 发布确认
    publisher-confirm-type: correlated
    publisher-returns: true
    # 消费者确认
    listener:
      simple:
        acknowledge-mode: manual  # 手动确认
        prefetch: 1               # 每次取一条消息
```

## 配置类

```java
@Configuration
public class RabbitMQConfig {
    
    public static final String EXCHANGE_NAME = "boot_exchange";
    public static final String QUEUE_NAME = "boot_queue";
    public static final String ROUTING_KEY = "boot.#";
    
    /**
     * 声明交换机
     */
    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }
    
    /**
     * 声明队列
     */
    @Bean
    public Queue queue() {
        return QueueBuilder.durable(QUEUE_NAME).build();
    }
    
    /**
     * 绑定交换机和队列
     */
    @Bean
    public Binding binding(Queue queue, TopicExchange topicExchange) {
        return BindingBuilder.bind(queue).to(topicExchange).with(ROUTING_KEY);
    }
}
```

## 生产者

### 简单发送

```java
@Service
public class MessageProducer {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    /**
     * 发送消息
     */
    public void sendMessage(String message) {
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            "boot.test",
            message
        );
        System.out.println("发送消息: " + message);
    }
    
    /**
     * 发送对象（自动序列化）
     */
    public void sendObject(User user) {
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            "boot.user",
            user
        );
    }
}
```

### 带确认的发送

```java
@Service
@Slf4j
public class ConfirmMessageProducer {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    @PostConstruct
    public void init() {
        // 设置确认回调
        rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
            if (ack) {
                log.info("消息发送成功: {}", correlationData);
            } else {
                log.error("消息发送失败: {}, 原因: {}", correlationData, cause);
                // 重试或记录
            }
        });
        
        // 设置退回回调
        rabbitTemplate.setReturnsCallback(returned -> {
            log.error("消息被退回: exchange={}, routingKey={}, message={}",
                returned.getExchange(),
                returned.getRoutingKey(),
                new String(returned.getMessage().getBody())
            );
        });
    }
    
    public void sendWithConfirm(String message) {
        CorrelationData correlationData = new CorrelationData(UUID.randomUUID().toString());
        
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            "boot.test",
            message,
            correlationData
        );
    }
}
```

## 消费者

### 简单消费

```java
@Component
@Slf4j
public class MessageConsumer {
    
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void onMessage(String message) {
        log.info("收到消息: {}", message);
        // 处理业务逻辑
    }
}
```

### 手动确认

```java
@Component
@Slf4j
public class ManualAckConsumer {
    
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void onMessage(String message, Channel channel, 
                          @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        try {
            log.info("收到消息: {}", message);
            
            // 处理业务逻辑
            processMessage(message);
            
            // 手动确认
            channel.basicAck(deliveryTag, false);
            log.info("消息已确认");
            
        } catch (Exception e) {
            log.error("消息处理失败", e);
            try {
                // 拒绝消息，重新入队
                channel.basicNack(deliveryTag, false, true);
            } catch (IOException ex) {
                log.error("消息拒绝失败", ex);
            }
        }
    }
    
    private void processMessage(String message) {
        // 业务处理
    }
}
```

### 接收对象

```java
@Component
@Slf4j
public class ObjectConsumer {
    
    @RabbitListener(queues = "user_queue")
    public void onMessage(User user, Channel channel, 
                          @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) 
            throws IOException {
        log.info("收到用户: {}", user);
        channel.basicAck(deliveryTag, false);
    }
}
```

## 注解方式声明

可以在 `@RabbitListener` 中直接声明交换机、队列和绑定：

```java
@Component
@Slf4j
public class AnnotationConsumer {
    
    @RabbitListener(bindings = @QueueBinding(
        value = @Queue(name = "annotation_queue", durable = "true"),
        exchange = @Exchange(name = "annotation_exchange", type = ExchangeTypes.TOPIC),
        key = "annotation.#"
    ))
    public void onMessage(String message, Channel channel, 
                          @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) 
            throws IOException {
        log.info("收到消息: {}", message);
        channel.basicAck(deliveryTag, false);
    }
}
```

## 消息转换器

默认使用 JDK 序列化，推荐使用 JSON：

```java
@Configuration
public class RabbitMQConfig {
    
    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

## 死信队列配置

```java
@Configuration
public class DeadLetterConfig {
    
    // 死信交换机
    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange("dlx.exchange", true, false);
    }
    
    // 死信队列
    @Bean
    public Queue dlxQueue() {
        return QueueBuilder.durable("dlx.queue").build();
    }
    
    // 死信绑定
    @Bean
    public Binding dlxBinding() {
        return BindingBuilder.bind(dlxQueue()).to(dlxExchange()).with("dlx.routing.key");
    }
    
    // 业务队列（带死信配置）
    @Bean
    public Queue businessQueue() {
        return QueueBuilder.durable("business.queue")
                .deadLetterExchange("dlx.exchange")
                .deadLetterRoutingKey("dlx.routing.key")
                .ttl(10000)  // 消息 TTL
                .maxLength(100)  // 队列最大长度
                .build();
    }
}
```

## 延迟队列

### 方式一：TTL + 死信队列

```java
@Configuration
public class DelayQueueConfig {
    
    // 延迟交换机
    @Bean
    public DirectExchange delayExchange() {
        return new DirectExchange("delay.exchange");
    }
    
    // 延迟队列（消息在此等待，过期后进入死信队列）
    @Bean
    public Queue delayQueue() {
        return QueueBuilder.durable("delay.queue")
                .deadLetterExchange("process.exchange")
                .deadLetterRoutingKey("process.routing.key")
                .ttl(60000)  // 延迟 60 秒
                .build();
    }
    
    // 处理交换机
    @Bean
    public DirectExchange processExchange() {
        return new DirectExchange("process.exchange");
    }
    
    // 处理队列
    @Bean
    public Queue processQueue() {
        return QueueBuilder.durable("process.queue").build();
    }
    
    @Bean
    public Binding delayBinding() {
        return BindingBuilder.bind(delayQueue()).to(delayExchange()).with("delay.routing.key");
    }
    
    @Bean
    public Binding processBinding() {
        return BindingBuilder.bind(processQueue()).to(processExchange()).with("process.routing.key");
    }
}
```

### 方式二：延迟插件

安装 `rabbitmq_delayed_message_exchange` 插件后：

```java
@Configuration
public class DelayPluginConfig {
    
    @Bean
    public CustomExchange delayedExchange() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-delayed-type", "direct");
        return new CustomExchange("delayed.exchange", "x-delayed-message", true, false, args);
    }
    
    @Bean
    public Queue delayedQueue() {
        return QueueBuilder.durable("delayed.queue").build();
    }
    
    @Bean
    public Binding delayedBinding() {
        return BindingBuilder.bind(delayedQueue()).to(delayedExchange()).with("delayed.routing.key").noargs();
    }
}

// 发送延迟消息
@Service
public class DelayedProducer {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void sendDelayedMessage(String message, long delayMillis) {
        rabbitTemplate.convertAndSend("delayed.exchange", "delayed.routing.key", message, msg -> {
            msg.getMessageProperties().setDelay((int) delayMillis);
            return msg;
        });
    }
}
```

## 小结

- Spring AMQP 极大简化了 RabbitMQ 的使用
- 使用 `@RabbitListener` 注解消费消息
- 使用 `RabbitTemplate` 发送消息
- 推荐使用 JSON 消息转换器
- 手动确认模式更可靠
- 延迟队列可通过 TTL + 死信队列或插件实现
