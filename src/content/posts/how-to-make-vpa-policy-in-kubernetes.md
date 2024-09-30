相对于HPA横向弹性伸缩POD数量，VPA垂直弹性会在现有POD基础上对POD的CPU与内存进行弹性，它根据容器资源使用率自动设置 CPU 和 内存 的requests，从而允许在节点上进行适当的调度，以便为每个 Pod 提供适当的资源。VPA既可以缩小过度请求资源的容器，也可以根据其使用情况随时提升资源不足的容量。

> 说明：VPA与HPA不能同时工作，二者只能选其一，且VPA目前还未大规模推广商用，仅供测试。

**依赖条件**：

1. metrics-server：跟HPA一样，需要有metrics-server识别CPU、内存指标数据。
2. vertical-pod-autoscaler：是Kubernetes的CRD对象，可在https://github.com/kubernetes/autoscaler.git获取安装包到集群中安装使用。

metrics-server与vertical-pod-autoscaler也是通过POD的方式运行在kube-system命名空间下，查看如下结果则表示安装成功。

```bash
$  kubectl get po -nkube-system |grep -E "metrics|vpa"
metrics-server-5458746495-pfv4d             1/1     Running   5          63d
vpa-admission-controller-657857bfb7-bjgrm   1/1     Running   0          94m
vpa-recommender-77dccb87b8-4rg69            1/1     Running   0          94m
vpa-updater-5f574b5d57-vblz9                1/1     Running   0          93m
```

下面部署一个负载，指定POD的CPU与内存大小，并通过压测触发VPA弹性策略，增加其CPU与内存，压测结束后CPU与内存缩小。

## 1. 部署Nginx负载

nginx-deploy.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: nginx
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx_vpa
  template:
    metadata:
      labels:
        app: nginx_vpa
    spec:
      containers:
      - image: nginx
        imagePullPolicy: IfNotPresent
        name: nginx
        resources:
          requests:
            cpu: 100m
            memory: 250Mi
```

这里指定容器的request资源为CPU 100m，内存 250Mi。

```bash
$ kubectl apply -f nginx_vpa.yaml
deployment.apps/nginx created

$ kubectl get po -l app=nginx_vpa
NAME                     READY   STATUS    RESTARTS   AGE
nginx-79c77f8bc7-fn574   1/1     Running   0          18s
nginx-79c77f8bc7-g8jzx   1/1     Running   0          18s
```

apply资源文件后生成两个nginx的POD。

## 2. 部署Nginx service服务

为了测试服务，给POD加上前端serice服务作为业务入口Endpoint。

**nginx-vpa-svc.yaml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  #type: NodePort
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: nginx_vpa
```

这里我们可以设置service类型为ClusterIP或者NodePort，前者是在集群内部互通，后者可通过节点在外部访问，默认不指定服务类型的时候，使用的类型为ClusterIP，为测试方便可选择默认ClusterIP并在集群的节点上直接压测。

apply资源对象文件：

```bash
$ kubectl apply -f nginx-svc.yaml
service/nginx created
```

查看生成的服务：

```bash
$ kubectl get svc
NAME            TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
nginx           ClusterIP   10.1.41.177    <none>        80/TCP         4s
```

可在集群节点上直接测试`curl -I 10.1.41.177:80`。

```bash
[lm@node2 ~]$ curl -I 10.1.41.177:80
curl -I 10.1.41.177:80
HTTP/1.1 200 OK
Server: nginx/1.21.5
Date: Thu, 31 Mar 2022 08:13:55 GMT
Content-Type: text/html
Content-Length: 615
Last-Modified: Tue, 28 Dec 2021 15:28:38 GMT
Connection: keep-alive
ETag: "61cb2d26-267"
Accept-Ranges: bytes
```



## 3. 部署VPA策略

**nginx-vpa.yaml**

```yaml
apiVersion: autoscaling.k8s.io/v1beta2
kind: VerticalPodAutoscaler
metadata:
  name: nginx-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: nginx
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: "nginx"
      minAllowed:
        cpu: "250m"
        memory: "100Mi"
      maxAllowed:
        cpu: "2000m"
        memory: "2048Mi"
```

这里我们指定的策略为CPU最小弹性至250m，内存到100Mi，CPU最大2000m，内存最大2048Mi。另外还有一个重要参数：`updateMode: "Auto"`。这里指将触发VPA弹性动作。如果该值为OFF表示只推荐，但是不会真的触发弹性值。

```bash
$  kubectl apply -f nginx-vpa-demo.yaml
verticalpodautoscaler.autoscaling.k8s.io/nginx-vpa created

$  kubectl get vpa
NAME        MODE   CPU    MEM       PROVIDED   AGE
nginx-vpa   Off    250m   262144k   True       8s

$  kubectl describe vpa nginx-vpa |tail -n 20
  Conditions:
    Last Transition Time:  2022-03-31T08:18:08Z
    Status:                True
    Type:                  RecommendationProvided
  Recommendation:
    Container Recommendations:
      Container Name:  nginx
      Lower Bound:
        Cpu:     250m
        Memory:  262144k
      Target:
        Cpu:     250m
        Memory:  262144k
      Uncapped Target:
        Cpu:     25m
        Memory:  262144k
      Upper Bound:
        Cpu:     429m
        Memory:  448631544
Events:          <none>
```

从策略里看有几个关键点：

- Lower Bound：下限值

- Target:  推荐值 

- Upper Bound:上限值 

- Uncapped Target:   如果没有为VPA提供最小或最大边界，则表示目标利用率 。

上述结果表明，推荐的 Pod 的 CPU 请求为 250m，推荐的内存请求为 262144k 字节。

