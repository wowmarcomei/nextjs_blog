---
title: 01-Docker基本架构与原理
date: 2021-12-20 20:01:41
updated: 2021-12-20 20:01:41
description: 容器=cgroup + namespace + rootfs + 容器引擎，其中docker就是其中一个容器引擎。
author: Laomei
pinned: false
categories: 
  - 技术笔记
tags: 
  - Docker
image: docker-logo.png
keywords: Docker,Docker基础
---
虽然Kubernetes从1.20版本中不再使用Docker作为容器引擎，但docker还是被广泛使用的，实际上新的Kubernetes容器引擎containerd的使用方式与docker大致相同。先继续了解下Docker基础架构与原理吧。

先来简单描述一下容器与虚拟化的技术差别：虚拟化是将物理（硬件）资源如CPU、内存、存储、网络进行抽象转换为虚拟资源的技术，而容器技术其实是基于OS（操作系统软件）层面的虚拟化。理解一下这个公式：

> **容器 = cgroup + namespace + rootfs + 容器引擎**

## 1. Cgroup

 基于Linux Cgroup来限制和隔离**一组进程**对系统资源的使用。

## 2. Namespace

 基于Namespace来隔离资源。

## 3. rootfs

 文件系统，每个Linux启动时都会挂载一个可读写的根文件系统，不同的是容器在启动后挂载的是一个空的只读的文件系统，在此基础上再挂载一个读写的文件系统，如下图示。

   ![container-rootfs](container-rootfs.png)

## 4. 容器引擎

 Docker实际是一个*C/S*架构程序，如下图示容器引擎主要有三部分组成：

   ![docker-engine-3components](docker-engine-3components.png)

- Client：docker CLI，就是命令行客户端
- REST API：客户端与服务端以API进行通信
- Server：是一个docker daemon守护进程，用于创建个管理docker对象，如容器镜像、容器、网络、存储卷。

   正常情况下，docker server以守护进程运行在主机上，client发出命令，通过REST API传递给server，server接收到指令开开始执行相应的动作，如启动容器，挂载卷等。容器引擎管理着容器实例 `container`，镜像 `image`，存储挂载卷 `data volumes`和网络 `network`，当然镜像 `image`跟仓库 `registry`又是强相关的，即我们是通过仓库来保存镜像的，通过 `pull/push`来下拉和推送保存镜像。

   以官网的一张示意图说明这几者之间的关系。

   ![docker-engine-explaination](docker-engine-explaination.png)

> 图中的①②③④，就是上文讲到的docker引擎内容，①是client客户端，执行docker命令，②是通过Rest API在③docker daemon守护进程server进行通信，执行最终操作，基于⑤镜像来创建/运行④容器。⑥是镜像仓库Registry，可通过Pull/Push来获取与推送镜像。
