---
title: 给Centos 7制作依赖包与本地仓库
date: 2021-12-12 10:03:41
updated: 2021-12-12 10:03:41
description: 公司内网安全区无法通互联网，如何把外部软件与对应的依赖包一起打包下来导入到内网呢？本文将简述方案。
categories: 
  - 技术笔记

tags: 
  - Linux
  - Centos

keywords: 依赖包，本地仓库，repository,linux,centos,

image: /images/Linux_logo.png
---

公司内网安全区无法通互联网，原本可以通过yum命令直接下载安装的软件包没法用了，那有没有一种快捷的方法把这些软件包与对应的依赖包一起打包下来导入到内网呢？本文将简述方案。

## 1. 软件与依赖包打包

在可以联网的服务器上按需安装好软件包，然后将其打包。

举个栗子，我需要安装docker和kubelet这些软件包，在可联网的服务器上安装：

```bash
$sudo yum install -y yum-utils device-mapper-persistent-data lvm2 #安装依赖包
$sudo yum install -y docker-ce-20.10.8 docker-ce-cli-20.10.8 containerd.io #安装docker包
$sudo yum install -y kubelet-1.22.4  kubectl-1.22.4 kubeadm-1.22.4 #安装kubelet，kubectl，kubeadm包与对应的依赖包
```

通过`repotrack`将它们打包，如果没有这个安装包，可以先安装。

```bash
$sudo yum install -y yum-utils #安装
$sudo yum install -y repotrack
```

然后通过`repotrack [packages]`进行打包，。

```bash
repotrack yum-utils device-mapper-persistent-data lvm2 docker-ce-20.10.8 docker-ce-cli-20.10.8 containerd.io kubelet-1.22.4  kubectl-1.22.4 kubeadm-1.22.4
```

> 注意：**kubeadm依赖kubectl,kubectl依赖kubelet，所以安装包的先后顺序不要弄错，否则版本依赖包会有问题**。

这时就会生成对应的软件依赖包了，可将这些软件包压缩下载。

```bash
mkdir -p centos7.6_packages
mv *.rpm centos7.6_packages
tar cjvf centos7.6_packages.tar.bz2 centos7.6_packages
```

最后将*centos7.6_packages.tar.bz2*下载下来。



> 如果发现版本依赖不匹配，也可以用yumdownloader下载指定包
>
> yum -y install yum-utils
>
> yumdownloader --resolve --destdir=/tmp docker-ce-cli-18.9.0
>
> 参数说明：
>
> - --destdir：指定 rpm 包下载目录（不指定时，默认为当前目录）
> - --resolve：下载依赖的 rpm 包。

## 2.在内网服务器建立本地源

首先将上面的*centos7.6_packages.tar.bz2*下载到内网服务器，将所有*rpm*包解压至`/mnt/packages`目录下。

```bash
tar xjvf centos7.6_packages.tar.bz2 /mnt/
mkdir -p /mnt/packages
mv /mnt/*.rpm /mnt/packages
```

通过`createrepo`在内网服务器建立本地源，如果没有`createrepo`的话，先安装一个。

```bash
yum install -y createrepo   #假设内网可以安装这个createrepo软件
```

如果内网里，这个软件都安装不了的话，那就下载好rpm文件手动安装了。

```bash
rpm -ivh createrepo.rpm
```

然后创建本地源目录，即有一堆rpm软件包的那个目录。

```bash
createrepo /mnt/packages
```

然后添加配置文件。

```bash
[root@master] # cat >> /etc/yum.repos.d/local.repo << EOF
[local]
name=local.repo
baseurl=file:///mnt/Packages
enabled=1
gpgcheck=0
EOF
```

> - [] 中括号中的是repository id，唯一，用来标识不同仓库
> - name 仓库名称，自定义
> - baseurl 仓库地址，设置为本地`/mnt/Packages`目录
> - enable 是否启用该仓库，默认为1表示启用
> - gpgcheck 是否验证从该仓库获得程序包的合法性，1为验证，0为不验证

添加完成后刷新源缓存。

```bash
[root@master] #yum clean all
[root@master] #yum makecache fast
```

然后就可以开心的安装已经在本地的源了。

--------

全文完。
