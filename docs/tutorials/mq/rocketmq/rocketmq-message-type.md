---
order: 2
---

# RocketMQ 消息类型

RocketMQ 支持多种消息类型，满足不同业务场景需求。

## 普通消息

最基本的消息类型，适用于大多数场景。

### 同步发送

```java
public class SyncProducer {
    public static void main(String[] args) throws Exception {
        DefaultMQProducer producer = new DefaultMQProducer("sync-producer-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.start();
        
        Message msg = new Message("TestTopic", "TagA", "Hello Sync".getBytes());
        
        // 同步发送，等待响应
        SendResult result = producer.send(msg);
        System.out.println("发送状态: " + result.getSendStatus());
        System.out.println("消息ID: " + result.getMsgId());
        
        producer.shutdown();
    }
}
```

### 异步发送

```java
public class AsyncProducer {
    public static void main(String[] args) throws Exception {
        DefaultMQProducer producer = new DefaultMQProducer("async-producer-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.start();
        
        Message msg = new Message("TestTopic", "TagA", "Hello Async".getBytes());
        
        // 异步发送
        producer.send(msg, new SendCallback() {
            @Override
            public void onSuccess(SendResult sendResult) {
                System.out.println("发送成功: " + sendResult.getMsgId());
            }
            
            @Override
            public void onException(Throwable e) {
                System.out.println("发送失败: " + e.getMessage());
            }
        });
        
        Thread.sleep(3000);  // 等待异步回调
        producer.shutdown();
    }
}
```

### 单向发送

```java
public class OnewayProducer {
    public static void main(String[] args) throws Exception {
        DefaultMQProducer producer = new DefaultMQProducer("oneway-producer-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.start();
        
        Message msg = new Message("TestTopic", "TagA", "Hello Oneway".getBytes());
        
        // 单向发送，不等待响应
        producer.sendOneway(msg);
        
        producer.shutdown();
    }
}
```

## 顺序消息

保证消息的顺序消费，适用于订单状态变更等场景。

### 发送顺序消息

```java
public class OrderedProducer {
    public static void main(String[] args) throws Exception {
        DefaultMQProducer producer = new DefaultMQProducer("ordered-producer-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.start();
        
        // 模拟订单状态变更
        String[] orderIds = {"order-001", "order-002", "order-003"};
        String[] statuses = {"创建", "支付", "发货", "完成"};
        
        for (String orderId : orderIds) {
            for (String status : statuses) {
                Message msg = new Message("OrderTopic", "OrderTag",
                    (orderId + ": " + status).getBytes());
                
                // 发送顺序消息，相同 orderId 发送到同一个 Queue
                SendResult result = producer.send(msg, (mqs, message, arg) -> {
                    String id = (String) arg;
                    int index = Math.abs(id.hashCode()) % mqs.size();
                    return mqs.get(index);
                }, orderId);
                
                System.out.printf("发送: %s - %s, Queue: %d%n",
                    orderId, status, result.getMessageQueue().getQueueId());
            }
        }
        
        producer.shutdown();
    }
}
```

### 消费顺序消息

```java
public class OrderedConsumer {
    public static void main(String[] args) throws Exception {
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("ordered-consumer-group");
        consumer.setNamesrvAddr("localhost:9876");
        consumer.subscribe("OrderTopic", "*");
        
        // 顺序消费监听器
        consumer.registerMessageListener((MessageListenerOrderly) (msgs, context) -> {
            for (MessageExt msg : msgs) {
                System.out.printf("消费: %s, Queue: %d%n",
                    new String(msg.getBody()), msg.getQueueId());
            }
            return ConsumeOrderlyStatus.SUCCESS;
        });
        
        consumer.start();
    }
}
```

## 延迟消息

消息发送后，延迟一段时间再投递给消费者。

### 延迟级别

RocketMQ 支持 18 个延迟级别：

| 级别 | 延迟时间 |
| ---- | -------- |
| 1    | 1s       |
| 2    | 5s       |
| 3    | 10s      |
| 4    | 30s      |
| 5    | 1m       |
| 6    | 2m       |
| 7    | 3m       |
| 8    | 4m       |
| 9    | 5m       |
| 10   | 6m       |
| 11   | 7m       |
| 12   | 8m       |
| 13   | 9m       |
| 14   | 10m      |
| 15   | 20m      |
| 16   | 30m      |
| 17   | 1h       |
| 18   | 2h       |

### 发送延迟消息

```java
public class DelayProducer {
    public static void main(String[] args) throws Exception {
        DefaultMQProducer producer = new DefaultMQProducer("delay-producer-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.start();
        
        Message msg = new Message("DelayTopic", "DelayTag", "延迟消息".getBytes());
        
        // 设置延迟级别 3 = 10秒
        msg.setDelayTimeLevel(3);
        
        SendResult result = producer.send(msg);
        System.out.println("发送时间: " + new Date());
        System.out.println("消息ID: " + result.getMsgId());
        
        producer.shutdown();
    }
}
```

### 应用场景

- 订单超时取消
- 延迟重试
- 定时任务

```java
// 订单超时取消示例
public void createOrder(Order order) {
    // 1. 创建订单
    orderService.save(order);
    
    // 2. 发送延迟消息（30分钟后检查）
    Message msg = new Message("OrderTimeout", order.getId().getBytes());
    msg.setDelayTimeLevel(16);  // 30分钟
    producer.send(msg);
}

// 消费者
public void checkOrderTimeout(MessageExt msg) {
    String orderId = new String(msg.getBody());
    Order order = orderService.getById(orderId);
    
    if (order.getStatus() == OrderStatus.UNPAID) {
        // 取消订单
        orderService.cancel(orderId);
        // 释放库存
        stockService.release(orderId);
    }
}
```

