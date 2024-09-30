

一般ConfigMap用于保存通用配置信息，属于明文信息，不能保存密钥，如果要保存密钥等加密信息，Kubernetes提供Secret对象进行Base64转码。

`Secret` 主要使用的有以下三种类型：

- `Opaque`：base64 编码格式的 Secret，用来存储密码、密钥等；但数据也可以通过`base64 –decode`解码得到原始数据，所以加密性很弱。
- `kubernetes.io/dockerconfigjson`：用来存储私有`docker registry`的认证信息。
- `kubernetes.io/service-account-token`：用于被 `ServiceAccount` ServiceAccount 创建时 Kubernetes 会默认创建一个对应的 Secret 对象。Pod 如果使用了 ServiceAccount，对应的 Secret 会自动挂载到 Pod 目录 `/run/secrets/kubernetes.io/serviceaccount` 中。

如下在集群中查询secret信息：

```bash
$  kubectl get secret
NAME                  TYPE                                  DATA   AGE
default-token-g4ktr   kubernetes.io/service-account-token   3      108d
mxhregcred            kubernetes.io/dockerconfigjson        1      91d
mysecret              Opaque                                2      11s
```

其中第一个`default-token-g4ktr`是创建service account时默认创建的secret，内容为加密的token信息，第二个`mxhregcred`是创建docker 私仓的密钥时生成的，也是加密的token信息，第三个是创建的Opaque类型的secret。下面以Opaque类型secret为例，演示向容器中注入secret方法。

## 1. 创建Secret对象

将需要加密的对象采用base64进行加密，下面分别对admin和admin321使用base64算法加密。

```bash
$   echo -n "admin" | base64
YWRtaW4=
$   echo -n "admin321" | base64
YWRtaW4zMjE=
```

创建Opaque类型的secret对象，编辑**secret-demo.yaml**，内容如下：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: YWRtaW4zMjE=
```

创建Secret对象：

```bash
$   kubectl apply -f secret-demo.yaml
secret/mysecret created
```

查看生成的Secret对象：

```bash
$    kubectl describe secret mysecret
Name:         mysecret
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
password:  8 bytes
username:  5 bytes


$    kubectl get secret mysecret -o yaml
apiVersion: v1
data:
  password: YWRtaW4zMjE=
  username: YWRtaW4=
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","data":{"password":"YWRtaW4zMjE=","username":"YWRtaW4="},"kind":"Secret","metadata":{"annotations":{},"name":"mysecret","namespace":"default"},"type":"Opaque"}
  creationTimestamp: "2022-03-31T02:42:27Z"
  managedFields:
  - apiVersion: v1
    fieldsType: FieldsV1
    fieldsV1:
      f:data:
        .: {}
        f:password: {}
        f:username: {}
      f:metadata:
        f:annotations:
          .: {}
          f:kubectl.kubernetes.io/last-applied-configuration: {}
      f:type: {}
    manager: kubectl-client-side-apply
    operation: Update
    time: "2022-03-31T02:42:27Z"
  name: mysecret
  namespace: default
  resourceVersion: "38254944"
  selfLink: /api/v1/namespaces/default/secrets/mysecret
  uid: 04bbf4f7-a4b9-4031-a137-408fd69e11cc
type: Opaque
```



## 2. 使用Secret对象

创建好 `Secret`对象后，有两种方式来使用：

- 以环境变量的形式
- 以Volume的形式挂载

### 2.1 以环境变量形式使用Secret对象

在containes下声明: `env` -> `name` `valueFrom` -> `secretRef` 层级来引用secret密钥，如果需要引用多个密钥则引用多个 `name` `valueFrom` 。

eg: **secret-demo1.yaml**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret1-pod
spec:
  containers:
  - name: secret1
    image: busybox
    command: [ "/bin/sh", "-c", "env" ]
    env:
    - name: USERNAME
      valueFrom:
        secretKeyRef:
          name: mysecret
          key: username
    - name: PASSWORD
      valueFrom:
        secretKeyRef:
          name: mysecret
          key: password
```

生成pod后查看其log日志：

```bash
 $    kubectl logs secret1-pod
......
USERNAME=admin
PASSWORD=admin321
......
```

可见密钥已经注入到容器中，可正常被识别。

### 2.2 以Volume的形式挂载使用Secret对象

与ConfigMap类似，挂载一个volumes，将其指定为secret，然后在container中引入使用volumeMounts进行挂载，这样的话相当于，**在容器上挂了一个secret类型的磁盘，磁盘里内容即为secret内容**。

eg：**secret-demo2.yaml**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret2-pod
spec:
  containers:
  - name: secret2
    image: busybox
    command: ["/bin/sh", "-c", "ls /etc/secrets"]
    volumeMounts:
    - name: secrets
      mountPath: /etc/secrets
  volumes:
  - name: secrets
    secret:
     secretName: mysecret
```

生成pod后查看其log日志：

```bash
 $    kubectl logs secret2-pod
password
username
```

可见volume方式也成功注入到容器中。

--- 

全文完。