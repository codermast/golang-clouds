---
order: 1
---

# RocketMQ 简介与安装

## 什么是 RocketMQ

Apache RocketMQ 是一个分布式消息中间件，源于阿里巴巴的 MetaQ，经过多年双十一的考验，具有以下特点：

- **低延迟**：毫秒级消息投递
- **高可靠**：消息持久化、主从复制
- **高性能**：单机十万级 TPS
- **高可用**：分布式架构，支持集群部署
- **丰富的消息类型**：普通消息、顺序消息、延迟消息、事务消息

## 核心概念

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                       NameServer Cluster                    │
│  ┌─────────────┐                      ┌─────────────┐       │
│  │ NameServer  │                      │ NameServer  │       │
│  └─────────────┘                      └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
              ↑                                  ↑
              │ 注册                              │ 注册
              │                                  │
┌─────────────────────────────────────────────────────────────┐
│                       Broker Cluster                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Broker-A    │  │ Broker-B    │  │ Broker-C    │         │
│  │ Master      │  │ Master      │  │ Master      │         │
│  │ Slave       │  │ Slave       │  │ Slave       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
              ↑                                  ↓
          Producer                          Consumer
```

### 核心术语

| 概念               | 说明                           |
| ------------------ | ------------------------------ |
| **NameServer**     | 注册中心，管理 Broker 路由信息 |
| **Broker**         | 消息服务器，存储和转发消息     |
| **Producer**       | 消息生产者                     |
| **Consumer**       | 消息消费者                     |
| **Topic**          | 消息主题，一级分类             |
| **Tag**            | 消息标签，二级分类             |
| **Queue**          | 消息队列，Topic 的分片         |
| **Message**        | 消息实体                       |
| **Producer Group** | 生产者组                       |
| **Consumer Group** | 消费者组                       |

### 消息模型

```
Topic: OrderTopic
├── Queue 0 → Message 0, 3, 6, 9 ...
├── Queue 1 → Message 1, 4, 7, 10 ...
├── Queue 2 → Message 2, 5, 8, 11 ...
└── Queue 3 → ...

Consumer Group: order-consumer-group
├── Consumer 1 → Queue 0, 1
└── Consumer 2 → Queue 2, 3
```

### 与其他 MQ 对比

| 特性     | RocketMQ | Kafka   | RabbitMQ |
| -------- | -------- | ------- | -------- |
| 单机吞吐 | 10万级   | 100万级 | 万级     |
| 消息延迟 | 毫秒级   | 毫秒级  | 微秒级   |
| 顺序消息 | 支持     | 支持    | 支持     |
| 延迟消息 | 支持     | 不支持  | 插件支持 |
| 事务消息 | 支持     | 不支持  | 支持     |
| 消息回溯 | 支持     | 支持    | 不支持   |
| 开发语言 | Java     | Scala   | Erlang   |

## Docker 安装

### docker-compose.yml

```yaml
version: '3'
services:
  namesrv:
    image: apache/rocketmq:5.1.3
    container_name: rmqnamesrv
    ports:
      - "9876:9876"
    command: sh mqnamesrv
    environment:
      - JAVA_OPT_EXT=-Xms256m -Xmx256m

  broker:
    image: apache/rocketmq:5.1.3
    container_name: rmqbroker
    ports:
      - "10909:10909"
      - "10911:10911"
      - "10912:10912"
    depends_on:
      - namesrv
    command: sh mqbroker -n namesrv:9876
    environment:
      - JAVA_OPT_EXT=-Xms512m -Xmx512m

  dashboard:
    image: apacherocketmq/rocketmq-dashboard:latest
    container_name: rocketmq-dashboard
    ports:
      - "8080:8080"
    depends_on:
      - namesrv
    environment:
      - JAVA_OPTS=-Drocketmq.namesrv.addr=namesrv:9876
```

### 启动

```bash
docker-compose up -d
```

### 访问管理界面

浏览器访问：`http://localhost:8080`

## Linux 安装

### 下载

```bash
wget https://dist.apache.org/repos/dist/release/rocketmq/5.1.3/rocketmq-all-5.1.3-bin-release.zip
unzip rocketmq-all-5.1.3-bin-release.zip
cd rocketmq-all-5.1.3-bin-release
```

### 启动 NameServer

