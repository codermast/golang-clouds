import theme from "./theme.js";

import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";

export default defineUserConfig({
  base: "/",
  lang: "zh-CN",
  locales: {
    "/": {
      lang: "zh-CN",
      title: "Golang 全栈指南",
      description: "Golang 全栈指南 - 专注 Golang 云原生技术栈，涵盖 Go 语言、Docker、Kubernetes、微服务等核心技术！",
    },
  },
  title: "Golang 全栈指南",
  description: "Golang 全栈指南 - 专注 Golang 云原生技术栈，涵盖 Go 语言、Docker、Kubernetes、微服务等核心技术！",
  head: [
    ["meta", { name: "keywords", content: "Golang,Go语言,云原生,Docker,Kubernetes,微服务,MySQL,Redis,gRPC" }],
    ["meta", { name: "baidu-site-verification", content: "codeva-GfqTd2Cs0w" }],
    ["script", {}, `<script charset="UTF-8" id="LA_COLLECT" src="//sdk.51.la/js-sdk-pro.min.js"></script><script>LA.init({id:"JWxCHZQ6MtnZPBkF",ck:"JWxCHZQ6MtnZPBkF"})</script>`]
  ],
  theme,

  bundler: viteBundler({
    viteOptions: {},
    vuePluginOptions: {},
  }),
});