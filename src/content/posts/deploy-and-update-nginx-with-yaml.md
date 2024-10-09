---
title: 02-使用YAML部署与升级Nginx
date: 2021-12-28 19:01:41
description: 通过YAML声明K8s API对象，使用kubectl部署与升级。
categories: 
  - 技术笔记

tags: 
  - K8s
  - Kubernetes
  - CloudNative

image: kubernetes.png
keywords: kubernetes,k8s,nginx,yaml
---

通过YAML基于kubectl使用原生方式跟API-Server快速交互，创建对应的API对象。

## YAML基本语法

YAML的基本语法规则如下：

- 大小写敏感
- 使用缩进表示层级关系
- 缩进时不允许使用`Tab`键，只允许使用空格
- 缩进的空格数目不重要，只要相同层级的元素左侧对齐即可
- `#` 表示注释，从这个字符一直到行尾，都会被解析器忽略

在 Kubernetes 中，首先了解两种结构类型就行了：

- Lists（列表）
- Maps（字典）

### Maps

`Map` 就是字典，即是一个 **key:value** 的键值对，`Maps` 可以让我们更加方便的去书写配置信息，例如：

```yaml
---
apiVersion: v1
kind: Pod
```

其中第一行的`---`是分隔符，是可选的，在单一文件中，可用连续三个连字号`---`区分多个文件。这里我们可以看到，我们有两个键：kind 和 apiVersion，他们对应的值分别是：v1 和 Pod。

再创建一个相对复杂一点的 YAML 文件，创建一个 KEY 对应的值不是字符串而是一个 Maps：

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  labels:
    app: web
```

上面的 YAML 文件，metadata 这个 KEY 对应的值就是一个 `Maps` ，它嵌套的 labels 这个 KEY 的值又是一个 Map，可根据情况进行多层嵌套。

> 注意：在 YAML 文件中绝对不要使用 tab 键来进行缩进，而且缩进前后保持一致的规范，比如前面的name缩进两个空格，后面的app就不要缩进四个空格，最好都保持两个空格作为规范。

### Lists

`Lists`就是列表，也是数组，跟Python、Markdown中定义列表的方式是一样的，如下：

```yaml
args
  - Cat
  - Dog
  - Fish
```

当然，Lists 的子项也可以是 Maps，Maps 的子项也可以是 Lists 如下所示：

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: test
  labels:
    app: web
spec:
  containers:
    - name: front-end
      image: nginx
      ports:
        - containerPort: 80
    - name: back-end
      image: flaskapp
      ports:
        - containerPort: 5000
```

比如这个 YAML 文件，定义了一个叫 containers 的 List 对象，**其中有两个列表子项**，每个子项都由name、image、ports 组成，每个 ports 都有一个 key 为 containerPort 的 Map 组成。

## 部署Nginx Deployment

### 基本使用

定义Nginx的YAML描述：

```yaml
apiVersion: apps/v1  # API版本
kind: Deployment  # API对象类型
metadata:
  name: nginx-deploy
  labels:
    chapter: first-app
spec:
  selector:
    matchLabels: #spec.selector.matchLabels的键值对与spec.template.metadata.labels的键值对需一致,用于选择pod
      app: nginx 
  replicas: 3  # Pod 副本数量
  template:  # Pod 模板
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:xxxx.xxx.xxxx.com:80/public/nginx:x86-1.20.1
        ports:
        - containerPort: 80 #容器监听的端口80
```

定义的YAML中有三个重要内容：

- replias：表示期望的 Pod 的副本数量，POD实际上是通过控制器ReplicaSet来控制的
- selector：matchLabels，用来匹配要控制的 Pod 标签，需要和下面的 Pod 模板中的标签一致
- template：Pod 模板，Pod的详细定义，相当于把一个 Pod 的描述以模板的形式**嵌入到了 ReplicaSet** 中来。

上面提到的POD、ReplicaSet、Deployment是什么关系呢？可以用下图来说明：

![k8s-deployment](k8s-deployment.png)

如上图所示，Deployment控制Replicaset，Replicaset控制POD，三者是层层控制的，Deployment 通过管理 ReplicaSet 的数量和属性来实现`水平扩展/收缩`以及`滚动更新`两个功能的；ReplicaSet 通过`replicas: 3`来保证 Pod 的个数始终保存为3。

使用Kubectl部署Deployment：

```bash
# kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deploy created
```

查询部署结果：

