---
title: 07-Centos上部署Harbor私有仓库
date: 2021-12-26 20:16:41
updated: 2021-12-26 20:16:41
categories: 
  - 技术笔记
description: 使用Harbor部署企业私有仓库，将一些核心镜像与软件与外部网络进行隔离与防护。
tags:
  - Docker
  - Harbor
  - K8s
series:
  - Docker
image: images/posts/harbor-logo.png  
meta_image: images/posts/harbor-logo.png  
keywords: harbor,docker,
---

Harbor是VMware公司开源的企业级的Docker Registry管理项目，它包括权限管理(RBAC)、LDAP、日志审核、管理界面、自我注册、镜像复制和中文支持等功能。使用Harbor可以部署企业自己的私有仓库，将一些核心镜像与软件与外部网络进行隔离与防护。

## 1. 环境准备

本次在腾讯云ECS服务器上部署Harbor私有仓库，系统与相关信息如下。

硬件信息：

| 资源 | 容量   | 描述               |
| ---- | ------ | ------------------ |
| CPU  | 2 核   | 4 CPU is preferred |
| 内存 | 2 GB   | 8GB is preferred   |
| 磁盘 | 50 GB  | 160GB is preferred |
| 网络 | 2 Mbps | 4Mbps is preferred |

软件信息：

