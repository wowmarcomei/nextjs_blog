Kubernetes中弹性伸缩最主要的就是使用HPA（Horizontal Pod Autoscaling）和CA（Cluster AutoScaling）两种弹性伸缩策略，HPA负责工作负载弹性伸缩，也就是应用层面的弹性伸缩，CA负责节点弹性伸缩，也就是资源层面的弹性伸缩。

通常情况下，两者需要配合使用，因为HPA需要集群有足够的资源才能扩容成功，当集群资源不够时需要CA扩容节点，使得集群有足够资源；而当HPA缩容后集群会有大量空余资源，这时需要CA缩容节点释放资源，才不至于造成浪费。

本文先演示HPA弹性伸缩，基于CPU和内存使用率实现POD实例的弹性。

## 1\. 准备工作

本次实验基于EKS集群，需要集群安装metrics-server插件，该插件能够收集包括Pod、Node、容器、Service等主要Kubernetes核心资源的度量数据,并通过标准的 Kubernetes API 把数据暴露出来。

## 2\. 工作原理

1.  在负载中指定多个POD副本，metrics-server可收集到这些POD使用的CPU与内存度量数据；
2.  创建一个HorizontalPodAutoscaler对象，在对象的定义中指定CPU与内存策略，比如超过CPU 50%时扩容POD；
3.  模拟CPU和内存增加场景，使得POD加大CPU和内存使用量，触发HPA策略生效。

**扩缩容决策算法：**HPA controller根据当前指标和期望指标来计算缩放比例，计算公式如下：

**desiredReplicas = ceil\[currentReplicas * ( currentMetricValue / desiredMetricValue )\]**

- 参数1：currentMetricValue 表示当前的值
  
- 参数2：desiredMetricValue 表示期望的值
  
- 参数3：currentReplicas 表示当前的POD副本数
  
- 参数4：desiredReplicas 表示希望扩容后的POD副本数
  

比如：有一个负载，创建了一个POD，它当前CPU利用率是20%，我们期望它的利用率不要超过30%，即desiredMetricValue = 30%；当它业务激增到60%的时候，currentMetricValue = 60%；

那么这时，期望的POD数 = 1 * (60/30) = 2，HPA控制器就会启动扩容增加一个POD实例；这个POD启动后它能够分担业务流量，两个POD的CPU降低，不再扩容；如果这时两个POD的流量继续增加一倍，业务压力导致CPU继续飙升一倍，则期望的POD数继续翻倍为4；业务压力下降时，POD随之缩容。

在实际过程中，可能会遇到实例数值反复伸缩，导致集群震荡。为了保证稳定性，HPA controller从以下几个方面进行优化：：

- 冷却时间：在1.11版本以及之前的版本，社区引入了horizontal-pod-autoscaler-downscale-stabilization-window和horizontal-pod-autoScaler-upscale-stabilization-window这两个启动参数代表缩容冷却时间和扩容冷却时间，这样保证在冷却时间内，跳过扩缩容。1.14版本之后引入延迟队列，保存一段时间内每一次检测的决策建议，然后根据当前所有有效的决策建议来进行决策，从而保证期望的副本数尽量小的发生变更，保证稳定性。如，设置`downscaleWindow`的值为1m表示1分钟内不缩容,`upscaleWindow`的值为1m表示1分钟内不扩容。
  
- 忍受度：可以看成一个缓冲区，当实例变化范围在忍受范围之内的话，保持原有的实例数不变。
  
    比如：CPU缓冲区为30%-50%，表示当前CPU利用率在30%~50%之间时不会扩容缩容，只有低于30%时才会缩容，高于50%时才会扩容。
    

## 3\. 测试验证

分别创建CPU和内存策略演示。

### 3.1 创建工作负载

基于Nginx镜像创建无状态工作负载，副本数为1。负载`01-nginx-demo.yaml`内容如下：

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hpa-nginx
  template:
    metadata:
      labels:
        app: hpa-nginx
    spec:
      containers:
      - name: container-1
        image: 'xxx.xxx.xxx.com:80/public/nginx:x86-1.20.1'
        resources:
          limits:                  # limits与requests建议取值保持一致，避免扩缩容过程中出现震荡
            cpu: 500m
            memory: 200Mi
          requests:
            cpu: 500m
            memory: 200Mi
