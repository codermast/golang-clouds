---
order : 5
---

# 5. 监视

Watch 是 Vue 提供的一个用于监视响应式数据变化并执行相应操作的 API，能够对响应式数据的变化做出一些操作的功能。Vue3 中的 Watch 支持多种用法，包括监视响应式对象、ref 对象、数组、函数等。

1. ref 定义的数据
2. reactive 定义的数据
3. 函数返回一个值，即 Getter 函数
4. 包含上述内容的数组

## 基本语法

在正式使用 watch 监视之前，为了避免一脸懵逼的情况出现，请先系统性的学习一下 watch 的具体用法，不必担心。

watch 监视器是一个函数，这个函数需要几个参数：

```js:no-line-numbers
watch(source: Ref | (() => any), callback: WatchCallback, options?: WatchOptions): StopHandle
```

- source：要监听的源。

可以是一个 ref 对象，也可以是一个返回值的函数。如果是一个 ref 对象，那么监听函数会在 ref 对象的值发生变化时被调用。如果是一个函数，那么监听函数会在函数的返回值发生变化时被调用。

- callback：监听回调函数

callback 是一个监听回调函数，当源发生变化时会被调用。它有两个参数：newValue 和 oldValue，分别表示新值和旧值。

```js:no-line-numbers
const count = ref(0)

watch(count, (newValue, oldValue) => {
  console.log(`count 变化了：${oldValue} => ${newValue}`)
})
```

在上面的代码中，我们监听了一个 ref 对象 count，并在它发生变化时输出变化信息。

- options：可选的选项对象，用于配置监听行为。它包含以下属性：
    - immediate：是否在监听时立即执行一次回调函数，默认为 false。
    - deep：是否深度监听对象和数组的变化，默认为 false。
    - flush：何时执行回调函数，可选值为 'pre'、'post' 和 'sync'，默认为 'post'。
    - onTrack：监听被触发时的回调函数，用于追踪依赖关系。
    - onTrigger：监听回调函数被触发时的回调函数，用于追踪依赖关系。




例如，我们可以使用 immediate 选项来在监听时立即执行一次回调函数：

```js:no-line-numbers
const count = ref(0)

watch(
  count,
  (newValue, oldValue) => {
    console.log(`count 变化了：${oldValue} => ${newValue}`)
  },
  { immediate: true }
)
```

在上面的代码中，我们使用 immediate 选项来在监听之前立即先执行一次回调函数。

- StopHandle：一个取消函数

watch 函数的返回值是一个取消函数，用于停止当前的监听。例如：


```js:no-line-numbers
const count = ref(0)

const stopWatch = watch(count, (newValue, oldValue) => {
  console.log(`count 变化了：${oldValue} => ${newValue}`)
})

// 5 秒后停止监听
setTimeout(() => {
  stopWatch()
}, 5000)
```

在上面的代码中，我们在调用 watch 函数时，将返回的取消函数保存起来，并在 5 秒后调用它来停止监听。

::: tip 了解 Watch 监视器的基本语法，现在就来看几个案例吧，根据这几个案例，你可以更好的使用和掌握监视器。
:::

## 监视 ref 定义的数据

### 1. 基本数据类型

使用 watch 监视 ref 定义的基本类型的数据，直接写数据名即可，实际监视的是其 .value 值的变化。

```js:no-line-numbers
let sum = ref(0)

// 监视 ref 定义的 基本类型 数据
const stopWatch = watch(sum,(newValue,oldValue) => {
    console.log('sum变化了',newValue,oldValue)
    if(newValue >= 10){
        stopWatch()
    }
})
```

watch 监视器的返回值是一个停止函数，调用这个函数可以停止对应的监视器继续监听。

### 2. 对象数据类型

使用 watch 监视 ref 定义的对象类型的数据，直接写数据名即可，实际监视的是对象地址的的变化，如果想监视对象内部的数据，则要开启深度监视。

