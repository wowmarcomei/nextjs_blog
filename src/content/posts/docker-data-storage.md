---
title: 04-Docker数据存储
date: 2021-12-23 21:31:41
updated: 2021-12-23 21:31:41
description: Docker提供两种数据存储资源，一种是基于storage driver提供的镜像层和容器层，一种是基于data volume提供的持久化存储，本文简要描述这两种存储资源。
author: Laomei
pinned: false
categories: 
  - 技术笔记
tags: 
  - Docker
  - 存储
image: docker-logo.png
keywords: Docker,Docker基础,Docker存储
---
Docker提供两种数据存储资源，一种是基于storage driver提供的镜像层和容器层，一种是基于data volume提供的持久化存储。

![Docker_Storage](https://laomeinote.com/images/posts/Docker_Storage.png)

*图1 Docker存储框架*

图1 描述了Docker存储的整体框架，它主要支持两种类型存储，一种是**storage driver**管理的镜像层与容器层，对现有容器数据的读写；一种是**data volume**持久化存储，提供 `bind volume`和 `docker managed volume`存储。

## Storage driver

我们知道容器镜像是按照多个层级来分层叠加的，如下图2示意，容器包含最上层的读写层与下面多个只读镜像层，当需要修改容器数据的时候，会将只读层数据**COPY**至容器层进行修改，修改后数据保存在容器层，镜像层不变，即使用了linux的**Copy on write**特性。

![docker-container-images](https://laomeinote.com/images/posts/docker-container-images.png)

*图2 存储：镜像层与容器层-图片出自网络*

这种数据存储的生命周期当然会随着容器的销毁而结束，如果想在容器销毁后依然保存数据，该怎么办呢，答案是持久化存储-`data volume`。

## Data volume

**Data volume**提供两种类型存储。一种是 `bind volume`，另一种是 `docker managed volume`。前者简单理解就是将host主机目录共享给容器，容器注销了主机还在，所以数据当然不会丢失（除非主机故障或者数据丢失）。后者也是挂载主机目录到容器，不过是隐形挂载。举几个示例简单说明。

1. 使用 `-v [host path]:/[container path]`进行*bind volume*显示挂载

   - 在 `/root/test`目录下新建了一个 `test.txt`文档

   ```shell
   $sudo pwd
   /root/test
   $sudo ls
   test.txt
   ```

   - 使用显示挂载将其隐射给容器

   ```shell
   $sudo docker run -it -d -v /root/test:/usr/home/test alpine:x86-3.11.5 
   adc809b503883f6cd91f30343a721c12a915e7cdb79ed1197d677bc705c23160
   $sudo docker ps -a
   CONTAINER ID        IMAGE               COMMAND       CREATED          STATUS           PORTS          NAMES
   adc809b50388        alpine:x86-3.11.5   "/bin/sh"        14 seconds ago      Up 14 seconds          flamboyant_shirley
   $sudo docker exec -it adc809b50388 /bin/sh
   / #
   / # ls -l /usr/home/
   total 4
   drwxr-xr-x    2 root     root          4096 Nov 17 01:13 test
   / # ls -l /usr/home/test/
   total 0
   -rw-r--r--    1 root     root             0 Nov 17 01:13 test.txt
   / # cat /usr/home/test/test.txt
   / #
   ```

   上面示例中，首先基于 `alpine`镜像启动了一个容器，通过显示挂载 `-v /root/test:/usr/home/test`将主机的 `/root/test`目录挂载到容器的 `/usr/home/test`目录下，如果镜像中默认没有该目录，则会新建一个这样的目录；docker创建了一个随机名为 `flamboyant_shirley`, ID为 `adc809b50388`的容器。进入容器后查看目录确实已经存在，把容器关闭销毁后文件依然会在主机中。

   > 当然还可以将具体文件通过显示挂载给容器使用，比如通过指定参数-v：`-v /root/test/test.txt:/usr/home/test/test.txt`。
   >
2. 使用 `-v /[container path]`进行*docker managed volume*隐式挂载

   ```shell
   $sudo docker run -it --name myalpine -v /usr/local/lmtest  alpine:x86-3.11.5
   / #
   / # ls /usr/local/lmtest/
   / #
   ```

   这里基于 `alpine`镜像启动了一个名为 `myalpine`的容器，隐式挂载并没有指定具体主机目录，容器挂载了一个匿名卷 `/usr/local/lmtest`，初始镜像里并没有这个目录，docker会为其创建一个该目录。使用 `inspect`看看这个匿名卷。

   ```shell
   $sudo docker inspect myalpine
   ```

   也可基于容器ID来查看容器情况，会输出很多内容，重点查看存储相关内容如下：

   ```json
           "Mounts": [
               {
                   "Type": "volume",
                   "Name": "5778513ecf9bf04a44722082c8f5c91ee9f0e30922c17d71529009149c0dcc63",
                   "Source": "/var/lib/docker/volumes/5778513ecf9bf04a44722082c8f5c91ee9f0e30922c17d71529009149c0dcc63/_data",
                   "Destination": "/usr/local/lmtest",
                   "Driver": "local",
                   "Mode": "",
                   "RW": true,
                   "Propagation": ""
               }
   ```

   其中 `Source`部分就是Host主机所在目录，`Destination`部分是容器挂载匿名卷，尝试从Host主机上的挂载目录写一个文件，然后查看容器中的变化。

   - **在主机上添加文件**

     ```shell
     [root@ecs_lm_test ~]# cd /var/lib/docker/volumes/5778513ecf9bf04a44722082c8f5c91ee9f0e30922c17d71529009149c0dcc63/_data
     [root@ecs_lm_test _data]# ls
     [root@ecs_lm_test _data]# echo "hello,lm" > test.txt
     ```

     在主机共享目录里新增一个 `test.txt`文件，内容为 `hello,lm`。
   - **在容器中查看文件**

     ```shell
     / # cat /usr/local/lmtest/test.txt
     hello,lm
     / # 
     ```

     在容器中可见与主机是保持一致的。
   - **销毁容器后查看主机目录**

     ```shell
     [root@ecs_lm_test _data]# docker ps -a
     CONTAINER ID        IMAGE          COMMAND             CREATED             STATUS                  PORTS               NAMES
     236406585e9a        alpine:x86-3.11.5   "/bin/sh"           16 minutes ago      Exited (0) 16 seconds ago                       myalpine
     [root@ecs_lm_test _data]#
     [root@ecs_lm_test _data]#
     [root@ecs_lm_test _data]# docker rm myalpine
     myalpine
     [root@ecs_lm_test _data]# docker ps -a
     CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
     [root@ecs_lm_test_data]# cd /var/lib/docker/volumes/5778513ecf9bf04a44722082c8f5c91ee9f0e30922c17d71529009149c0dcc63/_data
     [root@ecs_lm_test_data]#
     [root@ecs_lm_test_data]#
     [root@ecs_lm_test_data]# ls
     test.txt
     [root@ecs_lm_test_data]#
     ```

     可见容器在销毁后文件还是存在于主机目录下。

---

全文完。