```

基于yaml资源文件创建负载deployment。

```bash
➜  kubectl apply -f deployment.yaml
deployment.apps/nginx configured
➜  kubectl get deploy
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
nginx   1/1     1            1           3m5s
➜  kubectl get po -l app=hpa-nginx -o wide
NAME                     READY   STATUS    RESTARTS   AGE    IP           NODE            NOMINATED NODE   READINESS GATES
nginx-5dbc9b8ddc-7wbc7   1/1     Running   0          2m6s   12.11.0.52   10.247.154.39   <none>           <none>
```

这里可见一个名为`nginx-5dbc9b8ddc-7wbc7`的POD已经在`running`了，其获取到一个集群内部IP`12.11.0.52`。接下来创建一个HPA策略，并逐步增加该POD的CPU负载触发HPA弹性。

### 3.2 创建CPU相关HPA策略

创建HPA策略，如下所示。

hpa-demo.yaml：

```yaml
apiVersion: autoscaling/v2beta1
kind: HorizontalPodAutoscaler
metadata:
  name: hpa-example
  annotations:
    extendedhpa.metrics: '[{"type":"Resource","name":"cpu","targetType":"Utilization","targetRange":{"low":"40","high":"55"}}]'
    extendedhpa.option: '{"downscaleWindow":"1m","upscaleWindow":"1m"}'
  name: hpa-example
  namespace: default
spec:
  scaleTargetRef:
    kind: Deployment
    name: nginx
    apiVersion: apps/v1
  minReplicas: 1
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        targetAverageUtilization: 50
```

该策略关联了名为`nginx`的Deployment，期望CPU使用率为`50%`： targetAverageUtilization 为50。指明了最大副本数`maxReplicas`为100，最小副本数为`minReplicas`为1。

另外有两条注解`annotations`，一条是CPU的阈值范围，最低40，最高55，表示CPU使用率在40%到55%之间时，不会扩缩容，防止小幅度波动造成影响。另一条是扩缩容时间窗，表示策略成功触发后，在缩容/扩容冷却时间内，不会再次触发缩容/扩容，以防止短期波动造成影响。

如果这条HPA策略生效了，那什么时候扩容缩容呢？根据上面的公式：**desiredReplicas = ceil\[currentReplicas * ( currentMetricValue / desiredMetricValue )\]**

可知：

1）只有当CPU利用率超过55%的时候，会扩容；只有当CPU利用率低于40%的时候会缩容；

2）如果POD当前CPU利用率为70%时，根据上面的公式计算期望的POD数 =ceil\[ 1 x（70/50) \] = ceil\[1.4\]，向下取整为1，不扩容，当CPU超过75%时，期望的POD数 = ceil \[1 x (75/50)\] = 1.5，向上取整为2，扩容一个POD。当POD的CPU利用率低于40%会考虑缩容，如CPU利用率为20%，根据上面的公式计算期望的POD数 = ceil\[ 1 x (20/50) \] = ceil\[0.4\] < 1，会缩容一个POD。

3）扩容缩容后的1分钟内不会再次扩容缩容，防止POD数频繁变化，引起震荡。

创建HPA策略。

```bash
➜  kubectl apply -f hpa-demo.yaml
horizontalpodautoscaler.autoscaling/hpa-example configured
➜  kubectl get hpa
NAME          REFERENCE                TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
hpa-example   Deployment/hpa-example   <unknown>/50%   1         100       0          5s
➜  kubectl get hpa
NAME          REFERENCE                TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
hpa-example   Deployment/hpa-example   0%/50%    1         100       1          44s
```

HPA策略创建成功后，短暂时刻内获取不到指标，显示的TARGETS为`unknown`，片刻后数字变为`0`。 也可通过`kubectl top`命令检查Node与POD指标是否能正常获取：

```bash
➜  kubectl top node #检查Node节点指标
NAME             CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
10.247.154.106   1383m        35%    4644Mi          80%
10.247.154.147   1240m        31%    4232Mi          73%
10.247.154.161   1184m        30%    3275Mi          56%
10.247.154.39    1348m        34%    3268Mi          56%
➜  kubectl top pod -l app=hpa-example  #检查POD指标
NAME                     CPU(cores)   MEMORY(bytes)
nginx-5dbc9b8ddc-7wbc7   0m           3Mi
```

可见当前的POD - nginx-5dbc9b8ddc-7wbc7的CPU利用率为0个M，接下来进入POD内部，模拟增加CPU负荷来触发HPA。

### 3.3 增加POD的CPU负载触发HPA弹性

下面命令会创建 CPU 负荷，方法是通过压缩随机数据并将结果发送到 /dev/null：

```bash
cat /dev/urandom | gzip -9 > /dev/null
```

如果想要更大的负荷，或者系统有多个核，那么只需要对数据进行压缩和解压就行了，像这样：

```bash
cat /dev/urandom | gzip -9 | gzip -d | gzip -9 | gzip -d > /dev/null
```

可按下 CTRL+C 来终止上面的进程。

我们进入单个POD `nginx-5dbc9b8ddc-7wbc`里，执行上面的命令，模拟CPU负载增加，触发HPA控制器扩容POD。同时观察hpa扩容情况，很快扩容出一个POD `nginx-5dbc9b8ddc-qbmk9`了。

```bash
➜   kubectl get hpa hpa-example --watch #观察hpa控制器扩缩容动作
NAME          REFERENCE          TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
hpa-example   Deployment/nginx   0%/50%    1         100       1          49d
hpa-example   Deployment/nginx   99%/50%   1         100       1          49d
hpa-example   Deployment/nginx   100%/50%   1         100       1          49d
hpa-example   Deployment/nginx   100%/50%   1         100       2          49d
hpa-example   Deployment/nginx   50%/50%    1         100       2          49d
hpa-example   Deployment/nginx   49%/50%    1         100       2          49d
hpa-example   Deployment/nginx   50%/50%    1         100       2          49d


