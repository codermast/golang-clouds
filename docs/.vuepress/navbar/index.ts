import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
    {
        text: "技术教程",
        icon: "material-symbols:book",
        children: [
            { text: "Java", link: "/java/", icon: "logos:java" },
            { text: "Golang", link: "/tutorials/golang/", icon: "logos:go" },
            { text: "Spring系列", link: "/spring-series/", icon: "simple-icons:spring" },
            { text: "数据库", link: "/database/", icon: "mdi:sql-query" },
            { text: "消息队列", link: "/tutorials/mq/", icon: "mdi:message-queue" },
            { text: "云原生", link: "/tutorials/cloud/", icon: "mdi:cloud" },
            { text: "前端", link: "/front-end/", icon: "akar-icons:html-fill" },
            { text: "开发工具", link: "/dev-tools/", icon: "fluent:window-dev-tools-16-filled" },
            { text: "设计模式", link: "/dev-idea/design-patterns/", icon: "mdi:design" },
        ]
    },
    {
        text: "面试宝典",
        icon: "icon-park-solid:tips",
        prefix: "/interview/",
        children: [
            { text: "Golang", link: "golang", icon: "logos:go" },
            { text: "Java", link: "java", icon: "logos:java" },
            { text: "MySQL", link: "mysql", icon: "simple-icons:mysql" },
            { text: "Redis", link: "redis", icon: "cib:redis" },
            { text: "RocketMQ", link: "rocketmq", icon: "simple-icons:apacherocketmq" },
        ]
    },
    {
        text: "计算机基础",
        prefix: "/computer-basic/",
        icon: "mingcute:computer-fill",
        children: [
            { text: "数据结构", link: "datastruct/", icon: "cryptocurrency:data" },
            { text: "计算机网络", link: "computer-network/", icon: "ph:network-bold" },
            { text: "操作系统", link: "operating-system/", icon: "icon-park-solid:coordinate-system" },
            { text: "计算机组成原理", link: "computer-composition/", icon: "el:cog" },
        ]
    },
    {
        text: "项目实战",
        icon: "ph:planet-bold",
        link: "/project/",
    },
]);
