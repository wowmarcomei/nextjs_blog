目前可靠的docker镜像保存途径主要为docker hub与github的镜像仓，本文主要介绍推送镜像至Github的镜像仓库。

GitHub 提供了一个名为 GitHub Container Registry 的服务，可以存储和管理 Docker 镜像。

如下讲解如何将容器镜像推送到Github步骤。



## 1、准备条件

- Docker服务已正常安装并启动。

- Docker镜像已经存在于本地，如果本地没有的话，也可以使用Dockerfile创建镜像。例如，如果你的 Dockerfile 在你的项目的根目录中，可以使用以下命令构建镜像：

```shell
  docker build -t <your-image-name> .
```

- 获取Github的个人访问令牌（PAT），即Personal Access Token，需要确保 PAT 具有 `read:packages` 和 `write:packages` 权限。

  ![push-docker-images-to-github-registry](/images/posts/PAT-1.png)

  ![push-docker-images-to-github-registry](/images/posts/PAT-2.png)

## 2、推送镜像

- **登录 GitHub Container Registry：** 在终端或命令行中，使用 GitHub 用户名和 GitHub 的个人访问令牌（PAT）登录 GitHub Container Registry。

```bash
echo <PAT> | docker login ghcr.io -u <your-github-username> --password-stdin
```

将 `<PAT>` 替换为个人访问令牌，将 `<your-github-username>` 替换为 GitHub 用户名。

- **标记你的 Docker 镜像：** 使用以下命令将 Docker 镜像标记为 GitHub Container Registry 镜像：

```bash
docker tag <your-image-name>:<tag> ghcr.io/<your-github-username>/<your-image-name>:<tag>
```

将 `<your-image-name>:<tag>` 替换为本地 Docker 镜像名与tag名，`<your-github-username>` 替换为 GitHub 用户名，`<tag>` 替换想要使用的标签（例如默认的`latest`标签）。

- **推送 Docker 镜像到 GitHub：** 使用以下命令将 Docker 镜像推送到 GitHub Container Registry：

```bash
docker push ghcr.io/<your-github-username>/<your-image-name>:<tag>
```

完成以上步骤后，就可以在 GitHub个人账号的 的 "Packages" 部分看到Docker 镜像了，但是该镜像默认为private镜像，Pull使用时需要先登录。

