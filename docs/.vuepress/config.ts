import theme from "./theme.js";

import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";

export default defineUserConfig({
  base: "/",
  lang: "zh-CN",
  locales: {
    "/": {
      lang: "zh-CN",
      title: "友人的编程指南",
      description: "CoderMast编程指南，深入学习编程的技术指南，早日成为编码大师！",
    },
  },
  title: "友人的编程指南",
  description: "CoderMast编程指南，深入学习编程的技术指南，早日成为编码大师！。",
  head: [
    ["meta", { name: "keywords", content: "CoderMast,编程指南,Java编程,MySQL,Redis,Spring,MyBatis" }],
    ["meta", { name: "baidu-site-verification", content: "codeva-GfqTd2Cs0w" }],
    ["script", {}, `<script charset="UTF-8" id="LA_COLLECT" src="//sdk.51.la/js-sdk-pro.min.js"></script><script>LA.init({id:"JWxCHZQ6MtnZPBkF",ck:"JWxCHZQ6MtnZPBkF"})</script>`]
  ],
  theme,

  bundler: viteBundler({
    viteOptions: {},
    vuePluginOptions: {},
  }),
});