```bash
# kubectl get deploy
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
dddddddddd     1/1     1            1           13d
hpa-example    1/1     1            1           6d2h
nginx-deploy   0/3     3            0           35s
saf            1/1     1            1           18d
# kubectl get deploy -l app=nginx
No resources found in default namespace.
# kubectl get deploy -l chapter=first-app
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deploy   0/3     3            0           82s
```

如果不指定标签，则kubectl会将默认的default namespace下的所有负载均查询出来，可以通过标签选择器过滤刚才部署的负载，上面的例子中，故意选择标签`-l app=nginx`结果什么都没查到，实际上这是因为在上面的YAML定义中指定Deployment的标签键值对为`chapter: first-app`,POD的标签键值对才是`app: nginx`。

> 注：键值对可自由定义，但是控制器的label选择器和POD模板中的label定义要前后一致。

上面的例子中，通过Deployment定义了三个POD，通过POD的标签选择器过滤查询：

```bash
# kubectl get pods -l app=nginx
NAME                           READY   STATUS             RESTARTS   AGE
nginx-deploy-67df4cc9c-dwrhd   0/1     InvalidImageName   0          6m59s
nginx-deploy-67df4cc9c-nwfw4   0/1     InvalidImageName   0          6m59s
nginx-deploy-67df4cc9c-v6v9g   0/1     InvalidImageName   0          6m59s
```

其中STATUS为InvalidImageName，表示POD没有起来，可通过describe命令查询第一个POD `nginx-deploy-67df4cc9c-dwrhd`的详细信息：

```bash
# kubectl describe pod nginx-deploy-67df4cc9c-dwrhd

#...省略
Events:
  Type     Reason                 Age                     From               Message
  ----     ------                 ----                    ----               -------
  Normal   Scheduled              8m22s                   default-scheduler  Successfully assigned default/nginx-deploy-67df4cc9c-dwrhd to 10.247.154.106
  Normal   SuccessfulMountVolume  8m22s                   kubelet            Successfully mounted volumes for pod "nginx-deploy-67df4cc9c-dwrhd_default(9cf7030b-                 cafc-470c-ba51-ef12d798cb68)"
  Normal   SandboxChanged         8m19s                   kubelet            Pod sandbox changed, it will be killed and re-created.
  Warning  FailedCreate           6m48s (x11 over 8m19s)  kubelet            Error: InvalidImageName
  Warning  InspectFailed          3m14s (x28 over 8m19s)  kubelet            Failed to apply default image tag "nginx:kweecr03.my-privaterepo.com:80/public/nginx:v1": couldn't parse image reference "nginx:kweecr03.my-privaterepo.com:80/nginx:x86-1.20.1": invalid reference format
#...省略

```

从Events中可见其根因为image仓库地址写错，修改一下重新apply部署即可。

```bash
# kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deploy configured
# kubectl get pods -l app=nginx
NAME                            READY   STATUS             RESTARTS   AGE
nginx-deploy-5bbc6bfb99-7rgtd   0/1     Pending            0          0s
nginx-deploy-5bbc6bfb99-gwtwx   1/1     Running            0          2s
nginx-deploy-5bbc6bfb99-wtx8l   1/1     Running            0          4s
nginx-deploy-67df4cc9c-dwrhd    0/1     Terminating        0          12m
nginx-deploy-67df4cc9c-nwfw4    0/1     InvalidImageName   0          12m
nginx-deploy-67df4cc9c-v6v9g    0/1     Terminating        0          12m
# kubectl get pods -l app=nginx
NAME                            READY   STATUS    RESTARTS   AGE
nginx-deploy-5bbc6bfb99-7rgtd   1/1     Running   0          22s
nginx-deploy-5bbc6bfb99-gwtwx   1/1     Running   0          24s
nginx-deploy-5bbc6bfb99-wtx8l   1/1     Running   0          26s
```

重新部署的过程中，ReplicaSet控制器会重新部署三个POD，并将之前状态不正确的POD删除。查看一下ReplicaSet控制器：

```bash
# kubectl get rs -l app=nginx
NAME                      DESIRED   CURRENT   READY   AGE
nginx-deploy-5bbc6bfb99   3         3         3       4m12s
nginx-deploy-67df4cc9c    0         0         0       16m
```

其中`nginx-deploy-67df4cc9c`的Age是16分钟，是之前部署出错时Deployment生成的ReplicaSet控制器。`nginx-deploy-5bbc6bfb99`是目前的控制器，控制3个POD。查看一下这个ReplicaSet详细信息。

