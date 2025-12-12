---
order : 18
---
# Redis进阶 - Lua语法

## 初识 Lua

Lua 是一种轻量小巧的脚本语言，用标准的 C 语言编写并以源代码形式开放，其设计的目的是为了嵌入应用程序中，从而为应用程序提供灵活的扩展和定制功能。

官网：https://www.lua.org/

![](/assets/database/redis/redis-advance-lua-language/2023-08-26-20-27-16.png)

## 快速入门

1. 在 Linux 虚拟机的任意目录下，新建一个 hello.lua 文件

```sh
touch hello.lua
```

2. 添加下面的内容

```text
print("Hello World!")
```

3. 运行

```sh
lua hello.lua
```

4. 运行结果

```text
Hello World!
```

## 变量

在正式了解变量之前，需要先对 Lua 中的数据类型有个简单的了解，下面是 Lua 语言中的一些数据类型。

|数据类型|描述|
|:---:|:---:|
|nil|这个最简单，只有值 nil 属于该类型，表示一个无效值（在条件表达式中相当于 false）|
|boolean|包含两个数：false 和 true |
|number|表示双精度类型的实浮点数|
|string|字符串由一对双引号或者单引号来表示|
|function|由 C 或者 Lua 编写的函数|
|table|Lua 中的表（table）其实是一个 “关联数组” （associative arrays），数组的索引可以是数字、字符串或表类型。在 Lua 里，table 的创建是通过 “构造表达式” 来完成，最简单的构造表达式是 {} ，用来创建一个空表。|

Lua 声明变量的时候，并不需要指定数据类型：

- 声明字符串：`local str = 'hello'`
- 声明数字：`local num = 21`
- 声明布尔类型：`local flag = true`
- 声明数组 key 为索引的 table ：`local arr = {'Java', 'Python' , 'Lua'}`
- 声明 table ，类似 Java 的 Map：`local map = {name = 'Jack', age = 21}`

访问 table 的几种方式：
- 角标访问(从 1 开始)：`table[1]`
- Key 访问：
    - `map['name']`
    - `map.name`

## 循环

一组被重复执行的语句称之为循环体，能否继续重复，决定循环的终止条件。

循环结构是在一定条件下反复执行某段程序的流程结构，被反复执行的程序被称为循环体。

循环语句是由循环体及循环的终止条件两部分组成的。

- While循环：在判断条件为 true 时会重复执行循环体语句

```lua
while(condition)
do
   statements
end
```

- For循环：可以重复执行指定语句，重复次数可在 for 语句中控制。

```lua
for var=exp1,exp2,exp3 do  
    <执行体>  
end  
```

- 泛型for循环：通过一个迭代器函数来遍历所有值

```lua
a = {"one", "two", "three"}
for i, v in ipairs(a) do
    print(i, v)
end
```
> i是数组索引值，v是对应索引的数组元素值。ipairs是Lua提供的一个迭代器函数，用来迭代数组。

- Repeat循环：在条件进行判断前循环体都会执行一次，然后才进行条件判断。

```lua
repeat
   statements
until( condition )
```

> 类似于 do ... while ... 循环

## 条件

在布尔表达式为 true 时会if中的代码块会被执行，在布尔表达式为 false 时，紧跟在 if 语句 end 之后的代码会被执行。

Lua认为false和nil为假，true 和非nil为真。要注意的是Lua中 0 为 true。

```lua
if(布尔表达式)
then
   --[ 布尔表达式为 true 时执行该语句块 --]
else
   --[ 布尔表达式为 false 时执行该语句块 --]
end
```

## 函数

```lua
optional_function_scope function function_name( argument1, argument2, argument3..., argumentn)
    function_body
    return result_params_comma_separated
end
```

- optional_function_scope: 该参数是可选的指定函数是全局函数还是局部函数，未设置该参数默认为全局函数，如果你需要设置函数为局部函数需要使用关键字 local。

- function_name: 指定函数名称。

- argument1, argument2, argument3..., argumentn: 函数参数，多个参数以逗号隔开，函数也可以不带参数。

- function_body: 函数体，函数中需要执行的代码语句块。

- result_params_comma_separated: 函数返回值，Lua语言函数可以返回多个值，每个值以逗号隔开。

- Lua函数可以返回多个结果值，比如string.find，其返回匹配串"开始和结束的下标"（如果不存在匹配串返回nil）。

```lua
> s, e = string.find("www.runoob.com", "runoob") 
> print(s, e)
5    10
```

- Lua 函数可以接受可变数目的参数，和 C 语言类似，在函数参数列表中使用三点 ... 表示函数有可变的参数。

::: info 资料
https://www.runoob.com/lua/lua-tutorial.html
:::