| 软件           | 版本                | 描述                                                         |
| -------------- | ------------------- | ------------------------------------------------------------ |
| Centos         | CentOS 7.6 64位     | \                                                            |
| Docker         | 19.03.1             | 官方安装指南 [docker engine doc](https://docs.docker.com/engine/installation/) |
| Docker Compose | 1.22.0              | 官方安装指南 [docker compose doc](https://docs.docker.com/compose/install/) |
| Openssl        | OpenSSL 1.0.2k-fips | 为Harbor生成证书与密钥                                       |

> 注意：Harbor的所有服务组件都是在Docker中部署的，所以官方安装使用Docker-compose快速部署，因此需要安装Docker、Docker-compose。由于Harbor是基于Docker Registry V2版本，所以就要求Docker版本不小于1.10.0，Docker-compose版本不小于1.6.0。

## 2. 安装Docker与Docker-Compose

### 2.1 安装Docker

```bash
# yum install -y yum-utils device-mapper-persistent-data lvm2 epel-release
# yum-config-manager --add-repo  https://download.docker.com/linux/centos/docker-ce.repo
# yum install docker-ce
```

### 2.2 启动Docker

```bash
# systemctl enable docker
# systemctl start docker
# docker --version
```

### 2.3 安装Docker-Compose

```bash
# curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
# chmod +x /usr/local/bin/docker-compose
# docker-compose --version
```

### 2.4 配置证书与密钥

通过OpenSSL工具生成自签名的证书，后面将用于对请求进行校验。官方指南参考：[**Configuring Harbor with HTTPS Access**](https://github.com/goharbor/harbor/blob/master/docs/configure_https.md)

- 首先找到OpenSSL工具配置文件openssl.cnf，对于Centos,目录在/etc/pki/tls/中，编辑openssl.cnf,在[v3_ca]下面添加：subjectAltName = IP:域名|IP地址。如果没有域名填写IP即可。

  ```shell
  [ v3_ca ]
  subjectAltName = IP:193.112.221.230
  ```

- 通过OpenSSL生成证书与密钥

  ```bash
  [root@VM_95_141_centos data]# cd /data/ssl
  [root@VM_95_141_centos ssl]# openssl req -newkey rsa:4096 -nodes -sha256 -keyout ca.key -x509 -days 365 -out ca.crt
  [root@VM_95_141_centos ssl]# ls
  ca.crt  ca.key
  [root@VM_95_141_centos ssl]# cp ca.crt /etc/pki/ca-trust/source/anchors/
  [root@VM_95_141_centos ssl]# update-ca-trust enable
  [root@VM_95_141_centos ssl]# update-ca-trust extract
  ```

- 将生成的私有证书追加到系统的证书管理文件中。

  ```bash
  [root@VM_95_141_centos harbor]# cat ssl/ca.crt >> /etc/pki/tls/certs/ca-bundle.crt
  ```

- 重启docker, 该步骤一定不要省略，否则有可能加载私钥失败 

  ```bash
  [root@VM_95_141_centos harbor]#systemctl restart docker
  ```

## 3. 安装Harbor

```bash
# wget https://storage.googleapis.com/harbor-releases/release-1.8.0/harbor-offline-installer-v1.8.2.tgz
# tar xzvf harbor-offline-installer-v1.8.2.tgz
# cd harbor/
# ls 
```

下载离线安装包，解压后可以看到里面包含了如下文件：

```shell
[root@VM_95_141_centos harbor]# ls
harbor.v1.8.2.tar.gz  harbor.yml  install.sh  LICENSE  prepare
```

其中`harbor.v1.8.2.tar.gz`是软件包，`harbor.yml`是配置文件，`install.sh`是安装脚本，`prepare`是准备配置Harbor环境脚本。需要修改`harbor.yml`如下字段进行配置。

```yaml
hostname: 193.112.221.230

# http related config
http:
  # port for http, default is 80. If https enabled, this port will redirect to https port
  port: 80

# https related config
https:
  # https port for harbor, default is 443
  port: 443
  # The path of cert and key files for nginx
  certificate: /data/ssl/ca.crt
  private_key: /data/ssl/ca.key
```

然后先后执行`prepare`与`install.sh`进行配置与安装。

```bash
[root@VM_95_141_centos harbor]# ./prepare
prepare base dir is set to /root/harbor
Generated configuration file: /config/log/logrotate.conf
Generated configuration file: /config/nginx/nginx.conf
Generated configuration file: /config/core/env
Generated configuration file: /config/core/app.conf
Generated configuration file: /config/registry/config.yml
Generated configuration file: /config/registryctl/env
Generated configuration file: /config/db/env
Generated configuration file: /config/jobservice/env
Generated configuration file: /config/jobservice/config.yml
loaded secret from file: /secret/keys/secretkey
Generated configuration file: /compose_location/docker-compose.yml
Clean up the input dir
[root@VM_95_141_centos harbor]# ls -l
total 564668
drwxr-xr-x 3 root root      4096 Aug 24 23:09 common
-rw-r--r-- 1 root root      5377 Aug 24 23:09 docker-compose.yml
-rw-r--r-- 1 root root 578167000 Aug  8 15:51 harbor.v1.8.2.tar.gz
-rw-r--r-- 1 root root      4494 Aug 24 23:08 harbor.yml
-rwxr-xr-x 1 root root      5088 Aug  8 15:51 install.sh
-rw-r--r-- 1 root root     11347 Aug  8 15:51 LICENSE
-rwxr-xr-x 1 root root      1654 Aug  8 15:51 prepare
[root@VM_95_141_centos harbor]# vi docker-compose.yml
[root@VM_95_141_centos harbor]# ./install.sh
```

一般都会安装成功。

## 4. 操作Harbor

Harbor安装成功后，如下图示。我们可以对齐进行启动、停止、修改、上传镜像、下载镜像等操作。
![Harbor](https://laomeinote.com/images/posts/harbor.jpg)

### 4.1 查看Harbor

可以通过`docker ps`命令查询当前有哪些docker实例在运行。查询Harbor是否正常运行还可以查询docker-compose运行状态。需要进入Harbor所在目录，执行`docker-compose ps`。

```bash
[root@VM_95_141_centos harbor]# docker-compose ps
Name                 Command                  State                        Ports
-----------------------------------------------------------------------------------------
harbor-core         /harbor/start.sh                 Up (healthy)
harbor-db           /entrypoint.sh postgres          Up (healthy)   5432/tcp
harbor-jobservice   /harbor/start.sh                 Up
harbor-log          /bin/sh -c /usr/local/bin/ ...   Up (healthy)   127.0.0.1:1514->10514/tcp
harbor-portal       nginx -g daemon off;             Up (healthy)   80/tcp
nginx               nginx -g daemon off;             Up (healthy)   0.0.0.0:443->443/tcp, 0.0.0.0:80->80/tcp
redis               docker-entrypoint.sh redis ...   Up             6379/tcp
registry            /entrypoint.sh /etc/regist ...   Up (healthy)   5000/tcp
registryctl         /harbor/start.sh                 Up (healthy)
[root@VM_95_141_centos harbor]#
```

### 4.2 停止与重启Harbor

```bash
[root@VM_95_141_centos ~]# cd harbor
[root@VM_95_141_centos harbor]# ls
common  docker-compose.yml  harbor.v1.8.2.tar.gz  harbor.yml  install.sh  LICENSE  prepare
[root@VM_95_141_centos harbor]# docker-compose stop
Stopping nginx             ... done
Stopping harbor-portal     ... done
Stopping harbor-jobservice ... done
Stopping harbor-core       ... done
Stopping registryctl       ... done
Stopping redis             ... done
Stopping registry          ... done
Stopping harbor-db         ... done
Stopping harbor-log        ... done
[root@VM_95_141_centos harbor]# docker-compose start
Starting log         ... done
Starting registry    ... done
Starting registryctl ... done
Starting postgresql  ... done
Starting core        ... done
Starting portal      ... done
Starting redis       ... done
Starting jobservice  ... done
Starting proxy       ... done
[root@VM_95_141_centos harbor]#
```

如果需要修改Harbor的配置，可以先停止Harbor实例，更新 `harbor.yml`文件，再执行 `prepare` 脚本重新构建配置，最终启动Harbor实例:

```bash
[root@VM_95_141_centos ~]# docker-compose down -v
[root@VM_95_141_centos ~]# vim harbor.yml
[root@VM_95_141_centos ~]# prepare
[root@VM_95_141_centos ~]# docker-compose up -d
```

清除Harbor实例的时候会保持镜像数据与数据库在系统中：

```bash
[root@VM_95_141_centos ~]# docker-compose down -v
```

删除Harbor数据库与镜像数据 (如果需要重新安装):

```bash
[root@VM_95_141_centos ~]# rm -r /data/database
[root@VM_95_141_centos ~]# rm -r /data/registry
```

### 4.3 上传镜像到Harbor

查看当前镜像:`docker images`

```bash
[root@VM_95_141_centos harbor]# docker images
REPOSITORY                      TAG                       IMAGE ID      C   REATED      SIZE
goharbor/chartmuseum-photon     v0.9.0-v1.8.2             e72f3e685a37  2   weeks ago  130MB
goharbor/harbor-migrator        v1.8.2                    c11a64ae3a1e  2   weeks ago  361MB
goharbor/redis-photon           v1.8.2                    18036ee471bc  2   weeks ago  107MB
goharbor/clair-photon           v2.0.8-v1.8.2             68de68a40e66  2   weeks ago  164MB
goharbor/notary-server-photon   v0.6.1-v1.8.2             90cf28ef3a84  2   weeks ago  135MB
goharbor/notary-signer-photon   v0.6.1-v1.8.2             e9b49ea8ed32  2   weeks ago  132MB
goharbor/harbor-registryctl     v1.8.2                    ad798fd6e618  2   weeks ago  96.5MB
goharbor/registry-photon        v2.7.1-patch-2819-v1.8.2  081bfb3dc181  2   weeks ago  81.6MB
goharbor/nginx-photon           v1.8.2                    1592a48daeac  2   weeks ago  36.2MB
goharbor/harbor-log             v1.8.2                    42ad5ef672dd  2   weeks ago  81.8MB
goharbor/harbor-jobservice      v1.8.2                    623ed0095966  2   weeks ago  119MB
goharbor/harbor-core            v1.8.2                    03d6daab10c7  2   weeks ago  135MB
goharbor/harbor-portal          v1.8.2                    41e264a7980b  2   weeks ago  43.2MB
goharbor/harbor-db              v1.8.2                    927ecd68ee1f  2   weeks ago  144MB
goharbor/prepare                v1.8.2                    b0d62cc7683d  2   weeks ago  145MB
```

从Docker hub上下载一个最新的Nginx镜像:`docker pull nginx`：

```shell
[root@VM_95_141_centos harbor]# docker pull nginx
Using default tag: latest
latest: Pulling from library/nginx
1ab2bdfe9778: Pull complete
a17e64cfe253: Pull complete
e1288088c7a8: Pull complete
Digest: sha256:53ddb41e46de3d63376579acf46f9a41a8d7de33645db47a486de9769201fec9
Status: Downloaded newer image for nginx:latest
docker.io/library/nginx:latest
[root@VM_95_141_centos harbor]# docker images
REPOSITORY                    TAG                      IMAGE ID      CREATED     SIZE
nginx                         latest                   5a3221f0137b  8 days ago  126MB
goharbor/chartmuseum-photon   v0.9.0-v1.8.2            e72f3e685a37  2 weeks ago 130MB
goharbor/harbor-migrator      v1.8.2                   c11a64ae3a1e  2 weeks ago 361MB
goharbor/redis-photon         v1.8.2                   18036ee471bc  2 weeks ago 107MB
goharbor/clair-photon         v2.0.8-v1.8.2            68de68a40e66  2 weeks ago 164MB
goharbor/notary-server-photon v0.6.1-v1.8.2            90cf28ef3a84  2 weeks ago 135MB
goharbor/notary-signer-photon v0.6.1-v1.8.2            e9b49ea8ed32  2 weeks ago 132MB
goharbor/harbor-registryctl   v1.8.2                   ad798fd6e618  2 weeks ago 96.5MB
goharbor/registry-photon      v2.7.1-patch-2819-v1.8.2 081bfb3dc181  2 weeks ago 81.6MB
goharbor/nginx-photon         v1.8.2                   1592a48daeac  2 weeks ago 36.2MB
goharbor/harbor-log           v1.8.2                   42ad5ef672dd  2 weeks ago 81.8MB
goharbor/harbor-jobservice    v1.8.2                   623ed0095966  2 weeks ago 119MB
goharbor/harbor-core          v1.8.2                   03d6daab10c7  2 weeks ago 135MB
goharbor/harbor-portal        v1.8.2                   41e264a7980b  2 weeks ago 43.2MB
goharbor/harbor-db            v1.8.2                   927ecd68ee1f  2 weeks ago 144MB
goharbor/prepare              v1.8.2                   b0d62cc7683d  2 weeks ago 145MB
```

给Nginx镜像打上新标签，push到Harbor:

```shell
[root@VM_95_141_centos harbor]# docker tag nginx-mei:v1.0 193.112.221.230/library/nginx:latest
[root@VM_95_141_centos harbor]# docker login 193.112.221.230 -uadmin -pHarbor12345
WARNING! Using --password via the CLI is insecure. Use --password-stdin.
WARNING! Your password will be stored unencrypted in /root/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded
[root@VM_95_141_centos harbor]# docker push 193.112.221.230/library/nginx:latest
The push refers to repository [193.112.221.230/library/nginx]
12fdf55172df: Pushed
002a63507c1c: Pushed
1c95c77433e8: Pushed
latest: digest: sha256:099019968725f0fc12c4b69b289a347ae74cc56da0f0ef56e8eb8e0134fc7911 size: 948
[root@VM_95_141_centos harbor]#
```

### 4.4 从Harbor中下载镜像

从Harbor中下载刚上传的Nginx镜像，可以先删除本地的Nginx镜像。然后再从Harbor中Pull下来。

```shell
[root@VM_95_141_centos harbor]# docker rmi 193.112.221.230/library/nginx:latest
Untagged: 193.112.221.230/library/nginx:latest
Untagged: 193.112.221.230/library/nginx@sha256:099019968725f0fc12c4b69b289a347ae74cc56da0f0ef56e8eb8e0134fc7911
[root@VM_95_141_centos harbor]# docker images
REPOSITORY                     TAG                      IMAGE ID     CREATED     SIZE
wordpress                      latest                   fc03dc56d371 3 days ago  502MB
193.112.221.230/mei_test/nginx v1.0                     5a3221f0137b 9 days ago  126MB
nginx-mei                      v1.0                     5a3221f0137b 9 days ago  126MB
nginx                          latest                   5a3221f0137b 9 days ago  126MB
mysql                          5.6                      732765f8c7d2 11 days ago 257MB
goharbor/chartmuseum-photon    v0.9.0-v1.8.2            e72f3e685a37 2 weeks ago 130MB
goharbor/harbor-migrator       v1.8.2                   c11a64ae3a1e 2 weeks ago 361MB
goharbor/redis-photon          v1.8.2                   18036ee471bc 2 weeks ago 107MB
goharbor/clair-photon          v2.0.8-v1.8.2            68de68a40e66 2 weeks ago 164MB
goharbor/notary-server-photon  v0.6.1-v1.8.2            90cf28ef3a84 2 weeks ago 135MB
goharbor/notary-signer-photon  v0.6.1-v1.8.2            e9b49ea8ed32 2 weeks ago 132MB
goharbor/harbor-registryctl    v1.8.2                   ad798fd6e618 2 weeks ago 96.5MB
goharbor/registry-photon       v2.7.1-patch-2819-v1.8.2 081bfb3dc181 2 weeks ago 81.6MB
goharbor/nginx-photon          v1.8.2                   1592a48daeac 2 weeks ago 36.2MB
goharbor/harbor-log            v1.8.2                   42ad5ef672dd 2 weeks ago 81.8MB
goharbor/harbor-jobservice     v1.8.2                   623ed0095966 2 weeks ago 119MB
goharbor/harbor-core           v1.8.2                   03d6daab10c7 2 weeks ago 135MB
goharbor/harbor-portal         v1.8.2                   41e264a7980b 2 weeks ago 43.2MB
goharbor/harbor-db             v1.8.2                   927ecd68ee1f 2 weeks ago 144MB
goharbor/prepare               v1.8.2                   b0d62cc7683d 2 weeks ago 145MB
[root@VM_95_141_centos harbor]# docker pull 193.112.221.230/library/nginx:latest
latest: Pulling from library/nginx
Digest: sha256:099019968725f0fc12c4b69b289a347ae74cc56da0f0ef56e8eb8e0134fc7911
Status: Downloaded newer image for 193.112.221.230/library/nginx:latest
193.112.221.230/library/nginx:latest
[root@VM_95_141_centos harbor]# docker images
REPOSITORY                     TAG                      IMAGE ID      CREATED     SIZE
wordpress                      latest                   fc03dc56d371  3 days ago  502MB
193.112.221.230/library/nginx  latest                   5a3221f0137b  9 days ago  126MB
193.112.221.230/mei_test/nginx v1.0                     5a3221f0137b  9 days ago  126MB
nginx-mei                      v1.0                     5a3221f0137b  9 days ago  126MB
nginx                          latest                   5a3221f0137b  9 days ago  126MB
mysql                          5.6                      732765f8c7d2  11 days ago 257MB
goharbor/chartmuseum-photon    v0.9.0-v1.8.2            e72f3e685a37  2 weeks ago 130MB
goharbor/harbor-migrator       v1.8.2                   c11a64ae3a1e  2 weeks ago 361MB
goharbor/redis-photon          v1.8.2                   18036ee471bc  2 weeks ago 107MB
goharbor/clair-photon          v2.0.8-v1.8.2            68de68a40e66  2 weeks ago 164MB
goharbor/notary-server-photon  v0.6.1-v1.8.2            90cf28ef3a84  2 weeks ago 135MB
goharbor/notary-signer-photon  v0.6.1-v1.8.2            e9b49ea8ed32  2 weeks ago 132MB
goharbor/harbor-registryctl    v1.8.2                   ad798fd6e618  2 weeks ago 96.5MB
goharbor/registry-photon       v2.7.1-patch-2819-v1.8.2 081bfb3dc181  2 weeks ago 81.6MB
goharbor/nginx-photon          v1.8.2                   1592a48daeac  2 weeks ago 36.2MB
goharbor/harbor-log            v1.8.2                   42ad5ef672dd  2 weeks ago 81.8MB
goharbor/harbor-jobservice     v1.8.2                   623ed0095966  2 weeks ago 119MB
goharbor/harbor-core           v1.8.2                   03d6daab10c7  2 weeks ago 135MB
goharbor/harbor-portal         v1.8.2                   41e264a7980b  2 weeks ago 43.2MB
goharbor/harbor-db             v1.8.2                   927ecd68ee1f  2 weeks ago 144MB
goharbor/prepare               v1.8.2                   b0d62cc7683d  2 weeks ago 145MB
[root@VM_95_141_centos harbor]#
```

-----

全文完。
