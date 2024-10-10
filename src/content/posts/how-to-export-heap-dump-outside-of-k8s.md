---
title: 15-在K8s中导出Heap dump信息
date: 2022-04-13 20:19:21
updated: 2022-04-13 20:19:21
categories: 
  - 技术笔记
description: Kubernetes集群管理员在提供集群给开发者使用，出于安全考虑一般节点不会开放给开发者直接使用，导致开发者的heap dump数据无法直接获取到，本文描述这种场景的解决方案。
tags: 
  - K8s
  - Kubernetes
  - CloudNative
image: /images/kubernetes.png
keywords: kubernetes,k8s,heap dump,java,jvm
---
> 场景：应用基于Kubernetes部署，应用开发者受限登陆集群节点下载文件。当Java（或者其他）应用出现OOM异常需要生成heap dump二进制文件。

Kubernetes部署负载时，如果不指定POD的重启策略（**RestartPolicy**），则默认为 `Always`策略。也即意味着，如果这个容器主进程出现故障，Kubelet会自动将这个容器重启。

遗憾的是，容器故障时，由于Kubelet会很快自动重启容器，所以我们没法人工进入做java的heap dump这个动作。那是不是就没法获取到应用的heap dump信息呢？当然不是，需要注意的是，容器重启但是POD并没有重启，也就是说POD被调度的节点没有变化，也就意味着，我们可以将容器生成的文件直接存放到节点中，集群管理员可以协助去下载heap dump文件。

## 1\. 集群管理员获取heap dump文件

按照上面的思路，对于有整个集群权限的管理员而且，可以获取到节点中的任何数据，在容器退出前导出heap dump即可：

**Deployment.yaml**

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: your-app
spec:
  replicas: 1
  template:
    metadata:
      labels:
        test: heapdump
    spec:
      containers:
      - name: a-jvm-container
        image: openjdk:11.0.1-jdk-slim-sid
        lifecycle:
          preStop:
            exec:
              command: ["java", "-XX:+HeapDumpOnOutOfMemoryError", "-XX:HeapDumpPath=/dumps/oom.bin", "-jar", "yourapp.jar"]
        volumeMounts:
        - name: heap-dumps
          mountPath: /dumps
      volumes:
      - name: heap-dumps
        emptyDir: {}
```

这里，设置lifecycle的preStop阶段执行heap dump动作，并将其写入容器的 `/dumps`目录，主机上有一个目录会被kubelet自动挂载到容器的 `dumps`目录下面，这样的话，即使容器重启了，POD没有重启，该目录依然存在，集群管理员依然可以到主机上下载该文件。

但这显然不是一个好的运维方式，如果应用开发者能够自助获取到文件就好了。其实，应用可以启一个Sidecar容器来做采集就好了，没有权限登陆节点，那我们把应用采集到OBS对象存储里就好了呀。

## 2\. 应用开发者获取heap dump

顺着上面的思路，可以准备如下：

1. 准备一个镜像，里面包含脚本能够上传文件到OBS存储。
2. 业务部署的Deployment里加上一个Sidecar，使用上面的镜像，采集应用的文件到OBS存储。

这里，我们使用的是华为云OBS存储，基于python sdk写一个s3存储客户端，编写Dockerfile制作镜像。

### 2.1 步骤1：制作镜像

**dockerfile**

```dockerfile
# 设置Base镜像为alpine镜像,或者其他镜像
ARG baseImage="kweecr03.xxx.xxx.com:80/public/alpine:x86-3.11.5"
FROM $baseImage

#安装inotify-tools和python3
RUN set -eux && sed -i "s/dl-cdn.alpinelinux.org/mirrors.tools.xxx.com/g" /etc/apk/repositories \
    && apk update \
    && apk add --no-cache bash \
    && apk add --update --no-cache python3 \
    && ln -sf python3 /usr/bin/python \
    && apk add --no-cache inotify-tools

#加入OBS客户端到/usr/local
ADD s3_client.py /usr/local

#设置后台主进程为bash
ENTRYPOINT ["/bin/bash"]
```

在这个镜像中装了inotify和python，其中python用于跑OBS客户端脚本，inotify用于检测jump dump文件变化。将OBS客户端到 `easy_s3_2.1.py`复制到与dockerfile所在目录，build镜像：

```bash
docker build -f dockerfile -t myalpine:v1.1 .
```

### 2.2 步骤2：应用定义sidecar容器

**Deployment.yaml**

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: your-app
spec:
  replicas: 1
  template:
    metadata:
      labels:
        test: heapdump
    spec:
      containers:
      - name: a-jvm-container
        image: openjdk:11.0.1-jdk-slim-sid
        command: ["java", "-XX:+HeapDumpOnOutOfMemoryError", "-XX:HeapDumpPath=/dumps/oom.bin", "-jar", "yourapp.jar"]
        volumeMounts:
        - name: heap-dumps
          mountPath: /dumps
      - name: sidecar-container
        image: myalpine:v1.1   #使用刚才制作的镜像
        command: ["/bin/sh", "-c"]
        args:
        - |
          inotifywait -m /dumps -e close_write | while read path action file; python s3_client.py -s s3-hc-dgg.xxx.xxx.com put /lmbucket/oom.bin -f /dumps/oom.bin ; done;
        volumeMounts:
        - name: heap-dumps
          mountPath: /dumps
      volumes:
      - name: heap-dumps
        emptyDir: {}
```

在上面的这段Deployment的定义中，比*管理员获取heap dump文件* 方案多了一个sidecar容器，其他内容完全一致，如下：

```yaml
      - name: sidecar-container
        image: myalpine:v1.1   #使用刚才制作的镜像
        command: ["/bin/sh", "-c"]
        args:
        - |
          inotifywait -m /dumps -e close_write | while read path action file; python s3_client.py -s s3-hc-dgg.xxx.xxx.com put /lmbucket/oom.bin -f /dumps/oom.bin ; done;
```

其中 `inotifywait`这个sidecar容器中的应用，主要是检测 `/dumps`目录，检测内容包括 `read / path / action 和file`, 检测方法是 `close_write` ，即当 `dumps/`目录下的文件关闭了不再写入，就将文件通过s3客户端上传到sc桶 `s3-hc-dgg.xxx.xxx.com`中的 `/lmbucket`目录下并命名为 `oom.bin`。

这样，应用开发者即可自助到s3中下载heap dump文件了。

当然，这种方法适用于下载任何自己应用生成的文件。

> 另外，这里使用s3_client.py的时候是将obs桶访问的AK/SK写死在程序里了，建议使用secret对象写，能在一定程度上加密。

参考：

https://danlebrero.com/2018/11/20/how-to-do-java-jvm-heapdump-in-kubernetes/

https://github.com/aws-samples/kubernetes-for-java-developers/issues/12

---

全文完。
