---
title: Linux Shell中的数字0,1,2是什么意思
date: 2021-12-10 09:01:41
updated: 2021-12-10 09:01:41
description: Shell脚本的数字分为两种，一种是文本描述，一种是命令参数，两者用法和场景不同。
categories: 
  - 技术笔记

tags: 
  - Linux
  - Shell

keywords: linux,shell,数字,number
image: /images/Linux_shell.png

---
在Shell脚本中经常看到数字0,1,2，到底是什么意思，又有什么用处呢？其实Shell脚本的数字分为两种，一种是文本描述，一种是命令参数，两者用法和场景不同。这篇文章简单归纳总结。

## 1.文本描述0,1,2

在Linux和unix系统中，文件描述符0,1,2是系统预留的，它们的意义分别有如下对应关系：

- 0 —— stdin（标准输入）
- 1 —— stdout （标准输出）
- 2 —— stderr （标准错误）

其中，shell脚本中经常用到的就是描述符1，和描述符2。举个栗子说明：

```bash
[root@master test]# pwd        #在/root/test目录下测试
/root/test
[root@master test]# touch test.txt      #新建一个test.txt文件，这里的test.txt文本就是stdin（标准输入）
[root@master test]# ls              #执行ls命令会输出一个结果，输出的text.txt就是stdout （标准输出）
test.txt
[root@master test]# ls nothing.txt  #执行ls命令查看一个不存在的文件，下面输出的就是stderr （标准错误）
ls: cannot access nothing.txt: No such file or directory
```

上面的例子中，

- `touch test.txt`中的 `test.txt`就是0 — stdin（标准输入），
- 执行 `ls`命令会输出一个结果，如果不出错其输出结果就是1 — stdout （标准输出）
- 执行 `ls nothing.txt`查询一个不存在的文件，肯定会抛出错误，下面输出的结果就是2 — stderr （标准错误）

可以将正确结果重定向到文件中如：

```bash
[root@master test]# ls 1> stdout.txt
[root@master test]# ls
stdout.txt  test.txt
[root@master test]# cat stdout.txt
stdout.txt
test.txt
[root@master test]#
```

将错误结果重定向到文件中如：

```bash
[root@master test]# ls nothing.txt 2> stderr.txt
[root@master test]# cat stderr.txt
ls: cannot access nothing.txt: No such file or directory
[root@master test]#
```

### 1.1 文本描述0,1,2的几种常见用法

在shell中经常是通过管道，重定向等使用这些文件描述符。

### 1.2 重定向到/dev/null

`/dev/null`是一个特殊的设备文件，这个文件接收到的任何数据都会被丢弃。因此，null这个设备通常也被成为位桶（bit bucket）或黑洞。

即是将错误输出丢弃 `2> /dev/null`的用法：

```bash
$cat logcat.log 2> /dev/null |grep compiled
```

即打印logcat.log，将错误信息重定向到黑洞，标准输出作为grep的输入，过滤出包含 `compiled`字段的信息。

### 1.3 将标准输出与错误输出分开重定向

```bash
cmd 2>stderr.txt 1>stdout.txt
```

将cmd的结果中，正确的重定向到stdout.txt，错误的重定向到stderr.txt中。

### 1.4 将标准输出和错误输出重定向到一个文件中

```bash
cmd> output.txt 2>&1
```

即是将cmd结果输出到output.txt，其中 `2>&1`表示，将错误输出2-stderr叠加到1-stdout.txt中。

## 2. 参数$0、$1、$2

除了文本描述以外，0,1,2与 `$`符号在一起可作为shell参数。

### 2.1 基本含义

参数中的0,1,2就表示shell中的参数位置，举个栗子：

```bash
$ ./cmd.sh a b c 
```

执行脚本 `cmd.sh`，跟着的参数为 `a,b,c`，其中:

- `$0`
  对应 *./cmd.sh* 这个值。如果执行的是 `./myworkplace/cmd.sh`， 则$0为 *./myworkplace/cmd.sh* 这个值。
- `$1`
  会获取到 a，即 `$1` 对应传给脚本的第一个参数。
- `$2`
  会获取到 b，即 `$2` 对应传给脚本的第二个参数。
- `$3`
  会获取到 c，即 `$3` 对应传给脚本的第三个参数。`$4`、`$5` 等参数的含义依此类推。
- `$#`
  会获取到命令的参数个数，这里有a,b,c三个参数，所以其值为3，统计的参数不包括 `$0`。
- `$@`
  会获取到 "a" "b" "c"，也就是所有参数的**列表**，不包括 `$0`。
- `$*`
  也会获取到 "a" "b" "c"， 其值和 `$@` 相同。但 `"$*"` 和 `"$@"` 有所不同。
  `"$*"` 把所有参数**合并成一个字符串**，而 `"$@"` 会得到一个字符串参数数组。
- `$?`
  可以获取到执行 `./cmd.sh a b c` 命令后的返回值。
  在执行一个前台命令后，可以立即用 `$?` 获取到该命令的返回值。
  该命令可以是系统自身的命令，可以是 shell 脚本，也可以是自定义的 bash 函数。

  > 需要注意的是:
  >
  > 1）当调用的是系统命令，返回的是系统命令返回值。
  >
  > 2）当执行 shell 脚本时，`$?` 对应该脚本调用 `exit` 命令返回的值。如果没有主动调用 `exit` 命令，默认返回为 0。
  >
  > 3）当执行自定义的 bash 函数时，`$?` 对应该函数调用 `return` 命令返回的值。如果没有主动调用 `return` 命令，默认返回为 0。
  >

**另外，如果参数过多，超过9个，引用第10个参数的时候，不能使用 `$10`，而应该使用 `${10}`。**

### 2.2 基础使用

`$`与数字一起比较容易理解，剩下的几个稍微难理解，举个栗子测试 `$#`、`$@`和 `$*`。

```bash
#!/bin/bash

echo --------------
echo "#### demo:" $#

echo --------------
for arg in "$@"; do
    echo "@@@@ demo:" $arg
done
echo --------------
for arg in "$*"; do
    echo "**** demo:" $arg
done


[root@node1 ~]# ./cmd.sh a b c
--------------
#### demo: 3
--------------
@@@@ demo: a
@@@@ demo: b
@@@@ demo: c
--------------
**** demo: a b c
```

测试时，执行 `./cmd.sh a b c`，`$#`最终显示的是3表示脚本输入的参数个数，`$@`会逐个获取参数值，`$*`会将参数组合成字符串"a b c".

---

文章首发公众号-，欢迎关注，不定期更新。

---

全文完。
