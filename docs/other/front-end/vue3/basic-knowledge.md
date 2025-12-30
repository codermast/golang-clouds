---
order : 2
---
# 2. 基础知识

## 目录结构
```
my-vue3-project/
├── public/           # 静态资源文件夹，其中的文件会直接复制到构建输出目录中，无需经过编译处理
│   ├── favicon.ico    # 网站图标
│   └── index.html    # 应用程序入口HTML文件，Vue应用将挂载于此文件中的特定元素上
├── src/
│   ├── assets/        # 静态资源目录，包含图片、字体等未经过webpack编译的文件，可使用import导入并在构建时进行处理
│   ├── components/    # 组件目录，按照功能或类别划分存放单文件组件（.vue文件）
│   │   ├── Common/     # 公共组件目录
│   │   ├── Layout/     # 布局组件目录
│   │   └── ...         # 其他分类组件目录
│   ├── directives/    # 自定义指令目录，存放Vue自定义指令实现
│   ├── hooks/         # Vue Composition API 的自定义 Hooks 目录，用于组织和复用可组合的逻辑单元
│   ├── layouts/       # 应用布局相关的组件存放处，例如通用页面布局组件
│   │   ├── AppLayout.vue 
│   │   └── ...         # 其他布局相关页面组件
│   ├── pages/          # 页面组件目录，根据功能模块划分不同页面组件
│   │   ├── Home/       # 主页或首页相关页面组件
│   │   │   ├── Index.vue
│   │   │   └── ...
│   │   ├── User/       # 用户管理相关的页面组件
│   │   │   ├── Profile.vue
│   │   │   ├── Settings.vue
│   │   │   └── ...
│   │   ├── Product/    # 产品管理相关的页面组件
│   │   │   ├── List.vue
│   │   │   ├── Detail.vue
│   │   │   └── ...
│   │   └── ...         # 其他功能模块的页面组件目录
│   ├── plugins/       # Vue 插件配置目录，存放全局注册的插件及其配置
│   ├── router/        # 路由配置目录，主要包含index.js路由文件，用于配置应用程序的路由规则
│   ├── store/         # Vuex 状态管理目录，用于集中管理组件状态和数据流
│   ├── styles/        # 样式文件目录，包括全局样式、主题样式等
│   ├── utils/         # 工具函数和类库目录，存放项目中常用的工具函数、辅助类等
│   ├── App.vue        # 应用程序根组件，整个应用的入口点，通常包含路由视图和其他全局共享组件
│   ├── main.ts        # 应用程序入口脚本，用于初始化Vue实例、引入并配置路由、状态管理等核心模块
│   └── shims-vue.d.ts # TypeScript 类型声明文件，为Vue相关API提供类型支持
├── tests/             # 测试相关文件目录，存放单元测试、集成测试等代码
├── .env.*             # 环境变量配置文件，根据不同环境如开发、生产等设置不同的环境变量
├── .eslintrc.js       # Eslint 配置文件，用于定义项目的代码风格规范和错误检查规则
├── .gitignore         # Git 忽略文件，列出不需要添加到版本控制的文件或目录
├── package-lock.json  #  npm 包管理器中用于锁定项目依赖版本的文件
├── package.json       # npm 包配置文件，包括项目依赖、脚本命令、项目信息等元数据
├── vite.config.ts     # Vite 构建工具的配置文件，用于定制Vite的构建行为（如果使用Vite构建系统）
├── README.md          # 项目文档和说明文件，介绍项目结构、启动方式及注意事项等
├── tsconfig.json          # TypeScript 项目的核心配置文件，用于指定编译选项、包含的源文件、排除的文件等信息
├── tsconfig.node.json          # 针对 Node.js 应用程序进行更细粒度的 TypeScript 编译设置
├── .prettierrc        # Prettier 代码格式化配置文件，定义代码格式化规则
├── .ls-lint.yml       # Linting 规则配置文件，例如针对Less预处理器的代码风格检查规则
└── changelog.md       # 更新日志文件，记录项目的版本迭代和更新内容
```

## 命名规范

- Vue 组件：大驼峰命名法。`MyVueComponent`
- 变量：小驼峰命名法。`myVueVariable`
- 方法：小驼峰命名法。`getUserInfo()`
- 目录：小写英文即可。`component/common/header/`
- 常量：全为大写英文的蛇形命名法。`SUCCESS_CODE`

## Vue 组件组成

每个 Vue 组件由 3 个部分组成：模板区`<template></template>`、JS/TS 脚本区`<script></script>`、CSS 样式区`<style></style>`，其中模板区是必须存在的，JS 脚本区和 CSS 样式区是可选的。

- 模板区`<template></template>`：主要编写渲染在页面上的一些 HTML
- JS/TS 脚本区`<script></script>`：主要编写一些在当前组件中使用到的一些脚本
- CSS 样式区`<style></style>`：主要编写一些在当前组件中使用到的样式表

::: important 下面是一个简单的 Vue 组件实例
```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <button @click="count++">You clicked me {{ count }} times.</button>
</template>
```
:::

## API风格

这里的 API 风格是指 Vue 的两种编写风格，一种是 组合式，一种是选项式。

- 选项式 Options API ：其内部的数据、方法、计算属性是分散的，新增和修改时，就需要分别修改data、method、computed，不便于维护和更新。

::: center
![](/assets/front-end/vue3/basic-knowledge/options1.gif =x400) ![](/assets/front-end/vue3/basic-knowledge/options2.gif =x400) 
:::

- 组合式 Composition API：可以采用函数的方式，实现代码的复用，且逻辑清晰，便于维护和更新。

::: center
![](/assets/front-end/vue3/basic-knowledge/composition1.gif =x300) ![](/assets/front-end/vue3/basic-knowledge/composition2.gif =x300)
:::
> 说明：以上四张动图原创作者：大帅老猿

::: important 两种 API 风格的选择和使用，主要是依靠 Setup 来进行的，具体请参考下面 Setup 小节的内容。
:::

## Setup

Vue 3 中的 Setup 有两种，一种是 setup 函数，一种是 script 中的 setup。

- setup 函数：一般是 Vue2 中的选项式 API 使用，使用方法如下所示：

```vue
<script>
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)

    // 返回值会暴露给模板和其他的选项式 API 钩子
    return {
      count
    }
  },

  mounted() {
    console.log(this.count) // 0
  }
}
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

- script 中的 setup：Vue3 中为了简化setup函数，一般是组合式 API 使用，是目前比较主流的一种方式。

```vue
<script>
import { ref } from 'vue'

const count = ref(0)

// 计算属性
const mounted =  computed(() => {
    return count.value + 1  // 1
})
</script>

<template>
    <p>计算后的值：{{ mounted }}</p>
    <button @click="count++">{{ count }}</button>
</template>
```

::: tip 小结
对比上面两种风格的 API，能够明显的看到，组合式 API 的优势，所以在 Vue 3 的开发中，推荐使用这种用法。

本系列的后续教程也均以组合式 API 的风格来进行说明。
:::

