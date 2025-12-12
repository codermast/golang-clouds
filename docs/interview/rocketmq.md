---
order: 5
icon: simple-icons:apacherocketmq
---

# RocketMQ 面试题

RocketMQ 面试高频考点，覆盖消息模型、可靠性、顺序消息、事务消息、存储与高可用等核心知识。

---

## 一、基础架构

### Q1: RocketMQ 的核心组件

| 组件 | 说明 |
| :--- | :--- |
| **NameServer** | 注册中心，轻量级，无状态，多个互不通信 |
| **Broker** | 消息存储和转发，分 Master/Slave |
| **Producer** | 消息生产者 |
| **Consumer** | 消息消费者 |

**存储结构：**
- **CommitLog**：所有消息顺序追加写入
- **ConsumeQueue**：消息消费队列，存储 offset 指向 CommitLog
- **IndexFile**：消息索引，支持按 key/时间查询

---

### Q2: Topic、Queue、Tag 的关系

```
Topic (主题)
  ├── Queue 0 ──→ Consumer Instance 1
  ├── Queue 1 ──→ Consumer Instance 2
  ├── Queue 2 ──→ Consumer Instance 3
  └── Queue 3 ──→ Consumer Instance 4
```

| 概念 | 说明 |
| :--- | :--- |
| **Topic** | 一类消息的集合，逻辑分类 |
| **Queue** | 物理分区，一个 Topic 包含多个 Queue |
| **Tag** | 消息标签，二级分类，用于过滤 |
| **Key** | 消息 Key，用于查询和去重 |

---

### Q3: 集群消费和广播消费的区别

| 模式 | 说明 | 场景 |
| :--- | :--- | :--- |
| **集群消费** | 一条消息只被消费组内一个实例消费 | 业务处理（默认） |
| **广播消费** | 一条消息被消费组内所有实例消费 | 本地缓存刷新 |

```java
// 集群消费（默认）
consumer.setMessageModel(MessageModel.CLUSTERING);

// 广播消费
consumer.setMessageModel(MessageModel.BROADCASTING);
```

---

## 二、消息可靠性

### Q4: 如何保证消息不丢失

**消息丢失的三个环节：**

| 环节 | 风险点 | 解决方案 |
| :--- | :--- | :--- |
| 生产者→Broker | 网络异常 | 同步发送 + 重试 |
| Broker 存储 | 宕机丢失 | 同步刷盘 + 主从同步 |
| Broker→消费者 | 消费失败 | 手动 ACK + 重试 |

**生产者可靠发送：**

```java
// 同步发送（推荐）
SendResult result = producer.send(msg);

// 异步发送 + 回调
producer.send(msg, new SendCallback() {
    @Override
    public void onSuccess(SendResult sendResult) {}
    @Override
    public void onException(Throwable e) {
        // 重试或记录日志
    }
});
```

**Broker 配置：**

```properties
# 同步刷盘（更可靠）
flushDiskType=SYNC_FLUSH

# 同步复制（更可靠）
brokerRole=SYNC_MASTER
```

---

### Q5: 消费重试机制

**重试次数：**
- 默认最多重试 16 次
- 重试间隔逐渐增大（10s、30s、1m、2m...）

**重试触发：**

```java
consumer.registerMessageListener((msgs, context) -> {
    try {
        // 处理消息
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
    } catch (Exception e) {
        // 返回 RECONSUME_LATER 触发重试
        return ConsumeConcurrentlyStatus.RECONSUME_LATER;
    }
});
```

**死信队列（DLQ）：**
- 重试超过最大次数后进入死信队列
- 队列名：`%DLQ%消费组名`
- 需要手动处理或设置监控

---

### Q6: 如何保证幂等性

**常见方案：**

| 方案 | 实现 | 适用场景 |
| :--- | :--- | :--- |
| 唯一键 | DB 唯一索引 | 写入操作 |
| 去重表 | 消息 ID 存 Redis/DB | 通用 |
| 状态机 | 检查状态再处理 | 状态流转 |
| Token | 一次性 Token | 防重提交 |

**去重表实现：**

```java
public boolean consume(Message msg) {
    String msgId = msg.getMsgId();
    
    // 分布式锁 + 去重
    if (redis.setNx("consumed:" + msgId, "1", 7*24*3600)) {
        try {
            process(msg);
            return true;
        } catch (Exception e) {
            redis.del("consumed:" + msgId);
            throw e;
        }
    }
    return true;  // 已消费，直接返回成功
}
```

---

## 三、顺序消息

### Q7: 如何保证消息顺序

**全局顺序 vs 分区顺序：**

| 类型 | 说明 | 性能 |
| :--- | :--- | :--- |
| 全局顺序 | 整个 Topic 只用一个 Queue | 差 |
| 分区顺序 | 同一业务 key 进同一 Queue | 好（推荐） |

