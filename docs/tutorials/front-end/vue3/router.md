---
order : 7
---

# 7. 路由


## 概念

在 Web 开发中，路由是指根据用户的请求路径来决定显示哪个页面或者组件的过程。你也可以将路由理解为 url 和 页面或组件 的一个映射关系，访问 url，就展示对应页面。在 Vue 中这个过程通过 vue-router 来实现的。

由于 Vue 在开发时对路由支持的不足，于是官方补充了 vue-router 插件，通过 vue-router 可以实现多视图的单页 Web 应用（single page web application，SPA）。

::: warning 为什么不使用 a 标签来进行页面的跳转呢？
因为我们的 Vue 项目大都是单页面应用，只有一个 index.html 主页，凡是你看到的页面，都是挂载到该页面上的组件，所以无法使用传统的 a 标签来直接进行页面的跳转，需要使用 Vue 提供的 vue-router 路由来进行管理。
:::


## 安装

Vue 默认是没有安装 vue-router 路由插件的，在正式使用之前，请先安装路由。在你项目的根目录下执行如下指令，即可安装 vue-router 插件。


::: code-tabs#shell

@tab npm

```bash:no-line-numbers
npm install vue-router
```

@tab yarn

```bash:no-line-numbers
yarn install vue-router
```

@tab cnpm

```bash:no-line-numbers
cnpm install vue-router
```
:::

## 路由定义

使用路由之前，需要先进行路由的配置，主要配置 URL 和 页面组件的映射关系。创建路由配置文件 `/src/router/index.js`

```ts
import { createRouter,createWebHistory } from 'vue-router'

import Home from '../pages/Home.vue'
import News from '../pages/News.vue'
import Detail from '../pages/Detail.vue'

// 构建路由映射对象
const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/news',
        name: 'news',
        component: News,
        children:[
				{
					path: '/detail',
					name: 'detail',
					component: Detail
				}
			]
    }
];

// 创建路由对象
const router = createRouter({
    // 配置路由器模式
    history: createWebHistory(),
    routes
});

export default router
```

其中routes 是一个数组，其中的元素就是路由映射信息。

- path：对应的 URL 信息
- name：路由名称
- component：组件信息
- children：子路由信息

::: info 路由的映射关系中，也支持配置子路由，便于 URL 匹配，支持多级子路由嵌套
:::

## 路由传参

### Query 参数

- 传递参数
```vue
<!-- 跳转并携带query参数（to的字符串写法） -->
<router-link to="/news/detail?a=1&b=2&content=欢迎你">
	跳转
</router-link>
				
<!-- 跳转并携带query参数（to的对象写法） -->
<RouterLink 
  :to="{
    //name:'xiang', //用name也可以跳转
    path:'/news/detail',
    query:{
      id:news.id,
      title:news.title,
      content:news.content
    }
  }"
>
  {{news.title}}
</RouterLink>
```
- 接收参数

```ts
import {useRoute} from 'vue-router'
const route = useRoute()
// 打印query参数
console.log(route.query)
```
### Params 参数

- 传递参数
```vue
<!-- 跳转并携带params参数（to的字符串写法） -->
<RouterLink :to="`/news/detail/001/新闻001/内容001`">{{news.title}}</RouterLink>

<!-- 跳转并携带params参数（to的对象写法） -->
<RouterLink 
    :to="{
      name:'xiang', //用name跳转
      params:{
        id:news.id,
        title:news.title,
        content:news.title
      }
    }"
  >
    {{news.title}}
  </RouterLink>
```

- 接收参数

```ts
import {useRoute} from 'vue-router'
const route = useRoute()
// 打印params参数
console.log(route.params)
```
::: warning 注意
- 传递`params`参数时，若使用`to`的对象写法，必须使用`name`配置项，不能用`path`。

- 传递`params`参数时，需要提前在规则中占位。
:::
## RouterLink

`<router-link>` 是一个组件，该组件用于设置一个导航链接，切换不同的 HTML 内容。使得 Vue Router 可以在不重新加载页面的情况下更改 URL，处理 URL 的生成以及编码。

### To 属性

