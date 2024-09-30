---
title: Linux Shell之awk
date: 2021-12-17 22:15:01
updated: 2021-12-17 22:15:01
description: grep、sed、awk并称为linux文本处理器三剑客，本文主要总结awk的基础使用方法。
categories: 
  - 技术笔记

tags: 
  - Linux
  - Shell

keywords: linux,awk,shell
image: Linux_logo.png
---
awk是一个强大的文本分析工具，相对于grep的查找，sed的编辑，awk在其对数据分析并生成报告时，显得尤为强大。简单来说awk就是把文件逐行的读入，以空格为默认分隔符将每行切片，切开的部分再进行各种分析处理。

## awk基本使用方法

```bash
awk [-F  field-separator]  'commands'  input-file(s)
```

参数描述：

- [-F域分隔符]是可选的，awk以行为单位，逐行读取数据，通过*field-separator*将这行分割，分割后的行分别为对应的域；如果不设置该参数默认以"空白键" 或 "[tab]键"为分隔符；
- commands 是awk真正执行的命令;
- input-file(s) 是待处理的文件。

**需要注意的是，整个脚本命令是用单引号（''）括起，而其中的执行命令部分需要用大括号（{}）括起来。**

举个栗子：

读取系统前5条登陆记录：

```bash
# last -n 5
root     pts/0        10.45.52.12      Tue Jan  4 20:59   still logged in
root     pts/0        10.38.94.203     Tue Jan  4 16:34 - 18:17  (01:43)
root     pts/1        10.38.94.203     Tue Jan  4 15:00 - 16:29  (01:28)
root     pts/1        10.38.94.203     Tue Jan  4 14:44 - 15:00  (00:16)
root     pts/0        10.37.80.224     Tue Jan  4 11:06 - 15:53  (04:46)

wtmp begins Mon Apr 27 22:28:21 2020
```

使用awk获取用户名

```bash
# last -n 5 |awk '{print $1}'
root
root
root
root
root

wtmp
```

这个例子中awk工作流程是这样的：读入有'\n'换行符分割的一条记录，然后将记录按指定的域分隔符划分域，填充域，$0则表示所有域,$1表示第一个域,$n表示第n个域。默认域分隔符是"空白键" 或 "[tab]键",所以$1表示登录用户，$3表示登录用户ip，以此类推。

再举个栗子显性化 `:`分隔符：

```bash
# cat test.txt
I had a lovely: time: on: our little picnic.
asdh:sdhsf:dskgjfg
1h:sdjfhf:djhf
# cat test.txt |awk -F ':' '{print $1}'
I had a lovely
asdh
1h
```

这个例子中，awk工作流程是这样的：读入有'\n'换行符分割的一条记录，然后将记录按指定的域分隔符 `:`划分域，填充域，$0则表示所有域,$1表示第一个域,$n表示第n个域。默认域分隔符是"空白键" 或 "[tab]键"。

上面我们见识了awk的基本使用方法，其强大之处在于脚本命令 ` 'commands'`，其实更强大的还没展示出来，awk的 ` 'commands'`由 2 部分组成，分别为匹配规则和执行命令，如下所示：

```bash
'匹配规则{执行命令}'
```

即awk的使用方式为：

```bash
awk '匹配规则{执行命令}'  input-file(s)
```

举个栗子：test.txt共有5行，其中第2/4/6行为空行。

```bash
# cat test.txt
I had a lovely: time: on: our little picnic.

asdh:sdhsf:dskgjfg

1h:sdjfhf:djhf

# awk '/^$/{print "Blank line"}' test.txt
Blank line
Blank line
Blank line
```

`/^$/` 是一个正则表达式，功能是匹配文本中的空白行，同时可以看到，执行命令使用的是 print 命令，此命令经常会使用，它的作用很简单，就是将指定的文本进行输出。因此，整个命令的功能是，如果 test.txt 有 N 个空白行，那么执行此命令会输出 N 个 Blank line。

## awk使用数据字段变量

awk 的主要特性之一是其处理文本文件中数据的能力，它会自动给一行中的每个数据元素分配一个变量。

默认情况下，awk 会将如下变量分配给它在文本行中发现的数据字段：

- $0 代表整个文本行；
- $1 代表文本行中的第 1 个数据字段；
- $2 代表文本行中的第 2 个数据字段；
- $n 代表文本行中的第 n 个数据字段。

在 awk 中，默认的字段分隔符是任意的空白字符（例如空格或制表符）。 在文本行中，每个数据字段都是通过字段分隔符划分的。awk 在读取一行文本时，会用预定义的字段分隔符划分每个数据字段。