➜  kubectl get po -l app=hpa-nginx #获取负载pod情况
NAME                     READY   STATUS    RESTARTS   AGE
nginx-5dbc9b8ddc-7wbc7   1/1     Running   0          3h13m
nginx-5dbc9b8ddc-qbmk9   1/1     Running   0          95s


➜  kubectl top po -l app=hpa-nginx  #获取负载pod的指标
NAME                     CPU(cores)   MEMORY(bytes)
nginx-5dbc9b8ddc-7wbc7   501m         5Mi
nginx-5dbc9b8ddc-qbmk9   0m           3Mi

```

由于这里只是进入到第一个POD里模拟CPU负载增加，所以只有第一个POD的CPU增加，第二个并没有增加，如果这时终止CPU负载增加命令后，1分钟后会看到第二个POD会被缩容掉。

```bash
➜  kubectl get hpa hpa-example --watch
NAME          REFERENCE          TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
hpa-example   Deployment/nginx   0%/50%    1         100       1          49d
hpa-example   Deployment/nginx   99%/50%   1         100       1          49d
hpa-example   Deployment/nginx   100%/50%   1         100       1          49d
hpa-example   Deployment/nginx   100%/50%   1         100       2          49d
hpa-example   Deployment/nginx   50%/50%    1         100       2          49d
hpa-example   Deployment/nginx   49%/50%    1         100       2          49d
hpa-example   Deployment/nginx   50%/50%    1         100       2          49d
hpa-example   Deployment/nginx   50%/50%    1         100       2          49d
hpa-example   Deployment/nginx   0%/50%     1         100       2          49d
hpa-example   Deployment/nginx   0%/50%     1         100       2          49d
hpa-example   Deployment/nginx   0%/50%     1         100       1          49d
```

### 3.4 增加POD的内存负载触发HPA弹性

内存指标跟CPU负载类似，在yaml中添加mem字段即可，hpa-demo.yaml如下：

```yaml
apiVersion: autoscaling/v2beta1
kind: HorizontalPodAutoscaler
metadata:
  name: hpa-example
  annotations:
    extendedhpa.metrics: '[{"type":"Resource","name":"cpu","targetType":"Utilization","targetRange":{"low":"40","high":"55"}},{"type":"Resource","name":"memory","targetType":"Utilization","targetRange":{"low":"40","high":"55"}}]'
    extendedhpa.option: '{"downscaleWindow":"1m","upscaleWindow":"1m"}'
  name: hpa-example
  namespace: default
spec:
  scaleTargetRef:
    kind: Deployment
    name: nginx
    apiVersion: apps/v1
  minReplicas: 1
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        targetAverageUtilization: 50
    - type: Resource
      resource:
        name: memory
        targetAverageUtilization: 50
```

上面的声明指定HPA策略为：CPU在40%-55%之间不做扩缩容，内存在40%-55%之间不扩缩容，超出阈值时，根据计算公式desiredReplicas = ceil\[currentReplicas * ( currentMetricValue / desiredMetricValue )\]，扩容POD或者缩容POD。

更新该HPA策略。

```bash
➜  kubectl apply -f hpa-demo.yaml
```

模拟内存占用触发HPA策略。内存的模拟有几种方式：

1）常用的方法为通过mount命名将RAMFS文件系统挂载到一个目录，这个文件系统是内存型文件系统，通过dd命令往挂载目录里写大文件就会增加内存使用率。如：

```bash
mkdir z
mount -t ramfs ramfs z/
dd if=/dev/zero of=z/file bs=1M count=128 #使用 dd 在该目录下创建一个 128M 的文件
```

2）通过`stress` 工具和 [`lookbusy`](http://www.devin.com/lookbusy/) 工具实现精准、可控和易用的控制。

如：

```bash
stress --cpu 2 # 产生 2 个工作进程对 CPU 施加压力，也就是将会占用两个 CPU 核心
stress --vm 1 --vm-bytes 128M --vm-hang 0 # 产生 1 个工作进程，占用 128MB 内存并保持
stress --io 1 # 产生 1 个工作进程对 IO 施加压力
lookbusy -c 50 # 占用所有 CPU 核心各 50%
lookbusy -c 50 -n 2 # 占用两个 CPU 核心各 50%
lookbusy -c 50-80 -r curve # 占用所有 CPU 核心在 50%-80% 左右浮动

