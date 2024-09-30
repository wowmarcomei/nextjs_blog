Linux 的 screen工具是终端复用器，可在一个终端窗口中运行多个终端会话，并可进行跨窗口和会话切换，而不必担心丢失连接和状态。我们可将其用于离线作业场景。

想象一下这种场景：你需要在服务器上安装/编译一个大型软件，或者做系统备份、ftp 传输等，可能要花费1-2个小时，这期间不能关掉terminal窗口或者断开连接，否则这个任务就会被中断，一切半途而废了。但是又没法一直盯着屏幕，或者这时你需要关机出去处理别的事务，那这个任务岂不是要中断了？screen就可以完美解决这个问题，通过该软件同时连接多个命令行session会话，并在其间自由切换，只要不主动停止，会话里的任务不会中断。

## 安装screen

**Centos下安装**

```bash
sudo yum install -y screen
```

Ubuntu下安装

```bash
apt-get install screen
```

## Screen用法

```bash
screen [-AmRvx -ls -wipe][-d <作业名称>][-h <行数>][-r <作业名称>][-s <shell>][-S <作业名称>]
```

**参数说明**：

- -A 　将所有的视窗都调整为目前终端机的大小。
- -d <作业名称> 　将指定的screen作业离线。
- -h <行数> 　指定视窗的缓冲区行数。
- -m 　即使目前已在作业中的screen作业，仍强制建立新的screen作业。
- -r <作业名称> 　恢复离线的screen作业。
- -R  先试图恢复离线的作业。若找不到离线的作业，即建立新的screen作业。
- -s<shell> 　指定建立新视窗时，所要执行的shell。
- -S <作业名称> 　指定screen作业的名称。
- -v 　显示版本信息。
- -x 　恢复之前离线的screen作业。
- -ls或--list 　显示目前所有的screen作业。
- -wipe 　检查目前所有的screen作业，并删除已经无法使用的screen作业。

## Demo实例

创建 screen 终端

```bash
# screen lnmp //创建 screen 终端，名称为lnmp
# yum install -y xxx && ./install.sh xxx.sh #在lnmp窗口执行任务
```

关闭终端，任务已经在远程的会话里执行，一天后想查看执行结果，恢复会话即可。
```bash
# screen -ls    //查看当前有哪些会话
# screen -r lnmp  //恢复之前的lnmp会话
```

--------

全文完。
