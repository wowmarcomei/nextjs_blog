---
title: 09-往容器中注入配置信息
date: 2022-03-28 21:15:26
updated: 2022-03-28 21:15:26

description: 应用的配置在Kubernetes中可通过ConfigMap资源对象来实现，避免被直接写死到应用程序中。
categories: 
  - 技术笔记

tags: 
  - K8s
  - Kubernetes
  - CloudNative
image:  kubernetes.png
keywords: kubernetes,k8s,ConfigMap,
---

应用的配置在Kubernetes中可通过ConfigMap资源对象来实现，避免被直接写死到应用程序中，比如应用连接一个redis服务，下一次想更换另一个，如果写死的话，就得重新修改代码，重新制作新镜像。而利用ConfigMap就可以很方便地向容器中注入配置信息。**类似于Windows/Linux中的环境变量的配置**。

不过需要注意的是，ConfigMap一般是保存非安全的配置信息，比如服务连接地址，环境变量参数，服务端口等等，如果是涉及到密钥等敏感信息，则不适合用ConfigMap，因为ConfigMap是明文保存的，如果保存密钥等信息就会引起安全问题了。


## 1. 实践1：通过ConfigMap向容器中注入数据库端口值

最直观的方式是在命令行中直接注入参数值，通过`--from-literal`参数传递配置信息。

```bash
$  kubectl create configmap cm-demo1 --from-literal=db.host=localhost --from-literal=db.port=3306   #命令行直接创建configmap
configmap/cm-demo1 created

$  kubectl get cm/cm-demo1 -o yaml  #查看configmap具体信息
apiVersion: v1
data:
  db.host: localhost
  db.port: "3306"
kind: ConfigMap
metadata:
  creationTimestamp: "2022-03-28T07:36:40Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:db.host: {}
        f:db.port: {}
    manager: kubectl-create
    operation: Update
    time: "2022-03-28T07:36:40Z"
  name: cm-demo1
  namespace: default
  resourceVersion: "37278796"
  selfLink: /api/v1/namespaces/default/configmaps/cm-demo1
  uid: 53212514-4737-4bc1-b841-48deb80c9597
```

通过`kubectl create configmap`创建`configmap`配置信息，指定了`key`与`value`值，如果需要指定多个参数，则指定多个`--from-litera`.通过上面的命令，创建了一个名为cm-demo1的`configmap`，对应有两个变量。

- db.host: localhost
- db.port: 3306

上面创建好的configmap如何被其他API对象引用呢？可通过`env` -> `name` `valueFrom` -> `configMapKeyRef` -> `name` `key` 引用。如：

**testcm1_pod.yaml**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: testcm1-pod
spec:
  containers:
    - name: testcm1
      image: busybox
      command: [ "/bin/sh", "-c", "echo DB_HOST: $DB_HOST, DB_PORT: $DB_PORT" ]
      env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: cm-demo1
              key: db.host
        - name: DB_PORT
          valueFrom:
            configMapKeyRef:
              name: cm-demo1
              key: db.port
```

这里定义一个POD，使用busybox镜像，启动容器后只需命令`echo DB_HOST: $DB_HOST, DB_PORT: $DB_PORT`,显然，busybox镜像默认并没有DB_HOST与DB_PORT的变量，而是通过在POD下文中通过`env`定义的。

在`env`中定义了两个变量：

1. `name`为DB_HOST的变量：通过`valueFrom-configMapKeyRef`定位到configmap，分别设置`name`与`key`，则引用名为`cm-demo1`的configmap对象例的`db.host`变量。
2. `name`为DB_PORT的变量：通过`valueFrom-configMapKeyRef`定位到configmap，分别设置`name`与`key`，则引用名为`cm-demo1`的configmap对象例的`db.port`变量。

测试查看结果：

```bash
$  kubectl apply -f pod_cm.yaml
pod/testcm1-pod created

$  kubectl logs testcm1-pod
DB_HOST: localhost, DB_PORT: 3306
```

在创建pod对象后，testcm1-pod能够识别打印出提前定义的变量DB_HOST与DB_PORT。

## 2. 实践2：通过在数据卷中使用configmap向容器中注入多个变量

上面通过命令行，写了两个变量，已经有点麻烦了，如果涉及到多个变量的话，写命令行就不合适了，最好需要将配置写入文件，应用来读取该文件。一般采取步骤如下：

1. 创建好配置文件，如Mysql的配置文件`mysql.cnf`。

```nginx
[mysqld]
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock
symbolic-links=0
[mysqld_safe]
log-error=/var/log/mariadb/mariadb.log
pid-file=/var/run/mariadb/mariadb.pid
!includedir /etc/my.cnf.d
```

2. 根据该配置文件，创建成configmap配置，以供Kubernetes对象使用。

```bash
$  kubectl create cm mysql-cm --from-file=mysql.cnf
configmap/mysql-cm created
```

创建完成后，可查看创建好的cm。

```bash
$  kubectl get cm/mysql-cm -o yaml
apiVersion: v1
data:
  mysql.cnf: |
    [mysqld]
    datadir=/var/lib/mysql
    socket=/var/lib/mysql/mysql.sock
    symbolic-links=0
    [mysqld_safe]
    log-error=/var/log/mariadb/mariadb.log
    pid-file=/var/run/mariadb/mariadb.pid
    !includedir /etc/my.cnf.d
