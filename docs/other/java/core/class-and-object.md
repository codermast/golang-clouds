---
order: 3
---

# Java核心 - 面向对象

## 概述

面向对象编程（Object-Oriented Programming，OOP）是一种程序设计范式，它将程序中的数据和操作数据的方法封装成对象，通过对象之间的交互来完成程序功能。

### 面向过程 vs 面向对象

| 特点     | 面向过程       | 面向对象             |
| :------- | :------------- | :------------------- |
| 核心思想 | 按步骤分解问题 | 按对象分解问题       |
| 代码组织 | 函数           | 类和对象             |
| 数据处理 | 数据与函数分离 | 数据与方法封装在一起 |
| 代码复用 | 函数调用       | 继承、组合           |
| 扩展性   | 较差           | 较好                 |
| 典型语言 | C、Pascal      | Java、C++、Python    |

## 类与对象

### 基本概念

- **类（Class）**：是对象的模板/蓝图，定义了对象的属性和行为
- **对象（Object）**：是类的实例，是实际存在的个体

```java
// 定义类
public class Person {
    // 属性（成员变量）
    String name;
    int age;
    
    // 方法（成员方法）
    public void sayHello() {
        System.out.println("Hello, I'm " + name);
    }
}

// 创建对象
Person person = new Person();
person.name = "张三";
person.age = 25;
person.sayHello();
```

### 类的组成

```java
public class ClassName {
    // 1. 成员变量（属性）
    private String field;
    
    // 2. 静态变量（类变量）
    private static int count;
    
    // 3. 常量
    public static final double PI = 3.14159;
    
    // 4. 代码块
    {
        // 实例代码块，每次创建对象时执行
    }
    
    static {
        // 静态代码块，类加载时执行一次
    }
    
    // 5. 构造方法
    public ClassName() {
        // 无参构造
    }
    
    public ClassName(String field) {
        this.field = field;
    }
    
    // 6. 成员方法
    public void method() {
        // 方法体
    }
    
    // 7. 静态方法
    public static void staticMethod() {
        // 静态方法体
    }
    
    // 8. 内部类
    class InnerClass {
        // 内部类
    }
}
```

## 封装

封装是面向对象的核心特性之一，指将对象的状态（属性）和行为（方法）包装在类中，对外隐藏实现细节，只暴露必要的接口。

### 访问修饰符

| 修饰符    | 同类 | 同包 | 子类 | 其他包 |
| :-------- | :--- | :--- | :--- | :----- |
| private   | ✓    | ✗    | ✗    | ✗      |
| default   | ✓    | ✓    | ✗    | ✗      |
| protected | ✓    | ✓    | ✓    | ✗      |
| public    | ✓    | ✓    | ✓    | ✓      |

### JavaBean 规范

```java
public class User {
    // 私有属性
    private String name;
    private int age;
    
    // 无参构造
    public User() {
    }
    
    // 有参构造
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // Getter 方法
    public String getName() {
        return name;
    }
    
    // Setter 方法
    public void setName(String name) {
        this.name = name;
    }
    
    public int getAge() {
        return age;
    }
    
    public void setAge(int age) {
        if (age >= 0 && age <= 150) {
            this.age = age;
        }
    }
}
```

::: tip 封装的好处
1. 隐藏实现细节，提高安全性
2. 可以在 setter 中添加数据校验
3. 提高代码的可维护性
4. 便于修改内部实现而不影响外部调用
:::

## 继承

继承是面向对象的重要特性，允许子类继承父类的属性和方法，实现代码复用。

### 继承语法

```java
// 父类
public class Animal {
    protected String name;
    
    public void eat() {
        System.out.println(name + "正在吃东西");
    }
}

// 子类
public class Dog extends Animal {
    private String breed;
    
    public void bark() {
        System.out.println(name + "在汪汪叫");
    }
    
    // 重写父类方法
    @Override
    public void eat() {
        System.out.println(name + "正在吃狗粮");
    }
}
```

### 继承特点

1. Java 只支持单继承，一个类只能有一个直接父类
2. 支持多层继承：A → B → C
3. 子类继承父类所有非私有成员
4. 构造方法不能被继承
5. 所有类都直接或间接继承自 `Object` 类

### super 关键字

