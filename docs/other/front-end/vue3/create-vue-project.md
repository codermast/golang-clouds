---
order : 1
---

# 1. 环境搭建及安装

::: tip Vue 介绍
Vue (发音为 /vjuː/，类似 view) 是一款用于构建用户界面的 JavaScript 框架。它基于标准 HTML、CSS 和 JavaScript 构建，并提供了一套声明式的、组件化的编程模型，帮助你高效地开发用户界面。无论是简单还是复杂的界面，Vue 都可以胜任。

Vue 是一个框架，也是一个生态。其功能覆盖了大部分前端开发常见的需求。但 Web 世界是十分多样化的，不同的开发者在 Web 上构建的东西可能在形式和规模上会有很大的不同。考虑到这一点，Vue 的设计非常注重灵活性和“可以被逐步集成”这个特点。根据你的需求场景，你可以用不同的方式使用 Vue。
:::

## 环境搭建

在进行 Vue 进行开发之前，请先确保你成功的安装和配置了如下环境，如果已经成功安装和配置，忽略即可。

- Node.js 和 Npm 用来管理 Vue 相关依赖。
- Vscode 编辑器，开发 Vue 最好用的编辑器，没有之一。
- Vue - Official 插件，在 Vscode 编辑器内下载即可。

::: info 下载地址
- Node.js 和 Npm ：https://nodejs.cn/
- Vscode ：https://code.visualstudio.com/
- Vue - Official：https://marketplace.visualstudio.com/items?itemName=Vue.volar
:::


## 创建 Vue 工程

### 基于 vue-cli 创建

::: warning vue-cli 已处于维护模式，官方推荐基于 Vite 创建项目
现在官方推荐使用 create-vue 来创建基于 Vite 的新项目。 
:::

1. 安装 `@vue/cli`，已安装可以跳过该过程

```sh
npm install -g @vue/cli
```

2. 查看 `@vue/cli` 版本，确保其在 `4.5.0` 版本以上

```sh
vue --version
```

3. 执行创建命令

```sh
vue create vue-codermast-project
```

::: info 
vue-codermast-project 为想要创建的项目名称，替换为自己的即可。
:::

该指令执行后，根据提示输入 Y 即可安装，然后选择自己想要的版本和控件即可。

4. 运行项目

```sh
# 切换到项目目录
cd vue-codermast-project

# 安装所需依赖
npm install

# 启动项目
npm run serve
```

### 基于 vite 创建 【推荐】

::: tip 
`vite` 是新一代前端构建工具，官网地址：[https://vitejs.cn](https://vitejs.cn/)，`vite`的优势如下：

- 轻量快速的热重载（`HMR`），能实现极速的服务启动。
- 对 `TypeScript`、`JSX`、`CSS` 等支持开箱即用。
- 真正的按需编译，不再等待整个应用编译完成。
- `webpack`构建 与 `vite`构建对比图如下

![](/assets/front-end/vue3/create-vue-project/2024-04-10-16-12-45.png =450x250)

![](/assets/front-end/vue3/create-vue-project/2024-04-10-16-13-01.png =450x250)
:::

1. 安装 Vite 

```sh
npm install vite
```

2. 创建项目

```sh
npm create vue@latest
```

3. 项目配置

```text
## 配置项目名称
√ Project name: vue-codermast-project
## 是否添加TypeScript支持
√ Add TypeScript?  Yes
## 是否添加JSX支持
√ Add JSX Support?  No
## 是否添加路由环境
√ Add Vue Router for Single Page Application development?  No
## 是否添加pinia环境
√ Add Pinia for state management?  No
## 是否添加单元测试
√ Add Vitest for Unit Testing?  No
## 是否添加端到端测试方案
√ Add an End-to-End Testing Solution? » No
## 是否添加ESLint语法检查
√ Add ESLint for code quality?  Yes
## 是否添加Prettiert代码格式化
√ Add Prettier for code formatting?  No
```

4. 项目启动

```sh
# 切换到项目目录
cd vue-codermast-project

# 安装所需依赖
npm install

# 启动项目
npm run serve
```