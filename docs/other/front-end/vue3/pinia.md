---
order : 8
---

# 8. Pinia

::: warning 开始之前
在正式开始介绍 Pinia 之前，请先思考一下，你是否在日常开发中或者你的需求中遇到如下问题？

- 不同 Vue 组件中的数据需要共享
- 有些数据或方法需要全局访问

这样的需求该如何解决呢？答案是使用 **Pinia** ！
:::

## **介绍**

Pinia 是一个专门为 Vue 3 的专属状态管理库，它允许你跨组件或页面共享状态，提供了一种简单、直观和类型安全的方式来管理你的应用程序的状态。Pinia 的设计理念是结合了 Vue 3 的 组合式 API (Composition API) 和 TypeScript 的类型系统，以提供现代化和优雅的状态管理解决方案。


::: important 为什么不使用 Vuex 而使用 Pinia？
1. Vuex 主要为 Vue2 设计的，而 Pinia 是基于 Vue3 的 组合式 API 风格设计，这使得在 Vue3 项目的开发时更灵活、更直观。

2. Pinia 是使用 TypeScript 编写的，提供了很好的类型推断和类型安全，可以在编译时捕获到许多常见的类型错误，避免了在运行时出现一些难以调试的问题。

3. Pinia 是基于 Vue3 的响应式系统构建的，而且会优化更新过程，只更新需要更新的部分，以提高性能和效率。

4. Pina 提供了完善的异步操作支持，可以在 Action 中执行异步操作，并且能确保操作的正确执行顺序和结果。

5. 最重要的一点，正如 Pinia 官网所述，Pinia 更加**简单**、**直观**，**所见即所得**，**所写即所得**。
:::

## **安装**

在使用 Pinia 之前，请先安装 Pinia。在项目的根目录下执行对应的如下指令，即可安装 Pinia 

::: code-tabs#pinia

@tab npm
```bash:no-line-numbers
npm install pinia
```

@tab pnpm
```bash:no-line-numbers
pnpm install pinia
```

@tab yarn
```bash:no-line-numbers
yarn add pinia
```
:::

::: tip 提示：如果你的应用使用的 Vue 版本低于 2.7，你还需要安装组合式 API 包：@vue/composition-api
:::


## **使用**

Pinia 存储数据是使用 store 来实现的，store 中的数据可以全局访问，以此来实现组件之间的数据共享问题。一般关于 Store 相关的内容将其放在 Vue 项目的 `src/store/` 目录下。

`Store`是一个保存：**状态**、**业务逻辑** 的实体，每个组件都可以**读取**、**写入**它。

它有三个概念：`state`、`getter`、`action`，可以看做是组件中的： `data`、 `computed` 和 `methods`。



::: important 如果你学过 Java，可以将其看做是一个公开的静态类，所有的属性和方法都是静态的。
:::

### 存储数据

存储数据之前，需要先新建一个 store 文件，命名为 `src/user.ts` 来提供存储的位置，内容如下

```ts
// 引入 defineStore 用于创建 store
import { defineStore } from 'pinia'
import { reactive } from 'vue'

// 定义并暴露一个 store
export const useUserStore = defineStore('user',() => {
    // 这里演示的是 组合式 API 的写法
    let userInfo = reactive({
        uid : 1,
        username : 'codermast',
        nickname : '友人'
        url : "https://www.codermast.com/"
    });

    // 获取用户信息
    function getUserName() : string {
        // 将 username 转为大写
        return userInfo.value.username.toUpperCase();
    }

    // 需要手动进行返回暴露，这和 Vue3 中的 setup 有些差别
    return { userInfo, getUserName };
})
```

### 读取数据

将数据存储到 Store 中以后可以在 User.vue 这个组件中读取 User 信息。

在进行解构时，需要使用 **storeToRefs** ，和 Vue 中的 toRefs 类似，都是将数据转化为 ref 对象，方便在模板中使用。直接进行解构时，数据会失去响应式。

::: warning 注意：pinia 提供的 storeToRefs 只会将数据做转换，而 Vue 的 toRefs 会转换 store 中所有的数据。推荐使用 storeToRefs。
:::

- 直接读取