所以在下面的例子中，awk 程序读取文本文件，只显示第 1 个数据字段的值：

```bash
# cat data.txt
One line of test text.
Two lines of test text.
Three lines of test text.
# awk '{print $1}' data.txt
One
Two
Three
#
```

## awk使用多个命令

awk 可以将多条命令组合成一个正常的脚本，只需在命令之间加上分号即可。举个栗子：

```bash
# echo "Hello this is for shell test" | awk '{$5="awk"; print $0}'
My name is Christine
```

第一条命令$5="awk"，会给字段变量$4赋值，第二条命令打印整个字段。

## awk 脚本使用方法

一个awk脚本通常由：BEGIN语句块、能够使用模式匹配的通用语句块、END语句块3部分组成，这三个部分是可选的。任意一个部分都可以不出现在脚本中，脚本通常是被 **单引号** 中，其基本结构为：

```bash
awk 'BEGIN{ print "start" } pattern{ commands } END{ print "end" }' file
```

awk的工作原理：

- 第一步：执行 `BEGIN{ commands }`语句块中的语句；
- 第二步：从文件或标准输入(stdin)读取一行，然后执行 `pattern{ commands }`语句块，它逐行扫描文件，从第一行到最后一行重复这个过程，直到文件全部被读取完毕。**其中 `commands`也可使用分号隔开引用多个命令。**
- 第三步：当读至输入流末尾时，执行 `END{ commands }`语句块。

**BEGIN语句块** 在awk开始从输入流中读取行 **之前** 被执行，这是一个可选的语句块，比如变量初始化、打印输出表格的表头等语句通常可以写在BEGIN语句块中。

**END语句块** 在awk从输入流中读取完所有的行 **之后** 即被执行，比如打印所有行的分析结果这类信息汇总都是在END语句块中完成，它也是一个可选语句块。

**pattern语句块** 中的通用命令是最重要的部分，它也是可选的。如果没有提供pattern语句块，则默认执行 `{ print }`，即打印每一个读取到的行，awk读取的每一行都会执行该语句块。

举个栗子：

```bash
# echo -e "A line 1\nA line 2" | awk 'BEGIN{ print "Start" } { print } END{ print "End" }'
Start
A line 1
A line 2
End
```

当使用不带参数的 `print`时，它就打印当前行，当 `print`的参数是以逗号进行分隔时，打印时则以空格作为定界符。

## awk内置变量

awk有许多内置变量用来设置环境信息，这些变量可以被改变，下面给出了最常用的一些变量。

```shell
ARGC               命令行参数个数
ARGV               命令行参数排列
ENVIRON            支持队列中系统环境变量的使用
FILENAME           awk浏览的文件名
FNR                浏览文件的记录数
FS                 设置输入域分隔符，等价于命令行 -F选项
NF                 浏览记录的域的个数
NR                 已读的记录数
OFS                输出域分隔符
ORS                输出记录分隔符
RS                 控制记录分隔符
$0                 代表整个文本行；
$1                 代表文本行中的第 1 个数据字段；
$2                 代表文本行中的第 2 个数据字段；
$n                 代表文本行中的第 n 个数据字段。
```

举个栗子，统计/etc/passwd:文件名，每行的行号，每行的列数，对应的完整行内容:

