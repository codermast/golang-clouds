import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
    {
        text: "技术教程",
        icon: "material-symbols:book",
        children: [
            { text: "Java", link: "/tutorials/java/", icon: "logos:java" },
            { text: "Golang", link: "/tutorials/golang/", icon: "logos:go" },
            { text: "Spring系列", link: "/tutorials/spring-series/", icon: "logos:spring-icon" },
            { text: "数据库", link: "/tutorials/database/", icon: "mdi:database" },
            { text: "消息队列", link: "/tutorials/mq/", icon: "simple-icons:apachekafka" },
            { text: "云原生", link: "/tutorials/cloud/", icon: "mdi:cloud" },
            { text: "前端", link: "/tutorials/front-end/", icon: "logos:html-5" },
            { text: "开发工具", link: "/tutorials/dev-tools/", icon: "fluent:window-dev-tools-16-filled" },
            { text: "设计模式", link: "/tutorials/dev-idea/", icon: "mdi:design" },
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
        text: "项目实战",
        icon: "ph:planet-bold",
        link: "/project/",
    },
]);
