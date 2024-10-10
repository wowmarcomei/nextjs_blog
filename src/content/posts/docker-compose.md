---
title: 06-容器编排之Docker-Compose
date: 2021-12-25 22:01:41
updated: 2021-12-25 22:01:41
description: Docker Compose是Docker的编排开源组件，Docker的三架马车之一，主要用来编排docker容器。本文将简述Docker compose的使用。
categories: 
  - 技术笔记
tags: 
  - Docker
  - Docker-Compose
image: /images/docker-logo.png

keywords: Docker,Docker-Compose
---
Docker Compose是什么？它是Docker的编排开源组件，后被Docker收购，是当年社区内火爆程度仅次于Docker的开源项目，Docker的三架马车之一，主要用来编排docker容器。本文将简述Docker compose的使用。

## 1.Docker Compose组件

*Compose* 组件是Docker官方基于Python开发的Docker编排的组件。之前我们启动多个容器的时候，需要为每个容器编写 `dockerfile`，分别使用 `docker run`或者 `docker exec`启动它们。通过*Compose*咱们就可以一次性在定义好多个容器，一次性启动，实现编排功能。它的两个重点内容：

- `docker-compose.yml`： *Compose*的配置文件
- `docker-compose`： *Compose*的命令行工具

### 1.1 Docker Compose安装与卸载

推荐直接下载二进制可执行文件。

```shell
 #从github下载1.25.4版本compose
$ sudo curl -L "https://github.com/docker/compose/releases/download/1.25.4/docker-compose-$(uname -s)-$(uname -m) " -o /usr/local/bin/docker-compose 

#如果国内下载速度慢，可到下面网址下载
$ sudo curl -L "https://get.daocloud.io/docker/compose/releases/download/1.25.4/docker-compose-$(uname -s)-$(uname -m) " -o /usr/local/bin/docker-compose

# 给 docker-compose 添加可执行权限
$ sudo chmod +x /usr/local/bin/docker-compose

# 卸载 docker-compose
$ sudo rm /usr/local/bin/docker-compose
```

### 1.2 使用Compose编排flask实例

这个实例中，我们使用使用创建一个 `flask demo`应用，使用 `dockerfile`编写 `flask`应用镜像，使用*Compose*基于 `dockerfile`创建的 `flask`镜像拉取一个 `flask`容器和其依赖的 `redis`容器。

来看下这个测试目录结构：

```shell
[root@VM-95-141-centos flask-demo]# pwd
/root/flask-demo
[root@VM-95-141-centos flask-demo]# tree
.
|-- app.py
|-- docker-compose.yml
|-- dockerfile
└──  requirements.txt


0 directories, 4 files
```

在 `root/flask-demo`下新建了4个文件，分别是 `app.py`-flask源程序，`requirements.txt`-flask程序安装的依赖程序，`dockerfile`-构建flask镜像的dockerfile文件，`docker-compose.yml`-编排flask和redis容器的compose文件。

- `app.py` - flask源程序

  ```python
  import time
  
  import redis
  from flask import Flask
  
  app = Flask(__name__)
  cache = redis.Redis(host='redis', port=6379)


  def get_hit_count():
      retries = 5
      while True:
          try:
              return cache.incr('hits')
          except redis.exceptions.ConnectionError as exc:
              if retries == 0:
                  raise exc
              retries -= 1
              time.sleep(0.5)


  @app.route('/')
  def hello():
      count = get_hit_count()
      return 'Hello World! I have been seen {} times.\n'.format(count)
  ```
- `requirements.txt`-flask程序安装的依赖程序

  ```js
  flask
  redis
  ```
