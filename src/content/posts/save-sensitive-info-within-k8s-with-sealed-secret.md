---
title: "安全无小事：如何将容器秘钥等信息安全地存放在Git仓库？"
date: 2024-06-28T18:28:17+08:00
description: 在 Kubernetes 中，我们使用 Secrets 来保存敏感数据，例如密码、 API 密钥和证书等等，但Secret本身只做base64编码并不安全，为此我们可以基于SealedSecret自定义一个新的CRD对象进行加密再存储能。
categories: 
  - 技术笔记
tags: 
  - Kubernetes
  - K8s
  - Secret
  - 安全
image: /images/sealed_secret.png

keywords: GitOps,容器,秘钥,SealedSecret,Secret
---
![sealed_secret](/images/sealed_secret.png)

在 Kubernetes 中，我们使用 Secrets 来保存敏感数据，例如密码、 API 密钥和证书等等。想象一下，Secrets 就像保险箱，用来存放业务不想公开的信息。开发者可以在代码中轻松引用这些 Secrets，而无需直接暴露敏感信息。

然而，这些“保险箱”的安全性并没有想象中那么高。实际上，它们只是对这些信息进行了一层简单的 base64 编码，任何人都可以轻松解密。因此，直接将 Secrets 文件存放在像 Git 这样的代码仓库中是不安全的。但这同时也带来了另一个问题：如果每次部署都需要手动创建 Secrets，那么就会影响到 GitOps 的流畅性。

如何解决这个问题呢？ Bitnami 实验室针对这个问题提供了一个名为 [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) 的开源工具来解决这个问题。

## Sealed Secrets 的主要特点和工作原理

1. 它由两个主要组件组成:

   - 客户端工具 kubeseal
   - Kubernetes 集群中运行的控制器

   **Sealed Secrets主要架构**：

   ![sealed secret](/images/sealed-secret-arch.png)
2. 工作流程:

   - 使用 kubeseal 加密普通的 Kubernetes Secret
   - 生成加密后的 SealedSecret 自定义资源
   - **将 SealedSecret 提交到Git版本控制系统， Secret不提交到Git版本控制系统**
   - 部署到集群后,控制器会自动解密 SealedSecret 并创建对应的 Secret
   - 应用最终使用解密之后的Secret
3. 安全性:

   - 使用RSA 非对称加密算法，使用2048位的RSA密钥对，公钥用于加密,私钥用于解密。
   - 公钥存储在集群中，而私钥只存在于控制器中不会暴露给外部。
   - 即使获得 SealedSecret，没有私钥也无法解密。
4. 加密过程:

   - 用户使用kubeseal工具加密Secret。
   - kubeseal使用公钥对Secret数据进行加密。
   - 生成的SealedSecret对象包含加密后的数据。
5. 解密过程:

   - Sealed Secrets控制器在集群中运行。
   - 控制器使用私钥解密SealedSecret。
   - 解密后的Secret被应用到集群中。
6. 潜在风险:

   - 如果控制器被攻破,私钥可能泄露。
   - 如果公钥被替换,可能导致错误的加密。

## 使用Sealed Secret

下面使用 kubeseal 工具加密 Secret，然后让 Pod 读取并打印出加密后的 Secret 对象，做个简单的Demo演示。

### 步骤1：安装kubeseal客户端

在本地（可以是Windows/Linux/Mac) 任一主机安装kubeseal客户端，以Linux客户端为例：

```shell
$ wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.27.0/kubeseal-0.27.0-linux-amd64.tar.gz
$ tar xzvf kubeseal-0.27.0-linux-amd64.tar.gz
$ sudo install -m 755 kubeseal /usr/local/bin/kubeseal
```

### 步骤2：在K8s集群部署 SealedSecret 控制器

可以先下载最新版本controller配置：

```shell
$wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.27.0/controller.yaml
```

如果集群跟外部docker.io能够互通，就直接安装部署，不能直连的话，把controller.yaml中定义的镜像下载到本地，并加载，然后上传到自己的镜像仓库，可以是华为云的SWR仓库，也可以是自创建的Harbor等仓库。镜像传递完毕之后开始部署控制器到K8s集群。

