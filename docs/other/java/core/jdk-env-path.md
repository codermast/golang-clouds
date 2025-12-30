---
order: 1
---

# Java核心 - 环境搭建

## JDK、JRE、JVM 的关系

在开始学习 Java 之前，首先需要了解 JDK、JRE、JVM 这三个核心概念。

### JDK（Java Development Kit）

JDK 是 Java 开发工具包，是开发 Java 程序的完整工具集，包含：

- **JRE**：Java 运行时环境
- **编译器**：javac，将 `.java` 源文件编译为 `.class` 字节码
- **调试器**：jdb，用于调试 Java 程序
- **文档生成器**：javadoc，生成 API 文档
- **其他工具**：jar、jps、jstack、jmap 等

### JRE（Java Runtime Environment）

JRE 是 Java 运行时环境，是运行 Java 程序所需的最小环境，包含：

- **JVM**：Java 虚拟机
- **核心类库**：rt.jar 等基础类库
- **配置文件**：运行时所需的配置

### JVM（Java Virtual Machine）

JVM 是 Java 虚拟机，是 Java 实现"一次编写，到处运行"的关键：

- 将字节码（.class）解释/编译为机器码执行
- 不同平台有不同的 JVM 实现
- 提供内存管理、垃圾回收等功能

### 三者关系

```
┌─────────────────────────────────────────────────────┐
│                       JDK                           │
│  ┌───────────────────────────────────────────────┐  │
│  │                    JRE                        │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │                 JVM                     │  │  │
│  │  │  • 类加载器                             │  │  │
│  │  │  • 执行引擎                             │  │  │
│  │  │  • 垃圾回收器                           │  │  │
│  │  │  • 运行时数据区                         │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │  + 核心类库（rt.jar）                         │  │
│  │  + 扩展类库                                   │  │
│  └───────────────────────────────────────────────┘  │
│  + 编译器（javac）                                  │
│  + 调试器（jdb）                                    │
│  + 其他开发工具                                     │
└─────────────────────────────────────────────────────┘
```

::: tip 简单理解
- **开发者**需要 JDK（包含编译工具）
- **用户**只需要 JRE（只运行程序）
- **JVM** 是实际执行字节码的虚拟机
:::

## 下载 JDK

### Oracle JDK

Oracle 官方提供的 JDK，部分版本需要商业许可。

::: tip 下载地址
https://www.oracle.com/java/technologies/downloads/
:::

**下载步骤：**

1. 访问 Oracle 官网，选择需要的 JDK 版本
2. 根据操作系统选择对应的安装包：
   - Windows：`.exe` 或 `.msi` 安装包
   - macOS：`.dmg` 安装包
   - Linux：`.tar.gz` 压缩包或 `.rpm`/`.deb` 包

### OpenJDK

OpenJDK 是开源的 JDK 实现，与 Oracle JDK 功能基本一致。

常用的 OpenJDK 发行版：

| 发行版          | 说明                 | 下载地址                          |
| :-------------- | :------------------- | :-------------------------------- |
| Adoptium        | Eclipse 基金会维护   | https://adoptium.net/             |
| Amazon Corretto | 亚马逊维护，长期支持 | https://aws.amazon.com/corretto/  |
| Azul Zulu       | Azul 公司维护        | https://www.azul.com/downloads/   |
| Microsoft       | 微软维护             | https://www.microsoft.com/openjdk |

### 版本选择建议

| 版本    | 发布时间 | 支持类型 | 建议           |
| :------ | :------- | :------- | :------------- |
| Java 8  | 2014-03  | LTS      | 老项目维护     |
| Java 11 | 2018-09  | LTS      | 企业级应用推荐 |
| Java 17 | 2021-09  | LTS      | 新项目首选     |
| Java 21 | 2023-09  | LTS      | 最新 LTS 版本  |

::: warning LTS 说明
LTS（Long Term Support）表示长期支持版本，会获得多年的安全更新和 Bug 修复，生产环境推荐使用 LTS 版本。
:::

