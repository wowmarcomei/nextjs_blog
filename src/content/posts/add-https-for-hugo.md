---
title: "为Hugo配置https证书"
date: 2023-05-13T09:13:23+08:00
description: 为托管在腾讯云COS上的hugo静态网站加上let's encrypt证书, 通过github action自动为其续期。
categories: 
  - 建站笔记
tags: 
  - hugo
  - 腾讯云
  - cdn
  - github action
  - ssl
image: images/posts/qcloud-ssl.png
meta_image: images/posts/qcloud-ssl.png

keywords: hugo,腾讯云,cdn, github action, serverless, let's encrypt
---
![qclouod-ssl](/images/posts/qcloud-ssl.png)
网站启用https需要配置证书，`let's encrypt`提供免费https证书，不过需要90天重新更新一次证书，如果每次都采用手工上传证书会非常麻烦，也有可能忘记上传证书导致https访问异常。
为解决这个问题[acme.sh](https://acme.sh)提供了一键脚本，90天到期后自动续签证书。但是因为我们的站点[使用hugo快速建站并托管在腾讯云cos](./hugo-site)，并没有服务器可以部署该脚本，所以最好能生成https证书后上传到cdn。

zfb132开源了[qcloud-ssl-cdn](https://github.com/zfb132/qcloud-ssl-cdn)刚好能满足这个需求，其基本原理是通过github action来实现证书的更新，调用腾讯云CDN的API接口将证书上传到CDN中。fork仓库，配置对应的参数即可实现更新证书功能。

## 1. qcloud-ssl-cdn配置
fork仓库，添加Github Action Secrets：
- `ACME_DNS_TYPE`: Acme 的 dns 类型，配置[环境变量密钥](https://github.com/acmesh-official/acme.sh/wiki/dnsapi)，腾讯云的类型为`dns_dp`
- `ACME_DOMAIN`: 顶级域名，例如：laomeinote.com，自动申请证书 laomeinote.com/*.laomeinote.com
- `SECRETID`: 腾讯云 Secret Id
- `SECRETKEY`: 腾讯云 Secret Key
- `CDN_DOMAIN`: 在腾讯云上配置的CDN 域名，多个域名用逗号分隔，如`laomeinote.com`,`www.laomeinote.com`,注意不是通配符`*.laomeinote.com`
- `DP_Id`: DNSPod ID
- `DP_Key`: DNSPod Key

另需要注意：
1. 因为`acme.sh`使用申请证书使用的非RSA算法而是ecc算法，所以证书与密钥文件路径为`<domainname>_ecc`, 故需要修改`qcloud-ssl-cdn/docker/update.sh`中的`CER_FILE` 与`KEY_FILE`定义：
```bash
#1. 使用ACME申请的SSL完整证书的本地存放路径
CER_FILE = "${CERT_HOME}/${ACME_DOMAIN}_ecc/fullchain.cer"
#2. 使用ACME申请的SSL证书私钥的本地存放路径
KEY_FILE = "${CERT_HOME}/${ACME_DOMAIN}_ecc/${ACME_DOMAIN}.key"
```
更新后的完整代码可详见[qcloud-ssl-cdn/docker/update.sh](https://github.com/wowmarcomei/qcloud-ssl-cdn/blob/main/docker/update.sh).

2. `CDN_DOMAIN`必须为腾讯云上已配置的cdn域名，否则API会报错。

## 2. github action配置
Let's encrypt证书是90天过期一次，acme.sh也是90天刷新一次，为了避免当天失效当天刷新的情况，可以提前几天刷新证书。更新github action配置即可。

[qcloud-ssl-cdn/.github.workflows/update-cert.yml](https://github.com/wowmarcomei/qcloud-ssl-cdn/blob/main/.github/workflows/update-cert.yml)
```yaml
name: Update Cert

on:
  push:
    branches:
      - main # 只有在main分支push时才会触发
  schedule:
    - cron: '0 0 * */85 *' # 每隔85天自动执行,90天证书会过期，提前5天刷一次

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 
        uses: actions/checkout@v3

      - name: Prepare Environment
        run: |
          curl https://get.acme.sh | sh -s email=my@example.com
          pip install -r requirements.txt

      - name: Update Cert
        env:
          DP_Id: ${{ secrets.DP_Id }}
          DP_Key: ${{ secrets.DP_Key }}
          ACME_DNS_TYPE: ${{ secrets.ACME_DNS_TYPE }}
          ACME_DOMAIN: ${{ secrets.ACME_DOMAIN }}
          SECRETID: ${{ secrets.SECRETID }}
          SECRETKEY: ${{ secrets.SECRETKEY }}
          CDN_DOMAIN: ${{ secrets.CDN_DOMAIN }}
          CERT_HOME: /home/runner/.acme.sh
          ACME_HOME: /home/runner/.acme.sh
          WORK_DIR: .
        run: sh ./docker/update.sh

   ```
这里有两个动作会触发github action动作上传证书到cdn，一个是main分支有更新的时候，一种是85天定时触发。正常触发后可在腾讯云cdn上看到证书记录。
![upload_cert_to_cdn](/images/posts/upload_cert_to_cdn.png)

---
全文完。