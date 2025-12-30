import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
    {
        text: "Golang指南",
        prefix: "/golang/",
        icon: "grommet-icons:golang",
        children: [
            {
                text: "语法核心",
                icon: "ri:coreos-fill",
                children: [
                    { text: "核心基础", link: "core/", icon: "solar:crown-star-bold" },
                    { text: "进阶特性", link: "advanced/", icon: "ic:outline-sync-lock" },
                    { text: "工程化", link: "engineering/", icon: "carbon:build-tool" },
                    { text: "分布式", link: "distributed/", icon: "zondicons:network" },
                ]
            },
            {
                text: "Web开发",
                icon: "mdi:web",
                children: [
                    { text: "Gin框架", link: "web/gin/", icon: "simple-icons:lightning" },
                    { text: "GORM", link: "web/gorm/", icon: "mdi:database" },
                ]
            },
            {
                text: "社区生态",
                icon: "raphael:opensource",
                children: [
                    { text: "标准库", link: "stdlib/", icon: "majesticons:library" },
                ]
            }
        ]
    },
    {
        text: "云原生",
        icon: "carbon:cloud-services",
        children: [
            {
                text: "数据库",
                prefix: "/tutorials/database/",
                children: [
                    { text: "MySQL", link: "mysql/", icon: "tabler:brand-mysql" },
                    { text: "Redis", link: "redis/", icon: "cib:redis" },
                ]
            },
            {
                text: "消息队列",
                prefix: "/tutorials/mq/",
                children: [
                    { text: "Kafka", link: "kafka/", icon: "logos:kafka-icon" },
                    { text: "RabbitMQ", link: "rabbitmq/", icon: "simple-icons:rabbitmq" },
                    { text: "RocketMQ", link: "rocketmq/", icon: "simple-icons:apacherocketmq" },
                ]
            },
            {
                text: "系统与容器",
                prefix: "/tutorials/cloud/",
                children: [
                    { text: "Docker", link: "docker/", icon: "mdi:docker" },
                    { text: "Kubernetes", link: "kubernetes/", icon: "mdi:kubernetes" },
                    { text: "Linux", link: "linux/", icon: "mingcute:linux-fill" },
                ]
            },
        ]
    },
    {
        text: "面试宝典",
        icon: "icon-park-solid:tips",
        prefix: "/interview/",
        children: [
            { text: "Golang", link: "golang", icon: "logos:go" },
            { text: "MySQL", link: "mysql", icon: "simple-icons:mysql" },
            { text: "Redis", link: "redis", icon: "cib:redis" },
            { text: "RocketMQ", link: "rocketmq", icon: "simple-icons:apacherocketmq" },
            { text: "Kubernetes", link: "k8s", icon: "mdi:kubernetes" },
        ]
    },
    {
        text: "项目实战",
        icon: "ant-design:project-filled",
        link: "/project/",
    },
]);
