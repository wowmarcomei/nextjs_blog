---
title: 03-Dockerfile基础
date: 2021-12-22 21:31:41
updated: 2021-12-22 21:31:41
description: 本文简单总结Dockerfile的基本规则，并通过样例演示如何使用dockerfile制作镜像。
author: Laomei
pinned: false
categories: 
  - 技术笔记
tags: 
  - Docker
  - Dockefile
image: docker-logo.png
keywords: Docker,Docker基础,Dockerfile,华为云,
---
Dockerfile是用来干什么的？答案是制作镜像。那么了解Dockerfile之前，首先需要理解几个简单概念。

## Dockerfile基础概念

1. 制作镜像命令： `docker build`
2. `build context`: 镜像编译上下文，其实就是**docker客户端所在的目录**。[Docker基本架构与原理](www.meixuhong.com/docker-basic-concept.html)提到Docker 是一个典型的 C/S 架构的应用，分为 Docker 客户端（即平时敲的 docker 命令）和 Docker 服务端（dockerd 守护进程），Docker 客户端通过 REST API 和服务端进行交互，docker 客户端每发送一条指令，底层都会转化成 REST API 调用的形式发送给服务端，服务端处理客户端发送的请求并给出响应。

一个典型的使用 `docker build`的构建镜像的流程大概分为如下三步:

- 1）执行 `docker build -t <imageName:imageTag> .` ；注意命令中有一个点号**`(.)`**在linux中表示当前目录，就是这次 `build`的上下文 `build context`；
- 2）Docker 客户端会将构建命令后面指定的路径 `(.)`下的所有文件打包成一个 `tar` 包，发送给 Docker 服务端;
- 3）Docker 服务端收到客户端发送的 `tar` 包进行解压，根据 Dockerfile 里面的指令进行镜像的分层构建。

以一个简单的例子说明理解 `build context`，首先创建一个简单的 demo 工程，工程结构如下：

```shell
helloworld-app
├── Dockerfile
└── docker
    ├── app-1.0.jar
    ├── hello-world.txt
    └── html
        └── index.html
```

Dockerfile 内容：

```dockerfile
FROM busybox
COPY hello-world.txt .
COPY html/index.html .
```

测试一下进入 helloworld-app 目录进行镜像构建，以 `docker` 目录为 `build context`上下文构建一个镜像：

```shell
$ docker build -f Dockerfile -t hello-app:1.0 docker 
```

这里使用了docker build构建了一个镜像hello-app, tag是1.0，上下文是后面的参数docker，即helloworld-app目录下的docker目录，docker build执行的内容是Dockerfile定义的三个指令：FROM，COPY，COPY。当然这个镜像只是从busybox里复制了两个文件，实际意义不大。下面来看看详细的Dockerfile指令。

## Dockerfile的基本指令

关于这些基本指令先来看一则网上的示意图，将大部分指令形象化描述出来了。

![dockerfile-layer](dockerfile-layer.png)

*图 1 Dockerfile指令 - 图片来自网络*

- *FROM*指令：指定base镜像，Dockerfile中第一条指令必须是 `FROM`指令，其格式如下：

  ```dockerfile
  FROM image
  FROM image:tag
  ```
- *MAINTAINER*指令：指明作者信息，格式为:

  ```dockerfile
  MAINTAINER user_name user_email
  ```
- *WORKDIR*指令：为后续的 `RUN`、`CMD`、`ENTRYPOINT` 、`ADD`和 `COPY`指令指定工作目录，这个目录必须是在容器中提前创建好的。`docker build` 构建镜像过程中的，每一个 *RUN* 命令都是新建的一层，只有通过 *WORKDIR* 创建的目录才会一直存在。格式如下：

  ```dockerfile
  WORKDIR /path/to/workdir
  ```

  可以使用多个 `WORKDIR` 指令，后续命令中的参数如果是相对路径，则基于之前命令指定路径，如：

  ```dockerfile
  WORKDIR /a
  WORKDIR b
  WORKDIR c
  RUN pwd

  #RUN的结果是/a/b/c
  ```

  这里有多个*WORKDIR*指令，第一个路径 `/a`是绝对路径，第二个和第三个是 `b`和 `c`是相对路径，需要组合为 `/a/b/c`为最终路径。
