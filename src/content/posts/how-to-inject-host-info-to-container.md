---
title: 14-向容器中注入主机信息
date: 2022-04-09 20:19:21
updated: 2022-04-09 20:19:21
categories: 
  - 技术笔记
description: 一些自研插件通过sidecar容器提供服务，容器需要获取到当前所在节点的IP与hostname作为环境变量或者downward API传递给应用。
tags: 
  - K8s
  - Kubernetes
  - CloudNative
image: /images/kubernetes.png
keywords: kubernetes,k8s,downward api,环境变量,hostname
---
> 需求背景：一些自研插件通过sidecar容器提供服务，容器需要获取到当前所在节点的IP与hostname作为环境变量传递给应用。

Kubernetes通过环境变量可满足该需求。通过环境变量获取的内容如下：

- `status.podIP` - POD的IP
- `spec.serviceAccountName` - Pod 服务帐号名称, 版本要求 v1.4.0-alpha.3
- `spec.nodeName` - 节点名称, 版本要求 v1.4.0-alpha.3
- `status.hostIP` - 节点 IP, 版本要求 v1.7.0-alpha.1

此外，Kubernetes通过 `downward API`卷可以给容器提供POD信息、以及容器限额信息，详细可参考官网- [Downward API 的能力](https://kubernetes.io/zh/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/#downward-api-%E7%9A%84%E8%83%BD%E5%8A%9B)

## 实践 - 向容器中注入主机IP与主机Hostname

**deploy.yaml**

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nginx-deploy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-nginx
  template:
    metadata:
      labels:
        app: my-nginx
    spec:
      containers:
      - env:
          - name: my_env  
            value: 'beta'
          - name: MY_NODE_IP
            valueFrom:
              fieldRef:  #通过fieldRef引入到env中
                fieldPath: status.hostIP  #注入hostIP信息
        name: container-1
        image: 'kweecr03.xxx.xxx.xxx:80/public/nginx:x86-1.20.1'
        resources:
          limits:     
            cpu: 500m
            memory: 200Mi
          requests:
            cpu: 500m
            memory: 200Mi
```

测试：

```bash
$ kubectl apply -f deploy.yaml
deployment.apps/nginx-deploy created
$ kubectl get deploy
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deploy        1/1     1            1           6s
laomei@myworkspace:~/kubernetes/exec/exec15$ kubectl get po
NAME                                 READY   STATUS    RESTARTS   AGE
nginx-deploy-dfdf4f84d-v9w8r         1/1     Running   0          10s

$ kubectl exec -it nginx-deploy-dfdf4f84d-v9w8r env |grep my_env  #查看容器的环境变量my_env
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
my_env=beta

$ kubectl exec -it nginx-deploy-dfdf4f84d-v9w8r env |grep MY_NODE_IP  #查看容器的环境变量MY_NODE_IP
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
MY_NODE_IP=10.247.154.19

$ kubectl exec -it nginx-deploy-dfdf4f84d-v9w8r env |grep MY_NODE_NAME  #查看容器的环境变量MY_NODE_NAME
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
MY_NODE_NAME=10.247.154.19
```

从这里可以看出其实其节点名和节点IP是一致的，之所以这样是因为K8s安装时节点命名直接引用了IP地址，如下：

```bash
$ kubectl get nodes
NAME            STATUS   ROLES    AGE   VERSION
10.247.154.19   Ready    <none>   23d   v1.19.10-r0-CCE21.11.1.B006-21.11.1.B006
10.247.154.61   Ready    <none>   23d   v1.19.10-r0-CCE21.11.1.B006-21.11.1.B006
```

但是节点本身在 `/etc/hostname`中配置的名字是对的，那如何将这个配置文件传递给容器呢？

## 实践2 - 通过hostpath卷引入容器中

接上面的实践1，我们可以通过hostpath将主机的 `/etc/hostname`作为volume挂载到容器中的某个目录，容器如果需要读取，在应用中读取该volume即可。

**deploy.yaml**

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nginx-deploy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-nginx
  template:
    metadata:
      labels:
        app: my-nginx
    spec:
      containers:
      - env:
            - name: my_env
              value: 'beta'
            - name: MY_NODE_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.hostIP
            - name: MY_NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
        name: container-1
        image: 'kweecr03.xxx.xxx.xxx:80/public/nginx:x86-1.20.1'
        resources:
          limits:                  # limits与requests建议取值保持一致，避免扩缩容过程中出现震荡
            cpu: 500m
            memory: 200Mi
          requests:
            cpu: 500m
            memory: 200Mi
        volumeMounts:
          - mountPath: /etc/hostname_eks
            name: hostname         #引入下面的名字
      volumes:
        - hostPath:
            path: /etc/hostname    #主机目录
          name: hostname           #命名为hostame
```

部署后查询：

```bash
$ kubectl exec -it nginx-deploy-6677765846-bbrh5 cat /etc/hostname_eks
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
kweekshcgp-nsdk4
```

其本质是引入hostpath文件，但最终是要被容器中的应用调用的。