```bash
# kubectl describe rs nginx-deploy-5bbc6bfb99
Name:           nginx-deploy-5bbc6bfb99
Namespace:      default
Selector:       app=nginx,pod-template-hash=5bbc6bfb99
Labels:         app=nginx
                pod-template-hash=5bbc6bfb99
Annotations:    deployment.kubernetes.io/desired-replicas: 3
                deployment.kubernetes.io/max-replicas: 4
                deployment.kubernetes.io/revision: 2
Controlled By:  Deployment/nginx-deploy
Replicas:       3 current / 3 desired
Pods Status:    3 Running / 0 Waiting / 0 Succeeded / 0 Failed
Pod Template:
  Labels:  app=nginx
           pod-template-hash=5bbc6bfb99
  Containers:
   nginx:
    Image:        kweecr03.xxxxxxxxxx.com:80/public/nginx:x86-1.20.1
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Events:
  Type    Reason            Age    From                   Message
  ----    ------            ----   ----                   -------
  Normal  SuccessfulCreate  6m44s  replicaset-controller  Created pod: nginx-deploy-5bbc6bfb99-wtx8l
  Normal  SuccessfulCreate  6m42s  replicaset-controller  Created pod: nginx-deploy-5bbc6bfb99-gwtwx
  Normal  SuccessfulCreate  6m40s  replicaset-controller  Created pod: nginx-deploy-5bbc6bfb99-7rgtd
```

Events记录了创建三个POD事件。Containers、Labels、Annotations等信息也一并打印出来了。

### 水平伸缩

水平伸缩Horizontal POD Autoscaling，即是通过控制器增加/删除POD。常见的几种方案：

1.  使用命令 `kubectl scale` 来实现。
2.  修改YAML文件中的对象定义，然后重新执行`kubectl apply`来实现。
3.  基于k8s插件实现的控制器来获取相应指标，实现自动HPA。

第三种方案稍微比较复杂，本次实践前两种。

#### 使用kubectl scale进行HPA

```shell
# kubectl scale deployment nginx-deploy --replicas=4
deployment.apps/nginx-deploy scaled
# kubectl get rs -l app=nginx
NAME                      DESIRED   CURRENT   READY   AGE
nginx-deploy-5bbc6bfb99   4         4         4       24m
nginx-deploy-67df4cc9c    0         0         0       37m
# kubectl get pods -l app=nginx
NAME                            READY   STATUS    RESTARTS   AGE
nginx-deploy-5bbc6bfb99-7rgtd   1/1     Running   0          24m
nginx-deploy-5bbc6bfb99-8cqdv   1/1     Running   0          28s
nginx-deploy-5bbc6bfb99-gwtwx   1/1     Running   0          24m
nginx-deploy-5bbc6bfb99-wtx8l   1/1     Running   0          24m
```

其中POD - `nginx-deploy-5bbc6bfb99-8cqdv`即是ReplicaSet控制器弹出来的。同样，可以指定`replicas=2`实现POD的缩容。

```bash
# kubectl scale deployment nginx-deploy --replicas=2
deployment.apps/nginx-deploy scaled
[root@kweekshcgp-2ywd5 nginx_demo]# kubectl get rs -l app=nginx
NAME                      DESIRED   CURRENT   READY   AGE
nginx-deploy-5bbc6bfb99   2         2         2       26m
nginx-deploy-67df4cc9c    0         0         0       38mk
[root@kweekshcgp-2ywd5 nginx_demo]# kubectl get pods -l app=nginx
NAME                            READY   STATUS    RESTARTS   AGE
nginx-deploy-5bbc6bfb99-gwtwx   1/1     Running   0          26m
nginx-deploy-5bbc6bfb99-wtx8l   1/1     Running   0          26m
```

#### 修改YAML文件进行HPA

```yaml
apiVersion: apps/v1  # API版本
kind: Deployment  # API对象类型
metadata:
  name: nginx-deploy
  labels:
    chapter: first-app
spec:
  selector:
    matchLabels: #spec.selector.matchLabels的键值对与spec.template.metadata.labels的键值对需一致,用于选择pod
      app: nginx
  replicas: 5  # Pod 副本数量
  template:  # Pod 模板
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: xxxx.xxx.xxxx.com:80/public/nginx:x86-1.20.1
        ports:
        - containerPort: 80 #容器监听的端口80
```

将replcas的值修改为5，然后手动apply。

