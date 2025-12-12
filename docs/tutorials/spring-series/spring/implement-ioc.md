---
order : 6
---

# Spring - 原理手写IoC

Spring 框架的 IOC 是基于 Java 反射机制实现的，在学习手写 IoC 之前，你需要具备一定的 Java 反射相关的知识，参考本站内的 Java 教程。

::: tip Java教程
//TODO: 待更新
:::

IoC（控制反转）和DI（依赖注入）是Spring里面核心的东西，本章节我们就来自己实现 Spring 框架中的 IoC 和 DI。

## 创建子模块

还是和前面的几个章节一致，为了避免冲突，这里我们创建一个新的子模块，名为 spring6-ioc-reflect。

- **引入依赖**

引入相关的依赖，即将依赖项写入到子模块中的 pom.xml 配置文件中。如果之前在父模块中引入了该依赖，则不用重复添加。

```xml
<dependencies>
    <!--junit5测试-->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-api</artifactId>
        <version>5.3.1</version>
    </dependency>
</dependencies>
```

- **创建 UserDao**

```java
public interface UserDao {

    public void print();
}
```
- **创建UserDaoImpl实现**

```java
public class UserDaoImpl implements UserDao {

    @Override
    public void print() {
        System.out.println("Dao层执行结束");
    }
}

```

- **创建UserService接口**

```java
public interface UserService {

    public void out();
}
```

- **创建UserServiceImpl实现类**

```java
@Bean
public class UserServiceImpl implements UserService {

//    private UserDao userDao;

    @Override
    public void out() {
        //userDao.print();
        System.out.println("Service层执行结束");
    }
}
```

- 定义注解

    - bean注解
    ```java
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface Bean {
    }
    ```

    - 依赖注入DI注解
    ```java
    @Target({ElementType.FIELD})
    @Retention(RetentionPolicy.RUNTIME)
    public @interface Di {
    }
    ```

> 说明：上面两个注解可以随意取名

- 定义容器接口
```java
public interface ApplicationContext {

    Object getBean(Class clazz);
}
```

- 定义容器接口实现类

:::: details AnnotationApplicationContext 实现类
```java
public class AnnotationApplicationContext implements ApplicationContext {

    //存储bean的容器
    private HashMap<Class, Object> beanFactory = new HashMap<>();
    private static String rootPath;

    @Override
    public Object getBean(Class clazz) {
        return beanFactory.get(clazz);
    }

    /**
     * 根据包扫描加载bean
     *
     * @param basePackage
     */
    public AnnotationApplicationContext(String basePackage) {
        // 这里要注意的是如果在 linux 或 mac 平台下，文件的绝对路径使用的是 / 斜杠
        // 而 windows 平台下是 反斜杠 \
        // 如果使用的错误的符号，那么就会导致 dirs 为空
        // windows 使用这个
        // String packageDirName = basePackage.replaceAll("\\.", "\\\\");
        try {
            String packageDirName = basePackage.replaceAll("\\.", "/");
            Enumeration<URL> dirs = Thread.currentThread().getContextClassLoader().getResources(packageDirName);
            while (dirs.hasMoreElements()) {
                URL url = dirs.nextElement();
                String filePath = URLDecoder.decode(url.getFile(), StandardCharsets.UTF_8);
                rootPath = filePath.substring(0, filePath.length() - packageDirName.length());
                loadBean(new File(filePath));
            }

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        //依赖注入
        loadDi();
    }

    private void loadBean(File fileParent) {
        if (fileParent.isDirectory()) {
            File[] childrenFiles = fileParent.listFiles();
            if (childrenFiles == null || childrenFiles.length == 0) {
                return;
            }
            for (File child : childrenFiles) {
                if (child.isDirectory()) {
                    //如果是个文件夹就继续调用该方法,使用了递归
                    loadBean(child);
                } else {
                    //通过文件路径转变成全类名,第一步把绝对路径部分去掉
                    String pathWithClass = child.getAbsolutePath().substring(rootPath.length() - 1);
                    //选中class文件
                    if (pathWithClass.contains(".class")) {
                        //    com.codermast.dao.UserDao
                        //去掉.class后缀，并且把 \ 替换成 .

                        // 这里和上面同理，还是 windows 和 linux Mac 平台下的文件路径分隔符不一致的问题
                        // String fullName = pathWithClass.replaceAll("\\\\", ".").replace(".class", "");

                        String fullName = pathWithClass.replaceAll("/", ".").replace(".class", "").substring(1);
                        try {
                            Class<?> aClass = Class.forName(fullName);
                            //把非接口的类实例化放在map中
                            if (!aClass.isInterface()) {
                                Bean annotation = aClass.getAnnotation(Bean.class);
                                if (annotation != null) {
                                    Object instance = aClass.newInstance();
                                    //判断一下有没有接口
                                    if (aClass.getInterfaces().length > 0) {
                                        //如果有接口把接口的class当成key，实例对象当成value
                                        System.out.println("正在加载【" + aClass.getInterfaces()[0] + "】,实例对象是：" + instance.getClass().getName());
                                        beanFactory.put(aClass.getInterfaces()[0], instance);
                                    } else {
                                        //如果有接口把自己的class当成key，实例对象当成value
                                        System.out.println("正在加载【" + aClass.getName() + "】,实例对象是：" + instance.getClass().getName());
                                        beanFactory.put(aClass, instance);
                                    }
                                }
                            }
                        } catch (ClassNotFoundException | IllegalAccessException | InstantiationException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
        }
    }

    private void loadDi() {
        for (Map.Entry<Class, Object> entry : beanFactory.entrySet()) {
            //就是咱们放在容器的对象
            Object obj = entry.getValue();
            Class<?> aClass = obj.getClass();
            Field[] declaredFields = aClass.getDeclaredFields();
            for (Field field : declaredFields) {
                Di annotation = field.getAnnotation(Di.class);
                if (annotation != null) {
                    field.setAccessible(true);
                    try {
                        System.out.println("正在给【" + obj.getClass().getName() + "】属性【" + field.getName() + "】注入值【" + beanFactory.get(field.getType()).getClass().getName() + "】");
                        field.set(obj, beanFactory.get(field.getType()));
                    } catch (IllegalAccessException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }
}
```
::::

::: danger 
在 `AnnotationApplicationContext` 的代码中，有涉及到文件的路径转换。需要注意 `Windows` 和 `Linux`、`Mac` 平台下的文件路径分隔符是不相同的。
- `Windows` 下是 `\`，反斜杠
- `Linux`、`Mac` 下是 `/`，斜杠
需要注意区分，否则容易造成无法反射和注入对应的类和对象，导致空指针异常。
:::
- 对类进行@Bean注解标识


```java
@Bean
public class UserServiceImpl implements UserService
```
```java
@Bean
public class UserDaoImpl implements UserDao 
```

- 执行测试

```java
@Test
public void testIoc() {
    ApplicationContext applicationContext = new AnnotationApplicationContext("com.codermast.reflect");
    UserService userService = (UserService)applicationContext.getBean(UserService.class);
    userService.out();
    System.out.println("run success");
}
```

![测试结果](/assets/java/spring/implement-ioc/2024-01-01-20-17-52.png)