```java
public class Child extends Parent {
    private String name;
    
    public Child(String name) {
        super();        // 调用父类构造方法（必须在第一行）
        this.name = name;
    }
    
    public void show() {
        System.out.println(super.name);  // 访问父类属性
        super.method();                   // 调用父类方法
    }
}
```

### 方法重写（Override）

子类重新定义父类中已有的方法：

```java
public class Animal {
    public void makeSound() {
        System.out.println("动物发出声音");
    }
}

public class Cat extends Animal {
    @Override
    public void makeSound() {
        System.out.println("喵喵喵");
    }
}
```

::: warning 重写规则
1. 方法名、参数列表必须相同
2. 返回类型相同或是其子类型
3. 访问权限不能比父类更严格
4. 不能抛出比父类更多的异常
5. `private`、`final`、`static` 方法不能被重写
:::

### 重写 vs 重载

| 特性     | 重写（Override） | 重载（Overload） |
| :------- | :--------------- | :--------------- |
| 位置     | 子类与父类之间   | 同一个类中       |
| 方法名   | 必须相同         | 必须相同         |
| 参数列表 | 必须相同         | 必须不同         |
| 返回类型 | 相同或子类型     | 无要求           |
| 访问权限 | 不能更严格       | 无要求           |
| 多态类型 | 运行时多态       | 编译时多态       |

## 多态

多态是指同一个行为具有多种不同表现形式。在 Java 中，多态主要体现为父类引用指向子类对象。

### 多态的实现

```java
// 父类
public class Animal {
    public void makeSound() {
        System.out.println("动物叫声");
    }
}

// 子类
public class Dog extends Animal {
    @Override
    public void makeSound() {
        System.out.println("汪汪汪");
    }
    
    public void fetch() {
        System.out.println("捡球");
    }
}

public class Cat extends Animal {
    @Override
    public void makeSound() {
        System.out.println("喵喵喵");
    }
}

// 多态使用
Animal animal1 = new Dog();  // 向上转型
Animal animal2 = new Cat();

animal1.makeSound();  // 输出：汪汪汪
animal2.makeSound();  // 输出：喵喵喵

// animal1.fetch();   // 编译错误！父类引用无法调用子类特有方法
```

### 多态的特点

- **编译看左边**：编译时检查父类是否有该方法
- **运行看右边**：运行时执行子类重写的方法

### 类型转换

```java
Animal animal = new Dog();

// 向下转型（需要强制转换）
if (animal instanceof Dog) {
    Dog dog = (Dog) animal;
    dog.fetch();
}

// Java 16+ 模式匹配
if (animal instanceof Dog dog) {
    dog.fetch();
}
```

### 多态的好处

```java
// 不使用多态
public void feedDog(Dog dog) { dog.eat(); }
public void feedCat(Cat cat) { cat.eat(); }

// 使用多态
public void feedAnimal(Animal animal) {
    animal.eat();  // 可以传入任何 Animal 的子类
}
```

## 抽象类

抽象类是不能被实例化的类，用于定义一组子类的通用行为。

### 抽象类语法

```java
public abstract class Shape {
    protected String color;
    
    // 抽象方法：没有方法体，子类必须实现
    public abstract double getArea();
    
    // 普通方法：可以有具体实现
    public void setColor(String color) {
        this.color = color;
    }
}

public class Circle extends Shape {
    private double radius;
    
    public Circle(double radius) {
        this.radius = radius;
    }
    
    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }
}
```

### 抽象类特点

1. 使用 `abstract` 关键字修饰
2. 不能被实例化
3. 可以有构造方法（供子类调用）
4. 可以有抽象方法和普通方法
5. 子类必须实现所有抽象方法，否则子类也要声明为抽象类

## 接口

接口是一种完全抽象的类型，定义了一组行为规范。

### 接口语法

```java
public interface Flyable {
    // 常量（默认 public static final）
    int MAX_SPEED = 1000;
    
    // 抽象方法（默认 public abstract）
    void fly();
    
    // 默认方法（Java 8+）
    default void land() {
        System.out.println("着陆");
    }
    
    // 静态方法（Java 8+）
    static void checkWeather() {
        System.out.println("检查天气");
    }
    
    // 私有方法（Java 9+）
    private void helper() {
        // 辅助方法
    }
}

// 实现接口
public class Bird implements Flyable {
    @Override
    public void fly() {
        System.out.println("鸟儿飞翔");
    }
}
```

### 接口特点

