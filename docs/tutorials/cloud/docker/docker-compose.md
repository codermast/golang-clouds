---
order : 10
---
# Docker - Compose

在部署应用时，常常使用到不止一个容器，那么在部署容器的时候就需要一个一个进行部署，这样的部署过程也相对来说比较繁琐复杂，也容易出问题，那么有没有一种更为简单的方法呢？

## Compose简介

![](/assets/cloud/docker/docker-compose/2024-01-26-22-29-01.png =200x200)


Compose 是用于定义和运行多容器 Docker 应用程序的工具。Docker Compose 通过一个单独的 docker-compose.yml 模板文件（YAML格式）来定义一组相关联的应用容器，帮助我们实现多个相关联的 Docker 容器的快速部署。


Compose 使用的三个步骤：

- 使用 Dockerfile 定义应用程序的环境。

- 使用 docker-compose.yml 定义构成应用程序的服务，这样它们可以在隔离环境中一起运行。

- 最后，执行 docker-compose up 命令来启动并运行整个应用程序。



## Compose安装

- Linux：执行以下指令即可安装（最新版替换V后面的版本号即可）

```sh
$ sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

- MacOS：Mac 的 Docker 桌面版和 Docker Toolbox 已经包括 Compose 和其他 Docker 应用程序，因此 Mac 用户不需要单独安装 Compose。

- Windows：Windows 的 Docker 桌面版和 Docker Toolbox 已经包括 Compose 和其他 Docker 应用程序，因此 Windows 用户不需要单独安装 Compose。

## Compose样例

```yml
version : "3.7"
services:
  app:
    image: node:18-alpine
    command: sh -c "yarn install && yarn run dev"
    ports:
      - 127.0.0.1:3000:3000
    working_dir: /app
    volumes:
      - ./:/app
  web:
    image: nginx
    ports:
      - "80:80"
  db:
    image: postgres
    environment:
      POSTGRES_DB: example
```
在该样例中我们定义了 3 个服务，app、web 和 db。
- `app` 服务使用到了 `node:18-alpine` 会执行一条 Shell 指令，并且进行了端口映射，配置了工作目录，配置了卷。
- `web` 服务使用到了 `nginx` 镜像，并将容器的 80 端口，映射到宿主机的 80 端口。
- `db` 服务使用了 `postgres` 镜像，并设置了一个环境变量。

Docker Compose 的配置本质上就是把部署 Docker 容器的过程集中管理起来，方便用户部署和后续维护。核心就是将 Docker 命令转换为 Yaml 文件。


## Compose基本命令

使用Docker-Compose的常见命令包括：

- `docker-compose up`：启动并运行整个应用。
- `docker-compose down`：停止并移除容器、网络、卷和镜像。
- `docker-compose build`：构建或重建服务。
- `docker-compose logs`：查看服务的日志输出。
这些命令为 `Docker-Compose` 的日常使用提供了基础。

## Compose文件结构

1. 理解docker-compose.yml

docker-compose.yml文件是Docker-Compose项目的核心，它使用YAML格式来描述和配置您的应用服务。这个文件不仅定义了所使用的服务，还包括了这些服务的配置，例如使用的Docker镜像、端口映射、依赖关系、环境变量等。

2. 基本组件

- 服务（Services）：服务代表一个容器。在docker-compose.yml中，您可以定义一个或多个服务，每个服务可以使用不同的镜像。
- 网络（Networks）：Docker-Compose允许您定义和使用自己的网络。
- 卷（Volumes）：卷用于数据持久化和共享数据。您可以定义一个卷，并将其挂载到一个或多个容器中。

3. 文件示例

下面是一个更复杂的docker-compose.yml文件示例，其中包含了网络和卷的定义：
```yml
version: '3'

services:
  web:
    image: nginx
    ports:
      - "80:80"
    networks:
      - webnet
  db:
    image: postgres
    environment:
      POSTGRES_DB: example
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - webnet

volumes:
  db-data:

networks:
  webnet:
```

在这个示例中，我们创建了一个名为webnet的网络，并且让web和db服务都连接到这个网络。我们还定义了一个卷db-data用于持久化数据库的数据。

4. 配置项解析

- 环境变量（Environment）：可以设置环境变量，为服务配置必要的参数。
- 端口映射（Ports）：将容器内的端口映射到宿主机的端口，以便外部访问。
- 依赖关系（Depends On）：可以指定服务启动的顺序。


## Compose高级应用

1. 网络配置

在Docker-Compose中，您可以自定义网络来实现服务间的隔离或通信。例如，您可以创建一个只供数据库和后端服务使用的内部网络。以下是一个网络配置的例子：
```yml
version: '3'
services:
  web:
    image: nginx
    networks:
      - front-end
  api:
    image: my-api
    networks:
      - front-end
      - back-end
  db:
    image: postgres
    networks:
      - back-end

networks:
  front-end:
  back-end:
```

在这个配置中，web和api服务都连接到front-end网络，而db和api服务则连接到back-end网络。

2. 卷挂载和数据持久化
卷用于数据持久化和服务间共享数据。在Docker-Compose中，您可以定义卷并将其挂载到服务所需的位置。例如：
```yml
version: '3'
services:
  db:
    image: postgres
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

在这个例子中，我们定义了一个名为db-data的卷，并将其挂载到数据库服务的数据目录。

3. 环境变量和配置文件
Docker-Compose允许您通过环境变量或.env文件来配置服务。这使得您的配置更加灵活，也更适合不同的环境。例如：
```yml
version: '3'
services:
  web:
    image: nginx
    ports:
      - "${WEB_PORT}:80"
```

您可以在.env文件中定义WEB_PORT变量，Docker-Compose会在运行时使用该值。

4. 扩展和复用配置

通过使用extends关键字，您可以在多个项目中重用配置。这样，您可以为不同的环境（如开发、测试和生产）保持共同的基础配置，同时覆盖特定环境的设置。

5. 使用Docker-Compose进行部署

虽然Docker-Compose主要用于开发环境，但它也可以用于生产环境的部署。通过适当的配置和环境准备，Docker-Compose可以作为一个简单的部署工具。
