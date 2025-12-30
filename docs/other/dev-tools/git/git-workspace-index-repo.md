---
order : 2
---
# Git 工作原理


![](/assets/dev-tools/git/git-pro/2024-04-03-12-40-18.png)

- Workspace：工作区
- Index / Stage：暂存区
- Repository：仓库区（或本地仓库）
- Remote：远程仓库


Git 一般的工作原理为：

1. 克隆 Git 资源或创建版本库为本地工作区 workspace
2. 在本地工作区上进行二次创作
3. 将创作后的内容 add 添加到 index 暂存区
4. 将 index 暂存区的内容 commit 提交到仓库区 repository
5. 将本地仓库区的内容 push 推送到远程仓库 remote
