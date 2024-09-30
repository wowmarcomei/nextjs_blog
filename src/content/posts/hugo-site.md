![qclouod-ssl](/images/posts/hugo.png)
## 1.整体思路

之前一直在使用Hexo与webify托管站点，hexo的主题丰富、seo友好、webify静态托管也很省钱，小站点的成本几乎是免费的；吸引我改用hugo的原因主要是因为两点：

1. hugo使用go编译，号称是世界上最快的构建网站工具，据称200篇左右的博文用Hexo 需要10分钟去生成静态网页，而Hugo 只需要10秒。这带来的好处是什么？在写文章或者调整源码的时候基本上可以实时显示最终效果，而不用先编译调试再预览。
2. 这几年的工作主要跟k8s相关，k8s等技术栈均采用go开发，所以切换到hugo上保持技术栈一致似乎算得上一个折腾的理由。

使用hugo构建站点只需简单的几步即可完成，但如何将其部署上线稍微麻烦些，有人习惯部署到自己的服务器，但serverless时代了能不用服务器就不用，能托管就托管。github，vercel，netlify都是很好的托管平台，唯一不足的地方是在国内几乎都会存在DNS污染问题。为解决这个问题，咱们可以选择OBS文件存储进行托管，并通过CDN进行加速。各大厂(阿里、腾讯、华为等)都有成熟的OBS服务，综合比较下来腾讯的[COS](https://cloud.tencent.com/document/product/436)最便宜，所以这里介绍的都是基于腾讯服务部署的，整体流程如下图。

![build_hugo](/images/posts/build_site_with_hugo.png)

>注意： 使用腾讯CDN在国内进行CDN加速时，需要到工信部备案域名，海外加速时无需备案。

## 2.构建本地Hugo站点

在本地可通过5步快速生成一个站点： `安装Hugo` -> `创建站点` -> `选择主题` -> `创建内容` -> `生成网站`。

### 2.1 安装Hugo

参考[官网指导文档](https://gohugo.io/installation/)安装对应版本Hugo Extended，安装完成后可查看hugo版本,如：
```bash
$ hugo version
hugo v0.111.0-3fa8bb8318114cd69315eadd35bda169e6a8ca4b+extended linux/amd64 BuildDate=2023-03-01T20:57:44Z VendorInfo=gohugoio
```

### 2.2 创建站点

通过`hugo new site quickstart`一键创建站点。

### 2.3 选择主题

给站点选择一个默认主题并编辑设置主题内容，如选择[hugo-theme-zzo](https://github.com/zzossig/hugo-theme-zzo)主题。
```bash
$ cd quickstart
$ git init
$ git submodule add https://github.com/zzossig/hugo-theme-zzo.git themes/zzo
$ cp -fr themes/zzo/exampleSite/* ./ 
```
选择`hugo-theme-zzo`主题并将其演示站点的配置与内容拷贝至hugo根目录。其他配置可参考[主题官网指导](https://zzo-docs.vercel.app/zzo/configuration/configfiles/) 。

### 2.4 创建内容

可使用hugo命令生成页面。
```bash
$ hugo new posts/my-first-post.md
```
这将会在`content/posts`目录生成`my-first-post.md`文件，按照markdown格式编辑文件内容即可。后续也可直接在该目录添加文件，而不用通过命令方式创建。

### 2.5 生成网站

hugo编译创建静态网站，如果是需要将文件部署到服务器并通过Nginx进行代理提供服务，则需要生成最终的静态文件：
```bash
$ hugo build #在根目录下生成public目录，即为静态内容站点
```
public目录即为静态内容站点的所有内容，可将其打包至服务器上。如果需要在本地预览，则可启动本地服务器：
```bash
$ hugo server
```

## 3.托管至腾讯COS
如果不想通过服务器部署站点，则可以托管到对象存储中，设置桶属性为**静态网站托管**。腾讯云COS的配置使用步骤大致如下：

1. 选择region创建COS桶，设置访问权限为`公有读私有写`。
2. 在基础配置中启用静态网站，指定`索引文档`为`index.html`，即hugo生成的`public`目录下的`index`文件。
3. 可将本地生成的`public`目录下所有文件上传至bucket桶中，即可通过桶对外访问域名直接访问到`index.html`了。

当然，这种手工方式肯定不完美，我们可使用github action来协助完成自动推动到腾讯云COS中。在根目录下添加github workflow目录，设置action定义即可完成该需求。
4. 添加`github action`设置。
```bash

$ mkdir -p .github/workflows
$ cd .github/workflows
$ cat > kubeconfig.yaml <<EOL
name: Upload to COS

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1

    - name: Setup Hugo
      uses: peaceiris/actions-hugo@v2
      with:
        hugo-version: '0.110.0'
      
    - name: Build
      run: hugo --minify
    
    - name: Install coscmd
      run: sudo pip install coscmd
    - name: Configure coscmd
      env:
        SECRET_ID: ${{ secrets.SecretId }}
        SECRET_KEY: ${{ secrets.SecretKey }}
        BUCKET: ${{ secrets.Bucket }}
        REGION: ${{ secrets.Region }}
      run: coscmd config -a $SECRET_ID -s $SECRET_KEY -b $BUCKET -r $REGION
    - name: Upload
      run: coscmd upload -rfs --delete -f ./public/ / --ignore "./.git/*"

EOL

```
推送到github仓库中即可，另外，上面的github action中定义了四个环境变量：`SecretId`, `SecretKey`, `Bucket`和`Region`，需要在仓库中添加这些变量的定义，匹配上腾讯COS中创建的bucket桶信息。

这样在每次推送更新文章或者代码时，github均会使用hugo进行编译，并将`public`目录下的文件上传到COS桶。


## 4.CDN域名加速

COS开启静态网站后，默认会有一个cos的域名访问，但该域名比较长，而且COS访问成本相对CDN而言会贵一些，开启CDN不仅可在各地加速，整体成本也相对更低，何乐而不为？给腾讯云COS开启CDN很方便，在COS桶列表中选择`域名与传输管理`，选择`自定义CDN加速域名`，添加对应的域名。

![cdn_domain](/images/posts/cdn_domain.png)

如果域名是在腾讯云购买的，可以一站式完成DNS解析，如果是在其他网站注册，可在域名托管处修改DNS解析，添加CNAME解析。

完成CDN配置后即可正常通过CDN访问托管的网站了，但还有一个问题，每次COS内容更新时，可能由于CDN缓存刷新的慢，导致不能马上看到更新的内容，腾讯云COS支持serverless自动刷新缓存。
![update_cdn_cache](/images/posts/update_cdn_cache.png)
添加函数时按照提示选择全部部署&全部删除时刷新CDN缓存，这样每次在COS文件内容有更新时都会刷新CDN。
![cdn_domain](/images/posts/refresh_cdn_2.png)

完成这项配置后正常访问**http**域名即可正常访问上述配置的hugo站点，如果想要为托管在COS上的hugo静态网站加上https证书该如何处理呢？查看[为Hugo配置https证书](/posts/add-https-for-hugo).

---
全文完。