## 安装 JDK

### Windows

1. 运行下载的安装程序（.exe 或 .msi）
2. 选择安装目录（建议路径不含中文和空格）
3. 按提示完成安装

### macOS

**方式一：使用安装包**

1. 运行下载的 `.dmg` 文件
2. 按提示完成安装
3. 默认安装到 `/Library/Java/JavaVirtualMachines/`

**方式二：使用 Homebrew**

```bash
# 安装 OpenJDK 17
brew install openjdk@17

# 创建符号链接
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk \
     /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

### Linux

**Debian/Ubuntu：**

```bash
# 更新包列表
sudo apt update

# 安装 OpenJDK 17
sudo apt install openjdk-17-jdk

# 验证安装
java -version
```

**RHEL/CentOS：**

```bash
# 安装 OpenJDK 17
sudo yum install java-17-openjdk-devel

# 验证安装
java -version
```

## 配置环境变量

### Windows

1. 右键「此电脑」→「属性」→「高级系统设置」→「环境变量」

2. 新建系统变量 `JAVA_HOME`：
   ```
   变量名：JAVA_HOME
   变量值：C:\Program Files\Java\jdk-17（JDK 安装路径）
   ```

3. 编辑系统变量 `Path`，添加：
   ```
   %JAVA_HOME%\bin
   ```

4. 打开新的命令提示符窗口验证：
   ```cmd
   java -version
   javac -version
   ```

### macOS / Linux

编辑配置文件（`~/.bashrc`、`~/.zshrc` 或 `~/.bash_profile`）：

```bash
# 设置 JAVA_HOME
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
# Linux 通常为：export JAVA_HOME=/usr/lib/jvm/java-17-openjdk

# 添加到 PATH
export PATH=$JAVA_HOME/bin:$PATH
```

使配置生效：

```bash
source ~/.zshrc  # 或 ~/.bashrc
```

验证配置：

```bash
echo $JAVA_HOME
java -version
javac -version
```

## 验证安装

在终端/命令行执行以下命令：

```bash
# 查看 Java 版本
java -version

# 查看编译器版本
javac -version

# 查看 JAVA_HOME
echo $JAVA_HOME  # Linux/macOS
echo %JAVA_HOME% # Windows
```

正常输出示例：

```
java version "17.0.9" 2023-10-17 LTS
Java(TM) SE Runtime Environment (build 17.0.9+11-LTS-201)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.9+11-LTS-201, mixed mode, sharing)
```

## 第一个 Java 程序

创建文件 `HelloWorld.java`：

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

编译并运行：

```bash
# 编译（生成 HelloWorld.class）
javac HelloWorld.java

# 运行
java HelloWorld
```

输出：

```
Hello, World!
```

## Java 程序执行流程

```
源文件(.java) → 编译器(javac) → 字节码(.class) → JVM → 机器码 → CPU执行
```

1. **编写**：程序员编写 `.java` 源文件
2. **编译**：javac 将源文件编译为 `.class` 字节码文件
3. **加载**：JVM 的类加载器加载字节码
4. **验证**：验证字节码的正确性和安全性
5. **执行**：解释器/JIT 编译器将字节码转为机器码执行

::: tip 跨平台原理
Java 的跨平台性是通过 JVM 实现的。同一份 `.class` 字节码可以在任何安装了对应 JVM 的平台上运行，因为 JVM 负责将字节码翻译为该平台的机器码。
:::

## IDE 推荐

开发 Java 程序推荐使用专业的 IDE：

| IDE           | 说明                     | 适用场景     |
| :------------ | :----------------------- | :----------- |
| IntelliJ IDEA | JetBrains 出品，功能强大 | 专业开发首选 |
| Eclipse       | 开源免费，插件丰富       | 传统企业项目 |
| VS Code       | 轻量级，需安装 Java 扩展 | 轻量级开发   |

::: tip IDEA 推荐
IntelliJ IDEA 是目前最流行的 Java IDE，社区版免费，功能足够日常开发使用。
:::