```js:no-line-numbers
let person = ref({
    name:'张三',
    age:18
})

// 监视 ref 定义的 对象类型 数据
watch(person, (newValue,oldValue) => {
        console.log('person变化了',newValue,oldValue)
    },{deep:true}
)
```
::: important 
* 若修改的是`ref`定义的对象中的属性，`newValue` 和 `oldValue` 都是新值，因为它们是同一个对象。

* 若修改整个`ref`定义的对象，`newValue` 是新值， `oldValue` 是旧值，因为不是同一个对象了。
:::

## 监视 reactive 定义的数据

使用 watch 监视 reactive 定义的对象类型的数据，默认开启深度监视，即监视对象内的每个属性。

```js:no-line-numbers
let person = reactive({
    name:'张三',
    age:18
})

watch(person,(newValue,oldValue)=>{
    console.log('person变化了',newValue,oldValue)
})
```

## 监视函数的返回值

监视一个函数的返回值时，函数的返回值可以是 ref 对象内的某一个属性，也可以是多个，故监视 ref 对象内的属性和监视多个对象，都是使用这种方式，写成函数式即可。


```js:no-line-numbers
// 数据
let person = reactive({
    name:'张三',
    age:18,
    car:{
        c1:'奔驰',
        c2:'宝马'
    }
})

// 监视某个属性
watch(()=>person.car,(newValue,oldValue)=>{
    console.log('person.car变化了',newValue,oldValue)
},{deep:true})

// 监视多个数据 
watch([()=>person.name,person.car],(newValue,oldValue)=>{
    console.log('person.name变化了',newValue,oldValue)
    console.log('person.car变化了',newValue,oldValue)
},{deep:true})
```


::: info 监视 ref 或 reactive 定义的 对象类型 数据中的某个属性
1. 若该属性值**不是**【对象类型】，需要写成函数形式。
2. 若该属性值是**依然**是【对象类型】，可直接编，也可写成函数，建议写成函数。

- 结论：监视的要是对象里的属性，那么最好写函数式。
- 注意点：若是对象监视的是地址值，需要关注对象内部，需要手动开启深度监视。
:::

## 监视包含上述数据的数组

监听包含数据的数组，可以使用 watch 函数的 deep 选项来深度监听数组变化。

```js:no-line-numbers
const items = ref([
    { name: 'Alice', age: 20 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 30 }
])

// 监听数组
watch(items,(newValue, oldValue) => {
        console.log('items 变化了：', newValue, oldValue)
    },{ deep: true }
)
```

在上面的代码中，我们使用 watch 函数来监听 items 数组的变化，并将 deep 选项设置为 true 来深度监听数组的变化。当 items 数组的某个元素发生变化时，监听函数会被调用。

需要注意的是，当使用 deep 选项时，监听函数的 newValue 和 oldValue 参数都是响应式的，也就是说，它们会随着数组的变化而变化。

## WatchEffect

`WatchEffect` 会立即运行一次函数体，同时响应式地追踪其依赖，并在依赖更改时重新执行该函数。`WatchEffect` 默认开启 `deep` 和 `immediate` 。由于` WatchEffect` 的使用方法很简单，和 `Watch` 类似，这里就不再对 `WatchEffect` 的语法使用做详细说明，参考下面的例子，相信你很快能够明白理解。

```js
let person = reactive({
    name:'张三',
    age:18,
    car:{
        c1:'奔驰',
        c2:'宝马'
    }
})

// 返回值是一个停止函数
const stopWatch = watchEffect(() => {
    console.log('person.name变化了',person.name)
    console.log('person.car变化了',person.car)
})

// 5 秒后停止监视
setTimeout(() => {
  stopWatch()
}, 5000)
```

::: important watch 对比 watchEffect 
1. 都能监听响应式数据的变化，不同的是监听数据变化的方式不同
2. `watch`：要明确指出监视的数据
3. `watchEffect`：不用明确指出监视的数据（函数中用到哪些属性，那就监视哪些属性）。
4. `watchEffect` 默认开启 deep 和 immediate
:::
