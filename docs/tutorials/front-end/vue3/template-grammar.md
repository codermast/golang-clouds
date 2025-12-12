---
order : 3
---

# 3. 指令及模板语法

## 指令

### v-bind

v-bind 用于将 Vue 中的数据绑定到 HTML 元素的属性上。

```html
<div v-bind:id="id"></div>
```

::: tip v-bind 简写

因为 v-bind 在实际的开发中非常常用，Vue 中提供了特定的简单语法，可以省略 v-bind 仅保留 `:` 来实现绑定。

值得一说的是，当你要绑定的属性值变量和属性名称相同时，可直接使用 `:` 来进行简化绑定。具体实例请看下文。

```html:no-line-numbers
<div v-bind:id="id"></div>
<div :id="id"></div>
<div :id></div>

<button v-bind:disabled="isButtonDisabled">按钮</button>
<button :disabled="isButtonDisabled">按钮</button>
```

不同写法的绑定经过 Vue 处理后，在浏览器渲染出来的效果是完全一致的，不必担心兼容性和运行效率，选择你喜欢的方式即可。
:::

### v-model

v-model 与 v-bind 类似都是将 Vue 中数据和 HTML 中进行绑定，但是 v-bind 是单向绑定，将 Vue 数据绑定到页面，Vue 中数据变化时，页面会跟着变化，但是页面变化，并不会更新 Vue 中数据。

v-model 则将页面和 Vue 中数据双向绑定，无论哪个发生变化，对应一方都会发生改变，通常使用在输入框中。

```vue:no-line-numbers
<template>
    <input type="text" v-model="message" />
    <p> {{ message }}</p>
</template>

<script setup>
import { ref } from 'vue'
var message = ref("CoderMast");
</script>
```

### v-on

用于在 HTML 元素上绑定事件监听器，使其能够触发 Vue 实例中的方法或函数。

```vue:no-line-numbers
<template>
    <input type="text" v-model="message" />
    <p> {{ message }}</p>
    <button v-on:click="seeHello">说你好</button>
</template>

<script setup>
import { ref } from 'vue'
var message = ref("CoderMast");

function seeHello(){
    message.value = message.value + " Hello!";
    console.log(message.value);
}
</script>
```

### v-if

这个就很简单了，和 if ... else if ... else 语句是相同的功能，只不过这个是在 Vue 文件中进行渲染的。

```vue:no-line-numbers
<template>
    <p v-if="showMessage">Hello {{ name }}!</p>
    <p v-else>Bye {{ name }}!</p>
</template>

<script setup>
import { ref } from 'vue'
var showMessage = ref(true)
var name = ref("CoderMast");
</script>
```

### v-for

用于根据数组或对象的属性值来循环渲染元素或组件。

1. 遍历数组内容

```vue:no-line-numbers
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue'
var items = ref([
        { id: 1, text: 'Item 1' },
        { id: 2, text: 'Item 2' },
        { id: 3, text: 'Item 3' }
      ])
</script>
```

2. v-for 还支持第二个参数，参数值为当前项的索引下标：

```html
<ol>
    <li v-for="(site, index) in sites">
        {{ index }} -{{ site.text }}
    </li>
</ol>
```

3. 你也可以提供第二个的参数为键名，以便以遍历 Map 类型的值。

```html
<ul>
    <li v-for="(value, key) in object">
        {{ key }} : {{ value }}
    </li>
</ul>
```

4. 遍历 Map 时，第三个参数为索引。

```html
<ul>
    <li v-for="(value, key, index) in object">
        {{ index }}. {{ key }} : {{ value }}
    </li>
</ul>
```

5. 也可以迭代整数，也可以理解为循环多少次。

```html
<ul>
    <li v-for="n in 10">
        {{ n }}
    </li>
</ul>
```
### v-show

v-show 是 Vue.js 提供的一种指令，用于根据表达式的值来条件性地显示或隐藏元素。

```vue:no-line-numbers
<template>
    <button v-on:click="showMessage = !showMessage">显示/隐藏</button>
    <p v-show="showMessage">Hello CoderMast!</p>
</template>

<script setup>
import { ref } from 'vue'
var showMessage = ref(true)
</script>
```

::: important v-show 和 v-bind:disabled 有什么区别？

1. v-show 是用于根据条件控制元素的显示与隐藏的指令。
    - 当表达式为真时，元素会显示；当表达式为假时，元素会隐藏。它通过修改元素的 display CSS 属性来实现这一点。
    - 即使元素被隐藏，它仍然存在于 DOM 中，只是不可见。
    - 适用于需要频繁切换显示与隐藏的情况，因为元素的状态保持不变，只是修改了显示方式。

2. v-bind:disabled 用于将元素的禁用状态绑定到一个表达式。
    - 当表达式的值为真时，元素会被禁用；当表达式的值为假时，元素会处于可用状态。
    - 通常用于表单元素（如按钮、输入框等），以根据特定条件禁用或启用它们。

