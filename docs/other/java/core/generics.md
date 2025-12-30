---
order: 6
---

# Java核心 - 泛型

## 概述

泛型（Generics）是 JDK 5 引入的特性，允许在定义类、接口和方法时使用类型参数。泛型提供了编译时类型检查，避免了强制类型转换，提高了代码的安全性和可读性。

### 为什么需要泛型

```java
// 没有泛型时
List list = new ArrayList();
list.add("Hello");
list.add(123);  // 可以添加任何类型
String str = (String) list.get(0);  // 需要强制转换
String num = (String) list.get(1);  // 运行时 ClassCastException

// 使用泛型后
List<String> list = new ArrayList<>();
list.add("Hello");
// list.add(123);  // 编译错误！
String str = list.get(0);  // 无需强制转换
```

### 泛型的好处

1. **类型安全**：编译时检查类型，避免运行时错误
2. **消除强转**：无需手动进行类型转换
3. **代码复用**：同一套代码可以处理不同类型

## 泛型类

```java
// 定义泛型类
public class Box<T> {
    private T content;
    
    public void set(T content) {
        this.content = content;
    }
    
    public T get() {
        return content;
    }
}

// 使用泛型类
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String str = stringBox.get();

Box<Integer> intBox = new Box<>();
intBox.set(123);
Integer num = intBox.get();
```

### 多个类型参数

```java
public class Pair<K, V> {
    private K key;
    private V value;
    
    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }
    
    public K getKey() { return key; }
    public V getValue() { return value; }
}

// 使用
Pair<String, Integer> pair = new Pair<>("age", 25);
String key = pair.getKey();
Integer value = pair.getValue();
```

## 泛型接口

```java
// 定义泛型接口
public interface Generator<T> {
    T generate();
}

// 实现时指定类型
public class StringGenerator implements Generator<String> {
    @Override
    public String generate() {
        return "Hello";
    }
}

// 实现时保留泛型
public class GenericGenerator<T> implements Generator<T> {
    private T value;
    
    public GenericGenerator(T value) {
        this.value = value;
    }
    
    @Override
    public T generate() {
        return value;
    }
}
```

## 泛型方法

泛型方法可以在普通类中定义，类型参数声明在返回类型之前。

```java
public class Utils {
    // 泛型方法
    public static <T> T getFirst(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(0);
    }
    
    // 多个类型参数
    public static <K, V> Map<K, V> createMap(K key, V value) {
        Map<K, V> map = new HashMap<>();
        map.put(key, value);
        return map;
    }
    
    // 泛型方法与泛型类的类型参数无关
    public static <E> void printArray(E[] array) {
        for (E element : array) {
            System.out.println(element);
        }
    }
}

// 使用
String first = Utils.getFirst(Arrays.asList("a", "b", "c"));
Map<String, Integer> map = Utils.createMap("key", 100);
Utils.printArray(new Integer[]{1, 2, 3});
```

## 类型参数命名约定

| 参数  | 含义                |
| :---- | :------------------ |
| E     | Element（元素）     |
| T     | Type（类型）        |
| K     | Key（键）           |
| V     | Value（值）         |
| N     | Number（数字）      |
| S,U,V | 第2、3、4个类型参数 |

## 泛型边界

### 上界（extends）

限制类型参数必须是某个类型或其子类型。

```java
// T 必须是 Number 或其子类
public class NumberBox<T extends Number> {
    private T number;
    
    public double doubleValue() {
        return number.doubleValue();  // 可以调用 Number 的方法
    }
}

NumberBox<Integer> intBox = new NumberBox<>();  // OK
NumberBox<Double> doubleBox = new NumberBox<>();  // OK
// NumberBox<String> strBox = new NumberBox<>();  // 编译错误！
```

### 多重边界

```java
// T 必须同时是 A 的子类并实现 B、C 接口
// 类必须放在第一位
public class Demo<T extends Comparable<T> & Serializable> {
    // ...
}
```

### 方法中的边界

```java
// 限制只能接受 Number 及其子类的 List
public static <T extends Number> double sum(List<T> list) {
    double total = 0;
    for (T num : list) {
        total += num.doubleValue();
    }
    return total;
}
```

## 通配符

通配符 `?` 表示未知类型，主要用于方法参数。

### 无界通配符

```java
// 接受任意类型的 List
public static void printList(List<?> list) {
    for (Object item : list) {
        System.out.println(item);
    }
}

printList(Arrays.asList(1, 2, 3));
printList(Arrays.asList("a", "b", "c"));
```

### 上界通配符（extends）

```java
// 接受 Number 或其子类的 List
public static double sumList(List<? extends Number> list) {
    double total = 0;
    for (Number num : list) {
        total += num.doubleValue();
    }
    return total;
}

sumList(Arrays.asList(1, 2, 3));           // List<Integer>
sumList(Arrays.asList(1.0, 2.0, 3.0));     // List<Double>
```

### 下界通配符（super）

```java
// 接受 Integer 或其父类的 List
public static void addNumbers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
    list.add(3);
}

addNumbers(new ArrayList<Integer>());  // OK
addNumbers(new ArrayList<Number>());   // OK
addNumbers(new ArrayList<Object>());   // OK
// addNumbers(new ArrayList<Double>()); // 编译错误！
```

