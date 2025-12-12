---
order : 9
--- 

# 9. 组件通信

在前面的章节内，介绍了 Vue 中最核心的内容——组件的介绍和使用，和 Java 等编程语言相反，组件并不近似于这些变成语言中的类，类可以通过类或者其实例化的对象来相互交互，但 Vue 组件之间的作用域是相互独立的，这就意味着不同组件之间的数据无法相互引用。

总的来说组件之间有这三种关系：**父子关系**、**兄弟关系**、**隔代关系**（可能隔多代）。

![](/assets/front-end/vue3/component-communication/2024-06-03-17-25-40.png)

**`Vue3`组件通信和`Vue2`的区别：**

* 移出事件总线，使用`mitt`代替。

- `vuex`换成了`pinia`。
- 把`.sync`优化到了`v-model`里面了。
- 把`$listeners`所有的东西，合并到`$attrs`中了。
- `$children`被砍掉了。

**常见搭配形式：**

![](/assets/front-end/vue3/component-communication/2024-06-03-17-29-53.png)


## **1. props**

Props 是使用频率最高的一种通信方式，通常被使用于 父组件向子组件传递数据。

::: warning 理论上也能从子组件传递给父组件，但是需要父组件预先向子组件提供一个接受数据的函数。
:::

父组件向子组件传递数据时，直接写在子组件的标签中。具体的写法如下所示：

- 父组件传递数据

```vue
<Child v-bind:name="data" />
```

传递时需要使用 `v-bind` 进行响应式绑定，子组件中拿到的数据名为 `name`，实际的数据值为 `data` 变量的值。

也可以直接传递方法，子组件接收后可直接调用。

- 子组件接收数据

```ts
defineProps(['car','getToy'])
```

子组件需要先引入父组件传递的数据后，才能进行使用。
::: important 在 Vue3 中，defineProps 是一个内置函数，故不需要使用 import 引入，可直接在 setup 函数中使用。
:::


::: details Props 案例

- 父组件

```vue
<template>
  <div class="father">
    <h3>父组件，</h3>
		<h4>我的车：{{ car }}</h4>
		<h4>儿子给的玩具：{{ toy }}</h4>
		<Child :car="car" :getToy="getToy"/>
  </div>
</template>

<script setup lang="ts" name="Father">
	import Child from './Child.vue'
	import { ref } from "vue";
	// 数据
	const car = ref('奔驰')
	const toy = ref()
	// 方法
	function getToy(value:string){
		toy.value = value
	}
</script>
```

- 子组件

```vue
<template>
  <div class="child">
    <h3>子组件</h3>
		<h4>我的玩具：{{ toy }}</h4>
		<h4>父给我的车：{{ car }}</h4>
		<button @click="getToy(toy)">玩具给父亲</button>
  </div>
</template>

<script setup lang="ts" name="Child">
	import { ref } from "vue";
	const toy = ref('奥特曼')
	
	defineProps(['car','getToy'])
</script>
```
:::

## **2. 自定义事件**

自定义事件通常用于 子组件 -> 父组件传递数据，这里需要注意的是自定义事件和自定义方法的区别，还要区分原生事件和自定义事件。

- 原生事件：事件名是特定的，事件对象是包含事件相关信息的对象。
- 自定义事件：事件名是任意名称，事件对象是调用 emit 是所提供的数据，可以是任意类型。

::: important 在自定义事件的命名中推荐使用短横线命名法，例如 get-user ，这是因为 HTML 中不区分大小写，大小驼峰命名法中存在的大写字母会被自动转换，导致歧义。
:::


1. 父组件首先给子组件绑定事件

```vue
<Child @send-toy="saveToy" />
```

这里就给 `Child` 子组件绑定了 `send-toy` 事件。

2. 子组件中声明和触发事件

```vue
<template>
    <!-- 触发 send-toy 事件 -->
    <button @click="emit('send-toy',toy)">发送玩具</button>
</template>


<script setup lang="ts">
let toy = ref("钢铁侠");
// 声明事件
const emit = defineEmits(['send-toy'])
</script>
```
::: tip 子组件触发了父组件传递的事件后，父组件中对应的方法则会被调用，从而实现了子组件向父组件传递数据的效果。
:::

## **3. mitt**

mitt 与订阅发布模式类似，可以实现任意组件之间互相通信，在正式使用之前，请先安装 mitt

::: code-tabs#mitt
@tab npm
```bash
npm install mitt
```

@tab pnpm
```bash
pnpm install mitt
```

@tab yarn

```bash
yarn add mitt
```
:::

mitt 使用步骤如下：

1. 引入 mitt

```ts
import mitt from 'mitt'
const emitter = mitt()
```

2. 配置事件绑定
```ts
emitter.on('send-toy',(value : any)=>{
    console.log(value);
})
```

emitter 的 on 方法有两个参数，第一个参数为自定义事件的名称，第二个为事件触发时的回调函数。

3. 事件调用

```ts
emitter.emit('send-toy',toy.value)
```

emitter 的 emit 方法来触发事件，第一个参数为绑定的自定义事件名称，后续参数是回调函数的参数列表。

4. 事件解绑

```ts
// 解绑单个事件
emitter.off('send-toy');

// 解绑所有事件
emitter.all.clear();
```

