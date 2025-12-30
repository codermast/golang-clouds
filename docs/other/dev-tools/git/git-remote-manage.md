---
order : 6
---
# Git 远程管理

## 远程仓库操作

对于远程仓库的操作，Git 提供了 `git remote` 命令，用于用于管理 Git 仓库中的远程仓库。

以下是 git remote 命令的常见用法：

- 列出当前仓库中已配置的远程仓库

```sh
git remote 
```

- 列出当前仓库中已配置的远程仓库，并显示它们的 URL

```sh
git remote -v
```

- 添加一个新的远程仓库。指定一个远程仓库的名称和 URL，将其添加到当前仓库中

```sh
git remote add <remote_name> <remote_url>
```

- 将已配置的远程仓库重命名。

```sh
git remote rename <old_name> <new_name>
```

- 从当前仓库中删除指定的远程仓库
```sh
git remote remove <remote_name>
```
- 修改指定远程仓库的 URL

```sh
git remote set-url <remote_name> <new_url>
```
- 显示指定远程仓库的详细信息，包括 URL 和跟踪分支。

```sh
git remote show <remote_name>
```

## 从远程获取代码库

从远程仓库获取代码库到本地需要两步，首先获取远程分支数据，然后将本地分支没有的数据进行合并。

1. 获取远程分支数据

```sh
git fetch <remote-branch-name>
```

该指令是获取远程分支 remote-branch-name 中本地分支没有的数据，仅限于获取，对本地分支不做任何更改。

2. 合并远程分支数据到本地

```sh
git merge [remote-branch-name]/[local-branch-name]
```

该指令是在获取远程分支数据后，将本地分支没有的数据合并到本地分支，即使用远程数据覆盖本地数据。


## 下载远程代码并合并

Git 上提供了 `git pull` 命令，用于从远程获取代码并合并本地的版本。

git pull 其实就是 git fetch 和 git merge FETCH_HEAD 的简写。

```sh
git pull <远程主机名> <远程分支名>:<本地分支名>
```
该指令的功能就是将远程主机上的远程分支拉过来，与本地分支进行合并。

如果是远程分支和当前分支进行合并，则可以省略本地分支名。

```sh
git pull <远程主机名> <远程分支名>
```

## 上传远程代码并合并

Git 上提供了 `git push` 命令，用于从将本地的分支版本上传到远程并合并。

```sh
git push <远程主机名> <本地分支名>:<远程分支名>
```

如果本地分支名与远程分支名相同，则可以省略冒号和远程分支名

```sh
git push <远程主机名> <本地分支名>
```

如果本地分支和远程分支内容有差异，但又要强制推送可以使用 --force 参数

```sh
git push --force <远程主机名> <本地分支名>
```

删除远程分支

```sh
git push <远程主机名> --delete <本地分支名>
```