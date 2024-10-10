---
title: 02-安装并启动Docker容器
date: 2021-12-21 21:01:41
updated: 2021-12-21 21:01:41
description: 本文简单总结如何安装、启动和启用一个Docker容器。
author: Laomei
pinned: false
categories: 
  - 技术笔记
tags: 
  - Docker
image: /images/docker-logo.png
keywords: Docker,Docker基础
---
## 1.安装Docker

国内直接访问Docker官网速度较慢，不过国内各大厂商都提供加速服务，我们到[华为云镜像站](https://mirrors.huaweicloud.com/home)加速。

### 1.1 Centos安装Docker

- 安装过**docker**，需要先删掉，之后再安装依赖:

```bash
sudo yum remove docker docker-common docker-selinux docker-engine
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

- 下载docker repo文件，并更换软件仓库地址为华为云地址

```bash
wget -O /etc/yum.repos.d/docker-ce.repo https://repo.huaweicloud.com/docker-ce/linux/centos/docker-ce.repo
sudo sed -i 's+download.docker.com+repo.huaweicloud.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo
```

- 更新yum源索引，并安装docker, CE为社区版本

```bash
sudo yum makecache fast
sudo yum install docker-ce
```

- 启动Docker。

```shell
sudo  systemctl enable docker  #设置Docker服务宿主机重启后自动启动
sudo  systemctl start docker    #开始运行docker服务
sudo  systemctl status docker  #查看docker状态
```

- 检查一下docker安装结果

```shell
sudo  docker info
sudo  docker -v
sudo  docker ps -a
```

### 1.2 配置Docker加速

华为云提供免费SWR仓库，可登陆后，拷贝加速地址（https://e2660ea6dc2b4a16a3ae382f8d227beb.mirror.swr.myhuaweicloud.com）。

在宿主机的 `/etc/docker`目录下添加配置文件 `daemon.json`

```shell
mkdir -p /etc/docker
cat >>  /etc/docker/daemon.json <<EOF
{
"registry-mirrors":["https://e2660ea6dc2b4a16a3ae382f8d227beb.mirror.swr.myhuaweicloud.com/"]
}
EOF
```

重启服务生效：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

当然，如果是在内网环境，使用的是自建私有仓库，可能使用的HTTP协议的仓库 `your-private-repo.com`，则修改对应配置为：

```bash
mkdir -p /etc/docker
cat >>  /etc/docker/daemon.json <<EOF
{
"insecure-registries": [
	"your-private-repo.com:80"
    ]
}
EOF
```

### 1.3 获取镜像

安装完成后可拉取对应镜像，如果不指定仓库地址，则动docker-hub下载，或者指定地址下载镜像。

```bash
docker pull nginx:alpine-perl #拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.6 #从aliyun下载pause镜像
docker images  #查看镜像
```

## 2.启动一个ubuntu容器

直接启动容器一般有两个途径：

- 新建一个容器后启动 `docker run`。
- 已有一个容器实例执行该容器 `docker exec`。

**新建启动一个容器**

在获取到镜像以后，使用 `docker run`基于镜像新建启动一个容器，拉取一个ubuntu镜像做下实验.

```shell
$sudo docker pull ubuntu:latest   #拉取ubuntu镜像
$sudo  docker images   #查询镜像
$sudo docker run -it  -v /test:/tmp ubuntu:latest  #以这个镜像为基础，启动一个容器
root@79258329dbf4:/#
```

可以看到命令行已经切入到ubuntu这个容器中了，**容器与host主机是共内核的，上层文件系统是独立的**，通过 `Cgroup`与 `Namespace`来隔离容器之间的进程与资源。

**参数说明**：

- `-i`: 就是 `–interactive` 的缩写，表示以交互模式运行容器，通常与 `-t` 同时使用；
- `-t`: 也可以使用 `–tty` 来进行引用，为容器重新分配一个伪输入终端，通常与 `-i` 同时使用；
- `-v`: 指定主机的目录到容器目录下，实现主机与容器目录共享，`-v /test:/tmp`表示将主机上的 `/test`目录挂到容器的 `/tmp`下；

> 有几个特别注意事项：
>
> - 所有**镜像**的格式一定是**[REPOSITORY]:[tag]**。
> - 当 `docker run`命令不加任何启动命令的时候，默认执行容器的**ENTRYPOINT**或**CMD**指令所指定的命令，该命令是在镜像制作的时候指定的，以建议在制作镜像的时候，为服务性镜像提供默认的启动命令。上面的 `docker run`没有添加启动命令是因为在ubuntu中已经默认以 `bash`命令启动了。
> - 正常启动应以命令启动如，`docker run -it ubuntu:latest /bin/bash`

**执行一个已有容器**

如果已有一些容器在运行，希望更改该容器或从中获取某些内容，那么使用 `docker exec`直接进入，其格式为 `docker exec [OPTIONS] CONTAINER COMMAND [ARG...]`。如：

```shell
sudo docker exec -it ubuntu_bash bash    #ubuntu_bash为docker name也可以是docker ID
```

其中的**[OPTIONS]**包括常见的：

- `-it`: 分配一个终端交互
- `-w`: 如，`-w /tmp` 说明要在哪个工作目录中运行命令

其中的**CONTAINER **可以是docker name也可以是docker ID，**COMMAND**就是容器中命令如上面示例中的 `bash`。

## 3.启动一个tomcat容器

### 3.1 拉取tomcat镜像

可使用login命令指定镜像仓库地址，输入账号登陆。

```shell
$ sudo docker login -u my-private-repo.com:80 #输入密码可登陆私有镜像仓地址
$ sudo docker pull my-private-repo.com/public/tomcat:x86-9.0.31 #拉取镜像到本地
$ sudo docker tag my-private-repo.com/public/tomcat:x86-9.0.31 mytomcat:1.0 #给镜像打tag
```

打 `tag`就像给文件重新命名一样，所有docker镜像必须要有 `tag`说明，`tag`一般为版本号。

### 3.2 运行tomcat容器

```shell
$ docker run -d -p 8080:8080 --name tomcat01 mytomcat:1.0
```

参数说明：

- `-d`: daemon - 以守护进程在后台运行
- `-p`: port - 前者是外部访问端口，后者是容器内映射端口
- `--name`: tomcat01是容器名称，**也可以不用指定名字**
- 最后一个参数是引用的具体镜像

### 3.3 进入已经运行的容器

```shell
[root@kweekshcgp-m19vr ~]# docker ps -a |grep tomcat
f1cf7db136a9        mytomcat:v1.0                                                    "catalina.sh run"        26 minutes ago      Up 26 minutes               0.0.0.0:8080->8080/tcp   tomcat01

[root@kweekshcgp-m19vr ~]# docker exec -it f1cf7db136a9 /bin/bash 
```

执行 `docker exec -it containerID /bin/bash`即可进入容器中，其中：

- `-i`: 表示以交互模式运行容器，通常与 -t 同时使用；
- `-t`: 为容器重新分配一个伪输入终端，通常与 -i 同时使用；

但在浏览器输入 `Host IP:8080`后发现无法tomcat故障，到容器中查看tomcat目录结构如下：

```shell
root@f1cf7db136a9:/usr/local/tomcat# ls -al
total 172
drwxr-xr-x 1 root root  4096 Feb 11  2020 .
drwxr-xr-x 1 root root  4096 Feb  7  2020 ..
-rw-r--r-- 1 root root 18982 Feb  5  2020 BUILDING.txt
-rw-r--r-- 1 root root  5409 Feb  5  2020 CONTRIBUTING.md
-rw-r--r-- 1 root root 57092 Feb  5  2020 LICENSE
-rw-r--r-- 1 root root  2333 Feb  5  2020 NOTICE
-rw-r--r-- 1 root root  3255 Feb  5  2020 README.md
-rw-r--r-- 1 root root  6898 Feb  5  2020 RELEASE-NOTES
-rw-r--r-- 1 root root 16262 Feb  5  2020 RUNNING.txt
drwxr-xr-x 2 root root  4096 Feb 11  2020 bin
drwxr-xr-x 1 root root  4096 Nov  4 11:25 conf
drwxr-xr-x 2 root root  4096 Feb 11  2020 include
drwxr-xr-x 2 root root  4096 Feb 11  2020 lib
drwxrwxrwx 1 root root  4096 Nov  4 11:25 logs
drwxr-xr-x 3 root root  4096 Feb 11  2020 native-jni-lib
drwxrwxrwx 2 root root  4096 Feb 11  2020 temp
drwxr-xr-x 1 root root  4096 Nov  4 11:30 webapps
drwxr-xr-x 7 root root  4096 Feb  5  2020 webapps.dist
drwxrwxrwx 1 root root  4096 Nov  4 11:30 work
root@f1cf7db136a9:/usr/local/tomcat#
```

其中，`webapps`目录为空，需要将文件从 `webapps.dist`中拷贝至 `webapps`目录。再次访问时便可成功。

也可以在主机上查看tomcat所占资源情况。

```shell
[root@kweekshcgp-m19vr ~]# docker stats

CONTAINER ID   NAME CPU %    MEM USAGE / LIMIT    MEM %    NET I/O       BLOCK I/O    PIDS
f1cf7db136a9   tomcat01      143.2MiB / 7.27GiB   1.92%    14.4kB/213kB  0B / 0B      39
```

如果想限制该容器的资源，怎么办？

```shell
[root@kweekshcgp-m19vr ~]# docker run -d -p 8081:8080 --name tomcat02 -m 100M mytomcat:1.0
```

这是重新拉起一个tomcat02的容器，通过参数 `-m 100M`来限制内存大小

### 3.4 打包成新镜像

可以将允许修改了配置的容器重新打包，并上传到仓库，在其他机器上无需再做配置，直接拉取即可随时运行。

```shell
$sudo docker commit -a="author" -m="comments" 容器ID imagename:tag
```

- `-a`: 作者信息
- `-m`: 备注信息
- `容器ID`: 将需要打包的容器ID
- `imagename:tag`: 镜像命名与打tag标签

```shell
[root@kweekshcgp-m19vr ~]# docker commit -a="meixuhong" -m="add webapps app" f1cf7db136a9  mytomcat:2.0
sha256:6d9f5f6c07cab801745da0b56583733be1eca9fb285a4caad5c2d8d1fc3c88e3
[root@kweekshcgp-m19vr ~]# docker images|grep tomcat
mytomcat   									2.0      6d9f5f6c07ca      57 seconds ago    652MB
mytomcat   						            v1.0     71445a67f6b6      21 months ago     647MB
my-privare-repo.com:80/public/tomcat    9.0.31   71445a67f6b6      21 months ago     647MB
```

### 3.5 导出导入镜像

内网无法跟互联网互通，如果在内网无法获取到想要的镜像，可现在互联网将镜像导出并下载至本地，再将其导入到内网环境。

外网导出镜像：

```bash
$ docker save mytomcat:v.10 -o mytomcat.tar
```

内网导入镜像：

```bash
$docker load < mytomcat.tar
```

### 3.6 重启、退出与删除容器

退出容器直接使用 `exit`即可从交互命令中退出，删除容器前需要先停止，使用 `stop`或者 `rm`

```shell
root@f1cf7db136a9:/usr/local/tomcat#exit #退出容器

[root@kweekshcgp-m19vr ~]# docker stop 容器ID    #停止容器
[root@kweekshcgp-m19vr ~]# docker start 容器ID   #再次启动容器
[root@kweekshcgp-m19vr ~]# docker rm -f 容器ID   #停止容器
[root@kweekshcgp-m19vr ~]# docker rmi 镜像名称    #删除镜像
[root@kweekshcgp-m19vr ~]# docker container prune #删除所有停止的容器
```

---

文章首发公众号：，欢迎关注，不定期更新。

---

全文完。