to 属性值表示目标路由的链接。当被点击后，内部会立刻把 to 的值传到 router.push()，所以这个值可以是一个字符串或者是描述目标位置的对象。

to 属性有两种写法，一种是静态的 url 写法，另外一种是 v-bind 绑定的对象写法，对象可以传入路由的名称或者路径，在使用之前需要在 <Badge text="/src/router/index.ts" vertical="middle" type="note"/> 中进行注册声明，也只有声明过的路由才能进行跳转。

```vue
<!-- 第一种：to的字符串写法 -->
<router-link active-class="active" to="/home">主页</router-link>

<!-- 第二种：to的对象写法 -->
<router-link active-class="active" :to="{ path : '/home' }">Home</router-link>
<router-link active-class="active" :to="{ name : 'news' }">新闻</router-link>

<!-- 命名的路由 -->
<router-link :to="{ name: 'user', params: { userId: 123 }}">User</router-link>

<!-- 带查询参数，下面的结果为 /register?plan=private -->
<router-link :to="{ path: 'register', query: { plan: 'private' }}">Register</router-link>
```
::: tip 与路由一样，to 属性在实现跳转功能的同时，也能传递参数
::: 

### Replace 属性

设置 replace 属性的话，当点击时，会调用 router.replace() 而不是 router.push()，导航后不会留下 history 记录。

```vue
<router-link :to="{ path: '/abc'}" replace></router-link>
```

### Append 属性

设置 append 属性后，则在当前 (相对) 路径前添加其路径。例如，我们从 /a 导航到一个相对路径 b，如果没有配置 append，则路径为 /b，如果配了，则为 /a/b

```vue
<router-link :to="{ path: 'relative/path'}" append></router-link>
```

### Tag 属性

有时候想要 `<router-link>` 渲染成某种标签，例如`<li>`。 于是我们使用 tag prop 类指定何种标签，同样它还是会监听点击，触发导航。

```vue
<router-link to="/foo" tag="li">foo</router-link>
<!-- 渲染结果 -->
<li>foo</li>
```

### Active-class 属性

设置 链接激活时使用的 CSS 类名。可以通过以下代码来替代。

```vue
<style>
   ._active{
      background-color : red;
   }
</style>
<p>
   <router-link v-bind:to = "{ path: '/route1'}" active-class = "_active">Router Link 1</router-link>
   <router-link v-bind:to = "{ path: '/route2'}" tag = "span">Router Link 2</router-link>
</p>
```

注意这里 class 使用 active-class="_active"。

### Exact-active-class 属性

配置当链接被精确匹配的时候应该激活的 class。可以通过以下代码来替代。

```vue
<p>
   <router-link v-bind:to = "{ path: '/route1'}" exact-active-class = "_active">Router Link 1</router-link>
   <router-link v-bind:to = "{ path: '/route2'}" tag = "span">Router Link 2</router-link>
</p>
```

### Event 属性

声明可以用来触发导航的事件。可以是一个字符串或是一个包含字符串的数组。

```vue
<router-link v-bind:to = "{ path: '/route1'}" event = "mouseover">Router Link 1</router-link>
```

以上代码设置了 event 为 mouseover ，及在鼠标移动到 Router Link 1 上时导航的 HTML 内容会发生改变。

## RouterView

router-view 将显示与 url 对应的组件。你可以把他看做一个盒子，用来存放路由展示的组件，根据不同的 URL 显示不同的组件。所以你可以把它放在任何地方，以适应你的布局。

```vue
<router-view></router-view>
```

点击过的导航链接都会加上样式 `class ="router-link-exact-active router-link-active"`。


::: important &lt;router-link&gt; 和 &lt;router-link&gt; 也可以写成 &lt;RouterLink&gt; 和 &lt;RouterView&gt; 这种组件形式
:::

## 工作模式

在 Vue3 中路由器有两种工作模式，分别为 history 模式、hash 模式。

1. History 模式

```js
const router = createRouter({
	history:createWebHistory(), 
	/******/
})
```
- 优点：URL 美观，不带 # ，更接近传统的网站 URL
- 缺点：项目上线后，需要服务端配合处理路径问题

