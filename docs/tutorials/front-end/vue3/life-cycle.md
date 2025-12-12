---
order : 6
---
# 6. 生命周期

生命周期是指组件从创建、挂载、更新到销毁的整个过程中所经历的一系列阶段。在 Vue 中，每个组件都有自己的生命周期，可以通过生命周期钩子函数来监听和处理组件在不同阶段的行为和状态。

Vue 组件的生命周期可以分为**创建**、**挂载**、**更新**、**销毁**四个阶段。每个阶段都有执行前和执行后两个钩子。

![Vue 生命周期](/assets/front-end/vue3/life-cycle/2024-05-29-11-03-54.png =800x)

::: danger 这里要注意的是在 Vue3 中 组合式 API 的 setup 是在所有钩子之前执行的。    
:::


* `Vue2`的生命周期

  > 创建阶段：`beforeCreate`、`created`
  >
  > 挂载阶段：`beforeMount`、`mounted`
  >
  > 更新阶段：`beforeUpdate`、`updated`
  >
  > 销毁阶段：`beforeDestroy`、`destroyed`

* `Vue3`的生命周期

  > 创建阶段：`setup`
  >
  > 挂载阶段：`onBeforeMount`、`onMounted`
  >
  > 更新阶段：`onBeforeUpdate`、`onUpdated`
  >
  > 卸载阶段：`onBeforeUnmount`、`onUnmounted`

常用的钩子：`onMounted`(挂载完毕)、`onUpdated`(更新完毕)、`onBeforeUnmount`(卸载之前)

## 创建阶段

在这个阶段，Vue 实例正在被创建并初始化，包括数据的观测、事件的监听、虚拟 DOM 的初始化等。在这个阶段，会依次触发以下生命周期钩子函数：

- beforeCreate：在实例被创建之前，组件的数据和方法都还未被初始化。
- created：在实例创建完成后，组件的数据和方法已经被初始化，但是 DOM 元素还未被挂载到页面上。

## 挂载阶段

在这个阶段，Vue 实例已经完成了初始化，DOM 元素已经被创建并插入到页面中。在这个阶段，会依次触发以下生命周期钩子函数：

- beforeMount：在 DOM 元素被挂载到页面之前，可以在这个钩子函数中修改组件的数据和方法。
- mounted：在 DOM 元素被挂载到页面之后，可以在这个钩子函数中访问组件的 DOM 元素，并进行一些初始化操作。

## 更新阶段

在这个阶段，Vue 实例的数据发生了变化，需要重新渲染 DOM 元素。在这个阶段，会依次触发以下生命周期钩子函数：

- beforeUpdate：在组件更新之前，可以在这个钩子函数中获取组件更新前的状态。
- updated：在组件更新之后，可以在这个钩子函数中获取组件更新后的状态。

## 销毁阶段

在这个阶段，Vue 实例被销毁，包括数据的销毁、事件的解绑、DOM 元素的销毁等。在这个阶段，会触发以下生命周期钩子函数：

- beforeDestroy：在组件被销毁之前，可以在这个钩子函数中进行一些清理工作。
- destroyed：在组件被销毁之后，可以在这个钩子函数中访问组件的 DOM 元素，并进行一些清理工作。

掌握 Vue 组件的生命周期，可以帮助我们更好地理解 Vue 组件的运行机制，更好地进行组件的开发和调试。

## 具体使用

```vue
<template>
    <div class="hello">
        <h2>当前求和为：{{sum}}</h2>
        <button @click="sum++">+1</button>
    </div>
    
</template>
 
<script setup>
import {ref,onBeforeMount,onMounted,onBeforeUpdate,onUpdated,onBeforeUnmount,onUnmounted} from  'vue'

let sum = ref(99);

onBeforeMount(()=>{
    console.log('onBeforeMount');
});

onMounted(()=>{
    console.log('onMounted');
});

onBeforeUpdate(()=>{
    console.log('onBeforeUpdate');
});

onUpdated(()=>{
    console.log('onUpdated');
});

onBeforeUnmount(()=>{
    console.log('onBeforeUnmount');
});

onUnmounted(()=>{
    console.log('onUnmounted');
});
</script>
 
<style scoped>
/* 这里写组件内的 CSS 样式 */
</style>
```

::: important 自定义 hook
自定义 Hook 实际上就是把写在生命周期钩子函数中的一些内容，封装成一个方法，直接在钩子函数中调用该方法。

```js
function printInfo(){
    console.log('onBeforeMount');
}

onBeforeMount(()=>{
    // 在钩子函数内调用自定义的 hook 函数，实现代码的复用
    printInfo();
});
```
:::
