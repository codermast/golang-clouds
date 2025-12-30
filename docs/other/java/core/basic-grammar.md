---
order: 2
---

# Java核心 - 基础语法

## 注释

Java 支持三种注释方式：

```java
// 单行注释：从 // 开始到行尾

/*
 * 多行注释：
 * 可以跨越多行
 */

/**
 * 文档注释：
 * 用于生成 API 文档
 * @param args 命令行参数
 * @return 无返回值
 */
```

::: tip 注释说明
- 注释不会被编译，不影响程序执行
- 文档注释可以通过 javadoc 工具生成 HTML 文档
- 良好的注释是代码可维护性的重要保障
:::

## 标识符与命名规范

### 标识符规则

标识符是程序员定义的名称（类名、变量名、方法名等），必须遵循以下规则：

- 只能包含字母、数字、下划线 `_`、美元符 `$`
- 不能以数字开头
- 不能使用 Java 关键字
- 严格区分大小写

```java
// 合法的标识符
int age;
String userName;
double _value;
int $count;

// 非法的标识符
// int 2name;    // 不能以数字开头
// int class;    // 不能使用关键字
// int my-name;  // 不能包含连字符
```

### 命名规范

| 类型      | 规范          | 示例                     |
| :-------- | :------------ | :----------------------- |
| 类/接口   | 大驼峰        | `UserService`、`HashMap` |
| 方法/变量 | 小驼峰        | `getUserName`、`userId`  |
| 常量      | 全大写+下划线 | `MAX_VALUE`、`PI`        |
| 包名      | 全小写        | `com.example.service`    |

## 关键字

Java 中有 50 个关键字（含 2 个保留字）：

| 类别     | 关键字                                                                                              |
| :------- | :-------------------------------------------------------------------------------------------------- |
| 数据类型 | `byte` `short` `int` `long` `float` `double` `char` `boolean`                                       |
| 流程控制 | `if` `else` `switch` `case` `default` `for` `while` `do` `break` `continue` `return`                |
| 访问控制 | `public` `protected` `private`                                                                      |
| 类相关   | `class` `interface` `extends` `implements` `abstract` `final` `static`                              |
| 对象相关 | `new` `this` `super` `instanceof`                                                                   |
| 异常     | `try` `catch` `finally` `throw` `throws`                                                            |
| 其他     | `void` `import` `package` `native` `synchronized` `volatile` `transient` `strictfp` `enum` `assert` |
| 保留字   | `goto` `const`                                                                                      |

## 数据类型

Java 是强类型语言，数据类型分为**基本类型**和**引用类型**。

### 基本数据类型

Java 有 8 种基本数据类型：

| 类型    | 大小   | 范围                         | 默认值   | 包装类    |
| :------ | :----- | :--------------------------- | :------- | :-------- |
| byte    | 1 字节 | -128 ~ 127                   | 0        | Byte      |
| short   | 2 字节 | -32768 ~ 32767               | 0        | Short     |
| int     | 4 字节 | -2^31 ~ 2^31-1（约 ±21 亿）  | 0        | Integer   |
| long    | 8 字节 | -2^63 ~ 2^63-1               | 0L       | Long      |
| float   | 4 字节 | ±3.4E38（约 6-7 位有效数字） | 0.0f     | Float     |
| double  | 8 字节 | ±1.7E308（约 15 位有效数字） | 0.0d     | Double    |
| char    | 2 字节 | 0 ~ 65535（Unicode 字符）    | '\u0000' | Character |
| boolean | 1 位   | true / false                 | false    | Boolean   |

```java
byte b = 100;
short s = 10000;
int i = 100000;
long l = 10000000000L;    // 需要 L 后缀

float f = 3.14f;          // 需要 f 后缀
double d = 3.14159265;

char c = 'A';
boolean flag = true;
```

### 引用数据类型

引用类型包括：类、接口、数组、枚举、注解。

```java
String str = "Hello";           // 字符串
int[] arr = {1, 2, 3};          // 数组
Object obj = new Object();      // 对象
List<String> list = new ArrayList<>();  // 接口
```

### 自动装箱与拆箱

基本类型与包装类之间可以自动转换：

```java
// 自动装箱：基本类型 → 包装类
Integer num = 100;  // 实际调用 Integer.valueOf(100)

// 自动拆箱：包装类 → 基本类型
int n = num;        // 实际调用 num.intValue()
```

::: warning 注意事项
1. 包装类可以为 null，拆箱时可能抛出 NullPointerException
2. Integer 缓存了 -128 ~ 127 的值，该范围内的 Integer 对象可以用 == 比较
3. 超出缓存范围的 Integer 需要用 equals() 比较
:::

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b);      // true（使用缓存）