**分区顺序实现：**

```java
// 发送端：相同订单号进同一队列
producer.send(msg, new MessageQueueSelector() {
    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        Long orderId = (Long) arg;
        int index = (int) (orderId % mqs.size());
        return mqs.get(index);
    }
}, orderId);

// 消费端：使用顺序消费监听器
consumer.registerMessageListener(new MessageListenerOrderly() {
    @Override
    public ConsumeOrderlyStatus consumeMessage(List<MessageExt> msgs, ConsumeOrderlyContext context) {
        // 顺序处理
        return ConsumeOrderlyStatus.SUCCESS;
    }
});
```

---

### Q8: 顺序消息的局限性

**问题场景：**
1. **Broker 宕机**：队列迁移可能乱序
2. **消费超时**：队列锁转移给其他消费者
3. **扩缩容**：Queue 变化导致路由改变

**解决方案：**
- 消费端检查顺序（如检查状态流转是否合法）
- 异常情况下降级处理

---

## 四、延迟消息

### Q9: 延迟消息的实现

**固定延迟级别（RocketMQ 4.x）：**

```java
msg.setDelayTimeLevel(3);  // 10s 后投递

// 延迟级别（18 个）:
// 1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
```

**任意时间延迟（RocketMQ 5.0+）：**

```java
// 设置投递时间戳
msg.setDeliverTimeMs(System.currentTimeMillis() + 60000);  // 1 分钟后
```

**原理：**
- 延迟消息先存入特殊 Topic（SCHEDULE_TOPIC_XXXX）
- 定时任务检查到期消息
- 到期后投递到真正的 Topic

---

## 五、事务消息

### Q10: 事务消息的实现流程

```
Producer ───────────────────── Broker ─────────────────── Consumer
    │                             │                           │
    │──① 发送半消息(Prepare)────→│                           │
    │←──② 返回发送结果──────────│                           │
    │                             │                           │
    │──③ 执行本地事务             │                           │
    │                             │                           │
    │──④ Commit/Rollback────────→│                           │
    │                             │──⑤ 消息可消费─────────→ │
    │                             │                           │
    │←──⑥ 回查本地事务状态(如需)──│                           │
```

**代码示例：**

```java
TransactionMQProducer producer = new TransactionMQProducer("group");
producer.setTransactionListener(new TransactionListener() {
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            // 执行本地事务
            doLocalTransaction();
            return LocalTransactionState.COMMIT_MESSAGE;
        } catch (Exception e) {
            return LocalTransactionState.ROLLBACK_MESSAGE;
        }
    }
    
    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        // 回查本地事务状态
        if (checkTransactionSuccess(msg)) {
            return LocalTransactionState.COMMIT_MESSAGE;
        }
        return LocalTransactionState.ROLLBACK_MESSAGE;
    }
});

// 发送事务消息
producer.sendMessageInTransaction(msg, null);
```

---

### Q11: 事务消息的回查机制

**回查触发条件：**
- 半消息发送成功，但未收到 Commit/Rollback
- 默认 1 分钟后开始回查
- 最多回查 15 次

**本地事务要求：**
- 必须是**幂等**的
- 必须有**状态可查**（如订单状态字段）

---

## 六、存储与性能

### Q12: 为什么 RocketMQ 性能高

| 机制 | 说明 |
| :--- | :--- |
| **顺序写** | CommitLog 顺序追加，磁盘顺序写性能高 |
| **PageCache** | 利用操作系统页缓存，减少磁盘 IO |
| **零拷贝** | mmap 内存映射，减少数据拷贝 |
| **异步刷盘** | 批量刷盘，提高吞吐量 |

---

### Q13: 同步刷盘 vs 异步刷盘

| 模式 | 说明 | 特点 |
| :--- | :--- | :--- |
| 同步刷盘 | 消息写入磁盘后才返回成功 | 可靠性高，性能低 |
| 异步刷盘 | 消息写入 PageCache 即返回 | 性能高，可能丢数据 |

```properties
# Broker 配置
flushDiskType=SYNC_FLUSH   # 同步刷盘
flushDiskType=ASYNC_FLUSH  # 异步刷盘（默认）
```

---

### Q14: 消息堆积如何处理

**排查原因：**
1. 消费能力不足
2. 消费逻辑有 bug
3. 下游依赖慢

**解决方案：**

| 方案 | 说明 |
| :--- | :--- |
| 扩容消费者 | 增加消费实例（不超过 Queue 数） |
| 提高线程数 | `consumeThreadMax` |
| 批量消费 | `consumeMessageBatchMaxSize` |
| 临时队列 | 紧急情况，消息转存后处理 |
| 降级/跳过 | 非核心消息直接跳过 |