- *COPY*指令：从上下文目录中复制文件或者目录到容器里指定路径，上下文目录就是指上面提到的 `build context`。格式为:

  ```dockerfile
  COPY src desc  #若desc不存在则自动创建；
  ```
- *ADD*指令：*ADD* 指令和 *COPY* 的使用格类似（同样需求下，官方推荐使用 *COPY*），功能也类似，不同之处在于源文件格式为**tar,gzip,bzip2,xz**时，会自动复制并解压到**目标路径**。

  ```dockerfile
  ADD <src> <dest>  #src是上下文build context的相对路径，也可以是一个url
  ```
- *ENV*指令：设置环境变量，后续在*Dockerfile*的指令中，可以使用这个环境变量，**并在容器运行时保持**。格式如下：

  ```dockerfile
  ENV <key> <value>
  ENV <key1>=<value1> <key2>=<value2>...
  ```

  以下示例设置 `NODE_VERSION = 7.2.0` ， 后续在*Dockerfile*的指令中可以通过 `$NODE_VERSION` 引用：

  ```dockerfile
  ENV NODE_VERSION 7.2.0

  RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
    && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc"
  ```
- *EXPOSE*指令：指定容器中的进程会监听某个端口，Docker可以将该端口暴露出来。在运行时使用随机端口映射时，也就是 `docker run -P` 时，会自动随机映射 *EXPOSE* 的端口。*EXPOSE*格式如下：

  ```dockerfile
  EXPOSE <端口1> [<端口2>...]
  ```