- `dockerfile`-构建flask镜像的dockerfile文件

  ```dockerfile
  #设置base镜像
  FROM python:3.7-alpine
  
  #设置容器的工作目录
  WORKDIR /code
  
  #设置环境变量
  ENV FLASK_APP app.py
  ENV FLASK_RUN_HOST 0.0.0.0
  
  #将当期目录下的python依赖文件copy至容器文件系统中
  COPY requirements.txt requirements.txt
  COPY . .
  
  #设置镜像源，安装gcc,musl-dev和linux-headers
  RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
    && apk add --no-cache gcc musl-dev linux-headers\
    && pip install -r requirements.txt
  
  CMD ["flask", "run"]
  ```

  > - 从Python 3.7的alpine映像开始构建flask映像
  > - 将容器的工作目录设置为 `/code`
  > - 设置flask命令使用的环境变量
  > - 复制requirements.txt并
  > - 将 `.`项目中的当前目录复制到 `.`映像中的工作目录 `/code`
  > - 修改源以便快速下载安装gcc， musl-dev，linux-headers与Python依赖项
  > - 将容器的默认命令设置为flask run。
  >
- `docker-compose.yml`-编排flask和redis容器的compose文件

  ```yaml
  version: '3'
  services:
    web: #构建web容器
      build: . #基于当前目录下的dockfile构建镜像
      ports:
        - "5000:5000"  #隐射主机与容器端口，相当于容器的docker run -p
    redis: #构建redis容器
      image: "redis:latest" #引用官网的redis镜像
  ```

  > 在这里，通过 `docker-compose.yml`文件，编排了两个容器，其中第一个 `web`容器通过 `build`命令对 `dockerfile`文件进行构建生成 `flask`镜像后启动容器；第二个 `redis`容器通过官方redis镜像构建。
  >

  通过 `docker-compose up`启动两个容器即可。

  ```shell
  [root@VM-95-141-centos flask-demo]# docker-compose up
  Building web
  Step 1/8 : FROM python:3.7-alpine
   ---> f0c1a69798c7
  Step 2/8 : WORKDIR /code
   ---> Using cache
   ---> d75b21d5a312
  Step 3/8 : ENV FLASK_APP app.py
   ---> Using cache
   ---> 2a8e613c3372
  Step 4/8 : ENV FLASK_RUN_HOST 0.0.0.0
   ---> Using cache
   ---> e3af59840e84
  Step 5/8 : COPY requirements.txt requirements.txt
   ---> Using cache
   ---> a6b832e8d8a3
  Step 6/8 : COPY . .
   ---> c6bf499fd10c
  Removing intermediate container d3b237395dea
  Step 7/8 : RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories   && apk add --no-cache gcc musl-dev linux-headers  && pip install -r requirements.txt
   ---> Running in 0e6c2354c9d2
  
  fetch https://mirrors.ustc.edu.cn/alpine/v3.14/main/x86_64/APKINDEX.tar.gz
  fetch https://mirrors.ustc.edu.cn/alpine/v3.14/community/x86_64/APKINDEX.tar.gz
  (1/13) Installing libgcc (10.3.1_git20210424-r2)
  (2/13) Installing libstdc++ (10.3.1_git20210424-r2)
  (3/13) Installing binutils (2.35.2-r2)
  (4/13) Installing libgomp (10.3.1_git20210424-r2)
  (5/13) Installing libatomic (10.3.1_git20210424-r2)
  (6/13) Installing libgphobos (10.3.1_git20210424-r2)
  (7/13) Installing gmp (6.2.1-r0)
  (8/13) Installing isl22 (0.22-r0)
  (9/13) Installing mpfr4 (4.1.0-r0)
  (10/13) Installing mpc1 (1.2.1-r0)
  (11/13) Installing gcc (10.3.1_git20210424-r2)
  (12/13) Installing linux-headers (5.10.41-r0)
  (13/13) Installing musl-dev (1.2.2-r3)
  Executing busybox-1.33.1-r6.trigger
  OK: 140 MiB in 48 packages
  Collecting flask
    Downloading Flask-2.0.2-py3-none-any.whl (95 kB)
  Collecting redis
    Downloading redis-3.5.3-py2.py3-none-any.whl (72 kB)
  Collecting Jinja2>=3.0
    Downloading Jinja2-3.0.3-py3-none-any.whl (133 kB)
  Collecting click>=7.1.2
    Downloading click-8.0.3-py3-none-any.whl (97 kB)
  Collecting itsdangerous>=2.0
    Downloading itsdangerous-2.0.1-py3-none-any.whl (18 kB)
  Collecting Werkzeug>=2.0
    Downloading Werkzeug-2.0.2-py3-none-any.whl (288 kB)
  Collecting importlib-metadata
    Downloading importlib_metadata-4.8.2-py3-none-any.whl (17 kB)
  Collecting MarkupSafe>=2.0
    Downloading MarkupSafe-2.0.1-cp37-cp37m-musllinux_1_1_x86_64.whl (30 kB)
  Collecting zipp>=0.5
    Downloading zipp-3.6.0-py3-none-any.whl (5.3 kB)
  Collecting typing-extensions>=3.6.4
    Downloading typing_extensions-3.10.0.2-py3-none-any.whl (26 kB)
  Installing collected packages: zipp, typing-extensions, MarkupSafe, importlib-metadata, Werkzeug, Jinja2, itsdangerous, click, redis, flask
  Successfully installed Jinja2-3.0.3 MarkupSafe-2.0.1 Werkzeug-2.0.2 click-8.0.3 flask-2.0.2 importlib-metadata-4.8.2 itsdangerous-2.0.1 redis-3.5.3 typing-extensions-3.10.0.2 zipp-3.6.0
  WARNING: Running pip as the 'root' user can result in broken permissions and conflicting behaviour with the system package manager. It is recommended to use a virtual environment instead: https://pip.pypa.io/warnings/venv
  WARNING: You are using pip version 21.2.4; however, version 21.3.1 is available.
  You should consider upgrading via the '/usr/local/bin/python -m pip install --upgrade pip' command.
   ---> 5aa794729c32
  Removing intermediate container 0e6c2354c9d2
  Step 8/8 : CMD flask run
   ---> Running in 77721b2fb1c6
   ---> 71de094f6563
  Removing intermediate container 77721b2fb1c6
  Successfully built 71de094f6563
  WARNING: Image for service web was built because it did not already exist. To rebuild this image you must use `docker-compose build` or `docker-compose up --build`.
  Creating flask-demo_redis_1 ... done
  Creating flask-demo_web_1   ... done
  Attaching to flask-demo_redis_1, flask-demo_web_1
  redis_1  | 1:C 14 Nov 2021 14:02:30.930 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
  redis_1  | 1:C 14 Nov 2021 14:02:30.930 # Redis version=6.2.6, bits=64, commit=00000000, modified=0, pid=1, just started
  redis_1  | 1:C 14 Nov 2021 14:02:30.930 # Warning: no config file specified, using the default config. In order to specify a config file use redis-server /path/to/redis.conf
  redis_1  | 1:M 14 Nov 2021 14:02:30.930 * monotonic clock: POSIX clock_gettime
  redis_1  | 1:M 14 Nov 2021 14:02:30.931 * Running mode=standalone, port=6379.
  redis_1  | 1:M 14 Nov 2021 14:02:30.931 # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
  redis_1  | 1:M 14 Nov 2021 14:02:30.931 # Server initialized
  redis_1  | 1:M 14 Nov 2021 14:02:30.931 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.
  redis_1  | 1:M 14 Nov 2021 14:02:30.938 * Ready to accept connections
  web_1    |  * Serving Flask app 'app.py' (lazy loading)
  web_1    |  * Environment: production
  web_1    |    WARNING: This is a development server. Do not use it in a production deployment.
  web_1    |    Use a production WSGI server instead.
  web_1    |  * Debug mode: off
  web_1    |  * Running on all addresses.
  web_1    |    WARNING: This is a development server. Do not use it in a production deployment.
  web_1    |  * Running on http://172.19.0.3:5000/ (Press CTRL+C to quit)
  ```

  测试一下：

  ```shell
  [root@VM-95-141-centos flask-demo]# curl 172.19.0.3:5000
  Hello World! I have been seen 1 times.
  [root@VM-95-141-centos flask-demo]# curl 172.19.0.3:5000
  Hello World! I have been seen 2 times.
  [root@VM-95-141-centos flask-demo]# curl 172.19.0.3:5000
  Hello World! I have been seen 3 times.
  [root@VM-95-141-centos flask-demo]#
  ```

---

全文完。