lookbusy -c 0 -m 128MB -M 1000 # 每 1000 毫秒，循环释放并分配 128MB 内存
lookbusy -c 0 -d 1GB -b 1MB -D 10 # 每 10 毫秒，循环进行 1MB 磁盘写入，临时文件不超过 1GB

#以上命令的参数均可结合使用，同时对系统多个维度施加压力。
```

这两种方法都可以单纯模拟内存增加，但是方法1需要在容器内部mount volume，需修改docker启动方式时加上`--privileged`，方法2又需要在容器镜像中安装stress和lookbusy工具，比较麻烦不单独演示。

### 3.5 暴露服务并循环访问服务触发HPA

给pod加上一个service，在集群内部通过service作为前端接入分流到POD上。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
  labels:
    app: nginx-svc
spec:
  ports:
  - port: 8080
    targetPort: 80
    protocol: TCP
    name: http
  - port: 443
    protocol: TCP
    name: https
  selector:
    app: hpa-nginx  #这里与上面的pod的labels要一致
```

创建并查询服务：

```bash
➜  kubectl apply -f service.yaml
service/nginx-svc created

➜  kubectl get po -l app=hpa-nginx -o wide
NAME                     READY   STATUS    RESTARTS   AGE     IP            NODE             NOMINATED NODE   READINESS GATES
nginx-58c7b6bf67-fs6nn   1/1     Running   0          13m     12.11.0.121   10.247.154.161   <none>           <none>

➜  kubectl get svc -l app=hpa-nginx -o wide
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)            AGE   SELECTOR
nginx-svc    ClusterIP   12.12.232.122   <none>        8080/TCP,443/TCP   12h   app=hpa-nginx
```

在集群节点上模拟循环访问该service触发HPA扩容。

```bash
➜  while true;do wget -q -O-  http://12.12.232.122:8080; done
```

由于模拟过程中CPU利用率一直不会冲高很多，所以我们将HPA策略中的target阈值调整一下,改为最低20%，最高30%，期望值为25%，改完再观察HPA伸缩过程：

```bash
➜  kubectl get hpa hpa-example --watch
NAME          REFERENCE          TARGETS          MINPODS   MAXPODS   REPLICAS   AGE
hpa-example   Deployment/nginx   2%/49%, 0%/50%   1         100       1          49d
hpa-example   Deployment/nginx   2%/49%, 0%/50%   1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, <unknown>/50%   1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 0%/50%          1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 0%/50%          1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 54%/50%         1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 0%/50%          1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 0%/25%          1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 36%/25%         1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 36%/25%         1         100       1          49d
hpa-example   Deployment/nginx   0%/49%, 30%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 16%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 22%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 19%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 24%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 16%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 20%/25%         1         100       2          49d

```

可见一会儿pod副本从1变为2，如果停止循环访问服务，约1分钟后POD副本数将为1。

```bash
kubectl get hpa hpa-example --watch
NAME          REFERENCE          TARGETS          MINPODS   MAXPODS   REPLICAS   AGE
hpa-example   Deployment/nginx   2%/49%, 0%/50%   1         100       1          49d
hpa-example   Deployment/nginx   2%/49%, 0%/50%   1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, <unknown>/50%   1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 0%/50%          1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 0%/50%          1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 54%/50%         1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 0%/50%          1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 0%/25%          1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 36%/25%         1         100       1          49d
hpa-example   Deployment/nginx   1%/49%, 36%/25%         1         100       1          49d
hpa-example   Deployment/nginx   0%/49%, 30%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 16%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 22%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 19%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 24%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 16%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 20%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 18%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 23%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 22%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 28%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 26%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 24%/25%         1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 0%/25%          1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 0%/25%          1         100       2          49d
hpa-example   Deployment/nginx   1%/49%, 0%/25%          1         100       1          49d
```

最后一条log显示已经POD数已经将为1了。

---
全文完。