Integer c = 128;
Integer d = 128;
System.out.println(c == d);      // false（新建对象）
System.out.println(c.equals(d)); // true（值相等）
```

### 类型转换

```java
// 自动类型转换（小 → 大，隐式）
int i = 100;
long l = i;      // int → long
double d = l;    // long → double

// 强制类型转换（大 → 小，显式）
double d2 = 3.99;
int i2 = (int) d2;  // 结果为 3，直接截断小数

// 表达式中的类型提升
byte b1 = 10;
byte b2 = 20;
// byte b3 = b1 + b2;  // 错误！运算结果为 int
int b3 = b1 + b2;      // 正确
```

类型转换规则：`byte → short → int → long → float → double`

## 运算符

### 算术运算符

| 运算符 | 说明 | 示例          |
| :----- | :--- | :------------ |
| +      | 加法 | `5 + 3 = 8`   |
| -      | 减法 | `5 - 3 = 2`   |
| *      | 乘法 | `5 * 3 = 15`  |
| /      | 除法 | `5 / 3 = 1`   |
| %      | 取余 | `5 % 3 = 2`   |
| ++     | 自增 | `i++` / `++i` |
| --     | 自减 | `i--` / `--i` |

```java
int a = 5, b = 3;
System.out.println(a / b);   // 1（整数除法）
System.out.println(a % b);   // 2

int i = 5;
System.out.println(i++);     // 5（先使用，后自增）
System.out.println(++i);     // 7（先自增，后使用）
```

### 关系运算符

| 运算符 | 说明     | 示例     |
| :----- | :------- | :------- |
| ==     | 等于     | `a == b` |
| !=     | 不等于   | `a != b` |
| >      | 大于     | `a > b`  |
| <      | 小于     | `a < b`  |
| >=     | 大于等于 | `a >= b` |
| <=     | 小于等于 | `a <= b` |

### 逻辑运算符

| 运算符 | 说明   | 示例       | 说明                  |
| :----- | :----- | :--------- | :-------------------- |
| &&     | 逻辑与 | `a && b`   | 短路与，a为false不算b |
| \|\|   | 逻辑或 | `a \|\| b` | 短路或，a为true不算b  |
| !      | 逻辑非 | `!a`       | 取反                  |
| &      | 与     | `a & b`    | 非短路，都要计算      |
| \|     | 或     | `a \| b`   | 非短路，都要计算      |

```java
int x = 5;
// 短路与：第一个为 false，不计算第二个
boolean result = (x > 10) && (++x > 5);  // x 仍为 5
```

### 位运算符

| 运算符 | 说明       | 示例          |
| :----- | :--------- | :------------ |
| &      | 按位与     | `5 & 3 = 1`   |
| \|     | 按位或     | `5 \| 3 = 7`  |
| ^      | 按位异或   | `5 ^ 3 = 6`   |
| ~      | 按位取反   | `~5 = -6`     |
| <<     | 左移       | `5 << 1 = 10` |
| >>     | 右移       | `5 >> 1 = 2`  |
| >>>    | 无符号右移 | `5 >>> 1 = 2` |

### 赋值运算符

```java
int a = 10;     // 基本赋值
a += 5;         // a = a + 5
a -= 3;         // a = a - 3
a *= 2;         // a = a * 2
a /= 4;         // a = a / 4
a %= 3;         // a = a % 3
```

### 三元运算符

```java
int a = 10, b = 20;
int max = (a > b) ? a : b;  // 如果 a > b 返回 a，否则返回 b
```

### 运算符优先级

优先级从高到低：

1. `()` `[]` `.`
2. `!` `~` `++` `--`
3. `*` `/` `%`
4. `+` `-`
5. `<<` `>>` `>>>`
6. `<` `<=` `>` `>=` `instanceof`
7. `==` `!=`
8. `&` `^` `|`
9. `&&` `||`
10. `?:`
11. `=` `+=` `-=` 等赋值运算符

::: tip 建议
当不确定优先级时，使用括号明确运算顺序，提高代码可读性。
:::

## 流程控制

### if 语句

```java
// 基本 if
if (条件) {
    // 条件为 true 时执行
}

// if-else
if (条件) {
    // 条件为 true 时执行
} else {
    // 条件为 false 时执行
}

// if-else if-else
if (条件1) {
    // 条件1 为 true
} else if (条件2) {
    // 条件2 为 true
} else if (条件3) {
    // 条件3 为 true
} else {
    // 以上条件都不满足
}
```

### switch 语句

```java
// 传统 switch
switch (表达式) {
    case 值1:
        // 匹配值1时执行
        break;
    case 值2:
        // 匹配值2时执行
        break;
    default:
        // 都不匹配时执行
}