```shell
$ kubectl apply -f controller.yaml
deployment.apps/sealed-secrets-controller created
customresourcedefinition.apiextensions.k8s.io/sealedsecrets.bitnami.com created
service/sealed-secrets-controller created
rolebinding.rbac.authorization.k8s.io/sealed-secrets-service-proxier created
rolebinding.rbac.authorization.k8s.io/sealed-secrets-controller created
clusterrolebinding.rbac.authorization.k8s.io/sealed-secrets-controller created
clusterrole.rbac.authorization.k8s.io/secrets-unsealer created
serviceaccount/sealed-secrets-controller created
role.rbac.authorization.k8s.io/sealed-secrets-service-proxier created
service/sealed-secrets-controller-metrics created
role.rbac.authorization.k8s.io/sealed-secrets-key-admin created
```

控制器默认会安装在 kube-system 命名空间下面，完成安装后可查询到对应的POD：

```shell
$ kubectl get pods -n kube-system -l name=sealed-secrets-controller
NAME                                         READY   STATUS    RESTARTS   AGE
sealed-secrets-controller-685cdb9dcd-8qks9   1/1     Running   0          91s
```

### 步骤3：创建一个普通Secret对象

创建一个名为 `mysecret.yaml` 的文件，在里面定义用户名密码等信息，内容如下：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
stringData:
  username: admin
  password: supersecret
```

显然这里的用户名密码都是显性的，即使是做了base64编码之后也可以轻易解码，都不能直接上传到Git仓库。

## 步骤 4: 使用 kubeseal 加密 Secret

运行以下命令加密 Secret：

```shell
$ kubeseal --format yaml < mysecret.yaml > sealedsecret.yaml
```

这个命令使用 `<` 来从 `mysecret.yaml` 文件读取输入，并使用 `>` 将输出重定向到 `sealedsecret.yaml`，将创建一个名为 `sealedsecret.yaml` 的加密后的 Secret 文件。

查看该secret文件：

```shell
$ cat sealedsecret.yaml
---
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  creationTimestamp: null
  name: mysecret
  namespace: default
spec:
  encryptedData:
    password: AgAG8q++EBolh2TDLaZNS4Ab6c4pN5CbO6v6vi7z9CsT7c7o7z4CTsFXCiTLjfDLopGPWe0E3j5yiB7FsAZfF+NVOeJA1vL7v3cN7jBkvhNM2R6yjjoDnlANTsBbHKND55EagxqjcJsVqY1tch47EnRPmAsIH3FkEjQsT36OmBwR9mjYe7NL9unr9VTMVGfnyxoiOs78onQFso3AI5VbSQS869AJDVOlxdAmzVLHBD2iqPNuifKtGc0RPZMTbWE0GH80ezu5lxqYhdM1lSCr82yzZjL5SSeL2UdbhDFKBvKRhLT2pj4zHmUod9/vrTD20ArC/j6m0/vwQWIxfKj8vrL9KMbZeaIO7VV3EkSqr/8WCtIEHkcFeyTcy1pjp4XxoqvBFLcFiO7rWPnJltAlnnNBzurCHlfjtOVIw1D3zpNSDklAa6uLtfy3xCm6V1w5vC2WB9e0oc9J0V4TqiqPjlbU4Yz4iXeY2lGjSiD1p43dl66fnmteoj+ZDFClQQ1lAz+kLdt6JYq71cLsYlycY7a7BpxG9HEOKC6pVsihitDlcR2PrcjeUUvFKerRp4Uv0L8yDCno00+7G8gfPGAF0JasJm8Dvrsld1Tni7RSZwSSNDLRqIJQ+O+ONA+K7Sm1pR8sKuZBFpW8d8l89iEDBqWzYIik/M5zkE8WJ8lfJVBcNaI5l6Umg5Gqj9RF7qY9ddqXIDelAppooFSAkQ==
    username: AgAxo72cy957ERfTnSyrnzt7+b3zneRvIh4vWSvJnNLbw6LZTk8wq6+BZlQwjWXr/jeenpYYKKK0YaFM6mimy4zHDsmZZSQMInS2UYCSdN71sOEVUmtRfty5GqTWdYR+TD+aLwFZz30MkVEShaYgvyW9LUO1o9pmiusJtnJfUSzml+azdnLUxYrL1XrLWfnffCaVKr+OnRU36VmnRBJHuvlyzktDJuLu1bMpJMq9t6ocAbfZGLuJZbt0oqem0RZUwxXG67hU5obGU9tz2FuVJpV+7xDd9nuDsOaiT/4lPHGkt21uTn7lpUzXScRCI0s+NeB7nKsRYXVeYK8+RnvDdH33PkVfl70R1LqIxNnla4IgU1UtXMc8x/184yJK+ueqaYq6g+XTQ0HZeLj3yptSZ8W295MQDDJrNwlIVV5xVKDJuD8Lc1lWfwmV8h23DL3pxqKx5AthhIfzaaXdpx+YwbyW/Tg29gPIWPmlWIkQt9es5c7BO+G0aAevtNmNTetPVjsIN4AUnfH5/Dpustie9N+kTMlpEe5Uq+aoPa28KtTUpK3+c4hMdjGPbjENjyRP1yMMsMAyupcnYxkviRKTH1qgjpoY9yJRGAJlzAFa9LsyThFJU7GI7f1rpWFnitNN73BBsi6Qnrbtyp5j0bkcLDOZXLROM9sj1ye4Mkz5JJdYU9o07g2E9GiqdFyBmJUdn/Fxu6nbjA==
  template:
    metadata:
      creationTimestamp: null
      name: mysecret
      namespace: default
    type: Opaque
