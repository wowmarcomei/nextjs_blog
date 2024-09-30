
## 1、原理

通过K8s的亲和性和反亲和性设置，可以将POD在节点间调度。

- 亲和性（affinity）：将多个POD部署在同一个节点上，容器间通信无需转发路由，减少网络消耗。
- 反亲和性（anti-affinity）：将多个POD部署在不同节点上，满足业务容灾冗余需求，比如节点1挂了，节点2的POD还能提供服务。不过，K8s本身也会在pod消亡时自动寻找节点部署业务。

亲和与反亲和有两种条件：

- 必须满足： 即硬约束，关键字为requiredDuringSchedulingIgnoredDuringExecution。
- 尽量满足： 即软约束，关键字为preferredDuringSchedulingIgnoredDuringExecution。

除此之外，还有几个关键概念：

● 拓扑域： 即`topologyKey`，拓扑域通过设置工作节点的标签，包含默认和自定义标签，用于指定调度时作用域。比如`topologyKey: failure-domain.beta.kubernetes.io/zone`指的拓扑域是AZ域，`topologyKey: kubernetes.io/hostname`指的拓扑域是主机。

● 选择器： 对应于`matchExpressions`，可以添加多条选择器，多条选择器之间是一种“与”的关系，即需要满足全部选择器才能依据此条规则进行调度。

● 标签名： 对应应用组件的标签，您可以使用默认标签app或者使用自定义标签。

● 匹配关系： 即操作符，可以设置四种匹配关系（In, NotIn, Exists, DoesNotExist）。 In和NotIn操作符可以添加单个值或者多个value值（多值使用；进行划分）， Exists和DoesNotExist判断某个label是否存在，不需设置value值。

## 2、方案

### 2.1、前提

确保 K8S 纳管节点分布在不同的可用区（至少 2 个可用区）。比如：我们需要4 台节点，则确保2台在 AZ1、另外2台在 AZ2。

