import { hopeTheme } from "vuepress-theme-hope";
import { zhNavbar } from "./navbar";
import { zhSidebar } from "./sidebar";

export default hopeTheme({

  breadcrumb: false,

  // ico图标
  favicon: "/favicon.ico",
  // 顶部导航栏
  navbar: zhNavbar,

  // 侧边栏
  sidebar: zhSidebar,

  // 页脚
  footer: '<a href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow">陕ICP备20010345号-5</a>',

  // 全局显示页脚
  displayFooter: true,

  metaLocales: {
    editLink: "编辑此页",
  },

  // 发布站点链接
  hostname: "https://www.golangclouds.com",

  // 作者信息
  author: {
    name: "友人",
    url: "https://www.codermast.com",
    email: "codermast@163.com",
  },

  // 配置深色模式
  darkmode: "switch",

  logo: "/logo.png",

  // 文档仓库地址
  repo: "https://github.com/codermast/golang-clouds",

  // 文档在仓库中的目录
  docsDir: "docs",

  // 文档存放的分值
  docsBranch: "main",

  // markdown 增强（根级别配置）
  markdown: {
    align: true,
    attrs: true,
    chartjs: true,
    codeTabs: true,
    component: true,
    demo: true,
    echarts: true,
    figure: true,
    flowchart: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    math: true,
    mermaid: true,
    playground: {
      presets: ["ts", "vue"],
    },
    revealjs: {
      plugins: ["highlight", "math", "search", "notes", "zoom"],
      themes: [
        "auto",
        "beige",
        "black",
        "blood",
        "league",
        "moon",
        "night",
        "serif",
        "simple",
        "sky",
        "solarized",
        "white",
      ],
    },
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended",
            };
        },
      },
    ],
    sub: true,
    sup: true,
    tabs: true,
    vPre: true,
    vuePlayground: true,
  },

  plugins: {
    // 图标资源
    icon: {
      assets: "iconify",
    },

    // 搜索插件
    slimsearch: {
      indexContent: true,
    },

    components: {
      components: [
        "ArtPlayer",
        "Badge",
        "BiliBili",
        "CodePen",
        "PDF",
        "Share",
        "SiteInfo",
        "StackBlitz",
        "VPBanner",
        "VPCard",
        "VidStack",
      ],
    },

    // 配置评论框
    comment: {
      provider: "Giscus",
      repo: "codermast/codermast-notes",
      repoId: "R_kgDOIetRIw",
      category: "Announcements",
      categoryId: "DIC_kwDOIetRI84CVg1f",
    },
  },
}, {
  custom: true,
});
