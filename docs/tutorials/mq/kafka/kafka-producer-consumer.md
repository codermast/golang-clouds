---
order: 2
---

# Kafka 生产者与消费者

## 生产者（Producer）

### 发送流程

```
Producer
    ↓
Serializer（序列化）
    ↓
Partitioner（分区选择）
    ↓
RecordAccumulator（消息累加器）
    ↓
Sender（发送线程）
    ↓
Broker
```

### 核心配置

| 配置项              | 说明            | 默认值     |
| ------------------- | --------------- | ---------- |
| `bootstrap.servers` | Broker 地址列表 | 无         |
| `key.serializer`    | Key 序列化器    | 无         |
| `value.serializer`  | Value 序列化器  | 无         |
| `acks`              | 确认机制        | 1          |
| `retries`           | 重试次数        | 2147483647 |
| `batch.size`        | 批次大小        | 16384      |
| `linger.ms`         | 等待时间        | 0          |
| `buffer.memory`     | 缓冲区大小      | 33554432   |

### ACK 机制

| acks   | 说明          | 可靠性 | 性能 |
| ------ | ------------- | ------ | ---- |
| 0      | 不等待确认    | 最低   | 最高 |
| 1      | Leader 确认   | 中等   | 中等 |
| -1/all | 所有 ISR 确认 | 最高   | 最低 |

### 生产者示例

```java
public class ProducerExample {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        
        // 可靠性配置
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);  // 幂等性
        
        // 性能配置
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
        props.put(ProducerConfig.LINGER_MS_CONFIG, 5);
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432);
        
        try (KafkaProducer<String, String> producer = new KafkaProducer<>(props)) {
            
            // 1. 异步发送（Fire and Forget）
            producer.send(new ProducerRecord<>("topic", "key", "value"));
            
            // 2. 异步发送（带回调）
            producer.send(new ProducerRecord<>("topic", "key", "value"), 
                (metadata, exception) -> {
                    if (exception == null) {
                        System.out.printf("partition=%d, offset=%d%n",
                            metadata.partition(), metadata.offset());
                    } else {
                        exception.printStackTrace();
                    }
                });
            
            // 3. 同步发送
            RecordMetadata metadata = producer.send(
                new ProducerRecord<>("topic", "key", "value")).get();
            System.out.println("offset: " + metadata.offset());
        }
    }
}
```

### 自定义分区器

```java
public class CustomPartitioner implements Partitioner {
    
    @Override
    public int partition(String topic, Object key, byte[] keyBytes, 
                        Object value, byte[] valueBytes, Cluster cluster) {
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        int numPartitions = partitions.size();
        
        if (key == null) {
            // 无 key，轮询
            return ThreadLocalRandom.current().nextInt(numPartitions);
        }
        
        // 有 key，按 key hash
        return Math.abs(key.hashCode()) % numPartitions;
    }
    
    @Override
    public void close() {}
    
    @Override
    public void configure(Map<String, ?> configs) {}
}

// 使用自定义分区器
props.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, CustomPartitioner.class.getName());
```

### 自定义序列化器

```java
public class UserSerializer implements Serializer<User> {
    
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public byte[] serialize(String topic, User data) {
        try {
            return objectMapper.writeValueAsBytes(data);
        } catch (JsonProcessingException e) {
            throw new SerializationException("Error serializing User", e);
        }
    }
}
```

## 消费者（Consumer）

### 消费流程

```
Consumer Group
    ↓
Group Coordinator（协调者）
    ↓
Partition Assignment（分区分配）
    ↓
Fetch Messages（拉取消息）
    ↓
Deserialize（反序列化）
    ↓
Process（处理）
    ↓
Commit Offset（提交位移）
```

### 核心配置

| 配置项                    | 说明               | 默认值 |
| ------------------------- | ------------------ | ------ |
| `bootstrap.servers`       | Broker 地址列表    | 无     |
| `group.id`                | 消费者组 ID        | 无     |
| `key.deserializer`        | Key 反序列化器     | 无     |
| `value.deserializer`      | Value 反序列化器   | 无     |
| `enable.auto.commit`      | 自动提交           | true   |
| `auto.commit.interval.ms` | 自动提交间隔       | 5000   |
| `auto.offset.reset`       | 无位移时的策略     | latest |
| `max.poll.records`        | 单次拉取最大记录数 | 500    |