```java
// 增加消费线程
consumer.setConsumeThreadMax(64);
consumer.setConsumeThreadMin(32);

// 批量消费
consumer.setConsumeMessageBatchMaxSize(10);
```

---

## 七、高可用

### Q15: 主从复制模式

| 模式 | 说明 | 特点 |
| :--- | :--- | :--- |
| 异步复制 | Master 不等 Slave 确认 | 性能好，可能丢数据 |
| 同步复制 | 等待 Slave 确认才返回 | 可靠，性能略低 |

```properties
# Master 配置
brokerRole=ASYNC_MASTER   # 异步复制
brokerRole=SYNC_MASTER    # 同步复制

# Slave 配置
brokerRole=SLAVE
```

---

### Q16: Dledger 模式（自动选主）

**特点：**
- 基于 Raft 协议
- 自动选举 Master
- 无需手动切换

**对比：**

| 特性 | 普通主从 | Dledger |
| :--- | :--- | :--- |
| 选主 | 手动 | 自动（Raft） |
| 数据一致性 | 弱 | 强 |
| 运维复杂度 | 低 | 中 |

---

## 八、更多八股文

### Q17: 消费者负载均衡策略

| 策略 | 说明 |
| :--- | :--- |
| **AllocateMessageQueueAveragely** | 平均分配（默认） |
| **AllocateMessageQueueAveragelyByCircle** | 轮询分配 |
| **AllocateMessageQueueConsistentHash** | 一致性哈希 |
| **AllocateMessageQueueByConfig** | 配置指定 |

**注意：** 消费者数量不应超过 Queue 数量，否则有消费者空闲。

---

### Q18: 消息过滤方式

| 方式 | 说明 | 效率 |
| :--- | :--- | :--- |
| **Tag 过滤** | 简单标签过滤 | 高（Broker 端） |
| **SQL92 过滤** | 复杂条件过滤 | 中（Broker 端） |
| **类过滤** | 自定义 Java 类 | 低 |

```java
// Tag 过滤
consumer.subscribe("Topic", "TagA || TagB");

// SQL92 过滤
consumer.subscribe("Topic", MessageSelector.bySql("age > 18"));
```

---

### Q19: 消息轨迹

**作用：** 追踪消息全生命周期

**包含信息：**
- 生产者发送时间、Broker 地址
- 消费者接收时间、消费结果
- 重试次数

```java
// 开启消息轨迹
DefaultMQProducer producer = new DefaultMQProducer("group", true);
```

---

### Q20: RocketMQ vs Kafka

| 特性 | RocketMQ | Kafka |
| :--- | :--- | :--- |
| 开发语言 | Java | Scala |
| 事务消息 | ✅ 原生支持 | 0.11+ 支持 |
| 延迟消息 | ✅ 固定级别 / 5.0 任意 | ❌ 需自行实现 |
| 消息回溯 | ✅ 按时间 | ✅ 按 offset |
| 消息过滤 | ✅ Tag/SQL | ❌ |
| 吞吐量 | 十万级 | 百万级 |
| 适用场景 | 业务消息 | 日志、大数据 |

---

### Q21: NameServer vs ZooKeeper

| 特性 | NameServer | ZooKeeper |
| :--- | :--- | :--- |
| 架构 | 无状态，互不通信 | 有状态，需要选主 |
| 一致性 | 最终一致 | 强一致（ZAB） |
| 复杂度 | 简单 | 复杂 |
| 功能 | 仅路由发现 | 配置、选主、分布式锁 |

**为什么选 NameServer：** 简单、轻量、足够用。

---

### Q22: 消费位点管理

**存储位置：**
- **集群消费**：Broker 端存储
- **广播消费**：消费者本地存储

**位点提交方式：**
- **自动提交**：定时自动提交
- **手动提交**：消费成功后手动提交

```java
// 手动提交（推荐）
consumer.setAutoCommit(false);
consumer.commitSync();
```

---

## 九、高频考点清单

### 必考

- [ ] 核心组件和架构
- [ ] 消息不丢失的保障（三个环节）
- [ ] 幂等性实现方案
- [ ] 顺序消息实现
- [ ] 事务消息流程和回查

### 常考

- [ ] CommitLog/ConsumeQueue/IndexFile 作用
- [ ] 延迟消息实现
- [ ] 消费重试和死信队列
- [ ] 同步/异步刷盘区别
- [ ] 消息堆积处理
- [ ] 消费者负载均衡策略

### 进阶

- [ ] 同步/异步复制区别
- [ ] Dledger 模式
- [ ] 顺序写 + PageCache + 零拷贝
- [ ] RocketMQ vs Kafka
- [ ] NameServer vs ZooKeeper