![node-location-1](https://laomeinote.com/images/posts/node-location-1.png)

节点纳管后可查看其标签信息：

```bash
➜ kubectl describe node
Name:               10.x.154.106
Roles:              <none>
Labels:             beta.kubernetes.io/arch=amd64
                    beta.kubernetes.io/instance-type=Si3.xlarge.2
                    beta.kubernetes.io/os=linux
                    failure-domain.beta.kubernetes.io/region=cn-southwest-1
                    failure-domain.beta.kubernetes.io/zone=cn-southwest-1a
                    kubernetes.io/arch=amd64
                    kubernetes.io/hostname=10.x.154.106
                    kubernetes.io/os=linux
                    node.kubernetes.io/baremetal=false
                    node.kubernetes.io/container-engine=docker
                    node.kubernetes.io/instance-type=Si3.xlarge.2
                    node.kubernetes.io/subnetid=0b809883-9c99-4b67-a6ca-5c1a948a5def
                    os.architecture=amd64
                    os.name=EulerOS_2.0_SP9x86_64
                    os.version=4.18.0-147.5.1.6.h541.eulerosv2r9.x86_64
                    topology.kubernetes.io/region=cn-southwest-1
                    topology.kubernetes.io/zone=cn-southwest-1a
```

其中：

- 节点所在区域：
  - Key：failure-domain.beta.kubernetes.io/region
  - Value：cn-southwest-1
- 节点所在可用区：
  - Key：failure-domain.beta.kubernetes.io/zone
  - Value：cn-southwest-1a，a表示az1，b表示az2，c表示az3
- 节点的主机名：
  - Key：kubernetes.io/hostname
  - Value：10.x.154.106

### 2.2、反亲和性设置

创建一个无状态组件，设置反亲和性，这里均采用软约束尽量满足。

![pod-antiaffinity-1](https://laomeinote.com/images/posts/pod-antiaffinity-1.png)



创建成功后可见7个实例能分在两个AZ的4个节点上。

![pod-antiaffinity-instance](https://laomeinote.com/images/posts/pod-antiaffinity-instance.png)

尝试将节点之间的调度用硬约束，AZ之间的约束用软约束，通过定义yaml来实现，定义一个`pod-antiaffinity.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-pod-affinity-test
spec:
  selector:
    matchLabels:
      app: nginx-pod-affinity-test
  replicas: 5
  template:
    metadata:
      labels:
        app: nginx-pod-affinity-test
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - nginx-pod-affinity-test
              topologyKey: failure-domain.beta.kubernetes.io/zone
            weight: 50
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - nginx-pod-affinity-test
            topologyKey: kubernetes.io/hostname
      containers:
      - name: nginx-pod-affinity-test
        image: xxxx.xxx.xxx.com:80/public/nginx:x86-1.20.1
        imagePullPolicy: IfNotPresent
```

这里的实例个数为5，实际上集群的计算节点只有4个，AZ只有两个，apply观察一下结果：

```bash
➜ kubectl get deploy
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
nginx-pod-affinity-test     4/5     5            4           33m
```

可见期望5个实例只起来了4个，查看一下POD实例：

```bash
➜ kubectl get po -l app=nginx-pod-affinity-test
NAME                                       READY   STATUS    RESTARTS   AGE
nginx-pod-affinity-test-688d8f5fb5-44h4h   1/1     Running   0          35m
nginx-pod-affinity-test-688d8f5fb5-9sddx   0/1     Pending   0          35m
nginx-pod-affinity-test-688d8f5fb5-f2qxn   1/1     Running   0          35m
nginx-pod-affinity-test-688d8f5fb5-nbzft   1/1     Running   0          35m
nginx-pod-affinity-test-688d8f5fb5-zfdqb   1/1     Running   0          35m

➜ kubectl describe po nginx-pod-affinity-test-688d8f5fb5-9sddx
Name:           nginx-pod-affinity-test-688d8f5fb5-9sddx
Namespace:      default
Priority:       0
Node:           <none>
Labels:         app=nginx-pod-affinity-test
                pod-template-hash=688d8f5fb5
Annotations:    kubernetes.io/psp: psp-global
Status:         Pending
IP:
IPs:            <none>
Controlled By:  ReplicaSet/nginx-pod-affinity-test-688d8f5fb5
Containers:
  nginx-pod-affinity-test:
    Image:      xxxx.xxx.xxx.com:80/public/nginx:x86-1.20.1
    Port:       <none>
    Host Port:  <none>
    Environment:
      VMPORT:  []
      VMIP:     (v1:status.hostIP)
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-47g7m (ro)
Conditions:
  Type           Status
  PodScheduled   False
Volumes:
  default-token-47g7m:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-47g7m
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                 node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason             Age                 From                Message
  ----     ------             ----                ----                -------
  Warning  FailedScheduling   36m                 default-scheduler   0/4 nodes are available: 4 node(s) didn't match pod affinity/anti-affinity, 4 node(s) didn't match pod anti-affinity rules.
  Warning  FailedScheduling   36m                 default-scheduler   0/4 nodes are available: 4 node(s) didn't match pod affinity/anti-affinity, 4 node(s) didn't match pod anti-affinity rules.
  Normal   NotTriggerScaleUp  2s (x217 over 36m)  cluster-autoscaler  pod didn't trigger scale-up (it wouldn't fit if a new node is added):
```

提示第5个POD创建不出来，因为上面的策略定义的是POD硬约束在每个节点上分开，期望5个POD就需要5个节点，然而我们只有4个节点，所以第五个是创建不出来的。修改下策略为软约束：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-pod-affinity-test
spec:
  selector:
    matchLabels:
      app: nginx-pod-affinity-test
  replicas: 5
  template:
    metadata:
      labels:
        app: nginx-pod-affinity-test
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - nginx-pod-affinity-test
              topologyKey: failure-domain.beta.kubernetes.io/zone
            weight: 50
          - podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - nginx-pod-affinity-test
              topologyKey: kubernetes.io/hostname
            weight: 50
      containers:
      - name: nginx-pod-affinity-test
        image: xxxx.xxx.xxx.com:80/public/nginx:x86-1.20.1
        imagePullPolicy: IfNotPresent
```

部署并查看POD实例：

```bash
➜ kubectl apply -f pod-affinity/pod-affinity.yaml
deployment.apps/nginx-pod-affinity-test created
➜  kubectl get deploy
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
nginx-pod-affinity-test     5/5     5            5           5s

➜ kubectl get po -l app=nginx-pod-affinity-test -o wide
NAME                                       READY   STATUS    RESTARTS   AGE   IP            NODE             NOMINATED NODE   READINESS GATES
nginx-pod-affinity-test-8545c897c6-5ckjt   1/1     Running   0          93s   12.11.0.78    10.x.154.106   <none>           <none>
nginx-pod-affinity-test-8545c897c6-6svzj   1/1     Running   0          93s   12.11.0.122   10.x.154.161   <none>           <none>
nginx-pod-affinity-test-8545c897c6-hz2dp   1/1     Running   0          93s   12.11.0.57    10.x.154.39    <none>           <none>
nginx-pod-affinity-test-8545c897c6-ltc8w   1/1     Running   0          93s   12.11.0.104   10.x.154.147   <none>           <none>
nginx-pod-affinity-test-8545c897c6-q2m9h   1/1     Running   0          93s   12.11.0.58    10.x.154.39    <none>           <none>
```

5个实例分在两个AZ的5个节点上了。修改实例个数为12个看看。

```bash
➜ kubectl edit deploy nginx-pod-affinity-test
deployment.apps/nginx-pod-affinity-test edited
➜ kubectl get po -l app=nginx-pod-affinity-test -o wide
kubectl get po -l app=nginx-pod-affinity-test -o wide
NAME                                       READY   STATUS    RESTARTS   AGE     IP            NODE             NOMINATED NODE   READINESS GATES
nginx-pod-affinity-test-8545c897c6-5ckjt   1/1     Running   0          6m26s   12.11.0.78    10.x.154.106   <none>           <none>
nginx-pod-affinity-test-8545c897c6-6svzj   1/1     Running   0          6m26s   12.11.0.122   10.x.154.161   <none>           <none>
nginx-pod-affinity-test-8545c897c6-bgt4c   1/1     Running   0          50s     12.11.0.84    10.x.154.106   <none>           <none>
nginx-pod-affinity-test-8545c897c6-f7hbt   1/1     Running   0          50s     12.11.0.128   10.x.154.147   <none>           <none>
nginx-pod-affinity-test-8545c897c6-hz2dp   1/1     Running   0          6m26s   12.11.0.57    10.x.154.39    <none>           <none>
nginx-pod-affinity-test-8545c897c6-j4tlk   1/1     Running   0          50s     12.11.0.61    10.x.154.39    <none>           <none>
nginx-pod-affinity-test-8545c897c6-l7fvd   1/1     Running   0          50s     12.11.0.125   10.x.154.161   <none>           <none>
nginx-pod-affinity-test-8545c897c6-ltc8w   1/1     Running   0          6m26s   12.11.0.104   10.x.154.147   <none>           <none>
nginx-pod-affinity-test-8545c897c6-t62h7   1/1     Running   0          50s     12.11.0.127   10.x.154.161   <none>           <none>
nginx-pod-affinity-test-8545c897c6-w4rws   1/1     Running   0          50s     12.11.0.126   10.x.154.161   <none>           <none>
nginx-pod-affinity-test-8545c897c6-wbgvc   1/1     Running   0          50s     12.11.0.60    10.x.154.39    <none>           <none>
nginx-pod-affinity-test-8545c897c6-wtvvx   1/1     Running   0          50s     12.11.0.102   10.x.154.147   <none>           <none>
```

四个节点上的POD分布如下：

| AZ   | 节点IP | POD个数 |
| ---- | ------ | ------- |
| AZ1  |   10.x.154.147     |   3      |
| AZ1  |   10.x.154.106     |   2      |
| AZ2  |   10.x.154.161     |   4     |
| AZ2  |   10.x.154.39     |    3     |

---
全文完。