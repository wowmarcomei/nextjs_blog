---
title: 'Adding Multiple Accounts Connect to GitHub'
date: '2024-03-20'
tags: ['github', 'git', 'version control', 'css', 'nextjs']
category: 'Development Tools'
image: '/images/github-actions-post.png'
---

1.  在WSL2中安装git

在WSL2中打开终端，运行以下命令：

```bash
sudo apt update
sudo apt install git
```

2.  创建SSH密钥对

在WSL2终端中运行以下命令创建SSH密钥对：cd 

```bash
ssh-keygen -t ed25519 -C "wowmarcomei@163.com"
```

按提示输入密钥文件的保存位置及名称以及密码。完成后，请再为第二个帐户创建另一个密钥对：

```bash
ssh-keygen -t ed25519 -C "laomeinote@qq.com"
```

3.  添加SSH密钥到相应GitHub帐户

将公钥（以`.pub`结尾）的内容复制到剪贴板：

```bash
cat ~/.ssh/id_ed25519_firstaccount.pub | clip.exe
```

然后，转到GitHub网站并登录到您的第一个帐户。点击右上角的头像，在下拉菜单中选择"Settings"。然后，在左侧菜单中选择"SSH and GPG keys"，并点击"New SSH key"按钮。在弹出窗口中，为该密钥添加一个标题，并将剪贴板中的公钥粘贴到"Key"字段中，最后单击"Add SSH key"按钮。

同样地，将第二个帐户的公钥添加到其相应的GitHub帐户中。

4.  添加别名和全局设置

在WSL2终端中打开`~/.ssh/config`文件并添加类似于以下内容的内容：

```bash
# for first account
Host github.com-wowmarcomei163com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_wowmarcomei

# for second account
Host github.com-laomeinoteqqcom
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_laomeinote
```

> 注意，这里指定的是私钥，而不是以pub结尾的公钥。

然后，在WSL2终端中运行以下命令来配置全局git设置：

```bash
git config --global user.name "Your Name"
git config --global user.email "youremail@example.com"
```

5.  克隆或创建repo

在本地克隆或创建一个repo，例如：

```bash
git clone https://github.com/username/repo.git
cd repo/
touch README.md
git add README.md
git commit -m "add readme"
```

> 这里先使用https克隆repo，git没有指定别名是无法克隆下来的。

6.  添加远程存储库别名

为每个GitHub帐户创建远程别名，例如：

```bash
# for first account
git remote add firstaccount git@github.com-firstaccount:username/repo.git

# for second account
git remote add secondaccount git@github.com-secondaccount:username/repo.git
```

7.  推送更改

确认您要将更改推送到哪个远程存储库（分支），并使用正确的远程别名进行推送：

```bash
# push to the first account
git push firstaccount branchname

# push to the second account
git push secondaccount branchname
```

这就是在WSL2上安装配置git并与两个GitHub帐户连接的完整步骤。

> 在配置全局git设置时，`user.email`应该与要使用的GitHub帐户的电子邮件地址相对应。如果您要在第一个GitHub帐户上进行操作，则应将`user.email`设置为第一个GitHub帐户的电子邮件地址。同样地，如果您要在第二个GitHub帐户上进行操作，则应将`user.email`设置为第二个GitHub帐户的电子邮件地址。
> 
> 如果您不确定要在哪个GitHub帐户上进行操作，或者想要在多个GitHub帐户之间轮流切换，那么可以设置一个通用的电子邮件地址作为`user.email`，例如`your-email-address@example.com`。在这种情况下，您需要确保在每次使用git push时指定正确的远程别名来推送更改到正确的GitHub帐户中。