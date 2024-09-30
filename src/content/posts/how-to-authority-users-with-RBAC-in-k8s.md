RBAC：即role-based access control，基于角色的访问控制。RBAC 鉴权机制使用 `rbac.authorization.k8s.io` [API 组](https://kubernetes.io/zh/docs/concepts/overview/kubernetes-api/#api-groups-and-versioning) 来驱动鉴权，通过 Kubernetes API 动态配置策略。

## RBAC的几个关键概念

Kubernetes 所有资源对象都是模型化的 API 对象，允许执行 `CRUD(Create、Read、Update、Delete)` 操作，比如下面的这些资源：

- Pods、ConfigMaps、Deployments、Nodes、Secrets、Namespaces

对于上面这些资源对象的可能存在的操作有：

- create、get、delete、list、update、edit、watch、exec、patch

在更上层，这些资源和 API Group 进行关联，比如 Pods 属于 Core API Group，而 Deployements 属于 apps API Group。

除了这些资源和操作以外，还有几个关键概念：

- `Rule`：规则，规则是一组属于不同 API Group 资源上的一组操作的集合
- `Role` 和 `ClusterRole`：角色和集群角色，这两个对象都包含上面的 Rules 元素，二者的区别在于，在 Role 中，定义的规则只适用于单个命名空间，也就是和 namespace 关联的，而 ClusterRole 是集群范围内的，因此定义的规则不受命名空间的约束。另外 Role 和 ClusterRole 在Kubernetes 中都被定义为集群内部的 API 资源，和我们前面学习过的 Pod、Deployment 这些对象类似，都是我们集群的资源对象，所以同样的可以使用 YAML 文件来描述，用 kubectl 工具来管理
- `Subject`：主题，对应集群中尝试操作的对象，集群中定义了3种类型的主题资源：
  - `User Account`：用户，这是有外部独立服务进行管理的，管理员进行私钥的分配，用户可以使用 KeyStone 或者 Goolge 帐号，甚至一个用户名和密码的文件列表也可以。对于用户的管理集群内部没有一个关联的资源对象，所以用户不能通过集群内部的 API 来进行管理
  - `Group`：组，这是用来关联多个账户的，集群中有一些默认创建的组，比如 cluster-admin
  - `Service Account`：服务帐号，通过 Kubernetes API 来管理的一些用户帐号，和 namespace 进行关联的，适用于集群内部运行的应用程序，需要通过 API 来完成权限认证，所以在集群内部进行权限操作，我们都需要使用到 ServiceAccount，这也是我们这节课的重点
- `RoleBinding` 和 `ClusterRoleBinding`：角色绑定和集群角色绑定，简单来说就是把声明的 Subject 和我们的 Role 进行绑定的过程（给某个用户绑定上操作的权限），二者的区别也是作用范围的区别：RoleBinding 只会影响到当前 namespace 下面的资源操作权限，而 ClusterRoleBinding 会影响到所有的 namespace。

**RBAC就是分别定义好subject API对象、角色API对象、角色绑定API对象，然后再将subject与角色通过binding进行绑定**。

![RBAC](https://laomeinote.com/images/posts/RBAC.png)

## Demo1：只能访问某个 namespace 的普通用户

目标：创建一个 User Account，只能访问 kube-system 这个命名空间，对应的用户信息如下所示：

```yaml
username: laomei
group: laomeigroup
```

### 1. 创建用户凭证

Kubernetes 没有 User Account 的 API 对象，不过利用管理员分配给的私钥就可以创建一个用户账号，可以参考官方文档中的方法，这里我们来使用 `OpenSSL` 证书来创建一个 User（或者也可以使用更简单的 `cfssl`工具来创建）。

使用openssl给用户 laomei 创建一个私钥，命名成 `laomei.key`：

```shell
➜  openssl genrsa -out laomei.key 2048
Generating RSA private key, 2048 bit long modulus
...................+++
.........................+++
e is 65537 (0x10001)

```

使用刚刚创建的私钥创建一个**证书签名请求文件**：`laomei.csr`，要注意需要确保在`-subj`参数中指定用户名和组(CN表示用户名，O表示组)：

```shell
➜ openssl req -new -key laomei.key -out laomei.csr -subj "/CN=laomei /O=laomeigroup"
```

然后找到 Kubernetes 集群的 `CA` 证书，如果使用kubeadm 安装的集群，CA 相关证书位于 `/etc/kubernetes/pki/` 目录下面，如果是二进制方式搭建的，在最开始搭建集群的时候就已经指定好了 CA 的目录。利用该目录下面的 `ca.crt` 和 `ca.key`两个文件来批准上面的证书请求，生成最终的证书文件`laomei.crt`，我们这里设置证书的有效期为 500 天：

```shell
➜ openssl x509 -req -in laomei.csr -CA /etc/kubernetes/pki/ca.crt -CAkey /etc/kubernetes/pki/ca.key -CAcreateserial -out laomei.crt -days 500
Signature ok
subject=/CN=laomei /O=laomeigroup
Getting CA Private Key
```

查看当前文件夹下面是否生成了一个证书文件：

```shell
➜ ll
-rw-r--r--  1 root root      1001 Feb  8 16:25 laomei.crt
-rw-r--r--  1 root root       915 Feb  8 16:21 laomei.csr
-rw-r--r--  1 root root      1675 Feb  8 16:14 laomei.key
```

然后可以使用刚刚创建的证书文件和私钥文件在集群中创建新的凭证和上下文(Context):

```shell
➜ kubectl config set-credentials laomei --client-certificate=laomei.crt --client-key=laomei.key
User "laomei" set.
```

这里可以看到一个用户 `laomei` 创建了，然后为这个用户设置新的 Context，这里指定特定的一个 namespace：

```shell
➜ kubectl config set-context laomei-context --cluster=kubernetes --namespace=kube-system --user=laomei
Context "laomei-context" created.
```

到这里，用户 `laomei` 就已经创建成功了，现在使用当前的这个配置文件来操作 kubectl 命令的时候，应该会出现错误，因为还没有为该用户定义任何操作的权限：

```bash
➜ kubectl get pods --context=laomei-context
Error from server (Forbidden): pods is forbidden: User "laomei " cannot list resource "pods" in API group "" in the namespace "kube-system"
```

### 2. 创建角色Role

用户创建完成后，接下来就需要给该用户添加操作权限，可定义一个 YAML 文件，创建一个允许用户操作 Deployment、Pod、ReplicaSets 的角色，如下定义：(laomei-role.yaml).

```yaml
 apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: laomei-role
  namespace: kube-system
rules:
- apiGroups: ["", "apps"]
  resources: ["deployments", "replicasets", "pods"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"] # 也可以使用['*']  
```

其中apiGroups包含两个，一个`core` API Group（在YAML中用空字符可表示核心组），POD属于`core` API组，Deployment 和 ReplicaSet 都属于 `apps` 这个 API Group，所以 `rules` 下面的 `apiGroups` 就综合了这几个资源的 API Group：["", "apps"]。

API资源对象包括我们希望限制的几个`deployments`,`replicasets`和`pods`。其中`verbs` 就是上面提到的可以对这些资源对象执行的操作，我们这里需要所有的操作方法，所以我们也可以使用['*']来代替。然后直接创建这个 Role：

```bash
➜ kubectl apply -f laomei-role.yaml
role.rbac.authorization.k8s.io/laomei-role created
```

### 3. 用户与角色绑定Rolebinding

上面创建了用户laomei与角色laomei-role，但是二者并没有关联起来，使用laomei还是无法操作API资源对象，所以这里就需要创建一个角色绑定Rolebinding资源对象，将user与role绑定起来。例：在kube-system这个namespace下将上面的laomei与laomei-role进行绑定（laomei-rolebinding.yaml）。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: laomei-rolebinding
  namespace: kube-system
subjects:
- kind: User
  name: laomei
  apiGroup: ""
roleRef:
  kind: Role
  name: laomei-role
  apiGroup: rbac.authorization.k8s.io
```

其中`subjects` 字段就是User资源对象，这里对应上面的 `User` 帐号 `laomei`，`roleRef`字段将上面的subject与角色Role或者clusterrole进行绑定。使用kubectl 创建上面的资源对象：

```bash
➜ kubectl apply -f laomei-rolebinding.yaml
rolebinding.rbac.authorization.k8s.io/laomei-rolebinding created
```

### 4. 测试

使用上下文`laomei-context`操作集群。

```bash
➜ kubectl get pods --context=laomei-context
NAME                              READY   STATUS    RESTARTS   AGE
coredns-f9fd979d6-4dxst           1/1     Running   11         58d
coredns-f9fd979d6-59d2f           1/1     Running   11         58d
etcd-master                       1/1     Running   11         58d
kube-apiserver-master             1/1     Running   13         58d
kube-controller-manager-master    1/1     Running   11         58d
kube-flannel-ds-kcsd6             1/1     Running   9          58d
kube-flannel-ds-s7r2g             1/1     Running   14         58d
kube-flannel-ds-tdjr8             1/1     Running   6          58d
kube-proxy-nllct                  1/1     Running   7          58d
kube-proxy-qx2kp                  1/1     Running   4          58d
kube-proxy-xjsnk                  1/1     Running   11         58d
kube-scheduler-master             1/1     Running   13         58d
metrics-server-5458746495-pfv4d   1/1     Running   0          12d
```

这里使用kubectl 并没有指定 namespace，这是因为上面创建Context 的时候就绑定在了 kube-system 这个命名空间下面。

```bash
➜ kubectl get pods --context=laomei-context
```

等同于下面的命令：

```bash
➜ kubectl get pods --context=laomei-context -nkube-system
```

可以测试一下查询default命名空间。

```bash
➜ kubectl get pods --context=laomei-context -ndefault
Error from server (Forbidden): pods is forbidden: User "laomei" cannot list resource "pods" in API group "" in the namespace "default"
```

测试验证下service服务是否可以查询。

```bash
➜ kubectl get svc --context=laomei-context -nkube-system
Error from server (Forbidden): services is forbidden: User "laomei" cannot list resource "services" in API group "" in the namespace "kube-system"
```

## Demo2：只能访问某个 namespace 的 ServiceAccount

上面的demo1创建了一个只能访问某个命名空间下面的**普通用户**，前面也提到 `subjects` 下面还有一种类型的主题资源：`ServiceAccount`。现在通过demo2演示创建一个集群内部的用户只能操作 kube-system 这个命名空间下面的 pods 和 deployments。

### 1. 创建SA对象

首先来创建一个 `ServiceAccount` 对象：

```shell
➜ kubectl create sa laomei-sa -n kube-system
```

当然也可以定义成 YAML 文件的形式来创建：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: laomei-sa
  namespace: kube-system
```

### 2. 创建Role对象

然后新建一个 Role 对象：(laomei-sa-role.yaml)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: laomei-sa-role
  namespace: kube-system
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

这里定义的角色操作Pod 的权限只有`get`,`watch`,`list`权限，没有`create、delete、update` ，稍后可重点测试。

创建该 Role 对象：

```shell
➜  kubectl apply -f laomei-sa-role.yaml
role.rbac.authorization.k8s.io/laomei-sa-role created
```

### 3. 用户与角色绑定Rolebinding

然后创建一个 `RoleBinding` 对象，将上面的 `laomei-sa` 和角色 laomei-sa-role 进行绑定：(laomei-sa-rolebinding.yaml)

```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: laomei-sa-rolebinding
  namespace: kube-system
subjects:
- kind: ServiceAccount
  name: laomei-sa
  namespace: kube-system
roleRef:
  kind: Role
  name: laomei-sa-role
  apiGroup: rbac.authorization.k8s.io
```

添加这个资源对象：

```shell
➜  kubectl apply -f laomei-sa-rolebinding.yaml
rolebinding.rbac.authorization.k8s.io/laomei-sa-rolebinding created
```

这里就将laomei-sa这个subject与laomei-sa-role完成了绑定，laomei-sa这个账号对Pod 有`get`,`watch`,`list`权限，对deployments有`get`, `list`, `watch`, `create`, `update`, `patch`, `delete`权限。

### 4. 验证

这个ServiceAccount需要怎么验证呢？其实ServiceAccount 会生成一个 Secret 对象和它进行映射，这个 Secret 里面包含一个 token，使用该token登陆Dashboard，登陆到Dashboard中可验证权限是否符合预期。

```shell
➜  kubectl get secret -n kube-system |grep laomei-sa
laomei-sa-token-695h2                            kubernetes.io/service-account-token   3      2m3s
➜  kubectl get secret laomei-sa-token-695h2 -o jsonpath={.data.token} -n kube-system |base64 -d
# 会生成一串很长的base64后的字符串
```

使用这里的 token 去 Dashboard 页面进行登录：

![RBAC_SA](https://laomeinote.com/images/posts/RBAC_SA.png)

可以看到上面的提示现在使用的这个 ServiceAccount 没有权限获取当前命名空间下面的资源对象，这是因为登录进来后默认跳转到 default 命名空间，如果切换到 kube-system 命名空间下面就可以了：

![RBAC_SA_dashboard](https://laomeinote.com/images/posts/RBAC_SA_dashboard.png)

这里看到可以访问 pod 列表了，但也会有一些其他提示：

`events is forbidden: User "system:serviceaccount:kube-system:laomei-sa" cannot list events in the namespace "kube-system"`，这是因为当前登录用只被授权了访问 pod 和 deployment 的权限。

--------

全文完。