2. Hash 模式

```js
const router = createRouter({
	history:createWebHashHistory(), 
	/******/
})
```
- 优点：兼容性更好，不需要服务器配合处理
- 缺点：URL 带有 #，不美观，不利于搜索引擎优化。


## 重定向

默认直接访问项目都是请求 `/` 这个 URL 的路由，如果想直接进入其他路由时，可以直接将对应路由的 `path` 改为 `/`，但是这样做不便于代码的阅读和后期的维护。为了解决这个问题，可以使用 redirect 进行路由重定向。

1. 使用路径重定向，直接重定向到指定的 URL。

```js
const routes = [
    { path : '/', redirect : '/news'}
]
```


2. 使用命名的路由重定向，重定向到一个指定名称的路由

```js
const routes = [
    { path : "/", redirect : { name : 'news'} }
]
```

3. 重定向时也可以传参

```js
const routes = [
    { path : "/", redirect : to => {  
        // 使用编程式导航进行重定向，并附带查询参数  
        return {  
            path: '/news',  
            query: {  
                title: 'Hello CoderMast!',  
                context: '你好 CoderMast!'  
            }  
        }  
      }   
    }
]
```


## 编程式导航

上面的方式否是通过标签来进行路由控制，但是在实际的开发中经常遇到的一种情况就是，需要通过脚本的执行来进行路由控制。

例如，控制用户在登录成功后，自动跳转到用户中心。这就无法使用上述标签来实现，这该如何解决呢？

在 Vue3 中 可以使用 vue-router 插件中提供的两个方法 `useRoute` 和 `useRouter`，这和 Vue2 中的 `$route`和`$router` 类似。

具体的跳转方式有 push 和 replace 两种，和之前说过的用法一致，不过多赘述。

::: center
[点击跳转到 replace 属性](#replace-属性)
:::

```vue
<template>
  <div class="app">
    <h2>Vue 编程式路由测试</h2>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'  

const router = useRouter();

// 在页面成功挂载后 3 秒进行路由跳转
onMounted(()=> {
   setTimeout(() => {
      // 跳转到 "/news" 路由
      router.push("/news")    // 有痕跳转
      router.replace("/news") // 无痕跳转
   },3000)
})
</script>
```

::: important 实际的开发中，使用编程式导航的情况远远大于链接式。
:::

## 使用

在使用路由之前，需要先进行配置注册。

1. 创建路由配置文件 `/src/router/index.js`

```ts
import { createRouter,createWebHistory } from 'vue-router'

import Home from '../pages/Home.vue'
import News from '../pages/News.vue'

// 构建路由映射对象
const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/news',
        name: 'news',
        component: News
    }
];

// 创建路由对象
const router = createRouter({
    // 配置路由器模式
    history: createWebHistory(),
    routes
});

export default router
```

2. 在 main.ts 中进行注册

```ts
import { createApp } from 'vue'

import Home from '@/components/Home.vue'
import router from '@/router/index';

const app = createApp(Home);
app.use(router);
app.mount('#app');
```

3. 在组件中使用

```vue
<template>
  <div class="app">
    <h2 class="title">Vue路由测试</h2>
    <!-- 导航区 -->
    <div class="navigate">
        <RouterLink to="/home" active-class="active">首页</RouterLink>
        <RouterLink to="/news" active-class="active">新闻</RouterLink>
    </div>
    <!-- 展示区 -->
    <div class="main-content">
        <RouterView></RouterView>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'  

import { onMounted } from 'vue'

const router = useRouter();

// 在页面成功挂载后 3 秒进行路由跳转
onMounted(()=> {
   setTimeout(() => {
      // 跳转到 "/news" 路由
      router.push("/news")    // 有痕跳转
      router.replace("/news") // 无痕跳转
   },3000)
})
</script>
```

::: warning 注意
1. 路由组件通常存放在`pages` 或 `views`文件夹，一般组件通常存放在`components`文件夹。

2. 通过点击导航，视觉效果上“消失” 了的路由组件，默认是被**卸载**掉的，需要的时候再去**挂载**。
:::
