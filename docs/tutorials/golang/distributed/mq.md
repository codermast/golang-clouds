---
order: 2
---

# Go - 消息队列

使用 Go 操作 Kafka 和 RabbitMQ。

## Kafka

### 安装

```bash
go get github.com/IBM/sarama
```

### 生产者

```go
import "github.com/IBM/sarama"

func NewProducer(brokers []string) (sarama.SyncProducer, error) {
    config := sarama.NewConfig()
    config.Producer.RequiredAcks = sarama.WaitForAll
    config.Producer.Retry.Max = 3
    config.Producer.Return.Successes = true
    
    producer, err := sarama.NewSyncProducer(brokers, config)
    if err != nil {
        return nil, err
    }
    
    return producer, nil
}

// 发送消息
func SendMessage(producer sarama.SyncProducer, topic, key, value string) error {
    msg := &sarama.ProducerMessage{
        Topic: topic,
        Key:   sarama.StringEncoder(key),
        Value: sarama.StringEncoder(value),
    }
    
    partition, offset, err := producer.SendMessage(msg)
    if err != nil {
        return err
    }
    
    fmt.Printf("Message sent to partition %d at offset %d\n", partition, offset)
    return nil
}
```

### 异步生产者

```go
func NewAsyncProducer(brokers []string) (sarama.AsyncProducer, error) {
    config := sarama.NewConfig()
    config.Producer.RequiredAcks = sarama.WaitForLocal
    config.Producer.Return.Successes = true
    config.Producer.Return.Errors = true
    
    producer, err := sarama.NewAsyncProducer(brokers, config)
    if err != nil {
        return nil, err
    }
    
    // 处理成功和错误
    go func() {
        for {
            select {
            case success := <-producer.Successes():
                fmt.Printf("Message sent: %s\n", success.Value)
            case err := <-producer.Errors():
                fmt.Printf("Failed to send: %v\n", err)
            }
        }
    }()
    
    return producer, nil
}

// 发送消息
func SendAsync(producer sarama.AsyncProducer, topic, value string) {
    producer.Input() <- &sarama.ProducerMessage{
        Topic: topic,
        Value: sarama.StringEncoder(value),
    }
}
```

### 消费者

```go
func NewConsumer(brokers []string) (sarama.Consumer, error) {
    config := sarama.NewConfig()
    config.Consumer.Return.Errors = true
    
    consumer, err := sarama.NewConsumer(brokers, config)
    if err != nil {
        return nil, err
    }
    
    return consumer, nil
}

// 消费消息
func ConsumePartition(consumer sarama.Consumer, topic string, partition int32) {
    pc, err := consumer.ConsumePartition(topic, partition, sarama.OffsetNewest)
    if err != nil {
        panic(err)
    }
    defer pc.Close()
    
    for msg := range pc.Messages() {
        fmt.Printf("Partition: %d, Offset: %d, Key: %s, Value: %s\n",
            msg.Partition, msg.Offset, msg.Key, msg.Value)
    }
}
```

### 消费者组

```go
type ConsumerGroupHandler struct{}

func (h *ConsumerGroupHandler) Setup(sarama.ConsumerGroupSession) error   { return nil }
func (h *ConsumerGroupHandler) Cleanup(sarama.ConsumerGroupSession) error { return nil }

func (h *ConsumerGroupHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
    for msg := range claim.Messages() {
        fmt.Printf("Message: %s\n", string(msg.Value))
        
        // 处理消息...
        
        // 标记消息已处理
        session.MarkMessage(msg, "")
    }
    return nil
}

func StartConsumerGroup(brokers []string, groupID string, topics []string) {
    config := sarama.NewConfig()
    config.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategyRoundRobin
    config.Consumer.Offsets.Initial = sarama.OffsetNewest
    
    group, err := sarama.NewConsumerGroup(brokers, groupID, config)
    if err != nil {
        panic(err)
    }
    defer group.Close()
    
    handler := &ConsumerGroupHandler{}
    
    ctx := context.Background()
    for {
        if err := group.Consume(ctx, topics, handler); err != nil {
            fmt.Printf("Error: %v\n", err)
        }
    }
}
```

