---
order: 9
---

# Java核心 - 常用类

## Object 类

Object 是 Java 中所有类的根类，所有类都直接或间接继承自 Object。

### 常用方法

```java
public class Object {
    // 返回对象的哈希码
    public native int hashCode();
    
    // 判断两个对象是否相等
    public boolean equals(Object obj) {
        return (this == obj);
    }
    
    // 返回对象的字符串表示
    public String toString() {
        return getClass().getName() + "@" + Integer.toHexString(hashCode());
    }
    
    // 返回对象的运行时类
    public final native Class<?> getClass();
    
    // 创建并返回对象的副本
    protected native Object clone() throws CloneNotSupportedException;
    
    // 对象被垃圾回收前调用（已废弃）
    protected void finalize() throws Throwable { }
}
```

### 重写 equals 和 hashCode

```java
public class Person {
    private String name;
    private int age;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Person person = (Person) o;
        return age == person.age && Objects.equals(name, person.name);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }
    
    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age + "}";
    }
}
```

::: warning equals 与 hashCode 约定
- 如果两个对象 equals 相等，则 hashCode 必须相等
- 如果两个对象 hashCode 相等，equals 不一定相等
- 重写 equals 必须同时重写 hashCode
:::

## Objects 工具类

Objects 是 Java 7 引入的工具类，提供了对象操作的静态方法。

```java
// 判空
Objects.isNull(obj);       // obj == null
Objects.nonNull(obj);      // obj != null
Objects.requireNonNull(obj);  // 为空抛出 NPE
Objects.requireNonNull(obj, "对象不能为空");  // 自定义消息

// 安全比较
Objects.equals(a, b);  // 空安全的 equals
Objects.deepEquals(arr1, arr2);  // 深度比较（用于数组）

// 计算哈希
Objects.hash(field1, field2, field3);
Objects.hashCode(obj);  // 空安全，null 返回 0

// 转字符串
Objects.toString(obj);  // 空返回 "null"
Objects.toString(obj, "默认值");  // 空返回默认值

// Java 9+
Objects.requireNonNullElse(obj, defaultValue);
Objects.requireNonNullElseGet(obj, () -> createDefault());
```

## 包装类

Java 为每个基本类型提供了对应的包装类。

### 基本类型与包装类

| 基本类型 | 包装类    | 缓存范围     |
| :------- | :-------- | :----------- |
| byte     | Byte      | -128 ~ 127   |
| short    | Short     | -128 ~ 127   |
| int      | Integer   | -128 ~ 127   |
| long     | Long      | -128 ~ 127   |
| float    | Float     | 无缓存       |
| double   | Double    | 无缓存       |
| char     | Character | 0 ~ 127      |
| boolean  | Boolean   | TRUE / FALSE |

### 装箱与拆箱

```java
// 自动装箱
Integer num = 100;  // Integer.valueOf(100)

// 自动拆箱
int n = num;  // num.intValue()

// 手动装箱/拆箱
Integer num2 = Integer.valueOf(100);
int n2 = num2.intValue();
```

### Integer 缓存

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b);  // true（使用缓存）

Integer c = 128;
Integer d = 128;
System.out.println(c == d);  // false（新建对象）
System.out.println(c.equals(d));  // true
```

### 常用方法

```java
// 字符串转数字
int num = Integer.parseInt("123");
double d = Double.parseDouble("3.14");

// 数字转字符串
String str = Integer.toString(123);
String str2 = String.valueOf(123);

// 进制转换
String binary = Integer.toBinaryString(10);  // "1010"
String hex = Integer.toHexString(255);       // "ff"
String octal = Integer.toOctalString(8);     // "10"
int fromBinary = Integer.parseInt("1010", 2); // 10

// 比较
int cmp = Integer.compare(10, 20);  // -1
int max = Integer.max(10, 20);      // 20
int min = Integer.min(10, 20);      // 10

// 常量
Integer.MAX_VALUE;  // 2147483647
Integer.MIN_VALUE;  // -2147483648
```

## Math 类

Math 类提供了常用的数学运算方法。

```java
// 基本运算
Math.abs(-10);      // 10（绝对值）
Math.max(10, 20);   // 20（最大值）
Math.min(10, 20);   // 10（最小值）

// 幂和根
Math.pow(2, 3);     // 8.0（幂）
Math.sqrt(16);      // 4.0（平方根）
Math.cbrt(27);      // 3.0（立方根）

// 指数和对数
Math.exp(1);        // 2.718...（e^x）
Math.log(Math.E);   // 1.0（自然对数）
Math.log10(100);    // 2.0（以10为底的对数）

