---
title: Linux Shell之grep与正则
date: 2021-12-15 22:15:01
updated: 2021-12-15 22:15:01
description: grep、sed、awk并称为linux文本处理器三剑客，本文主要总结grep基础使用方法。
categories: 
  - 技术笔记

tags: 
  - Linux
  - Shell

keywords: linux,grep,shell
image: Linux_logo.png
---
**grep**：global  regular expressions print，全局正则表达式打印。主要用于在一个或者多个文件中，查找特定的单个字符、字符串、单词或句子，并打印出来。这个特定的字符(字符串)就是通过**正则表达式**(regular expressions print)来描述。

## 正则表达式

### 基本通配符

| 通配符                                                                       | 功能                                                                                            | 示例                                                                                            |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ^                                                                            | 以什么开头 的**行**：其实 `^`（脱字号）符号与一行开头的空字符串匹配。                   | '^love'：匹配以字符 `love`开头的行，即字符串 `love`仅在出现在一行的**开头**时才匹配。 |
| $      | 以什么结尾的**行**：其实`$`（美元）符号与一行结尾的空字符串匹配。 | 'love$'：匹配以字符 `love`结尾的行，即字符串 `love`仅在出现在一行的**末尾**时才匹配。 |                                                                                                 |
| .                                                                            | 匹配一个字符，一个任意字符的**行**                                                        |                                                                                                 |
| *                                                                            | 匹配0个或者多个字符的**行**                                                               | 'c*': 将匹配 0 个（即空白）或多个字符 c（c 为任一字符）的行；`.*`表示匹配任意字符串；         |
| [xyz]                                                                        | 匹配集合中的任意一个字符x,y,z的行                                                               | '[Ll]ove': 匹配字符 `Love`或者 `love`的行                                                   |
| [^xyz]                                                                       | 匹配除方括号中字符外的所有字符的行                                                              | [^had]: 匹配除了 `had`字符以外的所有字符、字符串、句子的行                                    |
| [x-y]                                                                        | 匹配集合范围内的字符的行                                                                        | '[A-Z]ove': 匹配 `Aove` ~ `Zove`的行                                                        |
| [^x-y]                                                                       | 匹配不在集合范围内的字符的行                                                                    | [^A-Z]: 匹配不在A-Z范围内的任何字符的行，所有的小写字符                                         |
| \                                                                            | 转义                                                                                            |                                                                                                 |

> 需要注意的是，在基本正则表达式中，如通配符 `*`、`+`、`{`、`|`、`(` 和 `)`等，已经失去了它们原本的含义，而若要恢复它们原本的含义，则要在之前添加反斜杠 \，如 `\*`、`\+`、`\{`、`\|`、`\(` 和 `\)`。

上表中提到，`^`（脱字号）符号与一行开头的空字符串匹配，`$`（美元）符号与一行结尾的空字符串匹配。所以 `^$`可用来匹配空行，即开头是空，中间没有字符，结尾是空。所以如果要将文本去掉空格行的话，可使用 `cat file |grep -v '^$'`，其中参数 `-v`表示翻转*verse*。

### 量词

量词可指定要出现匹配项必须出现的项数。 下表显示了GNU `grep`支持的量词：

| 量词      | 描述                            |
| :-------- | :------------------------------ |
| `*`     | 将前一项匹配零次或多次。        |
| `?`     | 将前一项匹配零或一次。          |
| `+`     | 匹配先前项一次或多次。          |
| `{n}`   | 精确匹配先前项 `n`            |
| `{n,}`  | 至少匹配 `n`次。              |
| `{,m}`  | 最多匹配前一项 `m`次。        |
| `{n,m}` | 匹配前一项从 `n`至 `m` 次。 |

举几个栗子：