emitter 的 off 方法来触发事件，传递的参数为绑定的自定义事件名称。

::: important 总结
本质上可以将 mitt 看做是将原来写在组件内部的自定义事件抽离出来，将其管理在 mitt 中，所有组件都通过 mitt 来实现自定义事件，从而实现任意组件之间的交互。类似于设计模式中的代理模式。
:::

::: details mitt 案例
1. 新建 `/src/utils/emitter.ts` 文件

```ts
// 1. 引入 mitt
import mitt from 'mitt'

// 2. 创建 emitter 
const emitter = mitt()

// 3. 暴露 mitt 
export default emitter
```

2. 使用 mitt 来绑定一些事件

```ts
import emitter from '@/utils/emitter'

// 绑定事件
emitter.on('send-toy',(value)=>{
    console.log('send-toy事件被触发',value)
})

// 解绑事件
emitter.off('send-toy');

// 解绑所有事件
emitter.all.clear();
```

3. 触发事件

```ts
emitter.emit('send-toy',toy.value)
```

> 在触发事件之前不能解绑事件，否则无法成功触发。
:::

## **4. v-model**

实际上在前面的 [3. 指令及模板语法](/front-end/vue3/template-grammar.html) 中已经介绍过 v-model 了，回顾一下 v-model 用于数据的双向绑定。

由于是在模板语法章节，故没有过多的详细说明 v-model 的使用，这里来详细说明。

1. 作用于普通标签

```vue
<template>
    <input v-model="username" />

    <!-- 等价于 -->
    <input v-bind:value="username"  
           @input="username =($event.target as HTMLInputElement).value" 
    />
</template>
```

2. 作用于组件标签

```vue
<template>
    <MyInput v-model="username" />

    <!-- 等价于 -->
    <MyInput :modelValue="username"  
            @update:modelValue="username = $event" 
    />
</template>
```

::: warning $event 什么时候调用 target？
1. 当 $event 使用在原生 HTML 标签上时，代表的是 DOM 元素的事件对象，则需要调用 target 
2. 当 $event 使用在组件标签上时，即自定义事件，代表的就是事件触发时，所传递的数据，不需要调用 target
:::

3. 这通常使用在自定义组件的封装中

- MyInput

```vue
<template>
  <div class="box">
    <!--将接收的value值赋给input元素的value属性，目的是：为了呈现数据 -->
		<!--给input元素绑定原生input事件，触发input事件时，进而触发update:model-value事件-->
    <input 
       type="text" 
       :value="modelValue" 
       @input="emit('update:model-value',$event.target.value)"
    >
  </div>
</template>

<script setup lang="ts" name="MyInput">
  // 接收props
  defineProps(['modelValue'])
  // 声明事件
  const emit = defineEmits(['update:model-value'])
</script>
```

父组件既向子组件传递了数据，子组件也向父组件传递了数据。

::: tip 自定义 v-model 值
在子组件中接受 v-model 传递的值时，默认是使用的 modelValue，可以进行自定义。

1. 传递时: `v-model:username`

2. 接收时：`defineProps(['username'])` 和 `defineEmits(['update:username'])`

3. 在模板中使用即可

4. 当使用了自定义 v-model 值后，则可以在组件标签上多次使用 v-model

```vue:no-line-numbers
<Child v-model:username="username" v-model:password="password" ... />
```
:::


## **5. $attrs**

`$attrs` 用于实现当前组件向其子组件传递数据通信的一种方式，也可跨代进行通信。祖组件 => 子组件

`$attrs`是一个对象，包含所有父组件传入的标签属性。

`$attrs` 会自动排除在组件传递过程中 `props` 中声明的属性，可以认为声明过的组件 `props` 被子组件消费了，故不会再继续向下传递。

具体的使用方式：

1. 父组件中向子组件绑定数据

```vue
<template>
    <Child v-bind:a="a" :b="b" :="{x:100,y:200}" :addA="addA">
</template>
<script>
let a = ref(0);
let b = ref(3);

function addA(value : number){
    a.value += value;
}
</script>
```

2. 子组件消费数据

```vue
<template>
	<h4>a：{{ a }}</h4>
	<button @click="addA(3)">点我更新 A</button>
</template>

<script setup lang="ts">
defineProps(['a','addA'])
</script>
```

3. 子组件向孙组件传递数据

```vue
<template>
    <GrantChild v-bind="$attrs" />
</template>
```

::: info 此时，孙组件中能使用的数据就剩下了 b、x、y 这三个数据，a 和 addA 被子组件消费了，不会向后传递。
:::

## 6. **\$refs、\$parent**

1. 概述：

   * `$refs`用于 ：**父→子。**
   * `$parent`用于：**子→父。**

2. 原理如下：

   | 属性      | 说明                                                     |
   | --------- | -------------------------------------------------------- |
   | `$refs`   | 值为对象，包含所有被`ref`属性标识的`DOM`元素或组件实例。 |
   | `$parent` | 值为对象，当前组件的父组件实例对象。                     |

## 7. provide、inject


## 8. Pinia 方式

::: important 请参考 第 8 章节 「<a href="/front-end/vue3/pinia.html" style="color:darkviolet;">Pinia 详解</a>」
:::

## 9. Slot 插槽

