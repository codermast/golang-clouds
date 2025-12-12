/**
 * 技术教程导航配置
 * 包含：编程语言、后端框架、数据库、前端等核心技术栈
 * 使用分组方式组织，便于扩展
 */

export const tutorialsNavbar = {
    text: "技术教程",
    icon: "material-symbols:book",
    children: [
        {
            text: "编程语言",
            children: [
                {
                    text: "Java",
                    icon: "logos:java",
                    link: "/tutorials/java/",
                },
                {
                    text: "Golang",
                    icon: "logos:go",
                    link: "/tutorials/golang/",
                },
            ]
        },
        {
            text: "后端框架",
            children: [
                {
                    text: "Spring系列",
                    icon: "simple-icons:spring",
                    link: "/tutorials/spring-series/",
                },
            ]
        },
        {
            text: "数据存储",
            children: [
                {
                    text: "数据库",
                    icon: "mdi:database",
                    link: "/tutorials/database/",
                },
                {
                    text: "消息队列",
                    icon: "carbon:ibm-mq",
                    link: "/tutorials/mq/",
                },
            ]
        },
        {
            text: "云原生",
            icon: "carbon:cloud-services",
            link: "/tutorials/cloud/",
        },
        {
            text: "前端开发",
            icon: "akar-icons:html-fill",
            link: "/tutorials/front-end/",
        },
        {
            text: "开发基础",
            children: [
                {
                    text: "开发工具",
                    icon: "fluent:window-dev-tools-16-filled",
                    link: "/tutorials/dev-tools/",
                },
                {
                    text: "开发思想",
                    icon: "mdi:design",
                    link: "/tutorials/dev-idea/",
                },
            ]
        },
    ]
};