### PECS 原则

**Producer Extends, Consumer Super**

- 如果需要**读取**数据，使用 `extends`（生产者）
- 如果需要**写入**数据，使用 `super`（消费者）
- 如果既读又写，不使用通配符

```java
// 从 source 读取，写入 dest
public static <T> void copy(List<? extends T> source, List<? super T> dest) {
    for (T item : source) {
        dest.add(item);
    }
}
```

### 通配符与泛型的区别

| 特性       | 泛型类型参数 T           | 通配符 ?            |
| :--------- | :----------------------- | :------------------ |
| 位置       | 类、接口、方法的定义     | 主要用于方法参数    |
| 是否可引用 | 可以在代码中引用         | 不能引用            |
| 赋值       | 可以赋值                 | 只能读取，不能添加  |
| 多次使用   | 可以多次使用表示同一类型 | 每个 ? 表示不同类型 |

## 类型擦除

Java 的泛型是通过类型擦除实现的，在编译后泛型信息会被擦除。

```java
// 编译前
public class Box<T> {
    private T content;
    public void set(T content) { this.content = content; }
    public T get() { return content; }
}

// 编译后（类型擦除）
public class Box {
    private Object content;
    public void set(Object content) { this.content = content; }
    public Object get() { return content; }
}
```

### 类型擦除的影响

```java
// 1. 无法使用基本类型
// List<int> list;  // 错误！必须使用 Integer

// 2. 运行时无法获取泛型类型
List<String> strings = new ArrayList<>();
List<Integer> integers = new ArrayList<>();
System.out.println(strings.getClass() == integers.getClass());  // true

// 3. 无法创建泛型数组
// T[] array = new T[10];  // 编译错误

// 4. 无法 instanceof 泛型类型
// if (obj instanceof List<String>) {}  // 编译错误

// 5. 无法创建泛型类型的实例
// T instance = new T();  // 编译错误
```

### 获取泛型类型信息

虽然运行时泛型信息被擦除，但可以通过反射获取类声明的泛型类型：

```java
public class UserDao extends BaseDao<User> { }

// 获取父类的泛型参数
Class<UserDao> clazz = UserDao.class;
Type genericSuperclass = clazz.getGenericSuperclass();
ParameterizedType pt = (ParameterizedType) genericSuperclass;
Type[] types = pt.getActualTypeArguments();
Class<?> entityClass = (Class<?>) types[0];
System.out.println(entityClass);  // class User
```

## 泛型的限制

### 不能使用基本类型

```java
// List<int> list;  // 错误
List<Integer> list = new ArrayList<>();  // 正确
```

### 不能创建泛型数组

```java
// 直接创建泛型数组是不允许的
// T[] array = new T[10];  // 编译错误
// List<String>[] array = new List<String>[10];  // 编译错误

// 替代方案
List<String>[] array = (List<String>[]) new List<?>[10];
Object[] objArray = new Object[10];
```

### 不能实例化类型参数

```java
public class Factory<T> {
    // T instance = new T();  // 编译错误
    
    // 替代方案：通过 Class 创建
    public T create(Class<T> clazz) throws Exception {
        return clazz.getDeclaredConstructor().newInstance();
    }
}
```

### 静态成员不能使用类的类型参数

```java
public class Box<T> {
    // private static T value;  // 编译错误
    // public static T getValue() { }  // 编译错误
    
    // 但静态方法可以有自己的泛型参数
    public static <E> E getValue(E value) {
        return value;
    }
}
```

## 泛型实战

### 泛型工具类

```java
public class CollectionUtils {
    // 判空
    public static <T> boolean isEmpty(Collection<T> collection) {
        return collection == null || collection.isEmpty();
    }
    
    // 获取第一个元素
    public static <T> T getFirst(List<T> list) {
        return isEmpty(list) ? null : list.get(0);
    }
    
    // 过滤
    public static <T> List<T> filter(List<T> list, Predicate<T> predicate) {
        List<T> result = new ArrayList<>();
        for (T item : list) {
            if (predicate.test(item)) {
                result.add(item);
            }
        }
        return result;
    }
    
    // 转换
    public static <T, R> List<R> map(List<T> list, Function<T, R> mapper) {
        List<R> result = new ArrayList<>();
        for (T item : list) {
            result.add(mapper.apply(item));
        }
        return result;
    }
}
```

### 泛型响应类

```java
public class Result<T> {
    private int code;
    private String message;
    private T data;
    
    private Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null);
    }
    
    // Getter 方法...
}

// 使用
Result<User> result = Result.success(new User("张三"));
Result<List<User>> listResult = Result.success(Arrays.asList(user1, user2));
```

### 泛型 DAO

```java
public interface BaseDao<T, ID> {
    T findById(ID id);
    List<T> findAll();
    void save(T entity);
    void update(T entity);
    void deleteById(ID id);
}

public class UserDaoImpl implements BaseDao<User, Long> {
    @Override
    public User findById(Long id) { /* ... */ }
    
    @Override
    public List<User> findAll() { /* ... */ }
    
    @Override
    public void save(User entity) { /* ... */ }
    
    @Override
    public void update(User entity) { /* ... */ }
    
    @Override
    public void deleteById(Long id) { /* ... */ }
}
```
