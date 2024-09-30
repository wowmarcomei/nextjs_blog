---
title: 12-快速删除集群所有节点上镜像
date: 2022-04-05 20:19:21
updated: 2022-04-05 20:19:21
categories: 
  - 技术笔记
description: 大规模集群上每个节点都有大量镜像需要定期维护，如果通过Kubelet GC机制垃圾回收镜像的话，可能会导致原本还在用的镜像被误删除。所以需要能指定镜像删除，同时不必登陆到每个节点上手动删除镜像。
tags: 
  - K8s
  - Kubernetes
  - CloudNative
image: kubernetes.png
keywords: kubernetes,k8s,images,delete,删除镜像,kubelet GC,daemonset,job

---

## 1. 背景

大规模集群上每个节点都有大量镜像需要定期维护，如果通过Kubelet GC机制垃圾回收镜像的话，可能会导致原本还在用的镜像被误删除。所以需要能指定镜像删除，同时不必登陆到每个节点上手动删除镜像。

## 2. 原理

核心思路是，在节点中的POD中获取特权，通过Docker on Docker方案，链接到主机docker socket上：`/var/run/docker.sock`，然后可通过Docker客户端操作主机，如：`docker rmi`命令强制删除主机镜像。如果使用`docker rmi`则要求POD使用的镜像中安装有docker，稍微麻烦。

其实docker客户端多种多样，其本质都是操作HTTP Restful API，还可以使用python、go等docker客户端，不过最简单是使用`curl`命令行调用HTTP Restful API了。

```bash
curl --unix-socket /var/run/docker.sock -X DELETE http://localhost/[docker Version]/images/[imageID]
```

详细描述参考：https://docs.docker.com/engine/api/sdk/

## 3. 方案 1 -Daemonset

- 通过Daemonset来实现，在每个节点上都生成一个POD，在POD中调用上面的curl命令，删除主机镜像
- 缺点：需要手动清除Daemonset

**daemonset.yaml**

```yaml
kind: DaemonSet
apiVersion: apps/v1
metadata:
  name: nginx-ds
  labels:
    k8s-app: nginx
spec:
  selector:
    matchLabels:
      k8s-app: nginx
  template:
    metadata:
      labels:
        k8s-app: nginx
    spec:
      containers:
      - name: nginx
        env:
        - name: DELETE_IMAGE_NAME
          value: "kweecr03.xxx.xxx.xxx:80/public/euleros:x86-V200R007C00SPC521B060"
        image: kweecr03.xxx.xxx.xxx:80/public/nginx:x86-1.20.1
        command: ['sh', '-c', 'curl --unix-socket /var/run/docker.sock -X DELETE http://localhost/v1.39/images/$(DELETE_IMAGE_NAME)?force=true']
        securityContext:
          privileged: true
        volumeMounts:
        - mountPath: /var/run/docker.sock
          name: docker-sock-volume
      volumes:
      - name: docker-sock-volume
        hostPath:
             path: /var/run/docker.sock
```

## 3.2 方案2 - Job

相比Daemonset，Job可以在完成后自动清除，不会遗留垃圾数据，但是需要手动设置反亲和性，指定节点之间的反亲和即可。

**job.yaml**

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: myjob
spec:
  completions: 6        # Job结束需要运行6个Pod，
  parallelism: 6         # 并行6个Pod
  backoffLimit: 2        # 最多重试2次
  ttlSecondsAfterFinished: 100 #Job运行后100s会删除
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: job-name
                operator: In
                values:
                - myjob
            topologyKey: kubernetes.io/hostname
      containers:
      - name: imagejob
        env:
        - name: DELETE_IMAGE_NAME
          value: "kweecr03.xxx.xxx.xxx:80/public/alpine:x86-3.11.5"
        image: kweecr03.xxx.xxx.xxx:80/public/nginx:x86-1.20.1
        command: ['sh', '-c', 'curl --unix-socket /var/run/docker.sock -X DELETE http://localhost/v1.39/images/$(DELETE_IMAGE_NAME)?force=true']
        securityContext:
          privileged: true
        volumeMounts:
        - mountPath: /var/run/docker.sock
          name: docker-sock-volume
      volumes:
      - name: docker-sock-volume
        hostPath:
           path: /var/run/docker.sock
      restartPolicy: Never
```

关键点：

1. 设置反亲和性：节点之间硬亲和`requiredDuringSchedulingIgnoredDuringExecution`
2. 设置Job自动清理时间`ttlSecondsAfterFinished`,比如设置值为100，表示成功执行job起，100s后Job被清理。

验证：

1. 给集群扩容到6节点，并给每个节点拉取镜像`kweecr03.xxx.xxx.xxx:80/public/alpine:x86-3.11.5`

```bash
 docker pull kweecr03.xxx.xxx.xxx:80/public/alpine:x86-3.11.5
```

2. 生成job任务

```bash
➜  kubectl apply -f job.yaml
job.batch/myjob created
➜  kubectl get job
NAME    COMPLETIONS   DURATION   AGE
myjob   6/6           5s         5s
➜  kubectl get po -o wide  #发现POD是分布在每个节点上
NAME                                 READY   STATUS      RESTARTS   AGE    IP            NODE             NOMINATED NODE   READINESS GATES
myjob-9hd6b                          0/1     Completed   0          67s    12.11.0.117   10.247.154.161   <none>           <none>
myjob-cqg2b                          0/1     Completed   0          67s    12.11.0.109   10.247.154.144   <none>           <none>
myjob-hcd7r                          0/1     Completed   0          67s    12.11.0.139   10.247.154.180   <none>           <none>
myjob-p9c8n                          0/1     Completed   0          67s    12.11.0.93    10.247.154.122   <none>           <none>
myjob-xpqmn                          0/1     Completed   0          67s    12.11.0.63    10.247.154.39    <none>           <none>
myjob-zb97w                          0/1     Completed   0          67s    12.11.0.76    10.247.154.19    <none>           <none>

➜  kubectl logs myjob-9hd6b  #查看POD日志，日志显示删除了镜像
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
[{"Untagged":"kweecr03.xxx.xxx.xxx:80/public/alpine:x86-3.11.5"},{"Untagged":"kweecr03.xxx.xxx.xxx:80/public/alpine@sha256:cb8a924afdf0229ef7515d9e5b3024e23b3eb03ddbba287f4a19c6ac90b8d221"},{"Deleted":"sha256:a187dde48cd289ac374ad8539930628314bc581a481cdb41409c9289419ddb72"}]
100   283  100   283    0     0  35375      0 --:--:-- --:--:-- --:--:-- 35375

```

3. 登陆到每个节点中查看镜像是否存在

```bash
➜  docker images |grep alpine
```

发现每个节点确实已经没有该镜像。

4. 100s后观察POD已经被自动清除。

---

全文完。