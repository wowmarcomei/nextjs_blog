---
title: 04-POD初始化与滚动更新
date: 2022-01-13 19:51:16
updated: 2022-01-13 19:51:16
description: 本文介绍POD的生命周期与使用滚动更新避免应用宕机。
categories: 
  - 技术笔记

tags: 
  - K8s
  - Kubernetes
  - CloudNative

image: /images/kubernetes.png

keywords: kubernetes,k8s,pod,生命周期,rolling update
---


## 1\. POD的生命周期

一个 Pod 的完整生命周期过程包含 `Init Container`、`Pod Hook`、`健康检查` 三个主要部分，如下图所示。

![pod-loap](/images/pod-loap.jpg)

- 其中`Init Container`初始化容器是用来做初始化的，比如提前给`main container`主容器准备卷、文件、检测环境等等。main容器只有等初始化容器运行结束后才会启动。
  
- POD Hook是main容器的钩子，有post start和pre stop钩子，post start即是在main容器启动之后马上开始的动作；pre stop是在main容器结束之前的动作。**一般事项零宕机就是通过设置pre stop钩子，在POD结束之前使容器优雅退出**。 设置pre stop后，删除POD时，POD将会发`SIGTERM` 信号给POD中各个容器通知准备退出了，同时Kubernetes 将从 Endpoints 对象中删除该 Pod，所以该 Pod 将会从负载均衡器中排除，负载均衡器便不再转发流量到这个POD上，理论上可实现零宕机（应用退出快的情况下）。一般优雅停机方法：
  
    ```yaml
     lifecycle:
       preStop:
         exec:
           command: ["/bin/sh"，"-c"，"/pre-stop.sh"]
    ```
    
    在`/pre-stop.sh` 脚本里添加应用的清理逻辑。
    
    串一串POD退出的流程：
    
    一、用户删除POD
    
    二、Pod 进入 Terminating 状态; 与此同时，k8s 会将 Pod 从对应的 service 上摘除;
    
    三、与此同时，针对有 pre stop hook 的容器，kubelet 会调用每个容器的 preStop hook，假如 preStop hook 的运行时间超出了 grace period（默认30s），kubelet 会发送 SIGTERM 并再等 2 秒;
    
    四、与此同时，针对没有 preStop hook 的容器，kubelet 发送 SIGTERM。
    
    五、grace period 超出之后，kubelet 发送 SIGKILL 干掉尚未退出的容器。
    
    总结：如果在POD停止前执行一条命令，通知网关或者注册中心对这个POD进行下线，那么注册中心就会标记POD已经下线，对其不进行流量转发，用户就不会有任何影响，这就是优雅停止，将滚动更新影响最小化。
    
    详细参考：https://imroc.cc/k8s/best-practice/graceful-shutdown/
    
    
    
- 健康检查主要是使用了三个探针： `liveness probe` 和`readiness probe`。
  
    一、kubelet 通过使用 `liveness probe` 来确定应用程序是否正在运行，即**是否还活着**。如果程序一旦崩溃了，通过 `liveness probe` 探针， Kubernetes 立刻就知道这个程序已经终止了，然后就会重启这个程序。
    
    二、kubelet通过 使用 `readiness probe` 来确定容器是否已经就绪可以接收流量过来了，即容器**是否准备好了**，是否可以开始工作了。只有当 Pod 中的容器都处于就绪状态的时候 kubelet 才会认定该 Pod 处于就绪状态，因为一个 Pod 下面可能会有多个容器。当然 Pod 如果处于非就绪状态，Kubernetes就会将他从 Service 的 Endpoints 列表中移除出来，这样流量就不会被路由到这个 Pod 里面来了。

## 2. POD初始化容器demo

**init-pod.yaml**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: first-demo
spec:
  volumes:
  - name: workdir
    emptyDir: {}
  initContainers:
  - name: install
    image: busybox
    command:
    - "/bin/sh"
    - "-c"
    - "echo hello,pod >> /home/message"
    volumeMounts:
    - name: workdir
      mountPath: /home
  containers:
  - name: nginx
    image: nginx
    ports:
    - containerPort: 80
    volumeMounts:
    - name: workdir
      mountPath: /usr/share/nginx/html
