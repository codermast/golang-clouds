---
order : 4
---

# 4. 计算属性

虽然直接在模板中使用表达式方便，但是如果在模板中添加很多逻辑，会让模板变的臃肿且难维护，耦合度较高。有没有一种简单的方式来实现呢？答案是有的。

最先想到的就是借助 JavaScript 中的方法来实现代码的复用，也可以借此来实现属性的计算。

不错，这种方式的确可以实现我们的需求，但是如果页面上有多个地方使用到了计算后的属性，则该方法会被调用多次，尽管只需要计算一次即可。这样会导致大量的资源被浪费，从而影响性能。

为了解决这个问题，Vue 提供了计算属性的功能，和方法类似，但其会自动检测所计算的内容，如果没发生改变，则只计算一次，大大降低了服务器的资源消耗。

## 计算属性

computed() 方法期望接收一个 getter 函数，返回值为一个计算属性 ref。通过计算属性返回的 ref 数据和其他一般的 ref 的使用方法类似，可以通过 `.value` 来访问计算结果。

计算属性 ref 也会在模板中自动解包，因此在模板表达式中引用时无需添加 `.value`。

Vue 的计算属性会自动检测源数据的变化，从而更新计算结果。

```vue
<script setup>
import { reactive, computed } from 'vue'

const author = reactive({
  name: 'John Doe',
  books: [
    'Vue 2 - Advanced Guide',
    'Vue 3 - Basic Guide',
    'Vue 4 - The Mystery'
  ]
})

// 一个计算属性 ref
const publishedBooksMessage = computed(() => {
  return author.books.length > 0 ? 'Yes' : 'No'
})
</script>

<template>
  <p>Has published books:</p>
  <span>{{ publishedBooksMessage }}</span>
</template>
```

::: important method 方法和 computed 计算属性的区别？
computed 是基于它的依赖缓存，只有相关依赖发生改变时才会重新取值。而使用 methods ，在重新渲染的时候，函数总会重新调用执行。
:::

## Setter

计算属性默认只有 Getter，如果想使用 Setter 时可以自己提供。 

```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed({
  // getter
  get() {
    return firstName.value + ' ' + lastName.value
  },
  // setter
  set(newValue) {
    // 注意：我们这里使用的是解构赋值语法
    [firstName.value, lastName.value] = newValue.split(' ')
  }
})
</script>
```

现在当你再运行 fullName.value = 'John Doe' 时，setter 会被调用而 firstName 和 lastName 会随之更新。

::: warning 建议：尽可能不使用 Setter
:::
## 使用建议

### Getter 不应该有副作用

这里说的是==副作用==，而非==负作用==。计算属性的 Getter 应只做计算而没有任何其他作用，不能将其作为方法使用。一个计算属性的职责仅仅为计算和返回结果值。

### 尽量避免直接修改计算属性值

从计算属性返回的值是派生状态，可以把它看作是一个“临时快照”，源状态发生变化时，就会创建一个新的快照。更改快照是没有意义的，因此计算属性的返回值应该被视为只读的，并且永远不应该被更改——应该更新它所依赖的源状态以触发新的计算。