// Java 12+ switch 表达式
String day = "MONDAY";
String type = switch (day) {
    case "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY" -> "工作日";
    case "SATURDAY", "SUNDAY" -> "周末";
    default -> "未知";
};
```

::: warning 注意
- switch 支持的类型：byte、short、int、char、String（Java 7+）、枚举
- 不支持 long、float、double
- 没有 break 会发生穿透（fall-through）
:::

### for 循环

```java
// 基本 for 循环
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}

// 增强 for 循环（foreach）
int[] arr = {1, 2, 3, 4, 5};
for (int num : arr) {
    System.out.println(num);
}

// 嵌套循环
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        System.out.println(i + ", " + j);
    }
}
```

### while 循环

```java
// while 循环：先判断后执行
int i = 0;
while (i < 5) {
    System.out.println(i);
    i++;
}

// do-while 循环：先执行后判断（至少执行一次）
int j = 0;
do {
    System.out.println(j);
    j++;
} while (j < 5);
```

### break 与 continue

```java
// break：退出当前循环
for (int i = 0; i < 10; i++) {
    if (i == 5) break;    // i=5 时退出循环
    System.out.println(i);
}

// continue：跳过本次循环
for (int i = 0; i < 10; i++) {
    if (i == 5) continue; // 跳过 i=5
    System.out.println(i);
}

// 带标签的 break/continue（跳出外层循环）
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (j == 1) break outer;  // 直接跳出外层循环
        System.out.println(i + ", " + j);
    }
}
```

## 数组

### 数组声明与初始化

```java
// 声明
int[] arr1;        // 推荐写法
int arr2[];        // C 风格，不推荐

// 静态初始化
int[] arr3 = {1, 2, 3, 4, 5};
int[] arr4 = new int[]{1, 2, 3};

// 动态初始化
int[] arr5 = new int[5];   // 默认值为 0
String[] arr6 = new String[3];  // 默认值为 null
```

### 数组操作

```java
int[] arr = {10, 20, 30, 40, 50};

// 访问元素（下标从 0 开始）
System.out.println(arr[0]);  // 10
arr[1] = 25;                 // 修改元素

// 数组长度
System.out.println(arr.length);  // 5

// 遍历数组
for (int i = 0; i < arr.length; i++) {
    System.out.println(arr[i]);
}

// 增强 for 循环
for (int num : arr) {
    System.out.println(num);
}
```

### 多维数组

```java
// 二维数组
int[][] matrix = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

// 访问元素
System.out.println(matrix[0][1]);  // 2

// 遍历
for (int i = 0; i < matrix.length; i++) {
    for (int j = 0; j < matrix[i].length; j++) {
        System.out.println(matrix[i][j]);
    }
}

// 不规则数组
int[][] irregular = new int[3][];
irregular[0] = new int[2];
irregular[1] = new int[3];
irregular[2] = new int[4];
```

### Arrays 工具类

```java
import java.util.Arrays;

int[] arr = {3, 1, 4, 1, 5, 9, 2, 6};

// 排序
Arrays.sort(arr);

// 二分查找（需要先排序）
int index = Arrays.binarySearch(arr, 5);

// 填充
Arrays.fill(arr, 0);

// 复制
int[] copy = Arrays.copyOf(arr, 10);

// 转字符串
System.out.println(Arrays.toString(arr));

// 比较
boolean equal = Arrays.equals(arr1, arr2);
```

## 方法

### 方法定义

```java
修饰符 返回类型 方法名(参数列表) {
    // 方法体
    return 返回值;  // void 方法可省略
}
```

```java
// 无参无返回值
public void sayHello() {
    System.out.println("Hello!");
}

// 有参有返回值
public int add(int a, int b) {
    return a + b;
}

// 静态方法
public static double square(double num) {
    return num * num;
}
```

### 方法重载

方法重载（Overload）：同一个类中，方法名相同，参数列表不同。

```java
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public double add(double a, double b) {
        return a + b;
    }
    
    public int add(int a, int b, int c) {
        return a + b + c;
    }
}
```

::: warning 注意
- 重载与返回类型无关
- 重载与参数名无关
- 只看参数类型和参数个数
:::

### 可变参数

```java
// 可变参数必须是最后一个参数
public int sum(int... nums) {
    int total = 0;
    for (int num : nums) {
        total += num;
    }
    return total;
}

// 调用
sum(1, 2, 3);
sum(1, 2, 3, 4, 5);
```

### 值传递

Java 只有值传递，没有引用传递。

```java
// 基本类型：传递的是值的副本
public void change(int num) {
    num = 100;  // 不影响外部变量
}

// 引用类型：传递的是引用的副本（指向同一对象）
public void change(int[] arr) {
    arr[0] = 100;  // 会修改数组内容
    arr = new int[]{1, 2, 3};  // 不影响外部引用
}
```
