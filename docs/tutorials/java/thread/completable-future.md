---
order : 7
---

# CompletableFuture

`CompletableFuture` 是 JDK 8 引入的异步编程工具，实现了 `Future` 和 `CompletionStage` 接口，支持函数式编程和链式调用。

## Future 的局限性

传统 `Future` 的问题：

```java
ExecutorService executor = Executors.newFixedThreadPool(2);
Future<String> future = executor.submit(() -> {
    Thread.sleep(1000);
    return "结果";
});

// 问题1：get() 会阻塞
String result = future.get();

// 问题2：无法手动完成
// 问题3：无法链式调用
// 问题4：无法组合多个 Future
```

## 创建 CompletableFuture

### 1. 直接创建

```java
// 创建已完成的 Future
CompletableFuture<String> cf1 = CompletableFuture.completedFuture("result");

// 创建并手动完成
CompletableFuture<String> cf2 = new CompletableFuture<>();
cf2.complete("手动完成");
```

### 2. 异步执行

```java
// 无返回值
CompletableFuture<Void> cf1 = CompletableFuture.runAsync(() -> {
    System.out.println("异步执行任务");
});

// 有返回值
CompletableFuture<String> cf2 = CompletableFuture.supplyAsync(() -> {
    return "异步执行结果";
});

// 指定线程池
ExecutorService executor = Executors.newFixedThreadPool(4);
CompletableFuture<String> cf3 = CompletableFuture.supplyAsync(() -> {
    return "使用自定义线程池";
}, executor);
```

## 获取结果

```java
CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "结果");

// 阻塞获取
String result1 = cf.get();  // 可能抛出异常
String result2 = cf.get(5, TimeUnit.SECONDS);  // 超时获取

// 不抛受检异常
String result3 = cf.join();

// 获取已完成的值，否则返回默认值
String result4 = cf.getNow("默认值");
```

## 结果转换

### thenApply - 转换结果

```java
CompletableFuture<Integer> cf = CompletableFuture
    .supplyAsync(() -> "123")
    .thenApply(s -> Integer.parseInt(s))   // 转换为 Integer
    .thenApply(i -> i * 2);                // 乘以 2

System.out.println(cf.join());  // 246
```

### thenAccept - 消费结果

```java
CompletableFuture.supplyAsync(() -> "结果")
    .thenAccept(result -> {
        System.out.println("接收到：" + result);
    });
```

### thenRun - 执行下一个任务

```java
CompletableFuture.supplyAsync(() -> "结果")
    .thenRun(() -> {
        System.out.println("上一步完成，执行下一步");
    });
```

### 同步与异步

```java
// 同步执行（使用上一步的线程）
.thenApply(x -> x * 2)

// 异步执行（使用默认线程池）
.thenApplyAsync(x -> x * 2)

// 异步执行（使用自定义线程池）
.thenApplyAsync(x -> x * 2, executor)
```

## 结果组合

### thenCompose - 扁平化

用于两个有依赖关系的异步任务。

```java
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> 1)
    .thenCompose(i -> CompletableFuture.supplyAsync(() -> "结果：" + i));

System.out.println(cf.join());  // 结果：1
```

### thenCombine - 合并两个结果

用于两个独立的异步任务。

```java
CompletableFuture<String> cf1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> cf2 = CompletableFuture.supplyAsync(() -> "World");

CompletableFuture<String> combined = cf1.thenCombine(cf2, (s1, s2) -> s1 + " " + s2);
System.out.println(combined.join());  // Hello World
```

### allOf - 等待所有完成

```java
CompletableFuture<String> cf1 = CompletableFuture.supplyAsync(() -> "任务1");
CompletableFuture<String> cf2 = CompletableFuture.supplyAsync(() -> "任务2");
CompletableFuture<String> cf3 = CompletableFuture.supplyAsync(() -> "任务3");

CompletableFuture<Void> allOf = CompletableFuture.allOf(cf1, cf2, cf3);

// 等待所有完成
allOf.join();

// 获取所有结果
List<String> results = Stream.of(cf1, cf2, cf3)
    .map(CompletableFuture::join)
    .collect(Collectors.toList());
```

### anyOf - 任一完成

```java
CompletableFuture<String> cf1 = CompletableFuture.supplyAsync(() -> {
    sleep(1000);
    return "慢任务";
});
CompletableFuture<String> cf2 = CompletableFuture.supplyAsync(() -> {
    sleep(100);
    return "快任务";
});

CompletableFuture<Object> anyOf = CompletableFuture.anyOf(cf1, cf2);
System.out.println(anyOf.join());  // 快任务
```

## 异常处理

### exceptionally - 异常恢复

```java
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> {
        if (true) throw new RuntimeException("出错了");
        return "成功";
    })
    .exceptionally(ex -> {
        System.out.println("异常：" + ex.getMessage());
        return "默认值";  // 返回默认值
    });

System.out.println(cf.join());  // 默认值
```

### handle - 统一处理

无论成功或失败都会执行。

```java
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> {
        if (Math.random() > 0.5) {
            throw new RuntimeException("出错了");
        }
        return "成功";
    })
    .handle((result, ex) -> {
        if (ex != null) {
            return "发生异常：" + ex.getMessage();
        }
        return "结果：" + result;
    });
```

### whenComplete - 回调通知

不改变结果，仅做通知。

```java
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> "结果")
    .whenComplete((result, ex) -> {
        if (ex != null) {
            System.out.println("异常：" + ex);
        } else {
            System.out.println("成功：" + result);
        }
    });
```