// 取整
Math.ceil(3.2);     // 4.0（向上取整）
Math.floor(3.8);    // 3.0（向下取整）
Math.round(3.5);    // 4（四舍五入）

// 三角函数
Math.sin(Math.PI / 2);  // 1.0
Math.cos(0);            // 1.0
Math.tan(Math.PI / 4);  // 1.0

// 随机数
Math.random();      // [0, 1) 之间的随机数

// 常量
Math.PI;            // 3.141592653589793
Math.E;             // 2.718281828459045
```

## Random 类

```java
Random random = new Random();

// 生成随机数
int intValue = random.nextInt();           // 任意 int
int intRange = random.nextInt(100);        // [0, 100)
long longValue = random.nextLong();        // 任意 long
double doubleValue = random.nextDouble();  // [0, 1)
boolean boolValue = random.nextBoolean();  // true 或 false

// 指定范围
int range = random.nextInt(50) + 10;  // [10, 60)

// 填充数组
byte[] bytes = new byte[10];
random.nextBytes(bytes);

// 设置种子（相同种子产生相同序列）
Random seeded = new Random(12345);
```

### ThreadLocalRandom（多线程推荐）

```java
ThreadLocalRandom random = ThreadLocalRandom.current();
int num = random.nextInt(1, 100);  // [1, 100)
```

## BigDecimal

BigDecimal 用于高精度计算，避免浮点数精度问题。

```java
// 创建（推荐使用字符串构造）
BigDecimal bd1 = new BigDecimal("0.1");
BigDecimal bd2 = BigDecimal.valueOf(0.1);

// 不推荐：有精度问题
// BigDecimal bd3 = new BigDecimal(0.1);

// 基本运算
BigDecimal a = new BigDecimal("10.5");
BigDecimal b = new BigDecimal("3.2");

a.add(b);       // 加法
a.subtract(b);  // 减法
a.multiply(b);  // 乘法
a.divide(b, 2, RoundingMode.HALF_UP);  // 除法，保留2位，四舍五入

// 比较
a.compareTo(b);  // 1（a > b）
a.equals(b);     // 比较值和精度

// 设置精度
a.setScale(2, RoundingMode.HALF_UP);

// 转换
a.intValue();
a.doubleValue();
a.toString();
```

### RoundingMode 舍入模式

| 模式      | 说明           |
| :-------- | :------------- |
| HALF_UP   | 四舍五入       |
| HALF_DOWN | 五舍六入       |
| UP        | 远离零方向舍入 |
| DOWN      | 向零方向舍入   |
| CEILING   | 向正无穷舍入   |
| FLOOR     | 向负无穷舍入   |

## 日期时间

### Date（旧版，不推荐）

```java
Date date = new Date();
System.out.println(date);

// 时间戳
long timestamp = date.getTime();
Date fromTimestamp = new Date(timestamp);
```

### Calendar（旧版，不推荐）

```java
Calendar cal = Calendar.getInstance();
int year = cal.get(Calendar.YEAR);
int month = cal.get(Calendar.MONTH) + 1;  // 注意：月份从0开始
int day = cal.get(Calendar.DAY_OF_MONTH);
```

### Java 8+ 新日期时间 API（推荐）

```java
// 日期
LocalDate date = LocalDate.now();
LocalDate date2 = LocalDate.of(2024, 1, 1);
LocalDate date3 = LocalDate.parse("2024-01-01");

// 时间
LocalTime time = LocalTime.now();
LocalTime time2 = LocalTime.of(10, 30, 0);

// 日期时间
LocalDateTime dateTime = LocalDateTime.now();
LocalDateTime dateTime2 = LocalDateTime.of(2024, 1, 1, 10, 30, 0);

// 时区日期时间
ZonedDateTime zonedDateTime = ZonedDateTime.now();
ZonedDateTime zonedDateTime2 = ZonedDateTime.now(ZoneId.of("America/New_York"));

// 时间戳
Instant instant = Instant.now();
long epochSecond = instant.getEpochSecond();
long epochMilli = instant.toEpochMilli();
```

### 日期操作

```java
LocalDate date = LocalDate.now();

// 获取信息
int year = date.getYear();
int month = date.getMonthValue();
int day = date.getDayOfMonth();
DayOfWeek dayOfWeek = date.getDayOfWeek();

// 加减
date.plusDays(10);
date.plusMonths(1);
date.plusYears(1);
date.minusDays(5);

// 修改
date.withYear(2025);
date.withMonth(6);
date.withDayOfMonth(15);