```

在yaml中定义了一个全局volumes，可以供下面的两个容器使用，其中volume没有使用hostpath，而是使用的是empyDir，kubelet会在主机上自动创建一个目录，可被挂载到容器目录中，该目录的生命周期等于POD的生命周期。

在初始化init容器中，拉取busybox镜像，执行一条echo语句打印到/home目录下的message文件中。并将主机上kubelet创建的目录挂载到容器的home目录下，volumeMounts的name需要与全局volumes的name一致。

在主容器声明中，定义了一个容器，拉取nginx镜像，容器暴露端口为80，将kubelet创建的emptyDir的名为workdir的全局目录挂载到容器的**/usr/share/nginx/html**目录下。即是说在初始化容器中生成的home目录与主容器目录均都mount了主机的emptyDir目录。主容器只有在初始容器起来后才会被拉起。所以很多初始化动作可在这个初始化容器中来预置。

Apply测试一下：

```bash
➜  kubectl apply -f init-pod.yaml
pod/first-demo created


➜  kubectl describe pod first-demo
Name:         first-demo
Namespace:    default
Priority:     0
Node:         master/192.168.0.114
Start Time:   Thu, 13 Jan 2022 08:29:25 +0800
Labels:       <none>
Annotations:  <none>
Status:       Running
IP:           10.244.0.22
IPs:
  IP:  10.244.0.22