因此，v-show 用于控制元素的显示与隐藏，而 v-bind:disabled 用于控制元素的禁用状态。根据具体的需求，你可以选择使用其中的一个或两者结合使用。
:::

## 模板语法

### 插值

-  普通文本

Vue 组件中可直接使用双大括号来进行渲染，调用的对象可以是变量，也可以是计算属性。

```vue
<span>Message: {{ msg }}</span>
```

- HTML文本

双大括号会将数据解释为纯文本，而不是 HTML。若想插入 HTML，你需要使用 v-html 指令：

```html
<p>Using text interpolation: {{ rawHtml }}</p>
<p>Using v-html directive: <span v-html="rawHtml"></span></p>
```

Using text interpolation: &lt;span style="color: red"&gt;This should be red.&lt;/span&lt;/p&gt;

Using v-html directive: <span style="color: red">This should be red.</span>

::: tip 这里使用到的就是在上一个章节学习的指令概念，v-html 指令，使用简单易懂，不必担心。
:::

### 属性

如果要对 HTML 标签中的属性值进行绑定，不能直接使用 `{{ }}`，需要使用 v-bind 指令，用来响应式的绑定一个属性值。

```html
<div v-bind:id="dynamicId"></div>
```

对于布尔值 boolean 属性，常规值为 true 或者 false，如果属性值为 null 或者 undefined，则该属性不会显示出来。

```html
<button v-bind:disabled="isButtonDisabled">按钮</button>
```

### 表达式

Vue 提供了完整的 JavaScript 表达式支持，可以直接在模板内使用。

```html
<template>
    <div id="app">
        <p> Hello World {{ 1 + 1 }} 次！</p>
        <p> {{ ok ? 'YES' : 'NO' }} </p>

        <div v-bind:id="id">编程桅杆</div>
        <!-- 也可以写成如下格式 -->
        <div :id="id">编程桅杆</div>
        <div :id>编程桅杆</div>

        <!-- 还可以直接在 {{ }}  内写 JavaScript 代码-->
        {{  message.value.toLowerCase() }}
    </div>
</template>
<script setup>
import { ref } from 'vue'

const ok = ref(true)
const message = ref("CoderMast!")
const id = ref(1)
</script>
```

### 修饰符

修饰符是以半角句号 `.` 指明的特殊后缀，用于指出一个指令应该以特殊方式绑定。例如，`.prevent` 修饰符告诉 v-on 指令对于触发的事件调用 `event.preventDefault()`

```html:no-line-numbers
<form v-on:submit.prevent="onSubmit"></form>
```

## Ref 属性

想要获取页面上标签对应的 DOM 信息，通常使用 JS 中的选择器来进行获取，但是由于 Vue 是单页面项目，所有的组件都是挂载在 index.html 中的某个标签上，组件中的命名不免重复，获取指定标签的难度较大。

为了解决这个问题，可以使用标签上的 ref 属性，可以直接获取到标签的 DOM 信息，不必使用 JS 来进行操作。

### 普通标签

使用在普通标签上，获取的是改标签的 DOM 信息。

```vue
<template>
    <h1 ref="title">Hello CoderMast！</h1>
    <button @click="getTitleInfo">获取 Title DOM 信息</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 定义 DOM 元素接受变量
const title = ref();

// 获取 Title DOM 信息
const getTitleInfo = () => {
    console.log(title.value);
}
</script>
```

点击该按钮，打印在控制台的信息为：`<h1>Hello CoderMast！</h1>`

可以直接拿到这个对象，像我们之前去操作 DOM 元素那样，可以对它进行任何操作。

::: info 说明
在这个案例中，将打印信息写在了方法内，那么不写在方法内直接进行打印呢？答案是打印为空。出现这种现象的主要原因是标签上标注了 setup，setup 函数内执行的内容是早于页面挂载的，当页面还没挂载时，当然获取不到对应的 DOM 信息。
- [Vue - 生命周期详解](https://www.codermast.com/front-end/vue3/life-cycle.html)
:::

### 组件标签

使用在组件标签上，获取的是其子组件的信息。

```vue
<template>
    <Person ref="person" />
    <button @click="getPersonInfo">获取信息</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Person from './components/Person.vue';

const person = ref();

const getPersonInfo = () => {
    console.log(person.value);
}
</script>
```

这里打印出来的信息是子组件中的对象信息，但是该对象中的信息是无法拿到的，需要子组件去配置。

在子组件中需要将数据暴露给外部，这样外部才能获取到对应的信息。
```ts
import {ref,defineExpose} from 'vue'

// 数据
let name = ref('张三')
let age = ref(18)

// 使用 defineExpose 将组件中的数据交给外部
defineExpose({ name, age })
```