// 比较
date.isAfter(otherDate);
date.isBefore(otherDate);
date.isEqual(otherDate);
```

### 日期格式化

```java
LocalDateTime dateTime = LocalDateTime.now();

// 格式化
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
String str = dateTime.format(formatter);

// 解析
LocalDateTime parsed = LocalDateTime.parse("2024-01-01 10:30:00", formatter);

// 预定义格式
DateTimeFormatter.ISO_LOCAL_DATE;      // 2024-01-01
DateTimeFormatter.ISO_LOCAL_TIME;      // 10:30:00
DateTimeFormatter.ISO_LOCAL_DATE_TIME; // 2024-01-01T10:30:00
```

### 时间间隔

```java
// Period：日期间隔
LocalDate date1 = LocalDate.of(2024, 1, 1);
LocalDate date2 = LocalDate.of(2024, 12, 31);
Period period = Period.between(date1, date2);
int years = period.getYears();
int months = period.getMonths();
int days = period.getDays();

// Duration：时间间隔
LocalTime time1 = LocalTime.of(10, 0);
LocalTime time2 = LocalTime.of(15, 30);
Duration duration = Duration.between(time1, time2);
long hours = duration.toHours();
long minutes = duration.toMinutes();

// ChronoUnit：计算天数差
long daysBetween = ChronoUnit.DAYS.between(date1, date2);
```

## Optional

Optional 是 Java 8 引入的容器类，用于优雅地处理 null 值。

```java
// 创建
Optional<String> opt1 = Optional.of("Hello");      // 非空值
Optional<String> opt2 = Optional.empty();          // 空
Optional<String> opt3 = Optional.ofNullable(str);  // 可能为空

// 判断
opt1.isPresent();   // 是否有值
opt1.isEmpty();     // 是否为空（Java 11+）

// 获取值
opt1.get();                    // 获取值（为空抛异常）
opt1.orElse("默认值");         // 为空返回默认值
opt1.orElseGet(() -> "默认值"); // 为空时懒加载默认值
opt1.orElseThrow();            // 为空抛出异常

// 条件处理
opt1.ifPresent(value -> System.out.println(value));
opt1.ifPresentOrElse(
    value -> System.out.println(value),
    () -> System.out.println("为空")
);

// 转换
opt1.map(String::toUpperCase);
opt1.flatMap(value -> Optional.of(value.toUpperCase()));
opt1.filter(value -> value.length() > 3);
```

### 实际应用

```java
// 链式调用避免空指针
String result = Optional.ofNullable(user)
    .map(User::getAddress)
    .map(Address::getCity)
    .map(City::getName)
    .orElse("未知城市");

// 方法返回值
public Optional<User> findById(Long id) {
    User user = userDao.findById(id);
    return Optional.ofNullable(user);
}

// 使用
findById(1L).ifPresent(user -> {
    // 处理用户
});
```

## System 类

```java
// 标准输入输出
System.out.println("输出");
System.err.println("错误输出");
int input = System.in.read();

// 时间
long currentTime = System.currentTimeMillis();  // 毫秒时间戳
long nanoTime = System.nanoTime();              // 纳秒（用于性能测试）

// 系统属性
String javaVersion = System.getProperty("java.version");
String osName = System.getProperty("os.name");
String userHome = System.getProperty("user.home");

// 环境变量
String path = System.getenv("PATH");
Map<String, String> envs = System.getenv();

// 数组复制
System.arraycopy(src, 0, dest, 0, length);

// 垃圾回收（建议，不保证执行）
System.gc();

// 退出程序
System.exit(0);  // 正常退出
System.exit(1);  // 异常退出
```

## Arrays 工具类

```java
int[] arr = {3, 1, 4, 1, 5, 9, 2, 6};

// 排序
Arrays.sort(arr);
Arrays.sort(arr, 0, 5);  // 部分排序

// 二分查找（需要先排序）
int index = Arrays.binarySearch(arr, 5);

// 填充
Arrays.fill(arr, 0);
Arrays.fill(arr, 0, 3, 10);

// 复制
int[] copy = Arrays.copyOf(arr, 10);
int[] rangeCopy = Arrays.copyOfRange(arr, 2, 5);

// 比较
Arrays.equals(arr1, arr2);
Arrays.deepEquals(arr2d1, arr2d2);  // 多维数组

// 转字符串
String str = Arrays.toString(arr);
String str2d = Arrays.deepToString(arr2d);

// 转 List（固定大小）
List<Integer> list = Arrays.asList(1, 2, 3);

// 并行排序（大数组）
Arrays.parallelSort(arr);

// Stream（Java 8+）
Arrays.stream(arr).sum();
```