- 正则表达式 `12*4` 与字符串 1234 不匹配，与 1224，12224，14 匹配：理解为字符2出现过0次或者多次；
- 正则表达式 `(12)*4` 表示与12匹配0次或者多次，再加上4，如124,12124,4；
- 正则表达式 `'o\{2\}'`表示匹配两个o，即oo，使用 `\`对大括号进行转义。
- 正则表达式 `'o\{2,4\}'`表示匹配两个o，到四个o，即oo,ooo,oooo，使用 `\`对大括号进行转义。

### 交替

交替是简单的 `or`运算。 交替运算符 `|`（竖线）使您可以指定不同的可能匹配项，这些匹配项可以是文字字符串或表达式集。 在所有正则表达式运算符中，此运算符的优先级最低。

在下面的示例中，我们正在搜索[Nginx log]错误文件中所有出现的单词 `fatal`，`error`和 `critical`：

```bash
grep 'fatal\|error\|critical' /var/log/nginx/error.log
```

## grep基础用法

 grep 命令的基本格式如下：

```bash
[root@localhost ~]# grep [选项] 模式 文件名
```

- 这里的模式，要么是字符（串），要么是正则表达式。
- 常用的选项以及各自的含义如下表所示。

| 选项 | 含义                                                       |
| ---- | ---------------------------------------------------------- |
| -c   | 仅列出文件中包含模式的行数。                               |
| -i   | 忽略模式中的字母大小写。                                   |
| -l   | 列出带有匹配行的文件名。                                   |
| -n   | 在每一行的最前面列出行号。                                 |
| -v   | 列出没有匹配模式的行。                                     |
| -w   | 把表达式当做一个完整的单字符来搜寻，忽略那些部分匹配的行。 |

> 注意，如果是搜索多个文件，grep 命令的搜索结果只显示文件中发现匹配模式的文件名；而如果搜索单个文件，grep 命令的结果将显示每一个包含匹配模式的行。

比如有一份文件reg.txt：

```bash
[root@localhost ~]# cat reg.txt
I had a lovely time on our little picnic.
Lovers were all around us. It is springtime. Oh
love, how much I adore you. Do you know
the extent of my love? Oh, by the way, I think
I lost my gloves somewhere out in that field of
clover. Did you see them?  I can only hope love.
is forever. I live for you. It's hard to get back in the
groove.
ABDS
JHB
had
what
```

 【例 1】搜索此reg.txt文件，找出包含了字符串 `love`，则执行命令如下：

```bash
# cat reg.txt |grep -n love  
cat reg.txt |grep -n 'love'
1:I had a lovely time on our little picnic.
3:love, how much I adore you. Do you know
4:the extent of my love? Oh, by the way, I think
5:I lost my gloves somewhere out in that field of
6:clover. Did you see them?  I can only hope love.
```

使用参数-n将文件的行打印出来，可见在文件的1，3,4,5,6行分别都有字符 `love`，但是第一行中的 `lovely`也被筛选出来了，如果想要精确匹配这个字符 `love`，则应该带上参数 `-w`.

```bash
# cat reg.txt |grep -n -w 'love'
3:love, how much I adore you. Do you know
4:the extent of my love? Oh, by the way, I think
6:clover. Did you see them?  I can only hope love.
```

在3,4,6行中匹配上了只有 `love`字符，第一行的 `lovely`和第5行的 `gloves`被过滤掉了。

如果只是想知道有多少个love字符串，则带上参数 `-c`：

```bash
# cat reg.txt |grep love -c
5
```

如果想知道有多少个精准的love字符串，则带上 `-w`和 `-c`:

```bash
# cat reg.txt |grep  -wc 'love'
3
```

【例 2】搜索reg.txt文件，使用正则表达式找出以 love开头的数据行，执行命令如下：

```bash
# cat reg.txt |grep -n '^love'
3:love, how much I adore you. Do you know
```

可见只匹配上了第三行。

 grep 命令的功能非常强大，通过利用它的不同选项以及变化万千的正则表达式，可以获取任何我们所需要的信息。本节所介绍的 grep  命令，只介绍了它的一部分基础知识。也可到https://linuxtools-rst.readthedocs.io/zh_CN/latest/base/03_text_processing.html#id4查看对应文本处理章节。

---

全文完。
