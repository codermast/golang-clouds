---
order: 1
---

# Kafka 简介与安装

## 什么是 Kafka

Apache Kafka 是一个分布式流处理平台，具有以下三个核心能力：

1. **消息队列**：发布和订阅消息流
2. **存储系统**：持久化存储消息流
3. **流处理**：实时处理消息流

### 核心特性

- **高吞吐量**：百万级 TPS
- **持久化**：消息持久化到磁盘
- **分布式**：天然支持集群部署
- **可扩展**：水平扩展能力强
- **消息回溯**：支持消息重新消费

## 核心概念

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Kafka Cluster                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Broker 0  │  │   Broker 1  │  │   Broker 2  │         │
│  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │         │
│  │  │Topic-A│  │  │  │Topic-A│  │  │  │Topic-A│  │         │
│  │  │ P0(L) │  │  │  │ P1(L) │  │  │  │ P2(L) │  │         │
│  │  │ P1(F) │  │  │  │ P2(F) │  │  │  │ P0(F) │  │         │
│  │  └───────┘  │  │  └───────┘  │  │  └───────┘  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
         ↑                                       ↓
     Producer                               Consumer Group
                                           ┌─────────────┐
                                           │ Consumer 0  │
                                           │ Consumer 1  │
                                           │ Consumer 2  │
                                           └─────────────┘
```

### 核心术语

| 概念               | 说明                           |
| ------------------ | ------------------------------ |
| **Broker**         | Kafka 服务器节点               |
| **Topic**          | 消息主题，逻辑分类             |
| **Partition**      | 分区，Topic 的物理划分         |
| **Replica**        | 副本，分区的备份               |
| **Leader**         | 分区的主副本，负责读写         |
| **Follower**       | 分区的从副本，同步 Leader 数据 |
| **Producer**       | 消息生产者                     |
| **Consumer**       | 消息消费者                     |
| **Consumer Group** | 消费者组，多个消费者协作消费   |
| **Offset**         | 消息在分区中的位置             |
| **ZooKeeper**      | 协调服务（新版本可选）         |

### 分区与副本

```
Topic: orders (3 partitions, 2 replicas)

Broker 0          Broker 1          Broker 2
┌─────────┐      ┌─────────┐      ┌─────────┐
│ P0 (L)  │      │ P1 (L)  │      │ P2 (L)  │
│ P1 (F)  │      │ P2 (F)  │      │ P0 (F)  │
└─────────┘      └─────────┘      └─────────┘

L = Leader, F = Follower
```

### 消费者组

```
Topic: orders (3 partitions)

Consumer Group A:
  Consumer 1 → P0
  Consumer 2 → P1
  Consumer 3 → P2

Consumer Group B:
  Consumer 1 → P0, P1, P2
```

- 同一消费者组内，一个分区只能被一个消费者消费
- 不同消费者组之间互不影响

## Docker 安装

### docker-compose.yml

```yaml
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
```

### 启动

```bash
docker-compose up -d
```

### KRaft 模式（无 ZooKeeper）

Kafka 3.0+ 支持 KRaft 模式：

```yaml
version: '3'
services:
  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
```

## 命令行工具

### Topic 管理

```bash
# 进入容器
docker exec -it kafka bash

# 创建 Topic
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic test-topic \
  --partitions 3 \
  --replication-factor 1

# 查看 Topic 列表
kafka-topics --list --bootstrap-server localhost:9092

# 查看 Topic 详情
kafka-topics --describe \
  --bootstrap-server localhost:9092 \
  --topic test-topic

# 删除 Topic
kafka-topics --delete \
  --bootstrap-server localhost:9092 \
  --topic test-topic
```

### 生产消息

```bash
# 命令行生产者
kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic test-topic
```

### 消费消息

```bash
# 命令行消费者
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic test-topic \
  --from-beginning

# 指定消费者组
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic test-topic \
  --group my-group
```

### 消费者组管理

```bash
# 查看消费者组列表
kafka-consumer-groups --list --bootstrap-server localhost:9092

# 查看消费者组详情
kafka-consumer-groups --describe \
  --bootstrap-server localhost:9092 \
  --group my-group

# 重置消费位移
kafka-consumer-groups --reset-offsets \
  --bootstrap-server localhost:9092 \
  --group my-group \
  --topic test-topic \
  --to-earliest \
  --execute
```

## Java 客户端

### 添加依赖

```xml
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>3.6.0</version>
</dependency>
```

### 生产者

```java
import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class KafkaProducerDemo {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, 
            "org.apache.kafka.common.serialization.StringSerializer");
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, 
            "org.apache.kafka.common.serialization.StringSerializer");
        
        try (KafkaProducer<String, String> producer = new KafkaProducer<>(props)) {
            for (int i = 0; i < 10; i++) {
                ProducerRecord<String, String> record = 
                    new ProducerRecord<>("test-topic", "key-" + i, "value-" + i);
                
                // 异步发送
                producer.send(record, (metadata, exception) -> {
                    if (exception == null) {
                        System.out.printf("发送成功: partition=%d, offset=%d%n",
                            metadata.partition(), metadata.offset());
                    } else {
                        exception.printStackTrace();
                    }
                });
            }
        }
    }
}
```

### 消费者

```java
import org.apache.kafka.clients.consumer.*;
import java.time.Duration;
import java.util.Collections;
import java.util.Properties;

public class KafkaConsumerDemo {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "my-group");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, 
            "org.apache.kafka.common.serialization.StringDeserializer");
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, 
            "org.apache.kafka.common.serialization.StringDeserializer");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        
        try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props)) {
            consumer.subscribe(Collections.singletonList("test-topic"));
            
            while (true) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
                for (ConsumerRecord<String, String> record : records) {
                    System.out.printf("收到消息: partition=%d, offset=%d, key=%s, value=%s%n",
                        record.partition(), record.offset(), record.key(), record.value());
                }
            }
        }
    }
}
```

## 消息存储

Kafka 消息存储在日志文件中：

```
/kafka-logs/
└── test-topic-0/          # Topic-Partition
    ├── 00000000000000000000.log    # 日志文件
    ├── 00000000000000000000.index  # 偏移量索引
    └── 00000000000000000000.timeindex  # 时间索引
```

### 日志分段

- 默认每个分段 1GB
- 到达大小或时间限制时创建新分段
- 可配置日志保留策略

## 小结

- Kafka 是高吞吐量的分布式消息系统
- 核心概念：Broker、Topic、Partition、Consumer Group
- 分区实现并行处理，副本实现高可用
- 支持 ZooKeeper 模式和 KRaft 模式
- 消息持久化到磁盘，支持消息回溯