```bash
# awk  -F ':'  '{print "filename:" FILENAME ",linenumber:" NR ",columns:" NF ",linecontent:"$0}' /etc/passwd
filename:/etc/passwd,linenumber:1,columns:7,linecontent:root:x:0:0:root:/root:/bin/bash
filename:/etc/passwd,linenumber:2,columns:7,linecontent:bin:x:1:1:bin:/bin:/sbin/nologin
filename:/etc/passwd,linenumber:3,columns:7,linecontent:daemon:x:2:2:daemon:/sbin:/sbin/nologin
filename:/etc/passwd,linenumber:4,columns:7,linecontent:adm:x:3:4:adm:/var/adm:/sbin/nologin
filename:/etc/passwd,linenumber:5,columns:7,linecontent:lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
filename:/etc/passwd,linenumber:6,columns:7,linecontent:sync:x:5:0:sync:/sbin:/bin/sync
filename:/etc/passwd,linenumber:7,columns:7,linecontent:shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
filename:/etc/passwd,linenumber:8,columns:7,linecontent:halt:x:7:0:halt:/sbin:/sbin/halt
filename:/etc/passwd,linenumber:9,columns:7,linecontent:mail:x:8:12:mail:/var/spool/mail:/sbin/nologin
filename:/etc/passwd,linenumber:10,columns:7,linecontent:operator:x:11:0:operator:/root:/sbin/nologin
filename:/etc/passwd,linenumber:11,columns:7,linecontent:games:x:12:100:games:/usr/games:/sbin/nologin
filename:/etc/passwd,linenumber:12,columns:7,linecontent:ftp:x:14:50:FTP User:/var/ftp:/sbin/nologin
filename:/etc/passwd,linenumber:13,columns:7,linecontent:nobody:x:99:99:Nobody:/:/sbin/nologin
filename:/etc/passwd,linenumber:14,columns:7,linecontent:systemd-network:x:192:192:systemd Network Management:/:/sbin/nologin
filename:/etc/passwd,linenumber:15,columns:7,linecontent:dbus:x:81:81:System message bus:/:/sbin/nologin
filename:/etc/passwd,linenumber:16,columns:7,linecontent:polkitd:x:999:998:User for polkitd:/:/sbin/nologin
filename:/etc/passwd,linenumber:17,columns:7,linecontent:postfix:x:89:89::/var/spool/postfix:/sbin/nologin
filename:/etc/passwd,linenumber:18,columns:7,linecontent:sshd:x:74:74:Privilege-separated SSH:/var/empty/sshd:/sbin/nologin
filename:/etc/passwd,linenumber:19,columns:7,linecontent:chrony:x:998:996::/var/lib/chrony:/sbin/nologin
filename:/etc/passwd,linenumber:20,columns:7,linecontent:tcpdump:x:72:72::/:/sbin/nologin
```

使用printf替代print,可以让代码更加简洁，如：

```bash
# awk  -F ':'  '{printf("filename:%s,linenumber:%s,columns:%s,linecontent:%s\n",FILENAME,NR,NF,$0)}' /etc/passwd
filename:/etc/passwd,linenumber:1,columns:7,linecontent:root:x:0:0:root:/root:/bin/bash
filename:/etc/passwd,linenumber:2,columns:7,linecontent:bin:x:1:1:bin:/bin:/sbin/nologin
filename:/etc/passwd,linenumber:3,columns:7,linecontent:daemon:x:2:2:daemon:/sbin:/sbin/nologin
filename:/etc/passwd,linenumber:4,columns:7,linecontent:adm:x:3:4:adm:/var/adm:/sbin/nologin
filename:/etc/passwd,linenumber:5,columns:7,linecontent:lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
filename:/etc/passwd,linenumber:6,columns:7,linecontent:sync:x:5:0:sync:/sbin:/bin/sync
filename:/etc/passwd,linenumber:7,columns:7,linecontent:shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
filename:/etc/passwd,linenumber:8,columns:7,linecontent:halt:x:7:0:halt:/sbin:/sbin/halt
filename:/etc/passwd,linenumber:9,columns:7,linecontent:mail:x:8:12:mail:/var/spool/mail:/sbin/nologin
filename:/etc/passwd,linenumber:10,columns:7,linecontent:operator:x:11:0:operator:/root:/sbin/nologin
filename:/etc/passwd,linenumber:11,columns:7,linecontent:games:x:12:100:games:/usr/games:/sbin/nologin
filename:/etc/passwd,linenumber:12,columns:7,linecontent:ftp:x:14:50:FTP User:/var/ftp:/sbin/nologin
filename:/etc/passwd,linenumber:13,columns:7,linecontent:nobody:x:99:99:Nobody:/:/sbin/nologin
filename:/etc/passwd,linenumber:14,columns:7,linecontent:systemd-network:x:192:192:systemd Network Management:/:/sbin/nologin
filename:/etc/passwd,linenumber:15,columns:7,linecontent:dbus:x:81:81:System message bus:/:/sbin/nologin
filename:/etc/passwd,linenumber:16,columns:7,linecontent:polkitd:x:999:998:User for polkitd:/:/sbin/nologin
filename:/etc/passwd,linenumber:17,columns:7,linecontent:postfix:x:89:89::/var/spool/postfix:/sbin/nologin
filename:/etc/passwd,linenumber:18,columns:7,linecontent:sshd:x:74:74:Privilege-separated SSH:/var/empty/sshd:/sbin/nologin
filename:/etc/passwd,linenumber:19,columns:7,linecontent:chrony:x:998:996::/var/lib/chrony:/sbin/nologin
filename:/etc/passwd,linenumber:20,columns:7,linecontent:tcpdump:x:72:72::/:/sbin/nologin
```

---

全文完。