```vue{17-19}
<template>
    <h2>ID ：{{ uid }}</h2>
    <h2>UserName ：{{ username }}</h2>
    <h2>NickName ：{{ nickname }}</h2>
    <h2>Url ：{{ url }}</h2>
</template>

<script setup lang="ts">
    // 引入 useUserStore
    import { useUserStore } from '@/store/user'
    
    // 调用 useUserStore 得到对应的 store
    const userStore = useUserStore()

    // 从 userStore 中解构出 userInfo 对象
    let { userInfo } = userStore;
    // 从 userInfo 对象中解构出需要的属性
    // let { uid, username, nickname, url } = userInfo;
    let { uid, username, nickname, url } = storeToRefs(userInfo);
</script>
```

- getter 读取

除了直接读取数据以外，与 Vue 中的 <a href="front-end/vue3/computed.html" style="color:CornflowerBlue;">计算属性</a> 类似，可以对数据进行计算，然后返回。

**定义 Getter**

```ts
// 获取用户信息中的用户名
function getUsername() : string {
    return userInfo.username;
}
```

**使用 Getter**

```ts
// 引入 useUserStore
import { useUserStore } from '@/store/user'

// 调用 useUserStore 得到对应的 store
const userStore = useUserStore()

// 调用 Getter 方法
userStore.getUsername();    // codermast
```


### 修改数据

正如 Pinia 官网所说，Pinia 是符合直觉的 Vue 状态管理库，类型安全、可扩展性以及模块化设计。甚至让你忘记正在使用的是一个状态库。

Pinia 提供的所有数据，可以像 Vue 组件中原生定义的数据一样，可以直接修改。具体的修改有三种方式。

1. 直接修改

```ts
// 调用 useUserStore 得到对应的 store
const userStore = useUserStore()

// 修改 username 
userStore.userInfo.username = "CoderMast"
```

2. 批量修改

```ts:
// 调用 useUserStore 得到对应的 store
const userStore = useUserStore()

// 1. 直接修改 username 
userStore.$patch({
    userInfo : {
        username : "CoderMast"
    }
})

// 2. 函数式修改 username
userStore.$patch((store) => {
    store.userInfo.username = 'CoderMast'
})
```

::: info 函数式修改时，会传一个 state 的参数，这个参数是 store 的内部状态，可以随意命名，只要与使用时保持一致即可。
:::

3. 借助`action`修改

在组合式 API 风格中，action 即就是 Mathod 方法，可以在方法中编写对应的数据修改规则，从而通过调用这些方法来实现修改数据的效果。

- 定义 Action : 在 `store/user.ts` 中 `useUserStore` 内部定义，具体写法请参考：[修改数据](#修改数据)

```ts
function setUserName(newUsername : string) : void {
    // 1. 直接修改
    userInfo.username = newUsername;

    // 2. 使用 $patch 修改
    $patch((state) => {
        state.userInfo.username = newUsername;
    })
}
```

- 使用 Action : 在 `User.vue` 中调用，具体的写法可参考 [读取数据](#读取数据)

```ts
// 引入 useUserStore
import { useUserStore } from '@/store/user'

// 调用 useUserStore 得到对应的 store
const userStore = useUserStore()

// 调用 action 
userStore.setUsername("CoderMast")
```


## **部署**

如果你想要在生产环境使用 Pinia，需要进行安装和配置。

1. 安装 Pinia

::: tip 参考本文的 <a href="#安装" style="color:#5864e1"><b>安装 Pinia 章节</b></a> 即可
:::

2. 注册 Pinia 

修改 `src/main.ts` 配置文件

```ts {4-5,11-12}
import { createApp } from 'vue'
import App from './App.vue'

// 引入createPinia，用于创建pinia 
import { createPinia } from 'pinia'

// 创建pinia 
const pinia = createPinia()
const app = createApp(App)

/// 使用插件 
app.use(pinia)
app.mount('#app')
```

3. 使用 Pinia

::: important 到此，Pinia 章节就算结束了，本章节的代码演示都以 组合式 API 风格为主，也推荐使用这种方法，如果您想学习选项式，可以参考 <a href="https://www.bilibili.com/video/BV1Za4y1r7KE?p=43" style="color : #773fd5;"><b>尚硅谷Vue3入门到实战，最新版vue3+TypeScript前端开发教程</b></a>