kind: ConfigMap
metadata:
  creationTimestamp: "2022-03-28T08:20:12Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:mysql.cnf: {}
    manager: kubectl-create
    operation: Update
    time: "2022-03-28T08:20:12Z"
  name: mysql-cm
  namespace: default
  resourceVersion: "37289515"
  selfLink: /api/v1/namespaces/default/configmaps/mysql-cm
  uid: 8f220505-0a44-4363-8bfc-9067e86dd034
```

3. Kubernetes资源对象引用configmap

定义POD，pod_vol_cm.yaml如下：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: testcm2-pod
spec:
  volumes:
    - name: config-volume
      configMap:
        name: mysql-cm
  containers:
    - name: testcm2
      image: busybox
      # command: [ "/bin/sh","-c","cat /etc/config/msyql.cnf" ]  #为了更显性化测试，将command修改为sleep 5分钟，然后进去POD中查看注入文件
      command: [ "/bin/sh","-c","sleep 3000" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
```

POD中定义了volumes，引用configmap，即：名为`mysql-cm`的configMap也是一个volumes数据卷，最终在container中被挂载到`/etc/config`目录下。在容器中执行cat命令，最终打印出的将是`mysql.cnf`文件内容。

生成POD并查看注入的配置文件：

```bash
$   kubectl apply -f pod_vol_cm.yaml    #生成POD
pod/testcm2-pod created

$   kubectl exec -it testcm2-pod sh     #进入POD执行命令
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
/ # cat /etc/config/mysql.cnf
[mysqld]
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock
symbolic-links=0
[mysqld_safe]
log-error=/var/log/mariadb/mariadb.log
pid-file=/var/run/mariadb/mariadb.pid
!includedir /etc/my.cnf.d
/ #
```

在POD中可查看到configmap注入的配置信息。

**简单理解下：有一个数据卷名为mysql-cm，这个名字其实也就是configmap的名字，这个数据卷被挂载到容器里的某个路径`/etc/config`，这个路径下的文件也即是configmap的配置文件**。

## 3. 总结ConfigMap的使用

configmap可以用来存储Kubernetes资源对象所需的配置文件，其内容将写入到ETCD存储中。

### 3.1 创建ConfigMap

通用创建ConfigMap的方式有以下几种：

- 通过直接在命令行中指定configmap参数创建，即`--from-literal`；
- 通过指定文件创建，即将一个配置文件创建为一个ConfigMap，`--from-file=<文件>`；
- 事先写好标准的configmap的yaml文件，然后`kubectl create -f` 创建。

#### 3.1.1 通过--from-literal创建

```bash
$   kubectl create configmap test-config1 --from-literal=db.host=localhost --from-literal=db.port='3306'
```

直接在命令行中写好所有的变量，通过configmap注入到容器中。

#### 3.1.2 通过--from-file

```bash
$   echo -n 172.18.8.200 > ./db.host
$   echo -n 3306 > ./db.port
$   kubectl create cm test-config2 --from-file=./db.host --from-file=./db.port
```

将环境变量写入文件，通过from-file导入。

#### 3.1.1.3 通过YAML配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config4
data:
  db.host: 172.18.8.200
  db.port: "3306"
```

直接写好configmap的配置，通过yaml文件创建API资源对象。

### 3.2 使用ConfigMap

使用ConfigMap的方式主要有两种：

- 第一种是通过环境变量的方式，直接传递给pod；
- 第二种是作为volume的方式挂载到pod内。

#### 3.2.1 通过环境变量使用

使用`valueFrom`、`configMapKeyRef`、`name`、`key`指定要用的key，如上面的实践1。当然也可以通过`envFrom`、`configMapRef`、`name`使得configmap中的所有key/value对都自动变成环境变量。如：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: busybox
    args: [ "/bin/sh", "-c", "sleep 3000" ]
    envFrom:
    - configMapRef:
        name: test-config4
```



#### 3.2.2 作为volume数据卷被挂载使用

通过将ConfigMap定义为数据卷，挂载到容器的某路径中。如上面的实践2。当然我们也可以在 `ConfigMap` 值被映射的数据卷里去控制路径，如下 Pod 定义：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: testcm2-pod
spec:
  volumes:
    - name: config-volume
      configMap:
        name: mysql-cm
        items:
        - key: mysql.conf
          path: path/to/msyql.conf
  containers:
    - name: testcm2
      image: busybox
      command: [ "/bin/sh","-c","cat /etc/config/path/to/msyql.cnf" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
```

参考链接：https://blog.51cto.com/wzlinux/2331050

---

全文完。