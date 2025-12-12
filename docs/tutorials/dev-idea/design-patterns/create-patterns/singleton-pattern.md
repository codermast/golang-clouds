---
order : 1
---

# 单例模式

单例模式是最常用的设计模式之一，他可以保证在整个应用中，某个类只存在一个实例化对象，即全局使用到该类的只有一个对象，这种模式在需要限制某些类的实例数量时非常有用，通常全局只需要一个该对象即可，如一些配置文件映射对象、数据库连接对象等。


::: tip 饿汉模式 和 懒汉模式
单例模式根据其实现方式不同，又可以分成两种类型：饿汉模式 和 懒汉模式。

- 饿汉模式：可以理解为餐馆老板认为每个顾客来到餐馆时都是快要饿死的状态，一旦请求食物，则必须立刻提供给他，必须尽快让他吃到东西，为了达到这样的效果，就必须提前把食物准备好，只等顾客来吃即可。

- 懒汉模式：可以理解为餐馆老板是一个非常懒的人，没有客人的时候，他什么也不会准备，只有当顾客点餐以后，老板才会开始工作。
:::

## 设计思想

1. 日志记录

在应用程序中，通常会有多个模块需要记录日志，为了避免创建多个日志记录器实例，使用单例模式就可以确保只有一个日志记录器实例，从而避免重复记录日志并提高应用程序的性能。

2. 数据库连接

在应用程序中，需要频繁的和数据库进行交互，使用单例模式可以确保只有一个数据库连接实例，从而减少数据库连接的数量，提高程序的性能，减少资源的消耗。

3. 配置文件

在应用程序中，通常会有一些全局的配置参数，如数据连接信息、项目配置信息、缓存大小等一些参数，使用单例模式可以确保只有一个配置实例，保证了参数的唯一性，从而方便管理和修改配置参数。

## 实现案例

### 饿汉模式

这种模式下，即使当前没有人来请求资源，在类加载的时候就会提前将所需要的资源准备好，只等来拿。

因为是在类加载的阶段初始化的，且类加载在程序的执行过程中仅出现一次，故其是线程安全的。

```java
class SingletonHungry {
    // static 修饰的，在类加载时就会被初始化
    private static final SingletonHungry singletonHungry = new SingletonHungry();

    // 将构造器设为私有的，禁止从外部创建实例
    private SingletonHungry() {

    }

    // 提供获取单例对象的方法
    public static SingletonHungry getInstance() {
        return singletonHungry;
    }
}
```

### 懒汉模式

这种模式下，只有当有人来获取资源的时候，才会开始准备资源。因为是需要进行手动初始化，在并发环境下就有可能出现构建了多个实例对象的情况，需要我们手动去处理。

- 懒汉模式：不考虑并发

```java
class SingletonLazy {
    // 默认不初始化
    private static SingletonLazy singletonLazy;

    // 将构造器设为私有的，禁止从外部创建实例
    private SingletonLazy() {

    }

    // 提供获取单例对象的方法
    public static SingletonLazy getInstance() {
        if (singletonLazy == null) {
            singletonLazy = new SingletonLazy();
        }

        return singletonLazy;
    }
}
```

- 懒汉模式：考虑并发

使用双重检查锁它可以在保证线程安全的同时实现延迟加载

```java
class SingletonLazy {
    // 默认不初始化
    private static SingletonLazy singletonLazy;

    // 将构造器设为私有的，禁止从外部创建实例
    private SingletonLazy() {

    }

    // 提供获取单例对象的方法
    public static SingletonLazy getInstance() {
        if (singletonLazy == null) {
            synchronized ( SingletonLazy.class ) {
                if (singletonLazy == null) {
                    singletonLazy = new SingletonLazy();
                }
            }
        }

        return singletonLazy;
    }
}
```

### 枚举方式

::: danger 
前面的两种方式中，看似是实现了单例模式，但是 Java 中一些机制可以破坏单例模式，会导致单例对象不唯一，例如反射机制、克隆机制、序列化和反序列化等。那这该如何解决呢？答案是使用 Enum 类来实现。
:::

使用枚举实现单例模式的好处是，可以避免反射和序列化攻击。因为枚举类型的构造函数是私有的，所以无法使用反射来创建实例；而且枚举类型的实例在序列化和反序列化时会自动处理好，所以也无法通过序列化和反序列化来破坏单例。

- 定义枚举类

```java
public enum SingletonEnum {
    SINGLETONENUM;

    public void doSomething() {
        // TODO：这里可以写一些单例对象的相关行为和操作
    }
}
```
- 使用枚举类

```java
public class SingletonEnumTest {
    public static void main(String[] args) {
        SingletonEnum singletonEnum = SingletonEnum.SINGLETON_ENUM;
        SingletonEnum singletonEnum2 = SingletonEnum.SINGLETON_ENUM;

        System.out.println(singletonEnum  == singletonEnum2);
    }
}
```

输出的结果为 true ，说明这两个是同一个对象。

## 小结

- 如果对线程安全和性能要求较高，可以考虑使用饿汉式或双重检查锁方式实现单例模式。这两种方式都能保证线程安全，而且在大多数情况下性能也比较好。


- 如果对线程安全要求不是很高，或者希望在第一次访问时才创建单例对象，可以考虑使用懒汉式或者静态内部类方式。这两种方式都是延迟加载的，只有在需要时才会创建单例对象。懒汉式不是线程安全的，需要通过加锁等方式来保证线程安全；而静态内部类方式则是天生线程安全的，不需要额外的处理。


- 希望实现简单、代码少，且不需要考虑线程安全和延迟加载的问题，可以考虑使用枚举方式。这种方式不仅代码简单，而且天生线程安全、单例对象创建和调用都很方便。


总之，选择哪种实现方式需要根据具体需求来决定，需要综合考虑线程安全、性能、代码复杂度、延迟加载等因素。