## 实战示例

### 示例1：并行调用多个服务

```java
public class ParallelServiceCall {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        
        // 并行调用三个服务
        CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "用户信息";
        });
        
        CompletableFuture<String> orderFuture = CompletableFuture.supplyAsync(() -> {
            sleep(1500);
            return "订单信息";
        });
        
        CompletableFuture<String> productFuture = CompletableFuture.supplyAsync(() -> {
            sleep(800);
            return "商品信息";
        });
        
        // 等待所有完成并汇总
        CompletableFuture<String> result = CompletableFuture
            .allOf(userFuture, orderFuture, productFuture)
            .thenApply(v -> {
                return String.format("汇总：%s, %s, %s",
                    userFuture.join(),
                    orderFuture.join(),
                    productFuture.join());
            });
        
        System.out.println(result.join());
        System.out.println("耗时：" + (System.currentTimeMillis() - start) + "ms");
        // 耗时约 1500ms（而非 3300ms）
    }
    
    static void sleep(long millis) {
        try { Thread.sleep(millis); } catch (InterruptedException e) {}
    }
}
```

### 示例2：异步任务编排

```java
public class AsyncTaskChain {
    public static void main(String[] args) {
        CompletableFuture<String> result = CompletableFuture
            // 1. 获取用户ID
            .supplyAsync(() -> {
                System.out.println("步骤1：获取用户ID");
                return 12345L;
            })
            // 2. 根据用户ID查询用户信息
            .thenCompose(userId -> CompletableFuture.supplyAsync(() -> {
                System.out.println("步骤2：查询用户信息，ID=" + userId);
                return new User(userId, "张三");
            }))
            // 3. 根据用户信息查询订单
            .thenCompose(user -> CompletableFuture.supplyAsync(() -> {
                System.out.println("步骤3：查询订单，用户=" + user.name);
                return "订单-001";
            }))
            // 4. 异常处理
            .exceptionally(ex -> {
                System.out.println("发生异常：" + ex.getMessage());
                return "默认订单";
            });
        
        System.out.println("最终结果：" + result.join());
    }
}

class User {
    Long id;
    String name;
    User(Long id, String name) {
        this.id = id;
        this.name = name;
    }
}
```

### 示例3：带超时的异步调用

```java
public class AsyncWithTimeout {
    public static void main(String[] args) {
        CompletableFuture<String> cf = CompletableFuture
            .supplyAsync(() -> {
                sleep(5000);  // 模拟慢操作
                return "结果";
            })
            // JDK 9+ 支持
            // .orTimeout(2, TimeUnit.SECONDS)
            // .completeOnTimeout("超时默认值", 2, TimeUnit.SECONDS)
            ;
        
        try {
            String result = cf.get(2, TimeUnit.SECONDS);
            System.out.println("结果：" + result);
        } catch (TimeoutException e) {
            System.out.println("操作超时");
            cf.cancel(true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    static void sleep(long millis) {
        try { Thread.sleep(millis); } catch (InterruptedException e) {}
    }
}
```

## API 速查表

### 创建

| 方法                   | 说明                |
| ---------------------- | ------------------- |
| supplyAsync(Supplier)  | 异步执行，有返回值  |
| runAsync(Runnable)     | 异步执行，无返回值  |
| completedFuture(value) | 创建已完成的 Future |

### 转换

| 方法        | 说明               |
| ----------- | ------------------ |
| thenApply   | 转换结果           |
| thenAccept  | 消费结果           |
| thenRun     | 执行下一步         |
| thenCompose | 扁平化（依赖任务） |
| thenCombine | 合并两个结果       |

### 组合

| 方法  | 说明         |
| ----- | ------------ |
| allOf | 等待所有完成 |
| anyOf | 任一完成     |

### 异常

| 方法          | 说明     |
| ------------- | -------- |
| exceptionally | 异常恢复 |
| handle        | 统一处理 |
| whenComplete  | 回调通知 |

## 最佳实践

### 1. 使用自定义线程池

```java
// 不推荐：使用默认的 ForkJoinPool
CompletableFuture.supplyAsync(() -> "result");

// 推荐：使用自定义线程池
ExecutorService executor = Executors.newFixedThreadPool(10);
CompletableFuture.supplyAsync(() -> "result", executor);
```

### 2. 避免阻塞

```java
// 不推荐：在异步回调中阻塞
cf.thenApply(result -> {
    return anotherCf.get();  // 阻塞！
});

// 推荐：使用 thenCompose
cf.thenCompose(result -> anotherCf);
```

### 3. 正确处理异常

```java
CompletableFuture.supplyAsync(() -> riskyOperation())
    .exceptionally(ex -> {
        log.error("操作失败", ex);
        return defaultValue;
    })
    .thenAccept(result -> process(result));
```

### 4. 合理设置超时

```java
// JDK 9+
cf.orTimeout(5, TimeUnit.SECONDS);

// JDK 8
cf.get(5, TimeUnit.SECONDS);
```

## 小结

- `CompletableFuture` 解决了传统 `Future` 的局限性
- 支持链式调用、函数式编程风格
- **创建**：supplyAsync、runAsync
- **转换**：thenApply、thenCompose
- **组合**：allOf、anyOf、thenCombine
- **异常**：exceptionally、handle、whenComplete
- 实际使用中建议配合自定义线程池，并合理处理异常和超时
