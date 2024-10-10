---
title: 13-容器数据持久化存储
date: 2022-04-08 20:19:21
updated: 2022-04-08 20:19:21
categories: 
  - 技术笔记
description: 通常容器的生命周期是不固定的、甚至是比较短的，但是它生成的数据可能是有价值的需要长期保存的，即持久化存储。在Kubernetes中持久化存储主要通过PV与PVC来实现。
tags: 
  - K8s
  - Kubernetes
  - CloudNative
image: /images/kubernetes.png
keywords: kubernetes,k8s,持久化,存储,数据
---
通常容器的生命周期是不固定的、甚至是比较短的，但是它生成的数据可能是有价值的需要长期保存的，即持久化存储。在Kubernetes中持久化存储主要通过PV与PVC来实现。

- PV：`PersistentVolume`（持久化卷）。
- PVC：`PersistentVolumeClaim`（持久化卷声明）。

PVC与PV的关系类似于POD与节点的关系，**PVC消耗的是PV资源，POD消耗的是节点资源**。一般来讲，是资源管理员或者SRE运维团队提前创建好PV存储资源，然后开发团队通过PVC来声明使用PV资源（是有点麻烦了）。

除了上面的两个基本资源对象以外，Kubernetes还引入了一个 `StorageClass`对象，这样就可以对存储进行分类，比如是快存储还是慢存储，是块存储、文件存储还是对象存储，是AWS的还是其他厂家的存储；同时通过 `StorageClass`对象，Kubernetes就可以自动创建PV了，不需要管理员提前创建好PV再给开发成员通过PVC声明使用。

也即是说持久化存储最终是通过PV来实现的，但是细化到具体存储资源，其实是多样化的，可以是Kubernetes主机本身的节点上挂载的磁盘，也可以是外部各类存储（块存储、文件存储、对象存储）。

来看看几种场景：

1. 场景1 -- 容器生成可读写的数据，但无需持久化存储场景：Kubernetes提供的方案是 `emptyDir`，POD或Deployment的声明中不需要指定具体节点路径，在POD创建的那一刻起，kubernetes自动在POD调度的节点上创建一个目录给POD使用，当POD注销的时候该目录也会被kubernetes清除掉，这显然没有达到持久化存储的目的，因为 `emptyDir`的生命周期与POD一样长，POD很可能多次重启，那么相应的 `emptyDir`里的数据也会被多次清除。

   > 注：`emptyDir`的生命周期与POD一致，但是POD里的容器与 `emptyDir`不一致，因为POD里可能有多个容器。
   >
2. 场景2 -- 容器生成可读写的数据，需要持久化保存，但是需要最佳的读写速度：虽然外挂存储也可满足要求，但是性能肯定比不上节点本身的磁盘，这种场景下，Kubernetes提供的是 `hostpath`资源对象，POD或Deployment的声明中指明节点的具体路径为POD存放数据的地方，它的生命周期跟POD本身无关，即使POD挂了重启了hostpath数据也不会丢的。

   > 显然，hostpath其实也有局限，POD重启后可能会被调度到其他节点上去，之前存在当前节点上的数据，无法被重启后的POD读取到。
   >
3. 场景3 -- 容器生成可读写的数据，需要持久化保存与最佳的读写速度，同时POD重启后依然能正常读写： 针对上面的场景2，Kubernetes提供的解决方案是 `local PV`，其实原理也很简单，就是 `hostpath + nodeaffinity`，就是告诉POD在重启后亲和到跟local PV的节点上去。
4. 场景4 -- 无需资源管理员提前创建PV，应用方（开发成员)可直接使用持久化存储的场景： 这种场景下使用 `StorageClass`即可。

下面针对这几种场景做下测试：

## 场景1 - emptyDir

创建一个pod，包含一个nginx容器与一个busybox容器。在nginx中的emptyDir中写入一个文件，可被busybox容器查看，在主机上也可到目录下查看，随着POD的注销，目录及其数据也会被删除。

emptydir-pod.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-emptydir
  namespace: default
spec:
  containers:
  - name: myapp-pod
    image: kweecr03.xxx.xxx.com:80/public/nginx:x86-1.20.1
    imagePullPolicy: IfNotPresent
    volumeMounts:
    - mountPath: /cache
      name: cache-volume
  - name: busybox-pod
    image: kweecr03.xxx.xxx.com:80/repo-mxh/busybox:v1.0
    imagePullPolicy: IfNotPresent
    command: ["/bin/sh", "-c", "sleep 3600"]
    volumeMounts:
    - mountPath: /test/cache
      name: cache-volume
  imagePullSecrets:
  - name: myregcred
  volumes:
  - name: cache-volume
    emptyDir: {}