### auto.offset.reset 策略

| 值       | 说明                 |
| -------- | -------------------- |
| earliest | 从最早的消息开始消费 |
| latest   | 从最新的消息开始消费 |
| none     | 抛出异常             |

### 消费者示例

```java
public class ConsumerExample {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "my-group");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        
        // 消费策略
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);  // 手动提交
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
        
        try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props)) {
            consumer.subscribe(Collections.singletonList("test-topic"));
            
            while (true) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
                
                for (ConsumerRecord<String, String> record : records) {
                    System.out.printf("partition=%d, offset=%d, key=%s, value=%s%n",
                        record.partition(), record.offset(), record.key(), record.value());
                    
                    // 处理消息
                    processRecord(record);
                }
                
                // 手动提交位移
                consumer.commitSync();
            }
        }
    }
}
```

### 位移提交

#### 自动提交

```java
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, 5000);
```

问题：可能重复消费或丢失消息

#### 手动同步提交

```java
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
    for (ConsumerRecord<String, String> record : records) {
        processRecord(record);
    }
    // 同步提交，阻塞直到完成
    consumer.commitSync();
}
```

#### 手动异步提交

```java
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
    for (ConsumerRecord<String, String> record : records) {
        processRecord(record);
    }
    // 异步提交
    consumer.commitAsync((offsets, exception) -> {
        if (exception != null) {
            log.error("Commit failed", exception);
        }
    });
}
```

#### 按分区提交

```java
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
    
    for (TopicPartition partition : records.partitions()) {
        List<ConsumerRecord<String, String>> partitionRecords = records.records(partition);
        
        for (ConsumerRecord<String, String> record : partitionRecords) {
            processRecord(record);
        }
        
        // 按分区提交
        long lastOffset = partitionRecords.get(partitionRecords.size() - 1).offset();
        consumer.commitSync(Collections.singletonMap(
            partition, new OffsetAndMetadata(lastOffset + 1)));
    }
}
```

### 消费者再平衡

当消费者组成员变化时，会触发再平衡（Rebalance）。

#### 再平衡监听器

```java
consumer.subscribe(Collections.singletonList("test-topic"), new ConsumerRebalanceListener() {
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
        // 分区被撤销前调用
        System.out.println("分区被撤销: " + partitions);
        // 提交当前位移
        consumer.commitSync();
    }
    
    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
        // 分区分配后调用
        System.out.println("分区已分配: " + partitions);
    }
});
```

### 指定分区消费

```java
// 手动分配分区
TopicPartition partition0 = new TopicPartition("test-topic", 0);
TopicPartition partition1 = new TopicPartition("test-topic", 1);
consumer.assign(Arrays.asList(partition0, partition1));

// 从指定位置开始消费
consumer.seek(partition0, 100);  // 从 offset 100 开始
consumer.seekToBeginning(Collections.singletonList(partition1));  // 从头开始
consumer.seekToEnd(Collections.singletonList(partition1));  // 从最新开始
```

## 消费者组

### 分区分配策略

| 策略                      | 说明                     |
| ------------------------- | ------------------------ |
| RangeAssignor             | 按范围分配，默认策略     |
| RoundRobinAssignor        | 轮询分配                 |
| StickyAssignor            | 粘性分配，减少再平衡影响 |
| CooperativeStickyAssignor | 协作式粘性分配           |

```java
props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, 
    StickyAssignor.class.getName());
```

### 消费者组状态

```
Empty → PreparingRebalance → CompletingRebalance → Stable
                 ↑                                    │
                 └────────────────────────────────────┘
```

## 小结

- 生产者通过 acks 配置可靠性级别
- 生产者支持同步、异步发送
- 消费者通过消费者组实现并行消费
- 手动提交位移更可靠
- 再平衡时需要注意位移提交
- 可以通过分配策略优化再平衡
