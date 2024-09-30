本文介绍如何使用 [Secret](https://kubernetes.io/zh/docs/concepts/configuration/secret/) 从私有镜像仓库或代码仓库拉取镜像来创建 Pod。

## 准备工作

- Kubernetes集群
- 私有仓库
- 可登陆私有仓库的账号

## 登录Docker私有仓库

要想拉取私有镜像必须在镜像仓库上进行身份验证。

```shell
docker login  -u <username> <repo-url>
```

当出现提示时，输入账号密码。

登录过程会创建或更新保存有授权令牌的 `config.json` 文件。 查看 [Kubernetes 中如何解析这个文件](https://kubernetes.io/zh/docs/concepts/containers/images#config-json)。

查看 `config.json` 文件：

```shell
cat ~/.docker/config.json
```

输出结果包含类似于以下内容的部分：

```json
{
    "auths": {
        "https://index.docker.io/v1/": {
            "auth": "c3R...zE2"
        }
    }
}
```

**说明：** 如果使用 Docker 凭证仓库，则不会看到 `auth` 条目，看到的将是以仓库名称作为值的 `credsStore` 条目。

## 创建Secret

在集群中创建保存授权令牌的 Secret

Kubernetes 集群使用 `docker-registry` 类型的 Secret 来通过容器仓库的身份验证，进而提取私有映像。

创建 Secret，命名为 `myregcred`：

```shell
kubectl create secret docker-registry myregcred \
  --docker-server=<你的镜像仓库服务器> \
  --docker-username=<你的用户名> \
  --docker-password=<你的密码> \
  --docker-email=<你的邮箱地址>
```

参数说明：

- `<your-registry-server>` 是私有 Docker 仓库全限定域名（FQDN）。 DockerHub 使用 `https://index.docker.io/v1/`。
- `<your-name>` 是 Docker 用户名，**注意使用单引号引用**。
- `<your-pword>` 是 Docker 密码，**注意使用单引号引用**。
- `<your-email>` 是Docker 邮箱，**注意使用单引号引用**。

这样就成功地将集群中的 Docker 凭证设置为名为 `regcred` 的 Secret。

## 检查 Secret myregcred

要了解创建的 `myregcred` Secret 的内容，可以用 YAML 格式进行查看：

```shell
kubectl get secret myregcred --output=yaml
```

输出和下面类似：

```yaml
apiVersion: v1
data:
  .dockerconfigjson: eyJodHRwczovL2luZGV4L ... J0QUl6RTIifX0=
kind: Secret
metadata:
  ...
  name: myregcred
  ...
type: kubernetes.io/dockerconfigjson
```

`.dockerconfigjson` 字段的值是 Docker 凭证的 base64 表示。

要了解 `dockerconfigjson` 字段中的内容，请将 Secret 数据转换为可读格式：

```shell
kubectl get secret myregcred --output="jsonpath={.data.\.dockerconfigjson}" | base64 --decode
```

输出和下面类似：

```json
{"auths":{"yourprivateregistry.com":{"username":"janedoe","password":"xxxxxxxxxxx","email":"jdoe@example.com","auth":"c3R...zE2"}}}
```

要了解 `auth` 字段中的内容，请将 base64 编码过的数据转换为可读格式：

```shell
echo "c3R...zE2" | base64 --decode
```

输出结果中，用户名和密码用 `:` 链接，类似下面这样：

```
janedoe:xxxxxxxxxxx
```

注意，Secret 数据包含与本地 `~/.docker/config.json` 文件类似的授权令牌。

这样你就已经成功地将 Docker 凭证设置为集群中的名为 `myregcred` 的 Secret。

## 创建一个使用Secret 的 Pod

下面是一个 Pod 配置清单示例，该示例中 Pod 需要访问你的 Docker 凭证 `regcred`：

[`pods/private-reg-pod.yaml` ](https://raw.githubusercontent.com/kubernetes/website/main/content/zh/examples/pods/private-reg-pod.yaml)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: private-reg
spec:
  containers:
  - name: private-reg-container
    image: <your-private-image>
  imagePullSecrets:
  - name: myregcred
```

在`my-private-reg-pod.yaml` 文件中，使用私有仓库的镜像路径替换 `<your-private-image>`，例如：

```
janedoe/jdoe-private:v1
```

要从私有仓库拉取镜像，Kubernetes 需要凭证。 配置文件中的 `imagePullSecrets` 字段表明 Kubernetes 应该通过名为 `myregcred` 的 Secret 获取凭证。

创建使用了 Secret 的 Pod，并检查它是否正常运行：

```shell
kubectl apply -f my-private-reg-pod.yaml
kubectl get pod private-reg
```
--------

全文完。