## 4. 对Nginx服务进行压测触发VPA弹性

由于我们的Endpoint为clusterIP类型的service，所需需在集群内部访问，可在节点上测试Nginx服务。

```bash
[root@node2 ~]# ab -c 100 -n 10000000 http://10.1.41.177:80/
This is ApacheBench, Version 2.3 <$Revision: 1430300 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 10.1.41.177 (be patient)
Completed 1000000 requests
Completed 2000000 requests
Completed 3000000 requests
Completed 4000000 requests
Completed 5000000 requests
Completed 6000000 requests
Completed 7000000 requests
Completed 8000000 requests
Completed 9000000 requests
apr_pollset_poll: The timeout specified has expired (70007)
Total of 9999808 requests completed
```

在压测过程中查看vpa详情，只关注Container Recommendations部分：

```bash
$  kubectl  describe  vpa nginx-vpa  |tail -n 20
  Conditions:
    Last Transition Time:  2022-03-31T08:18:08Z
    Status:                True
    Type:                  RecommendationProvided
  Recommendation:
    Container Recommendations:
      Container Name:  nginx
      Lower Bound:
        Cpu:     250m
        Memory:  262144k
      Target:
        Cpu:     250m
        Memory:  262144k
      Uncapped Target:
        Cpu:     25m
        Memory:  262144k
      Upper Bound:
        Cpu:     2
        Memory:  545717993
Events:          <none>
```

这里Target为`Cpu: 250m ，Memory: 262144k`，继续查看event事件。

```bash
$ kubectl  get event
LAST SEEN   TYPE      REASON             OBJECT                                MESSAGE
2m42s       Warning   FailedGetScale     horizontalpodautoscaler/hpa-example   deployments/scale.apps "hpa-example" not found
11m         Normal    EvictedByVPA       pod/nginx-79c77f8bc7-fn574            Pod was evicted by VPA Updater to apply resource recommendation.
11m         Normal    Killing            pod/nginx-79c77f8bc7-fn574            Stopping container nginx
12m         Normal    Scheduled          pod/nginx-79c77f8bc7-g68rc            Successfully assigned default/nginx-79c77f8bc7-g68rc to master
12m         Normal    Pulled             pod/nginx-79c77f8bc7-g68rc            Container image "nginx" already present on machine
12m         Normal    Created            pod/nginx-79c77f8bc7-g68rc            Created container nginx
12m         Normal    Started            pod/nginx-79c77f8bc7-g68rc            Started container nginx
12m         Normal    EvictedByVPA       pod/nginx-79c77f8bc7-g8jzx            Pod was evicted by VPA Updater to apply resource recommendation.
12m         Normal    Killing            pod/nginx-79c77f8bc7-g8jzx            Stopping container nginx
11m         Normal    Scheduled          pod/nginx-79c77f8bc7-vtknc            Successfully assigned default/nginx-79c77f8bc7-vtknc to node2
11m         Normal    Pulled             pod/nginx-79c77f8bc7-vtknc            Container image "nginx" already present on machine
11m         Normal    Created            pod/nginx-79c77f8bc7-vtknc            Created container nginx
11m         Normal    Started            pod/nginx-79c77f8bc7-vtknc            Started container nginx
12m         Normal    SuccessfulCreate   replicaset/nginx-79c77f8bc7           Created pod: nginx-79c77f8bc7-g68rc
11m         Normal    SuccessfulCreate   replicaset/nginx-79c77f8bc7           Created pod: nginx-79c77f8bc7-vtknc
```

从事件里可以看出，vpa执行了`EvictedByVPA`，自动停掉了老的POD，`pod/nginx-79c77f8bc7-fn574`与`pod/nginx-79c77f8bc7-g8jzx`，然后使用 VPA推荐的资源启动了新的nginx : ` pod/nginx-79c77f8bc7-g68rc`与`pod/nginx-79c77f8bc7-vtknc `。分别查看这两个POD的资源requests情况：

```bash
$ kubectl describe pod nginx-79c77f8bc7-g68rc
Name:         nginx-79c77f8bc7-g68rc
Namespace:    default
Priority:     0
Node:         master/192.168.0.114
Start Time:   Thu, 31 Mar 2022 16:38:40 +0800
Labels:       app=nginx_vpa
              pod-template-hash=79c77f8bc7
Annotations:  vpaObservedContainers: nginx
              vpaUpdates: Pod resources updated by nginx-vpa: container 0: cpu request, memory request
Status:       Running
IP:           10.244.0.126
IPs:
  IP:           10.244.0.126
Controlled By:  ReplicaSet/nginx-79c77f8bc7
Containers:
  nginx:
    Container ID:   docker://d45c8eeada45b8bc8e932cd28d7e72c6ac412c90568689f4090c97f207a99914
    Image:          nginx
    Image ID:       docker-pullable://nginx@sha256:0d17b565c37bcbd895e9d92315a05c1c3c9a29f762b011a10c54a66cd53c9b31
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Thu, 31 Mar 2022 16:38:41 +0800
    Ready:          True
    Restart Count:  0
    Requests:
      cpu:        250m
      memory:     262144k
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-g4ktr (ro)
```

可见其申请了新的CPU与内存值。不过压测半小时过去了，也没见VPA将POD的requests缩回去。。。可能等的时间不够，或者VPA本身不成熟吧。

## 5.总结

- VPA垂直弹性可对POD进行CPU与内存requests修改，kill掉老POD，生成新POD。

- VPA与HPA不能同时使用，从上面的event事件中可看出VPA测试过程中确实影响了HPA弹性。

- VPA压测很久之后POD还没有垂直缩回去，功能应该还不成熟。

---

全文完。