1. 接口中的方法默认是 `public abstract`
2. 接口中的变量默认是 `public static final`
3. 一个类可以实现多个接口
4. 接口可以继承多个接口
5. 接口不能有构造方法

### 抽象类 vs 接口

| 特性      | 抽象类                 | 接口                         |
| :-------- | :--------------------- | :--------------------------- |
| 关键字    | abstract class         | interface                    |
| 继承/实现 | extends（单继承）      | implements（多实现）         |
| 构造方法  | 可以有                 | 不能有                       |
| 成员变量  | 可以有各种类型         | 只能是常量                   |
| 方法      | 可以有抽象和非抽象方法 | 抽象方法、默认方法、静态方法 |
| 设计目的  | 代码复用               | 定义行为规范                 |

## 内部类

内部类是定义在另一个类内部的类。

### 成员内部类

```java
public class Outer {
    private String name = "外部类";
    
    // 成员内部类
    public class Inner {
        public void show() {
            System.out.println(name);  // 可以访问外部类私有成员
        }
    }
}

// 使用
Outer outer = new Outer();
Outer.Inner inner = outer.new Inner();
inner.show();
```

### 静态内部类

```java
public class Outer {
    private static String staticName = "静态变量";
    
    // 静态内部类
    public static class StaticInner {
        public void show() {
            System.out.println(staticName);  // 只能访问外部类静态成员
        }
    }
}

// 使用
Outer.StaticInner inner = new Outer.StaticInner();
inner.show();
```

### 局部内部类

```java
public class Outer {
    public void method() {
        // 局部内部类
        class LocalInner {
            public void show() {
                System.out.println("局部内部类");
            }
        }
        
        LocalInner inner = new LocalInner();
        inner.show();
    }
}
```

### 匿名内部类

```java
// 接口的匿名实现
Runnable runnable = new Runnable() {
    @Override
    public void run() {
        System.out.println("匿名内部类");
    }
};

// 使用 Lambda 表达式简化（Java 8+）
Runnable runnable2 = () -> System.out.println("Lambda 表达式");
```

## Object 类

`Object` 是所有类的根类，所有类都直接或间接继承自 Object。

### 常用方法

| 方法           | 说明                     |
| :------------- | :----------------------- |
| toString()     | 返回对象的字符串表示     |
| equals(Object) | 判断两个对象是否相等     |
| hashCode()     | 返回对象的哈希码         |
| getClass()     | 返回对象的运行时类       |
| clone()        | 创建并返回对象的副本     |
| finalize()     | 垃圾回收前调用（已废弃） |

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
1. 如果两个对象 equals 相等，则 hashCode 必须相等
2. 如果两个对象 hashCode 相等，equals 不一定相等
3. 重写 equals 必须同时重写 hashCode
:::

## final 关键字

`final` 可以修饰类、方法、变量：

```java
// final 类：不能被继承
public final class String { }

// final 方法：不能被重写
public final void method() { }

// final 变量：常量，只能赋值一次
final int MAX = 100;
final Object obj = new Object();  // 引用不可变，但对象内容可变
```

## static 关键字

`static` 修饰的成员属于类，而不是对象。

```java
public class Counter {
    // 静态变量：所有对象共享
    private static int count = 0;
    
    // 静态代码块：类加载时执行
    static {
        System.out.println("类加载");
    }
    
    // 静态方法
    public static int getCount() {
        return count;
    }
    
    public Counter() {
        count++;
    }
}

// 使用
Counter.getCount();  // 通过类名调用
```

::: warning 静态方法注意事项
1. 静态方法不能访问非静态成员
2. 静态方法不能使用 this 和 super
3. 静态方法可以被继承但不能被重写
:::

## 代码块执行顺序

```java
public class Parent {
    static { System.out.println("1. 父类静态代码块"); }
    { System.out.println("3. 父类实例代码块"); }
    public Parent() { System.out.println("4. 父类构造方法"); }
}

public class Child extends Parent {
    static { System.out.println("2. 子类静态代码块"); }
    { System.out.println("5. 子类实例代码块"); }
    public Child() { System.out.println("6. 子类构造方法"); }
}

// new Child() 输出顺序：
// 1. 父类静态代码块
// 2. 子类静态代码块
// 3. 父类实例代码块
// 4. 父类构造方法
// 5. 子类实例代码块
// 6. 子类构造方法
```
