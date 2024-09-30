---
title: 使用Github Actions自动同步备份Github仓库至Gitee仓库
date: 2024-07-22 18:15:26
updated: 2024-07-22 18:15:26

description: Github很好很强大，不过它也是有限制的，如若一不小心提交了不该传的仓库/代码/文档，可能整个仓库就被封掉了，为防万一，备份到Gitee是一个不错的选择。

categories: 
  - 技术笔记

tags: 
  - Github Actions
  - Github
  - Gitee
  - Sync

series:
  - Github

meta_image: images/posts/github-actions-post.png
image: images/posts/github-actions-post.png
keywords: Github Actions, Github, Gitee, Sync
---

Github被微软收购以后，财大气粗的开放了Private仓库限制了，Github Copilot背靠OpenAI Chatgpt-4越来越好用了，Github Actions、Github Container Repository等生态也越来越丰富了，各种开源软件雨后春笋般的提交到Github了，仿佛github就是git的代名词了。不过，github也是有限制的，如若一不小心提交了不该传的仓库/代码/文档，可能整个仓库就被封掉了，为防万一，备份到Gitee是一个不错的选择。

> 说明：Gitee管控的更严格，不要同步一些国内不允许的仓库上去，否则Gitee整个账号就被block掉了。

本文主要讲述通过Github Actions快速自动备份仓库到Gitee仓库。


## 在Gitee上导入Github仓库

登录Gitee后点击右上角选择**从Github/Gitlab导入仓库**，选中Github对应仓库导入即可。

如：
![sync2gitee](/images/posts/sync2gitee-1.png)

## 生成Gitee的ssh秘钥

在github actions中实际上是通过一个docker容器，远程登录到gitee仓库，跟在本地登录提交git代码类似，所以需要有对应的ssh秘钥，包括public key与private key。
参考[Gitee SSH 公钥设置](https://help.gitee.com/base/account/SSH%E5%85%AC%E9%92%A5%E8%AE%BE%E7%BD%AE)生成ssh key，并添加到gitee全局配置中。

如：
![sync2gitee](/images/posts/sync2gitee-2.png)



## 在Github上添加秘钥

为何还需要在Github上添加秘钥呢？这是因为如前文所述，在Github Actions中操作CI/CD实际上是启动一个Docker容器运行git，跟在本地登录提交代码到git仓库类似，需要在git仓库（github）上添加公钥，并将私钥作为secret变量引入给CI/CD Docker容器。

### 添加Public Key

将本地生成的用于Gitee的公钥 Public key填入到github的ssh keys中。

![ssh key](/images/posts/sync2gitee-3.png)


### 添加Private Key

将本地生成的用于Gitee的私钥 Private key填入到项目的secret秘钥中。

![ssh key](/images/posts/sync2gitee-4.png)



添加好对应的秘钥之后，开始设置Github Actions，用于同步仓库到Gitee。



## 添加Github Actions

在Github仓库根目录添加`.github/workflows`中添加：

```yaml
# 通过 Github action， 在仓库的每一次 commit 后自动同步到 Gitee 上
name: sync2gitee
on:
  push:
    branches:
      - main 
jobs:
  repo-sync:
    env:
      SSH_PRIVATE_KEY: ${{ secrets.GITEE_PRIVATE_KEY }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          persist-credentials: false
          
      - name: Configure Git
        run: |
           git config --global --add safe.directory /github/workspace

      - name: sync github -> gitee
        uses: wearerequired/git-mirror-action@master
        if: env.SSH_PRIVATE_KEY
        with:
          source-repo: "git@github.com:${{ github.repository }}.git"
          destination-repo: "git@gitee.com:meixuhong/meixuhong.com.git"
```

这里有两个需要注意的地方：

- 我们添加了一个task： `Configure Git`主要是为了避免出现` "detected dubious ownership in repository"`错误，所以将编译过程中使用的`/github/workspace`添加到安全目录。
- source-repo与destination-repo要写对，分别填写github仓库与gitee仓库地址。