## RabbitMQ

### 安装

```bash
go get github.com/rabbitmq/amqp091-go
```

### 连接

```go
import amqp "github.com/rabbitmq/amqp091-go"

func NewConnection(url string) (*amqp.Connection, *amqp.Channel, error) {
    conn, err := amqp.Dial(url)
    if err != nil {
        return nil, nil, err
    }
    
    ch, err := conn.Channel()
    if err != nil {
        conn.Close()
        return nil, nil, err
    }
    
    return conn, ch, nil
}
```

### 简单队列

```go
// 声明队列
func DeclareQueue(ch *amqp.Channel, name string) (amqp.Queue, error) {
    return ch.QueueDeclare(
        name,  // 队列名
        true,  // 持久化
        false, // 自动删除
        false, // 排他
        false, // 不等待
        nil,   // 参数
    )
}

// 发送消息
func Publish(ch *amqp.Channel, queue, message string) error {
    return ch.PublishWithContext(
        context.Background(),
        "",    // exchange
        queue, // routing key
        false, // mandatory
        false, // immediate
        amqp.Publishing{
            DeliveryMode: amqp.Persistent,
            ContentType:  "text/plain",
            Body:         []byte(message),
        },
    )
}

// 消费消息
func Consume(ch *amqp.Channel, queue string) {
    msgs, err := ch.Consume(
        queue, // queue
        "",    // consumer
        false, // auto-ack
        false, // exclusive
        false, // no-local
        false, // no-wait
        nil,   // args
    )
    if err != nil {
        panic(err)
    }
    
    for msg := range msgs {
        fmt.Printf("Received: %s\n", msg.Body)
        
        // 处理消息...
        
        // 确认消息
        msg.Ack(false)
    }
}
```

### 工作队列（公平分发）

```go
// 设置 QoS
ch.Qos(
    1,     // prefetch count
    0,     // prefetch size
    false, // global
)

// 多个消费者消费同一个队列
// 消息会轮询分发给各个消费者
```

### 发布/订阅（Fanout）

```go
// 声明 Exchange
func DeclareExchange(ch *amqp.Channel, name, kind string) error {
    return ch.ExchangeDeclare(
        name,  // name
        kind,  // type: fanout, direct, topic, headers
        true,  // durable
        false, // auto-deleted
        false, // internal
        false, // no-wait
        nil,   // arguments
    )
}

// 发布者
func PublishToExchange(ch *amqp.Channel, exchange, message string) error {
    return ch.PublishWithContext(
        context.Background(),
        exchange, // exchange
        "",       // routing key（fanout 忽略）
        false,
        false,
        amqp.Publishing{
            ContentType: "text/plain",
            Body:        []byte(message),
        },
    )
}

// 订阅者
func Subscribe(ch *amqp.Channel, exchange string) {
    // 声明临时队列
    q, _ := ch.QueueDeclare(
        "",    // 随机队列名
        false, // 非持久化
        true,  // 自动删除
        true,  // 排他
        false,
        nil,
    )
    
    // 绑定到 Exchange
    ch.QueueBind(q.Name, "", exchange, false, nil)
    
    // 消费
    msgs, _ := ch.Consume(q.Name, "", true, false, false, false, nil)
    
    for msg := range msgs {
        fmt.Printf("Received: %s\n", msg.Body)
    }
}
```

### 路由模式（Direct）