## 事务消息

保证本地事务和消息发送的一致性。

### 事务流程

```
Producer                    Broker                    Consumer
    │                          │                          │
    │  1. 发送半消息            │                          │
    │ ───────────────────────→ │                          │
    │                          │                          │
    │  2. 响应半消息结果        │                          │
    │ ←─────────────────────── │                          │
    │                          │                          │
    │  3. 执行本地事务          │                          │
    │                          │                          │
    │  4. 提交/回滚             │                          │
    │ ───────────────────────→ │                          │
    │                          │                          │
    │                          │  5. 投递消息（提交后）     │
    │                          │ ──────────────────────→ │
```

### 发送事务消息

```java
public class TransactionProducer {
    public static void main(String[] args) throws Exception {
        TransactionMQProducer producer = new TransactionMQProducer("tx-producer-group");
        producer.setNamesrvAddr("localhost:9876");
        
        // 设置事务监听器
        producer.setTransactionListener(new TransactionListener() {
            @Override
            public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
                // 执行本地事务
                try {
                    String orderId = (String) arg;
                    // 创建订单
                    orderService.create(orderId);
                    
                    return LocalTransactionState.COMMIT_MESSAGE;
                } catch (Exception e) {
                    return LocalTransactionState.ROLLBACK_MESSAGE;
                }
            }
            
            @Override
            public LocalTransactionState checkLocalTransaction(MessageExt msg) {
                // 事务回查
                String orderId = msg.getKeys();
                Order order = orderService.getById(orderId);
                
                if (order != null) {
                    return LocalTransactionState.COMMIT_MESSAGE;
                }
                return LocalTransactionState.ROLLBACK_MESSAGE;
            }
        });
        
        producer.start();
        
        // 发送事务消息
        String orderId = "order-001";
        Message msg = new Message("TxTopic", "TxTag", "事务消息".getBytes());
        msg.setKeys(orderId);
        
        SendResult result = producer.sendMessageInTransaction(msg, orderId);
        System.out.println("发送状态: " + result.getSendStatus());
        
        // 注意：不要立即关闭，等待事务完成
        Thread.sleep(60000);
        producer.shutdown();
    }
}
```

### 事务状态

| 状态             | 说明                       |
| ---------------- | -------------------------- |
| COMMIT_MESSAGE   | 提交事务，消息投递给消费者 |
| ROLLBACK_MESSAGE | 回滚事务，消息丢弃         |
| UNKNOW           | 未知，等待回查             |

## 批量消息

一次发送多条消息，提高吞吐量。

```java
public class BatchProducer {
    public static void main(String[] args) throws Exception {
        DefaultMQProducer producer = new DefaultMQProducer("batch-producer-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.start();
        
        // 构建消息列表
        List<Message> messages = new ArrayList<>();
        messages.add(new Message("BatchTopic", "Tag", "消息1".getBytes()));
        messages.add(new Message("BatchTopic", "Tag", "消息2".getBytes()));
        messages.add(new Message("BatchTopic", "Tag", "消息3".getBytes()));
        
        // 批量发送（注意：消息总大小不超过 4MB）
        SendResult result = producer.send(messages);
        System.out.println("发送状态: " + result.getSendStatus());
        
        producer.shutdown();
    }
}
```

### 大批量消息分割

```java
public class MessageSplitter implements Iterator<List<Message>> {
    private static final int SIZE_LIMIT = 1024 * 1024 * 4;  // 4MB
    private final List<Message> messages;
    private int currIndex;
    
    public MessageSplitter(List<Message> messages) {
        this.messages = messages;
    }
    
    @Override
    public boolean hasNext() {
        return currIndex < messages.size();
    }
    
    @Override
    public List<Message> next() {
        int nextIndex = currIndex;
        int totalSize = 0;
        
        for (; nextIndex < messages.size(); nextIndex++) {
            Message msg = messages.get(nextIndex);
            int size = msg.getTopic().length() + msg.getBody().length;
            
            if (totalSize + size > SIZE_LIMIT) {
                break;
            }
            totalSize += size;
        }
        
        List<Message> subList = messages.subList(currIndex, nextIndex);
        currIndex = nextIndex;
        return subList;
    }
}
```

## 消息过滤

### Tag 过滤

```java
// 生产者
Message msg = new Message("FilterTopic", "TagA", "消息A".getBytes());
producer.send(msg);

// 消费者 - 订阅指定 Tag
consumer.subscribe("FilterTopic", "TagA || TagB");  // 多个 Tag
consumer.subscribe("FilterTopic", "*");              // 所有 Tag
```

### SQL92 过滤

```java
// 生产者 - 设置属性
Message msg = new Message("FilterTopic", "Tag", "消息".getBytes());
msg.putUserProperty("price", "100");
msg.putUserProperty("region", "shanghai");
producer.send(msg);

// 消费者 - SQL 过滤
consumer.subscribe("FilterTopic", 
    MessageSelector.bySql("price > 50 AND region = 'shanghai'"));
```

需要在 broker.conf 中启用：

```properties
enablePropertyFilter=true
```

## 小结

| 消息类型 | 适用场景               |
| -------- | ---------------------- |
| 普通消息 | 一般业务消息           |
| 顺序消息 | 订单状态、数据同步     |
| 延迟消息 | 超时处理、定时任务     |
| 事务消息 | 分布式事务、数据一致性 |
| 批量消息 | 日志收集、批量处理     |
