---
order : 2
---
# 工厂模式


## 设计思想

工厂模式是最常用的设计模式之一，属于创建型模式，将创建对象的权利交给了一个工厂类，从而提供了一种不使用构造方法的情况下创建对象的途径，无需指定要创建的具体类，将创建对象的过程进行封装，通过提供的通用接口和一组实现类，隐藏了具体的对象实例化细节，使得实际对象创建的逻辑与使用该对象的逻辑分离，降低了程序的耦合度，实现解耦。

::: warning 注意
需要注意的是，这里说的不使用构造方法创建对象是在业务逻辑中通过调用工厂方法来获取对象的，并不是说在工厂方法的具体实现中不使用构造方法。
:::

### 使用场景

1. 对象的创建过程复杂

如果一个对象的创建过程较为复杂，或者初始化所依赖的其他项过多，且使用较为频繁，那么就可以使用工厂模式将该对象的实例化过程进行封装，既降低了程序耦合度，也让业务逻辑更为清晰和明了。

2. 对象的创建过程不确定

如果一个对象的创建过程不确定，在后续可能会进行修改，那么此时就可以将对象的创建过程抽离出来，从而达到修改对象的创建不会影响业务逻辑的正常执行的效果。

3. 对象的创建需要统一管理

如果需要统一管理对象的创建过程，或者需要对创建出来的对象做统一处理，那么使用工厂模式就能够很好的完成这个需求。

4. 对象的创建依赖不同的条件

如果需要根据不同的条件来创建不同类型的对象，那么使用工厂模式可以很方便地实现这个需求。

::: tip 
一个工厂类中可以有多个工厂方法，一般情况下工厂类中的工厂方法都是静态的，即使用 static 关键字修饰，一般都通过类来调用，不实质化工厂对象。
:::
## 实现案例

- 简单案例

```java
// 形状接口
interface  Shape{
    void draw();
}

// 圆
class Circle implements Shape{
    @Override
    public void draw() {
        System.out.println("画一个圆...");
    }
}

// 矩形
class Rectangle implements Shape{
    @Override
    public void draw() {
        System.out.println("画一个矩形...");
    }
}

// 三角形
class Triangle implements Shape{
    @Override
    public void draw() {
        System.out.println("画一个三角形...");
    }
}

public class ShapeFactory {
    // 1. 简单工厂模式
    public static Circle getCircle(){
        return new Circle();
    }

    // 2. 复杂工厂：根据名称获取
    public static Shape getShape(String type){
        if (type == null || type.equals("")){
            return null;
        }

        if (type.equalsIgnoreCase("circle")){
            return new Circle();
        }else if (type.equalsIgnoreCase("rectangle")){
            return new Rectangle();
        }

        return null;
    }
}
```

- 测试类

```java
// 工厂模式
public class FactoryPattern {
    public static void main(String[] args) {
        ShapeFactory.getShape("Circle").draw();
        ShapeFactory.getShape("Rectangle").draw();
    }
}
```

- 测试结果

```text
画一个圆...
画一个矩形...
```

## 小结

一个或一类实例化过程较为复杂的类，可以使用工厂模式来构建对象，同一种类型的类，可抽象为一个工厂方法，通过参数来判断其具体实例化哪个对象。在 Java 中，工厂模式广泛应用于各种框架和类库中，例如 JDBC 中的 DataSource 工厂、 Spring 框架中的 Bean 工厂、MyBatis 框架中的 SqlSessionFactory 等等。