```

> 说明：之所以加了secret对象，是因为上面的镜像在我的私仓里，需要secret访问才行。

这个pod中创建了一个名为 `cache-volume`的**emptyDir**，这个volume被挂载到两个容器中。apply生成pod：

```bash
# 创建pod
$ kubectl apply -f emptydir.yaml
pod/pod-emptydir created

$ kubectl get po
NAME                                 READY   STATUS    RESTARTS   AGE
pod-emptydir                         2/2     Running   0          9s

#进入到nginx的pod中在挂载的emptyDir目录下创建123.txt文件
$ kubectl exec -it pod-emptydir -c myapp-pod -- sh
# ls
bin  boot  cache  dev  docker-entrypoint.d  docker-entrypoint.sh  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
# cd cache
# touch 123.txt
# ls
123.txt
# exit

#进入到busybox的pod中，可查看到nginx容器创建的文件
$ kubectl exec -it pod-emptydir -c busybox-pod -- sh
/ # ls
bin   dev   etc   home  proc  root  sys   test  tmp   usr   var
/ # cd /test/cache/
/test/cache # ls
123.txt
/test/cache # exit

#获取容器ID
$ kubectl describe pod pod-emptydir | grep "Container ID"
    Container ID:   docker://208dab7448336f9da697b173d2b08cb99e4a98cef76e913f91d9c69ce962903b
    Container ID:  docker://986a9124b282b7e31be681c6695e2441b469b226c87441a97c68d5da5019658b
```

通过获取到的容器ID，进入节点上查找Kubernetes创建的目录。

```bash
$ docker inspect 208dab7448336f9da697b173d2b08cb99e4a98cef76e913f91d9c69ce962903b | grep volume
                "/mnt/paas/kubernetes/kubelet/pods/1759becf-5396-4e4c-828f-d256e43475e5/volumes/kubernetes.io~empty-dir/cache-volume:/cache",
                "/mnt/paas/kubernetes/kubelet/pods/1759becf-5396-4e4c-828f-d256e43475e5/volumes/kubernetes.io~secret/default-token-47g7m:/var/run/secrets/kubernetes.io/serviceaccount:ro",
                "Source": "/mnt/paas/kubernetes/kubelet/pods/1759becf-5396-4e4c-828f-d256e43475e5/volumes/kubernetes.io~empty-dir/cache-volume",
                "Source": "/mnt/paas/kubernetes/kubelet/pods/1759becf-5396-4e4c-828f-d256e43475e5/volumes/kubernetes.io~secret/default-token-47g7m",

