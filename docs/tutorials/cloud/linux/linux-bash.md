---
order: 7
---
# Linux - Bash 基础语法

## 概述

Bash（Bourne Again Shell）是 Linux 最常用的 Shell。掌握 Bash 脚本可以自动化日常任务，提高工作效率。

## 脚本基础

### 创建脚本

```bash
#!/bin/bash
# 这是注释

echo "Hello, World!"
```

### 运行脚本

```bash
# 方法 1：添加执行权限
chmod +x script.sh
./script.sh

# 方法 2：使用 bash 执行
bash script.sh

# 方法 3：使用 source（在当前 shell 执行）
source script.sh
. script.sh
```

### Shebang

```bash
#!/bin/bash       # Bash
#!/bin/sh         # POSIX Shell
#!/usr/bin/env bash  # 更便携的写法
#!/usr/bin/env python3  # Python
```

## 变量

### 定义和使用

```bash
# 定义变量（等号两边不能有空格）
name="John"
age=25

# 使用变量
echo $name
echo ${name}
echo "My name is ${name}"

# 只读变量
readonly PI=3.14159

# 删除变量
unset name
```

### 变量类型

```bash
# 字符串
str="Hello World"

# 数字
num=100

# 数组
arr=(1 2 3 4 5)
arr[0]=10
echo ${arr[0]}      # 第一个元素
echo ${arr[@]}      # 所有元素
echo ${#arr[@]}     # 数组长度

# 关联数组（Bash 4+）
declare -A map
map[name]="John"
map[age]=25
echo ${map[name]}
```

### 特殊变量

| 变量 | 说明               |
| :--- | :----------------- |
| $0   | 脚本名称           |
| $1-9 | 位置参数           |
| $#   | 参数个数           |
| $@   | 所有参数（分开）   |
| $*   | 所有参数（合并）   |
| $?   | 上一条命令的返回值 |
| $$   | 当前进程 PID       |
| $!   | 最近后台进程 PID   |

```bash
#!/bin/bash
echo "脚本名: $0"
echo "第一个参数: $1"
echo "参数个数: $#"
echo "所有参数: $@"
```

### 字符串操作

```bash
str="Hello World"

# 长度
echo ${#str}           # 11

# 截取
echo ${str:0:5}        # Hello（从位置0取5个）
echo ${str:6}          # World（从位置6开始）

# 替换
echo ${str/World/Bash}  # Hello Bash（替换第一个）
echo ${str//o/O}        # HellO WOrld（替换所有）

# 删除
echo ${str#Hello }      # World（删除开头匹配）
echo ${str%World}       # Hello （删除结尾匹配）

# 默认值
echo ${var:-default}    # var 为空时返回 default
echo ${var:=default}    # var 为空时设置为 default
echo ${var:+value}      # var 非空时返回 value
echo ${var:?error}      # var 为空时报错
```

## 运算

### 算术运算

```bash
# 方法 1：(( ))
a=10
b=3
echo $((a + b))     # 13
echo $((a - b))     # 7
echo $((a * b))     # 30
echo $((a / b))     # 3
echo $((a % b))     # 1
echo $((a ** 2))    # 100

# 方法 2：let
let sum=a+b
let "sum = a + b"

# 方法 3：expr
sum=$(expr $a + $b)

# 自增自减
((a++))
((a--))
((a+=5))
```

### 浮点运算

```bash
# 使用 bc
result=$(echo "scale=2; 10/3" | bc)
echo $result    # 3.33

# 使用 awk
result=$(awk 'BEGIN{printf "%.2f", 10/3}')
```

## 条件判断

### if 语句

```bash
# 基本语法
if [ condition ]; then
    commands
fi

# if-else
if [ condition ]; then
    commands
else
    commands
fi

# if-elif-else
if [ condition1 ]; then
    commands
elif [ condition2 ]; then
    commands
else
    commands
fi
```

### 条件测试

```bash
# 数值比较
[ $a -eq $b ]    # 等于
[ $a -ne $b ]    # 不等于
[ $a -gt $b ]    # 大于
[ $a -lt $b ]    # 小于
[ $a -ge $b ]    # 大于等于
[ $a -le $b ]    # 小于等于

# 字符串比较
[ "$str1" = "$str2" ]     # 相等
[ "$str1" != "$str2" ]    # 不等
[ -z "$str" ]             # 为空
[ -n "$str" ]             # 非空

# 文件测试
[ -e file ]     # 存在
[ -f file ]     # 普通文件
[ -d file ]     # 目录
[ -r file ]     # 可读
[ -w file ]     # 可写
[ -x file ]     # 可执行
[ -s file ]     # 大小不为 0
[ file1 -nt file2 ]   # file1 更新
[ file1 -ot file2 ]   # file1 更旧

# 逻辑运算
[ cond1 ] && [ cond2 ]    # 与
[ cond1 ] || [ cond2 ]    # 或
[ ! condition ]           # 非
[ cond1 -a cond2 ]        # 与（在 [ ] 内）
[ cond1 -o cond2 ]        # 或（在 [ ] 内）
```

### [[ ]] 扩展测试

```bash
# 支持更多特性
[[ $str == pattern* ]]    # 模式匹配
[[ $str =~ regex ]]       # 正则匹配
[[ $a > $b ]]             # 字符串比较
[[ condition1 && condition2 ]]  # 逻辑与
[[ condition1 || condition2 ]]  # 逻辑或
```