Init Containers:
  install:
    Container ID:  docker://a65b77a94ba8d822052f72fc8e673dbe1026b93a202b855d0dc1eb1019c4170d
    Image:         busybox
    Image ID:      docker-pullable://busybox@sha256:5acba83a746c7608ed544dc1533b87c737a0b0fb730301639a0179f9344b1678
    Port:          <none>
    Host Port:     <none>
    Command:
      /bin/sh
      -c
      echo hello,pod >> /home/message
    State:          Terminated
      Reason:       Completed
      Exit Code:    0
      Started:      Thu, 13 Jan 2022 08:29:50 +0800
      Finished:     Thu, 13 Jan 2022 08:29:50 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /home from workdir (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-g4ktr (ro)
Containers:
  nginx:
    Container ID:   docker://47a20ab3bcbaedf472e063c2ebbfd3e8efef929fbb9f83f4ea6698a1eda2f318
    Image:          nginx
    Image ID:       docker-pullable://nginx@sha256:0d17b565c37bcbd895e9d92315a05c1c3c9a29f762b011a10c54a66cd53c9b31
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Thu, 13 Jan 2022 08:30:15 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /usr/share/nginx/html from workdir (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-g4ktr (ro)
Conditions:
  Type              Status
  Initialized       True
  Ready             True
  ContainersReady   True
  PodScheduled      True
Volumes:
  workdir:
    Type:       EmptyDir (a temporary directory that shares a pod's lifetime)
    Medium:
    SizeLimit:  <unset>
  default-token-g4ktr:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-g4ktr
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                 node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age    From               Message
  ----    ------     ----   ----               -------
  Normal  Scheduled  4m9s   default-scheduler  Successfully assigned default/first-demo to master
  Normal  Pulling    4m8s   kubelet            Pulling image "busybox"
  Normal  Pulled     3m44s  kubelet            Successfully pulled image "busybox" in 24.295845225s
  Normal  Created    3m44s  kubelet            Created container install
  Normal  Started    3m44s  kubelet            Started container install
  Normal  Pulling    3m43s  kubelet            Pulling image "nginx"
  Normal  Pulled     3m19s  kubelet            Successfully pulled image "nginx" in 24.107119504s
  Normal  Created    3m19s  kubelet            Created container nginx
  Normal  Started    3m19s  kubelet            Started container nginx

```

在部署pod之后，先拉取busybox镜像生成初始容器，初始容器的状态为`Terminated`后才会启动主容器，开始拉取nginx镜像启动主容器。

## 3. POD优雅停机demo

**gracestop.yaml**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hook-demo2
spec:
  containers:
  - name: hook-demo2
    image: nginx
    lifecycle:
      preStop:
        exec:
          command: ["/usr/sbin/nginx","-s","quit"]  # 优雅退出

---
apiVersion: v1
kind: Pod
metadata:
  name: hook-demo3
spec:
  volumes:
  - name: message
    hostPath:
      path: /tmp
  containers:
  - name: hook-demo2
    image: nginx
    ports:
    - containerPort: 80
    volumeMounts:
    - name: message
      mountPath: /usr/share/
    lifecycle:
      preStop:
        exec:
          command: ['/bin/sh', '-c', 'echo Hello from the preStop Handler > /usr/share/message']
```

这里定义了两个POD，hook-demo2和hook-demo3，其中hook-demo2是利用 `preStop` 来进行优雅删除，另外一个是利用 `preStop` 来做一些信息记录。

```bash
➜  kubectl apply -f gracestop.yaml
pod/hook-demo2 created
pod/hook-demo3 created
➜   kubectl get pods |grep hook
hook-demo2                      1/1     Running   0          2m14s
hook-demo3                      1/1     Running   0          2m14s
```

创建完成后，直接删除 hook-demo2 这个 Pod，在容器删除之前会执行 preStop 里面的优雅关闭命令。

第二个 Pod 声明了一个 hostPath 类型的 Volume，在容器里面声明挂载到了这个 Volume，所以当删除 Pod时，在退出容器之前，在容器里面输出的信息也会同样的保存到宿主机的 `/tmp` 目录下面，我们可以查看 hook-demo3 这个 Pod 被调度的节点：

```
➜  kubectl describe pod hook-demo3
Name:         hook-demo3
Namespace:    default
Priority:     0
Node:         master/192.168.0.114

......
```

可以看到这个 Pod 被调度到了 `master` 这个节点上，可以先到该节点上查看 `/tmp` 目录没有message输出：

```
➜  ls /tmp/
```

现在删除 hook-demo3 这个 Pod，容器退出之前会执行 `preStop` 里面的命令，也就是会往 message 文件中输出一些信息：

```
➜  kubectl delete pod hook-demo3
pod "hook-demo3" deleted
➜  ls /tmp/
message
➜  cat /tmp/message
Hello from the preStop Handler
```



## 4. POD探针demo

demo: 用 exec 执行命令的方式来检测容器的存活，如下liveness-exec.yaml。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: liveness-exec
spec:
  containers:
  - name: liveness
    image: busybox
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 5
      periodSeconds: 5
```

这个例子中，容器启动时创建文件`/tmp/healthy`，然后休眠30秒，30秒后删除文件，修改10分钟。探针livenessProbe会执行exec命令`cat /tmp/healthy`，执行成功会返回值成功码0，如果返回值为非0，kubelet就会kill掉容器并重启它。

- `periodSeconds`：表示让 kubelet 每隔5秒执行一次存活探针，也就是每5秒执行一次上面的`cat /tmp/healthy`命令。默认是10秒，最小1秒。
- `initialDelaySeconds`：表示在第一次执行探针的时候要等待5秒，这样能够确保容器能够有足够的时间启动起来。如果第一次执行探针等待时间段，可能容器都还没起来，存活探针始终都是失败的，容器就会一直重启下去。

测试一下：

我们来创建下该 Pod，然后在 30 秒内，查看 Pod 的 Event：

```bash
➜ kubectl apply -f liveness-exec.yaml
➜ kubectl describe pod liveness-exec
......
  Events:
  Type     Reason     Age                  From               Message
  ----     ------     ----                 ----               -------
  Normal  Scheduled  51s   default-scheduler  Successfully assigned default/liveness-exec to node2
  Normal  Pulling    51s   kubelet            Pulling image "busybox"
  Normal  Pulled     35s   kubelet            Successfully pulled image "busybox" in 16.548421804s
  Normal  Created    34s   kubelet            Created container liveness
  Normal  Started    34s   kubelet            Started container liveness
```

可以观察到容器一开始是正常启动的，在隔一会儿，比如 40s 后，再查看下 Pod 的 Event，在最下面有一条信息显示 liveness probe 失败了，容器将要重启。然后可以查看到 Pod 的 `RESTARTS` 值加 1 了：

```
➜ kubectl describe pod liveness-exec
  ----     ------     ----              ----               -------
  Normal   Scheduled  2m9s                default-scheduler  Successfully assigned default/liveness-exec to node2
  Normal   Pulled     113s                kubelet            Successfully pulled image "busybox" in 16.548421804s
  Warning  Unhealthy  68s (x3 over 78s)   kubelet            Liveness probe failed: cat: can't open '/tmp/healthy': No such file or directory
  Normal   Killing    68s                 kubelet            Container liveness failed liveness probe, will be restarted
  Normal   Pulling    38s (x2 over 2m9s)  kubelet            Pulling image "busybox"
  Normal   Created    22s (x2 over 112s)  kubelet            Created container liveness
  Normal   Started    22s (x2 over 112s)  kubelet            Started container liveness
  Normal   Pulled     22s                 kubelet            Successfully pulled image "busybox" in 16.089227559s

➜  kubectl get pods
NAME            READY   STATUS    RESTARTS   AGE
liveness-exec   1/1     Running   1          1m
```
--------

全文完。
