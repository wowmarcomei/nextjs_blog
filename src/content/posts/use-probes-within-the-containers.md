---
title: 16-使用探针保障容器高可用
date: 2022-04-17 20:19:21
updated: 2022-04-17 20:19:21
categories: 
  - 技术笔记
description: 从业务层面来讲，应用需要高可用，确保容器启动失败时能自愈，业务异常能自愈。
tags: 
  - K8s
  - Kubernetes
  - CloudNative
image: kubernetes.png
keywords: kubernetes,k8s,probe,startup,readiness,liveness,
---
> 场景与需求：
>
> - POD中的容器在启动后才能接管业务流量，如果启动失败要能够重启；
> - 如果容器在运行过程中，出现OOM错误或网络不通等，要能够使得该容器不再提供服务，且尝试自愈（重启）。

针对上面的需求，Kubernetes提供三种探针来解决。

1. startupProbe探针: 探测容器是否已经启动。*用在有些POD启动需要很长时间的场景，避免每隔一段时间使用其他探针探测一次*。
   - 如果提供了启动探针，则所有其他探针都会被禁用，直到此探针成功为止，即容器启动时优先使用startupProbe探测容器是否已经启动。
   - 如果启动探测失败，kubelet 将kill POD中的容器，而容器依其重启策略（RestartPolicy）进行重启。
   - 如果探测容器启动成功，将会启动容器中的其他两个探针（如果启动了的话），即readinessProbe和livenessProbe会接管进行下一步的探测。
   - 如若没有提供startupProbe探针，默认容器启动成功。
2. readinessProbe探针：探测容器是否准备好对外提供服务。
   - 容器启动后，如果探测容器readiness失败，kubelet将从与 该Pod 匹配的所有服务的端点列表中删除该 Pod 的 IP 地址。也就是 svc 负载均衡会将这个 Pod 删掉，不提供服务。
   - readiness探针中的 `initialDelaySeconds`之前的时间里，探针状态是failure，过了这个时间点，如果探测成功，则状态为success。
   - 如果没有提供readiness探针，则默认容器一直是就绪的，是可以对外提供服务的。
3. livenessProbe探针：探测容器提供的服务是否活着。
   - 容器启动后，如果探测容器提供的服务readiness失败， kubelet 会杀死容器， 并且容器将根据其重启策略（RestartPolicy）决定是否重启。
   - 如果没有提供liveness探针，则默认容器提供的服务是活着的，不会主动重启。

**使用这三种探针来确认容器中业务高可用的实践，容器如果挂了不再提供服务，并一定程度自愈（三板斧之一 ：重启）**。

```yaml
spec:
  containers:
  #...省略
     startupProbe:
          failureThreshold: 30  #探测失败重试阈值为30次
          httpGet:
            path: /health
            port: 9080
            scheme: HTTP
          periodSeconds: 5  #每5秒探测一次
          successThreshold: 1 # 探测成功阈值，1次成功就让liveness探针接管
        
     readinessProbe:
        failureThreshold: 3   #探测失败重试阈值为3次
          httpGet:
            path: /health
            port: 9080
            scheme: HTTP
          periodSeconds: 5    #每5秒探测一次   
        
     livenessProbe:
        failureThreshold: 3  #探测失败重试阈值为3次
          httpGet:
            path: /health
            port: 9080
            scheme: HTTP
          periodSeconds: 10  #每10秒探测一次
          successThreshold: 1 # 探测成功阈值 
   #...省略  
```

这里首先设置启动探针的阈值为30次，每5秒探测一次，应用程序将有最大(150秒)完成启动，一旦启动成功，readiness和liveness探针即会接管后续的探测。在后续的探测中，readiness是每5s探测一次，如果探测到3次失败则认定已经失败，service Endpoints将会摘除这个POD IP使其不再对外提供服务；同时，liveness探针也会每10s中探测一次，如果探测到3次失败则认定已经失败，根据容器的重启策略，决定是否重启容器，如果不指定POD的重启策略（**RestartPolicy**），则默认为 `Always`策略。也即意味着，如果这个容器出现故障，Kubelet会自动将这个容器重启。

---

全文完。