```go
// 发布者
func PublishWithRouting(ch *amqp.Channel, exchange, routingKey, message string) error {
    return ch.PublishWithContext(
        context.Background(),
        exchange,
        routingKey, // 路由键
        false,
        false,
        amqp.Publishing{
            ContentType: "text/plain",
            Body:        []byte(message),
        },
    )
}

// 订阅者
func SubscribeWithRouting(ch *amqp.Channel, exchange string, routingKeys []string) {
    q, _ := ch.QueueDeclare("", false, true, true, false, nil)
    
    // 绑定多个路由键
    for _, key := range routingKeys {
        ch.QueueBind(q.Name, key, exchange, false, nil)
    }
    
    msgs, _ := ch.Consume(q.Name, "", true, false, false, false, nil)
    
    for msg := range msgs {
        fmt.Printf("[%s] %s\n", msg.RoutingKey, msg.Body)
    }
}

// 使用示例
// 发布者发送不同路由键的消息
PublishWithRouting(ch, "logs", "error", "Error message")
PublishWithRouting(ch, "logs", "info", "Info message")
PublishWithRouting(ch, "logs", "warning", "Warning message")

// 订阅者只接收 error 和 warning
SubscribeWithRouting(ch, "logs", []string{"error", "warning"})
```

### 主题模式（Topic）

```go
// 路由键格式：word1.word2.word3
// * 匹配一个单词
// # 匹配零个或多个单词

// 发布者
PublishWithRouting(ch, "logs", "user.created", "User created")
PublishWithRouting(ch, "logs", "user.deleted", "User deleted")
PublishWithRouting(ch, "logs", "order.created", "Order created")

// 订阅者
// 接收所有 user 相关消息
SubscribeWithRouting(ch, "logs", []string{"user.*"})

// 接收所有 created 消息
SubscribeWithRouting(ch, "logs", []string{"*.created"})

// 接收所有消息
SubscribeWithRouting(ch, "logs", []string{"#"})
```

## 消息模式

### 请求/响应

```go
// RPC 客户端
func RPCClient(ch *amqp.Channel, message string) string {
    // 声明回调队列
    replyQueue, _ := ch.QueueDeclare("", false, true, true, false, nil)
    
    corrID := uuid.New().String()
    
    // 发送请求
    ch.PublishWithContext(
        context.Background(),
        "",
        "rpc_queue",
        false,
        false,
        amqp.Publishing{
            ContentType:   "text/plain",
            CorrelationId: corrID,
            ReplyTo:       replyQueue.Name,
            Body:          []byte(message),
        },
    )
    
    // 等待响应
    msgs, _ := ch.Consume(replyQueue.Name, "", true, false, false, false, nil)
    
    for msg := range msgs {
        if msg.CorrelationId == corrID {
            return string(msg.Body)
        }
    }
    
    return ""
}

// RPC 服务端
func RPCServer(ch *amqp.Channel) {
    msgs, _ := ch.Consume("rpc_queue", "", false, false, false, false, nil)
    
    for msg := range msgs {
        // 处理请求
        result := process(string(msg.Body))
        
        // 发送响应
        ch.PublishWithContext(
            context.Background(),
            "",
            msg.ReplyTo,
            false,
            false,
            amqp.Publishing{
                ContentType:   "text/plain",
                CorrelationId: msg.CorrelationId,
                Body:          []byte(result),
            },
        )
        
        msg.Ack(false)
    }
}
```

### 延迟队列（死信队列）

```go
// 声明死信交换机和队列
ch.ExchangeDeclare("dlx", "direct", true, false, false, false, nil)
ch.QueueDeclare("dlq", true, false, false, false, nil)
ch.QueueBind("dlq", "delay", "dlx", false, nil)

// 声明延迟队列
ch.QueueDeclare(
    "delay_queue",
    true,
    false,
    false,
    false,
    amqp.Table{
        "x-dead-letter-exchange":    "dlx",
        "x-dead-letter-routing-key": "delay",
        "x-message-ttl":             30000, // 30 秒后过期
    },
)

// 发送延迟消息
ch.PublishWithContext(
    context.Background(),
    "",
    "delay_queue",
    false,
    false,
    amqp.Publishing{
        ContentType: "text/plain",
        Body:        []byte("delayed message"),
    },
)

// 消费延迟消息（从死信队列）
msgs, _ := ch.Consume("dlq", "", true, false, false, false, nil)
```