#进入节点上Kubernetes创建给pod的emptyDir的目录中
$ cd /mnt/paas/kubernetes/kubelet/pods/1759becf-5396-4e4c-828f-d256e43475e5/volumes/kubernetes.io~empty-dir/cache-volume/
$ ls
123.txt
```

将pod删除，再次查看文件。

```bash
$ kubectl delete po pod-emptydir
pod "pod-emptydir" deleted
```

查看节点的目录与文件信息：

```bash
$ ll /mnt/paas/kubernetes/kubelet/pods/1759becf-5396-4e4c-828f-d256e43475e5/volumes/kubernetes.io~empty-dir/cache-volume/
ls: cannot access '/mnt/paas/kubernetes/kubelet/pods/1759becf-5396-4e4c-828f-d256e43475e5/volumes/kubernetes.io~empty-dir/cache-volume/'
```

可见，随着POD的消亡，Kubernetes通过emptyDir在主机上创建的数据也被删除掉了。

## 场景2 - hostpath

对于hostpath，其本质是PV与PVC，PV有几个属性需要关注：

- Capacity（存储能力）：一般来说，一个 PV 对象都要指定一个存储能力，通过 PV 的 `capacity` 属性来设置的，目前只支持存储空间的设置，就是我们这里的 `storage=10Gi`，不过未来可能会加入 `IOPS`、吞吐量等指标的配置。
- AccessModes（访问模式）：用来对 PV 进行访问模式的设置，用于描述用户应用对存储资源的访问权限，访问权限包括下面几种方式：

  - ReadWriteOnce（RWO）：读写权限，但是只能被单个节点挂载
  - ReadOnlyMany（ROX）：只读权限，可以被多个节点挂载
  - ReadWriteMany（RWX）：读写权限，可以被多个节点挂载
- RECLAIM POLICY（回收策略）：是指PV删除后的数据是清除，还是保留等，主要有以下三种：

  - Retain（保留）：保留数据，需要管理员手工清理数据
  - Recycle（回收）：清除 PV 中的数据，效果相当于执行 `rm -rf /thevolume/*`
  - Delete（删除）：与 PV 相连的后端存储完成 volume 的删除操作，当然这常见于云服务商的存储服务
- STATUS（状态）：指的是PV的生命周期，可能会处于4种不同的阶段：

  - Available（可用）：表示可用状态，还未被任何 PVC 绑定
  - Bound（已绑定）：表示 PVC 已经被 PVC 绑定
  - Released（已释放）：PVC 被删除，但是资源还未被集群重新声明
  - Failed（失败）： 表示该 PV 的自动回收失败

OK，有了上面的概念后，来创建一个PV、PVC与POD。

**pod-pvc-pv.yaml**

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-hostpath
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/data/k8s/test/hostpath"

---  
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-hostpath
spec:
  storageClassName: manual
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi

---
apiVersion: v1
kind: Pod
metadata:
  name: pv-hostpath-pod
spec:
  volumes:
  - name: pv-hostpath
    persistentVolumeClaim:
      claimName: pvc-hostpath
  containers:
  - name: task-pv-container
    image: kweecr03.xxx.xxx.com:80/public/nginx:x86-1.20.1
    ports:
    - containerPort: 80
    volumeMounts:
    - mountPath: "/usr/share/nginx/html"
      name: pv-hostpath
```

在上面的定义中，PV是首先声明的，然后再声明PVC，可以看到PVC的定义里并没有指定需要哪个名字的PV。**其实在Kubernetes创建PVC后，会自动查看满足声明的PV，比如 `storageClassName`、`accessModes` 以及容量这些是否满足要求，如果满足要求就会将 PV 和 PVC 绑定在一起**。

在POD的定义中，使用具体PVC，名字就是前面定义的PVC的名字。然后apply生成资源测试。

```bash
$ kubectl apply -f pod-pvc-pv.yaml
persistentvolume/pv-hostpath created
persistentvolumeclaim/pvc-hostpath created
pod/pv-hostpath-pod created

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM                                STORAGECLASS   REASON   AGE
pv-hostpath                                10Gi       RWO            Retain           Bound      default/pvc-hostpath                 manual                  33s

$ kubectl get pvc
NAME           STATUS   VOLUME        CAPACITY   ACCESS MODES   STORAGECLASS   AGE
pvc-hostpath   Bound    pv-hostpath   10Gi       RWO            manual         36s

$ kubectl get pod
NAME                                 READY   STATUS    RESTARTS   AGE
pv-hostpath-pod                      1/1     Running   0          38s

$ kubectl describe po pv-hostpath-po
... ##省略
Containers:
  task-pv-container:
    Container ID:   docker://eead5bc53e345e7ec9e0c8a99d5441ddcf597edec4a6d434bdc70304ce0fe186
    Image:          kweecr03.xxx.xxx.com:80/public/nginx:x86-1.20.1
    Image ID:       docker-pullable://kweecr03.xxx.xxx.com:80/public/nginx@sha256:56cbb3c9ada0858d69d19415039ba2aa1e9b357ba9aa9c88c73c30307aae17b0
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Wed, 13 Apr 2022 20:15:08 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /usr/share/nginx/html from pv-hostpath (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-47g7m (ro)
... ##省略
Volumes:
  pv-hostpath:
    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)
    ClaimName:  pvc-hostpath
    ReadOnly:   false
... ##省略


$ kubectl exec -it pv-hostpath-pod -- sh
# ls -l /usr/share/nginx/html
total 4
-rw------- 1 root root 10 Apr  2 10:53 test.txt
```

可见PV是10Gi大小，虽然声明了3Gi容量，但是比它大的PV也可满足要求，PVC与PV完成了Bound绑定。节点的volume被mount的目录为 `/usr/share/nginx/html`。这个目录下有一个test.txt文件，是提前在节点创建目录写下的。查看节点文件：

```bash
# ll /data/k8s/test/hostpath
total 4
-rw------- 1 root root 10 Apr  2 10:53 test.txt
```

节点上目录与文件内容与容器挂载内容是一致的，符合预期。**另外有一点需要额外注意：hostpath需要提前在节点上创建好对应的目录，否则会创建失败**。

## 场景3 - local PV

上面提到，local PV其实类似于 Hostpath + nodeAffinity，使得POD即使重启了也会调度到与hostpath一样的节点上。但是还需要注意的是PVC要等到POD创建时才去关联PV，而不能在PVC创建时立刻关联PV，避免POD因为关联到已经绑定到节点上去了导致POD创建失败的问题，这里就需要用到StorageClass的延迟绑定特性。

**pod-localPV.yaml**

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-local
spec:
  capacity:
    storage: 5Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:  #local字段来指定为local-pv
    path: /data/k8s/localpv  # 集群node1节点上的目录，需要提前创建好该目录
  nodeAffinity:  # 加入亲和性设置
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - 10.247.154.19  # 集群node1节点的名字

---
# 如果pod被调度到其他非节点1的节点上去了，POD引用的PVC却在节点1上，因为PVC已经与节点1的PV绑定了，所以这会导致POD因为PVC的原因调度失败
# 所以可引用Kubernetes的StorageClass指定延迟绑定WaitForFirstConsumer，等待POD被调度后才对PVC绑定PV
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer

---
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: pvc-local
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: local-storage   

---
apiVersion: v1
kind: Pod
metadata:
  name: pv-local-pod
spec:
  volumes:
  - name: example-pv-local
    persistentVolumeClaim:
      claimName: pvc-local
  containers:
  - name: example-pv-local
    image: kweecr03.xxx.xxx.com:80/public/nginx:x86-1.20.1
    ports:
    - containerPort: 80
    volumeMounts:
    - mountPath: /usr/share/nginx/html
      name: example-pv-local
```

这段定义中分别定义了4个k8s资源对象，pv，storageclass，pvc和pod。

```bash
$ kubectl apply -f pod-localpv.yaml
persistentvolume/pv-local created
storageclass.storage.k8s.io/local-storage created
persistentvolumeclaim/pvc-local created
pod/pv-local-pod created

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM                                STORAGECLASS    REASON   AGE
pv-hostpath                                10Gi       RWO            Retain           Bound      default/pvc-hostpath                 manual                   12h
pv-local                                   5Gi        RWO            Delete           Bound      default/pvc-local                    local-storage            23s

$ kubectl get pvc
NAME           STATUS   VOLUME        CAPACITY   ACCESS MODES   STORAGECLASS    AGE
pvc-hostpath   Bound    pv-hostpath   10Gi       RWO            manual          12h
pvc-local      Bound    pv-local      5Gi        RWO            local-storage   27s

$ kubectl get pod
NAME                                 READY   STATUS    RESTARTS   AGE
pv-hostpath-pod                      1/1     Running   0          12h
pv-local-pod                         1/1     Running   0          43s

```

从上面的打印中可以看出local-pv跟hostpath的类型还是有区别的，在pod的定义中引入pvc即可使用底层存储，其中引入storageclass指定 `volumeBindingMode: WaitForFirstConsumer`，等待POD被调度后才对PVC绑定PV动作。

将POD删除之后，重启拉取POD，由于设置了NodeAffinity亲和性，下次还是会被部署到同一个节点上来，这样就能使用这个节点上的PV存储资源了。

需要注意的是，上面手动创建 PV 的方式，即静态的 PV 管理方式，在删除 PV 时需要按如下流程执行操作：

- 1）删除使用这个 PV 的 Pod
- 2）从宿主机移除本地磁盘
- 3）删除 PVC
- 4）删除 PV

如果不按照这个流程的话，这个 PV 的删除就会失败。

## 场景4 - storageclass

上面手工创建PV是静态PV管理，需要管理员提前创建好PV，比较复杂，而采用storageclass可以实现动态管理PV。storageclass本身是个存储类型，上面的几个场景中已经有用到。

基于StorageClass自动创建PV，需要管理员部署PV配置器（provisioner），然后定义对应的StorageClass，这样开发者在创建PVC的时候只需要选择要创建存储的类型，PVC会把StorageClass传递给PV provisioner，由provisioner自动创建PV。

如华为云CCE就提供csi-disk、csi-nas、csi-obs等StorageClass，在声明PVC时加上StorageClassName，就可以自动创建PV，并自动创建底层的存储资源。查询管理员已经创建好的storageclass：

```bash
$ kubectl get sc
NAME                PROVISIONER                     RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
csi-disk            everest-csi-provisioner         Delete          Immediate              true                   129d
csi-disk-topology   everest-csi-provisioner         Delete          WaitForFirstConsumer   true                   129d
csi-nas             everest-csi-provisioner         Delete          Immediate              true                   129d
csi-obs             everest-csi-provisioner         Delete          Immediate              false                  129d
csi-sfsturbo        everest-csi-provisioner         Delete          Immediate              true                   129d
efs-performance     flexvolume-xxx.com/fuxiefs   Delete          Immediate              true                   129d
efs-standard        flexvolume-xxx.com/fuxiefs   Delete          Immediate              true                   129d
local-storage       kubernetes.io/no-provisioner    Delete          WaitForFirstConsumer   false                  6h53m
nfs-rw              flexvolume-xxx.com/fuxinfs   Delete          Immediate              true                   129d
obs-standard        flexvolume-xxx.com/fuxiobs   Delete          Immediate              false                  129d
obs-standard-ia     flexvolume-xxx.com/fuxiobs   Delete          Immediate              false                  129d
sas                 flexvolume-xxx.com/fuxivol   Delete          Immediate              true                   129d
sata                flexvolume-xxx.com/fuxivol   Delete          Immediate              true                   129d
ssd                 flexvolume-xxx.com/fuxivol   Delete          Immediate              true                   129d
```

其中csi是引用的华为云CCE的存储插件，可以基于这些storageclass直接创建PV。

**volume.yaml**

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name:  pvc-sfs-auto-example
spec:
  accessModes:
  - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
  storageClassName: csi-nas        # StorageClass类型引入上面csi中的nas类型存储
```

创建这个PVC，即可自动创建与之对应的PV，并且PVC与PV会进行自动绑定。

```bash
$ kubectl get pvc
NAME                   STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS    AGE
pvc-hostpath           Bound    pv-hostpath                                10Gi       RWO            manual          19h
pvc-local              Bound    pv-local                                   5Gi        RWO            local-storage   6h57m
pvc-sfs-auto-example   Bound    pvc-c4911ba4-e55a-41e7-a246-a93a32b95a9e   5Gi        RWX            csi-nas         12s

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM                                STORAGECLASS    REASON   AGE
pv-hostpath                                10Gi       RWO            Retain           Bound      default/pvc-hostpath                 manual                   19h
pv-local                                   5Gi        RWO            Delete           Bound      default/pvc-local                    local-storage            6h58m
pvc-c4911ba4-e55a-41e7-a246-a93a32b95a9e   5Gi        RWX            Delete           Bound      default/pvc-sfs-auto-example         csi-nas                  15s
```

**deploy.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: kweecr03.xxx.xxx.com:80/public/nginx:x86-1.20.1
        name: container-0
        volumeMounts:
        - mountPath: /tmp                                # 挂载路径
          name: pvc-sfs-example
      restartPolicy: Always
      volumes:
      - name: pvc-sfs-example
        persistentVolumeClaim:
          claimName:  pvc-sfs-auto-example               # PVC的名称，使用上述的nas存储
```

这里定义了两个nginx pod副本，容器使用的volumes中的PVC即为上述创建的PVC，直接使用上述的nas存储。

```bash
$ kubectl apply -f deploy.yaml
deployment.apps/nginx-deployment created

$ kubectl get po
NAME                                 READY   STATUS    RESTARTS   AGE
nginx-deployment-5ffdb86f59-7v46b    0/1     Pending   0          24s
nginx-deployment-5ffdb86f59-tlt9m    0/1     Pending   0          24s

$ kubectl describe po nginx-deployment-5ffdb86f59-7v46b
...省略
Containers:
  container-0:
    Container ID:   docker://578300edb44cbdbabc7faa0fb770e3b4bf83b536deb5dc27e5b4879818dbe9eb
    Image:          kweecr03.xxx.xxx.com:80/public/nginx:x86-1.20.1
    Image ID:       docker-pullable://kweecr03.xxx.xxx.com:80/public/nginx@sha256:56cbb3c9ada0858d69d19415039ba2aa1e9b357ba9aa9c88c73c30307aae17b0
    Port:           <none>
    Host Port:      <none>
    State:          Running
      Started:      Thu, 14 Apr 2022 16:06:30 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /tmp from pvc-sfs-example (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-47g7m (ro)
Conditions:
  Type              Status
  Initialized       True
  Ready             True
  ContainersReady   True
  PodScheduled      True
Volumes:
  pvc-sfs-example:
    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)
    ClaimName:  pvc-sfs-auto-example
    ReadOnly:   false
  default-token-47g7m:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-47g7m
    Optional:    false
...省略
```

两个POD实例通过使用StorageClass使用自动创建了PV，且两个POD共享使用该nas存储。

---

全文完。