```bash
# 启动
nohup sh bin/mqnamesrv &

# 查看日志
tail -f ~/logs/rocketmqlogs/namesrv.log
```

### 启动 Broker

```bash
# 启动
nohup sh bin/mqbroker -n localhost:9876 &

# 查看日志
tail -f ~/logs/rocketmqlogs/broker.log
```

### 关闭服务

```bash
# 关闭 Broker
sh bin/mqshutdown broker

# 关闭 NameServer
sh bin/mqshutdown namesrv
```

## 命令行工具

### 创建 Topic

```bash
sh bin/mqadmin updateTopic -n localhost:9876 -t TestTopic -c DefaultCluster
```

### 查看 Topic 列表

```bash
sh bin/mqadmin topicList -n localhost:9876
```

### 查看 Topic 详情

```bash
sh bin/mqadmin topicStatus -n localhost:9876 -t TestTopic
```

### 查看消费者组

```bash
sh bin/mqadmin consumerProgress -n localhost:9876 -g test-consumer-group
```

### 发送测试消息

```bash
sh bin/tools.sh org.apache.rocketmq.example.quickstart.Producer
```

### 消费测试消息

```bash
sh bin/tools.sh org.apache.rocketmq.example.quickstart.Consumer
```

## Java 客户端

### 添加依赖

```xml
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-client</artifactId>
    <version>5.1.3</version>
</dependency>
```

### 生产者

```java
import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.common.message.Message;

public class ProducerDemo {
    public static void main(String[] args) throws Exception {
        // 创建生产者
        DefaultMQProducer producer = new DefaultMQProducer("producer-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.start();
        
        try {
            for (int i = 0; i < 10; i++) {
                // 创建消息
                Message msg = new Message(
                    "TestTopic",    // Topic
                    "TagA",         // Tag
                    ("Hello RocketMQ " + i).getBytes()  // Body
                );
                
                // 发送消息
                SendResult result = producer.send(msg);
                System.out.printf("发送成功: msgId=%s, queueId=%d%n",
                    result.getMsgId(), result.getMessageQueue().getQueueId());
            }
        } finally {
            producer.shutdown();
        }
    }
}
```

### 消费者

```java
import org.apache.rocketmq.client.consumer.DefaultMQPushConsumer;
import org.apache.rocketmq.client.consumer.listener.ConsumeConcurrentlyStatus;
import org.apache.rocketmq.client.consumer.listener.MessageListenerConcurrently;
import org.apache.rocketmq.common.message.MessageExt;

public class ConsumerDemo {
    public static void main(String[] args) throws Exception {
        // 创建消费者
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("consumer-group");
        consumer.setNamesrvAddr("localhost:9876");
        
        // 订阅 Topic
        consumer.subscribe("TestTopic", "*");  // * 表示所有 Tag
        
        // 注册消息监听器
        consumer.registerMessageListener((MessageListenerConcurrently) (msgs, context) -> {
            for (MessageExt msg : msgs) {
                System.out.printf("收到消息: msgId=%s, body=%s%n",
                    msg.getMsgId(), new String(msg.getBody()));
            }
            return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
        });
        
        consumer.start();
        System.out.println("消费者启动成功");
    }
}
```

## 消息发送方式

### 同步发送

```java
SendResult result = producer.send(msg);
```

可靠性高，等待服务器响应。

### 异步发送

```java
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
```

性能高，通过回调处理结果。

### 单向发送

```java
producer.sendOneway(msg);
```

不关心发送结果，性能最高。

## 消费者类型

### Push 消费者

Broker 推送消息给消费者（实际是长轮询）：

```java
DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("group");
```

### Pull 消费者

消费者主动拉取消息：

```java
DefaultLitePullConsumer consumer = new DefaultLitePullConsumer("group");
consumer.subscribe("TestTopic", "*");
consumer.start();

while (true) {
    List<MessageExt> msgs = consumer.poll();
    for (MessageExt msg : msgs) {
        System.out.println(new String(msg.getBody()));
    }
}
```

## 小结

- RocketMQ 是阿里开源的分布式消息中间件
- 核心组件：NameServer、Broker、Producer、Consumer
- 支持多种消息类型：普通、顺序、延迟、事务
- 推荐使用 Docker 快速安装
- 提供 Web 管理界面（Dashboard）