```bash
# kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deploy configured
# kubectl describe deploy nginx-deploy
#...省略其他log
Events:
  Type    Reason             Age    From                   Message
  ----    ------             ----   ----                   -------
  Normal  ScalingReplicaSet  43m    deployment-controller  Scaled up replica set nginx-deploy-67df4cc9c to 3
  Normal  ScalingReplicaSet  31m    deployment-controller  Scaled up replica set nginx-deploy-5bbc6bfb99 to 1
  Normal  ScalingReplicaSet  31m    deployment-controller  Scaled down replica set nginx-deploy-67df4cc9c to 2
  Normal  ScalingReplicaSet  31m    deployment-controller  Scaled up replica set nginx-deploy-5bbc6bfb99 to 2
  Normal  ScalingReplicaSet  31m    deployment-controller  Scaled down replica set nginx-deploy-67df4cc9c to 1
  Normal  ScalingReplicaSet  31m    deployment-controller  Scaled up replica set nginx-deploy-5bbc6bfb99 to 3
  Normal  ScalingReplicaSet  31m    deployment-controller  Scaled down replica set nginx-deploy-67df4cc9c to 0
  Normal  ScalingReplicaSet  7m2s   deployment-controller  Scaled up replica set nginx-deploy-5bbc6bfb99 to 4
  Normal  ScalingReplicaSet  4m56s  deployment-controller  Scaled down replica set nginx-deploy-5bbc6bfb99 to 2
  Normal  ScalingReplicaSet  42s    deployment-controller  Scaled up replica set nginx-deploy-5bbc6bfb99 to 5
```

从打印的信息中可见，42秒前deployment-controller进行了一次伸缩的动作，将ReplicaSet对象`nginx-deploy-5bbc6bfb99`控制的POD伸缩到5了。

## 负载的滚动升级

Deployment怎么做到滚动升级，其实就是通过ReplicaSet对象来实现的，实际上在前文中，我们写错了image地址，导致生成的ReplicaSet创建的POD不生效，后面更新了YAML文件，重新生成了ReplicaSet，并创建了新的POD，这个过程跟负载滚动升级是一致的。

修改一下YAML文件，修改镜像版本，或者使用新的仓库地址。

```yaml
apiVersion: apps/v1  # API版本
kind: Deployment  # API对象类型
metadata:
  name: nginx-deploy
  labels:
    chapter: first-app
spec:
  selector:
    matchLabels: #spec.selector.matchLabels的键值对与spec.template.metadata.labels的键值对需一致,用于选择pod
      app: nginx
  replicas: 3  # Pod 副本数量
  minReadySeconds: 5
  strategy:
    type: RollingUpdate  # 指定更新策略：RollingUpdate和Recreate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:  # Pod 模板
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: xxxxxxxxxxxxxx.com:80/public/nginx:x86-1.20.2
        ports:
        - containerPort: 80 #容器监听的端口80
```

实际上除了更改了镜像之外，还指定了更新策略：

```yaml
minReadySeconds: 5
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 1
```

- `minReadySeconds`：表示 Kubernetes 在等待设置的时间后才进行升级，如果没有设置该值，Kubernetes 会假设该容器启动起来后就提供服务了，如果没有设置该值，在某些极端情况下可能会造成服务不正常运行，默认值就是0。
- `type=RollingUpdate`：表示设置更新策略为滚动更新，可以设置为`Recreate`和`RollingUpdate`两个值，`Recreate`表示全部重新创建，默认值就是`RollingUpdate`，表示创建一个POD再删除一个POD来进行滚动升级。
- `maxSurge`：表示升级过程中最多可以比原先设置多出的 Pod 数量，例如：`maxSurage=1，replicas=5`，就表示Kubernetes 会先启动一个新的 Pod，然后才删掉一个旧的 Pod，整个升级过程中最多会有`5+1`个 Pod。
- `maxUnavaible`：表示升级过程中最多有多少个 Pod 处于无法提供服务的状态，当`maxSurge`不为0时，该值也不能为0，例如：`maxUnavaible=1`，则表示 Kubernetes 整个升级过程中最多会有1个 Pod 处于无法服务的状态。

使用kubectl apply进行滚动升级Deployment对象。

```bash
# kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deploy configured
```

当然也可在升级过程中暂停，使用pause命令。

```bash
# kubectl rollout pause deployment/nginx-deploy
deployment.apps/nginx-deploy paused
```

查看Deployment详细信息。