### case 语句

```bash
case $var in
    pattern1)
        commands
        ;;
    pattern2|pattern3)
        commands
        ;;
    *)
        default commands
        ;;
esac

# 示例
case $1 in
    start)
        echo "Starting..."
        ;;
    stop)
        echo "Stopping..."
        ;;
    restart)
        echo "Restarting..."
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac
```

## 循环

### for 循环

```bash
# 列表循环
for item in item1 item2 item3; do
    echo $item
done

# 范围循环
for i in {1..5}; do
    echo $i
done

# 步长
for i in {0..10..2}; do
    echo $i
done

# C 风格
for ((i=0; i<5; i++)); do
    echo $i
done

# 遍历数组
arr=(a b c d e)
for item in ${arr[@]}; do
    echo $item
done

# 遍历文件
for file in *.txt; do
    echo $file
done

# 遍历命令输出
for user in $(cat /etc/passwd | cut -d: -f1); do
    echo $user
done
```

### while 循环

```bash
# 基本语法
while [ condition ]; do
    commands
done

# 计数
count=0
while [ $count -lt 5 ]; do
    echo $count
    ((count++))
done

# 读取文件
while read line; do
    echo $line
done < file.txt

# 无限循环
while true; do
    commands
    sleep 1
done
```

### until 循环

```bash
# 条件为假时执行
until [ condition ]; do
    commands
done

count=0
until [ $count -ge 5 ]; do
    echo $count
    ((count++))
done
```

### 循环控制

```bash
# break - 退出循环
for i in {1..10}; do
    if [ $i -eq 5 ]; then
        break
    fi
    echo $i
done

# continue - 跳过本次
for i in {1..5}; do
    if [ $i -eq 3 ]; then
        continue
    fi
    echo $i
done
```

## 函数

### 定义函数

```bash
# 方法 1
function func_name {
    commands
}

# 方法 2
func_name() {
    commands
}
```

### 函数参数

```bash
greet() {
    echo "Hello, $1!"
    echo "Args: $@"
    echo "Count: $#"
}

greet "World"
greet "Alice" "Bob"
```

### 返回值

```bash
# 使用 return（0-255）
is_even() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

is_even 4
if [ $? -eq 0 ]; then
    echo "Even"
fi

# 使用 echo（输出结果）
get_sum() {
    echo $(($1 + $2))
}

result=$(get_sum 3 5)
echo $result    # 8
```

### 局部变量

```bash
my_func() {
    local local_var="local"
    global_var="global"
    echo $local_var
}

my_func
echo $global_var    # global
echo $local_var     # 空
```

## 输入输出

### 读取输入

```bash
# 基本读取
echo -n "Enter name: "
read name
echo "Hello, $name"

# 带提示
read -p "Enter name: " name

# 隐藏输入
read -sp "Enter password: " password

# 超时
read -t 5 -p "Enter (5s timeout): " input

# 读取多个值
read -p "Enter x y: " x y

# 读取到数组
read -a arr
echo ${arr[0]}
```

### 输出

```bash
# echo
echo "Hello"
echo -n "No newline"    # 不换行
echo -e "Line1\nLine2"  # 解释转义

# printf
printf "Name: %s, Age: %d\n" "John" 25
printf "%.2f\n" 3.14159
```

### 重定向

```bash
# 输出重定向
command > file      # 覆盖
command >> file     # 追加
command 2> file     # 错误输出
command &> file     # 全部输出
command > file 2>&1 # 全部输出

# 输入重定向
command < file

# Here Document
cat << EOF
Line 1
Line 2
Line 3
EOF

# Here String
cat <<< "Hello World"

# 管道
command1 | command2 | command3

# tee（同时输出到文件和屏幕）
command | tee file
command | tee -a file  # 追加
```

## 调试

### 调试选项

```bash
# 显示执行的命令
bash -x script.sh
set -x   # 开启
set +x   # 关闭

# 遇到错误退出
set -e

# 使用未定义变量时报错
set -u

# 管道命令失败时退出
set -o pipefail

# 常用组合
set -euo pipefail
```

### 调试技巧

```bash
#!/bin/bash
# 开头添加
set -x  # 调试模式

# 打印变量
echo "DEBUG: var=$var"

# 条件调试
if [ "$DEBUG" = "1" ]; then
    echo "Debug info..."
fi
```

## 最佳实践

### 脚本模板

```bash
#!/bin/bash
set -euo pipefail

# 脚本描述
# Author: Your Name
# Date: 2024-01-01

# 常量
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "$0")"

# 变量
LOG_FILE="/var/log/${SCRIPT_NAME}.log"

# 函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $*" >&2
    exit 1
}

usage() {
    cat << EOF
Usage: $SCRIPT_NAME [options]

Options:
    -h, --help      Show this help
    -v, --verbose   Verbose output
EOF
}

# 参数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=1
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# 主逻辑
main() {
    log "Starting..."
    # Your code here
    log "Done."
}

main "$@"
```

### 编码规范

1. 使用 `set -euo pipefail`
2. 使用有意义的变量名
3. 添加注释说明
4. 使用函数组织代码
5. 检查命令是否存在
6. 处理错误和异常
7. 使用双引号包裹变量

::: tip 学习建议
1. 从简单脚本开始，逐步增加复杂度
2. 阅读系统中的 Shell 脚本学习
3. 使用 shellcheck 检查脚本
4. 多练习，熟能生巧
:::