- *VOLUME*指令：定义匿名数据卷，在*HOST宿主机*的目录 `/var/lib/docker/volumes`下自动生成一个随机目录。我们知道不应该在容器存储层内进行数据写入操作，所有写操作都应该使用卷，那么匿名卷是什么意思？即

  - 在进行数据卷挂载的时候不指定**HOST宿主机**的数据卷目录，使用 `docker run -v`命令后直接跟上*容器内数据卷所在的路径*。
  - 或者在Dockerfile中定义了匿名卷以后，用户即使没有使用 `docker run -v`指定卷也会在容器内指定一个目录，挂载在*HOST宿主机*的目录 `/var/lib/docker/volumes`下面，可以通过 `docker inspect (这是容器id)`查看容器挂载的卷的具体目录。

  *VOLUME*指令格式如下：

  ```dockerfile
  VOLUME ["<路径1>", "<路径2>"...]
  VOLUME <路径>
  ```

  在启动容器 `docker run` 的时候，我们可以通过 `-v` 参数**修改**挂载点。

  > 参考文章1： [Dockerfile Volume指令与docker -v的区别](https://blog.csdn.net/fangford/article/details/88873104)
  >
  > 参考文章2：[Docker 匿名卷（匿名挂载）和命名卷（具名挂载)](https://blog.csdn.net/qq_43655835/article/details/106478731)
  >
- *RUN*指令：每条 `RUN` 指令将在当前的镜像基础上执行指定的命令，**并创建一个新的镜像层，一层新的数据到镜像中**。格式如下：

  ```dockerfile
  RUN command                                                         ##格式1，调用shell终端通过/bin/sh来执行
  RUN ["executable","param1","param2".....]              ##格式2，使用docker exec命令执行，推荐这种方式
  ```
- *CMD*指令：**为启动的容器指定默认要运行的程序，就是startup启动程序，程序运行结束时容器生命周期也就结束了**。*CMD*指令指定的程序会被 `docker run `命令行参数中指定要运行的程序**所覆盖**。每个Dockerfile只能有一个*CMD*指令，如果有多个则只有最后一个被启动执行。其格式为：

  ```dockerfile
  CMD command param1 param2                 ##格式1，调用shell终端通过/bin/sh来执行
  CMD ["executable","param1","param2"]    ##格式2，使用docker exec命令执行，推荐这种方式
  ```
- *ENTRYPOINT*指令：跟*CMD*指令类似，**也是容器startup启动程序**，并且不会被 `docker run` 提供的参数覆盖，每个Dockerfile只能有一个*ENTRYPOINT*，当指定多个时，只有最后一个生效。格式如下：

  ```dockerfile
  ENTRYPOINT command param1 param2                    ##格式1，调用shell终端通过/bin/sh来执行
  ENTRYPOINT ["executable", "param1", "param2"]    ##格式2，使用docker exec命令执行，推荐这种方式
  ```

  > 上面看起来*RUN*、*CMD*、*ENTRYPOINT*都一样，它们有什么区别呢？直接抛结论：
  >
  > 1. *RUN*命令执行命令，并创建新的镜像层，通常用于安装软件包
  > 2. *CMD*命令设置的是**容器startup后执行的命令及其参数**，但*CMD*设置的命令能够被 `docker run`命令后面的命令行参数**替换**，如*ubuntu, busybox, debian*镜像在其dockerfile最后一句中都会指定启动命令为 `/bin/bash`
  > 3. *ENTRYPOINT*配置容器startup时的执行命令（**不会被忽略，一定会被执行**，即使运行 `docker run`时指定了其他命令）
  >

  列了这么多，举个栗子实操一下基于Dockerfile写一个Nginx镜像并启动一个nginx容器吧。

## 基于Dockerfile定制Nginx镜像

- 设置工作目录

  ```shell
  $ sudo mkdir -p /root/lab
  $ sudo cd /root/lab
  ```
- 在工作目录下新建一个Dockerfile文件 `Dockerfile_nginx`

  ```shell
  $ sudo vim Dockerfile_nginx
  ```

  内容如下：

  ```dockerfile
  # 设置Base镜像为dockerhub最新nginx镜像
  FROM nginx

  # 设置容器的工作目录
  WORKDIR "/tmp"

  # 表示对外期望暴露的端口
  EXPOSE 80

  # 设置容器的匿名卷 /usr/local/tmp
  VOLUME /usr/local/tmp

  # 启动nginx，指定参数 -g `daemon off`将nginx设置为前台运行
  CMD ["nginx", "-g", "daemon off;"]
  ```

  > **使用nginx -g daemon off启动nginx容器的原因：**
  >
  > 1. **背景**：Docker 容器启动时，默认会把容器内部第一个进程，也就是pid=1的程序，作为docker容器是否正在运行的依据，如果 docker 容器pid=1的进程挂了，那么docker容器便会直接退出。
  > 2. **原因**：nginx默认是以后台模式启动的，Docker未执行自定义的CMD之前，nginx的pid是1，执行到CMD之后，nginx就在后台运行，bash或sh脚本的pid变成了1。所以一旦执行完自定义CMD，nginx容器也就退出了。为了保持nginx的容器不退出，应该关闭nginx后台运行
  >

  编译Dockerfile生成一个镜像：

  ```shell
  $sudo docker build -f Dockerfile_nginx -t lm/nginx:v1.0 .
  ```

  参数说明：

  - `-f`：输入Dockerfile文件
  - `-t`：给镜像打*TAG*
  - `.`：指定 `build context`上下文为当前目录

  开始启动容器：

  ```shell
  $sudo docker run -it -d -p 80:80 lm/nginx:v1.0
  0f6ec4c8ac83edde6fbfc6288905af29f7ed2312a08d850fab53c299e7840fda
  ```

  参数说明：

  - `it`: 给容器分配一个shell终端进行交互，以tty进行；
  - `-d`: 后台守护这个容器进程
  - `-p`: 第一个80是主机端口，第二个80是容器端口，将主机端口隐射至容器端口

  启动后访问主机IP，可直接通过 `curl`命令访问，也可通过浏览器访问，由于http协议默认端口为80所以无需加端口号访问，如下图示。

  ![day1-docker-nginx](day1-docker-nginx.png)

  上面是通过 `nginx`镜像直接生成的，一般应用中 `nginx`大多是当成中间件的，base镜像选择的一般是操作系统。

  ## 导出导入Docker镜像

  在内网中因为基于安全考虑，正式仓库中的镜像比较少，如果在内网从因为无法获取软件包而制作镜像失败，一个可行的解决方案是在外网中制作好镜像，将镜像打包后拷贝至内网中，再导入镜像，最终PUSH上传到自己的私有仓库。

  **导出镜像**：


  ```shell
  $sudo docker save [镜像:tag]  >  [镜像包名]
  ```

  **导入镜像**：

  ```shell
  $sudo docker load <  [镜像包名]   
  ```

  > 此举可以做一些曲线救国之事，比如我们在内网无法获取的一些软件安装包，可以在外网打包下载下来再加载进来，然后push到自己的私有仓库。后续需要使用的时候，就直接拉取即可。
  >

---

全文完。