```bash
# kubectl describe deploy nginx-deploy
Name:                   nginx-deploy
Namespace:              default
CreationTimestamp:      Wed, 05 Jan 2022 14:49:34 +0800
Labels:                 chapter=first-app
Annotations:            deployment.kubernetes.io/revision: 6
Selector:               app=nginx
Replicas:               3 desired | 2 updated | 4 total | 4 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        5
RollingUpdateStrategy:  1 max unavailable, 1 max surge
Pod Template:
#........省略
OldReplicaSets:  nginx-deploy-5bbc6bfb99 (2/2 replicas created)
NewReplicaSet:   nginx-deploy-5b7b9ccb95 (5/5 replicas created)

Events:
  Type    Reason             Age    From                   Message
  ----    ------             ----   ----                   -------
  Normal  ScalingReplicaSet  26m    deployment-controller  Scaled up replica set nginx-deploy-85ff79dd56 to 4
  Normal  ScalingReplicaSet  3m44s  deployment-controller  Scaled down replica set nginx-deploy-85ff79dd56 to 3
  Normal  ScalingReplicaSet  3m44s  deployment-controller  Scaled up replica set nginx-deploy-5b7b9ccb95 to 1
  Normal  ScalingReplicaSet  3m44s  deployment-controller  Scaled down replica set nginx-deploy-85ff79dd56 to 2
  Normal  ScalingReplicaSet  3m44s  deployment-controller  Scaled up replica set nginx-deploy-5b7b9ccb95 to 2
```

在上面的例子中，伸缩前用 `kubectl scale` 命令将 Pod 副本调整到了 4，但更新的时候在YAML中又声明副本数为 3 了，所以 Deployment 控制器首先是将之前控制的 `nginx-deploy-85ff79dd56` 这个 RS 资源对象进行缩容操作，然后滚动更新开始了，可以发现 Deployment 为一个新的 `nginx-deploy-5b7b9ccb95` RS 资源对象首先新建了一个新的 Pod，然后将之前的 RS 对象缩容到 2 了，再然后新的 RS 对象扩容到 2，后面由于我们暂停滚动升级了，所以没有后续的事件了。即滚动升级的过程是：

1.  启动一个新的 Pod。
    
2.  删除一个旧的 Pod。
    
3.  然后再启动一个新的 Pod，直到所有的POD的都变成新的POD。
    
    而且因为设置的策略`maxSurge=1`，所以在升级过程中是允许比原先设置多出1个 Pod ，即4个POD，两个新的 Pod，两个旧的 Pod，如下图示意：
    

![deployment-rollupdate](deployment-rollupdate.png)

使用`kubectl rollout resume`来恢复滚动更新：

```shell
# kubectl rollout resume deployment/nginx-deploy
deployment.apps/nginx-deploy resumed
# kubectl rollout status deployment/nginx-deploy
Waiting for deployment "nginx-deploy" rollout to finish: 2 of 3 updated replicas are available...
deployment "nginx-deploy" successfully rolled out
```

观察POD信息查看资源状态：

```bash
# kubectl get pod -l app=nginx
NAME                            READY   STATUS    RESTARTS   AGE
nginx-deploy-75bcbf6c9b-lfdlf   1/1     Running   0          23m
nginx-deploy-75bcbf6c9b-tnbpm   1/1     Running   0          20m
nginx-deploy-75bcbf6c9b-tx6gw   1/1     Running   0          23m
```

## 几个有用的小tips

1.  查看负载、pod、服务等对象的IP、端口信息时可加上`-o wide`参数，如：
    
    ```bash
    # kubectl get pod nginx-deploy-75bcbf6c9b-lfdlf -o wide
    NAME                            READY   STATUS    RESTARTS   AGE   IP           NODE            NOMINATED NODE   READINESS GATES
    nginx-deploy-75bcbf6c9b-lfdlf   1/1     Running   0          24m   12.11.0.58   10.247.154.37   <none>           <none>
    ```
    
2.  想查询系统中部署好的负载、服务的YAML定义，可加上`-o yaml`参数
    
    ```bash
    # kubectl get deploy nginx-deploy -o yaml
    ```
    
3.  可以通过rollout历史记录回滚对应版本。
    
    ```bash
    # kubectl rollout history deployment nginx-deploy #查询revision版本
    deployment.apps/nginx-deploy 
    REVISION  CHANGE-CAUSE
    1         <none>
    2         <none>
    # kubectl rollout history deployment nginx-deploy --revision=1  #查看revision=1的版本信息
    # kubectl rollout undo deployment nginx-deploy                  #回滚到升级前的前一个版本
    # kubectl rollout undo deployment nginx-deploy --to-revision=1  #回滚到revision=1的版本
    ```

--------

全文完。