```

## 步骤 5: 创建SealedSecret对象

运行以下命令创建SealedSecret对象：

```shell
$ kubectl apply -f sealedsecret.yaml
sealedsecret.bitnami.com/mysecret created
$ kubectl get SealedSecret -A
NAMESPACE   NAME       AGE
default     mysecret   4s
```

可以看到SealedSecret对象已经被创建，当我们使用kubectl查询secret对象时，应该能看到对应secret对象也已经被创建了。

```shell
$ kubectl get secret  mysecret
NAME       TYPE     DATA   AGE
mysecret   Opaque   2      1m9s
```

查看secret对象内容：

```shell
kubectl get secret  mysecret -oyaml
apiVersion: v1
data:
  password: c3VwZXJzZWNyZXQ=
  username: YWRtaW4=
kind: Secret
metadata:
  creationTimestamp: "2024-06-26T11:26:06Z"
  name: mysecret
  namespace: default
  ownerReferences:
  - apiVersion: bitnami.com/v1alpha1
    controller: true
    kind: SealedSecret
    name: mysecret
    uid: da3b13a2-0333-4a78-976b-0b8cbbd055de
  resourceVersion: "77934869"
  uid: e3273419-d828-41a2-8d64-57fe777dc1ee
type: Opaque
```

可以看到base64编码的 `username`与 `password`。

- `username`值为 `YWRtaW4=`
- `password`值为 `c3VwZXJzZWNyZXQ=`

解码后查看内容如下：

```shell
$ echo "YWRtaW4=" |base64 -d
admin

$ echo "c3VwZXJzZWNyZXQ=" |base64 -d
supersecret
```

意味着我们创建SealedSecret对象时，经过controller处理后，最终生产了可用的secret对象。

## 步骤 6: pod引用secret对象

K8s其他资源对象可使用最终的原生secret对象，以pod为例。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-demo-pod
spec:
  containers:
  - name: secret-demo-container
    image: <swr.sa-fb-1.xxx.com/xxxx/nginx-arm:v1>
    command: ["/bin/sh", "-c", "echo Username: $(USERNAME) && echo Password: $(PASSWORD) && sleep 3600"]
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

这里定义了POD可以直接引用secret对象中变量，pod启动后会执行echo命令，打印出username和password变量。

```shell
$ kubectl apply -f secret-demo-pod.yaml
pod/secret-demo-pod created
$ kubectl get po
NAME                               READY   STATUS              RESTARTS   AGE
secret-demo-pod                    1/1     Running   0          7s
```

可以看到pod部署后成功运行，这时查看一下其运行日志，在其ttl日志中应该是echo打印出username与password变量。

```shell
$ kubectl logs -f secret-demo-pod
Username: admin
Password: supersecret
```

## 总结

通过Sealed Secrets，采用RSA 非对称加密算法，使用2048位的RSA密钥对，对一些敏感数据进行加密处理，之后就能将其保存在Git仓库，不用单独再手工创建secret填入系统中了，既安全又丝滑无比。
