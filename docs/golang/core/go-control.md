---
order: 3
---

# Go - 流程控制

## 条件语句

### if 语句

```go
// 基本形式
if condition {
    // ...
}

// if-else
if condition {
    // ...
} else {
    // ...
}

// if-else if-else
if score >= 90 {
    fmt.Println("优秀")
} else if score >= 60 {
    fmt.Println("及格")
} else {
    fmt.Println("不及格")
}

// if 带初始化语句
if num := getValue(); num > 0 {
    fmt.Println("正数:", num)
} else {
    fmt.Println("非正数:", num)
}
// num 的作用域仅在 if-else 块内
```

::: warning 注意
Go 的 if 条件不需要括号，但大括号是必须的，且左大括号必须在同一行。
:::

### switch 语句

```go
// 基本形式
switch day {
case 1:
    fmt.Println("星期一")
case 2:
    fmt.Println("星期二")
case 3, 4, 5:  // 多个条件
    fmt.Println("工作日")
default:
    fmt.Println("周末")
}

// switch 带初始化
switch num := getNum(); num {
case 1:
    fmt.Println("一")
default:
    fmt.Println("其他")
}

// 无表达式 switch（替代 if-else 链）
switch {
case score >= 90:
    fmt.Println("A")
case score >= 80:
    fmt.Println("B")
case score >= 60:
    fmt.Println("C")
default:
    fmt.Println("D")
}

// fallthrough 穿透到下一个 case
switch num {
case 1:
    fmt.Println("1")
    fallthrough
case 2:
    fmt.Println("2")  // num=1 时也会执行
}

// 类型 switch
switch v := x.(type) {
case int:
    fmt.Println("int:", v)
case string:
    fmt.Println("string:", v)
case bool:
    fmt.Println("bool:", v)
default:
    fmt.Println("unknown type")
}
```

::: tip Go 的 switch 特点
- 不需要 break，默认不穿透
- 使用 fallthrough 可以穿透
- case 可以是表达式
:::

## 循环语句

Go 只有 `for` 一种循环结构，但可以实现 for、while、do-while 的功能。

### 标准 for 循环

```go
for i := 0; i < 10; i++ {
    fmt.Println(i)
}
```

### 类似 while

```go
i := 0
for i < 10 {
    fmt.Println(i)
    i++
}
```

### 无限循环

```go
for {
    // 无限循环
    // 使用 break 退出
}
```

### for-range 遍历

```go
// 遍历数组/切片
arr := []int{1, 2, 3, 4, 5}
for index, value := range arr {
    fmt.Printf("索引: %d, 值: %d\n", index, value)
}

// 只要索引
for index := range arr {
    fmt.Println(index)
}

// 只要值
for _, value := range arr {
    fmt.Println(value)
}

// 遍历 map
m := map[string]int{"a": 1, "b": 2}
for key, value := range m {
    fmt.Printf("%s: %d\n", key, value)
}

// 遍历字符串
for index, char := range "Hello中国" {
    fmt.Printf("%d: %c\n", index, char)
}

// 遍历 channel
ch := make(chan int, 3)
ch <- 1
ch <- 2
ch <- 3
close(ch)
for v := range ch {
    fmt.Println(v)
}
```

## 跳转语句

### break

```go
// 退出当前循环
for i := 0; i < 10; i++ {
    if i == 5 {
        break
    }
    fmt.Println(i)
}

// 退出指定循环（使用标签）
OuterLoop:
for i := 0; i < 3; i++ {
    for j := 0; j < 3; j++ {
        if i*j > 2 {
            break OuterLoop  // 退出外层循环
        }
        fmt.Printf("%d * %d = %d\n", i, j, i*j)
    }
}
```

### continue

```go
// 跳过当前迭代
for i := 0; i < 10; i++ {
    if i%2 == 0 {
        continue  // 跳过偶数
    }
    fmt.Println(i)  // 只打印奇数
}

// 带标签的 continue
OuterLoop:
for i := 0; i < 3; i++ {
    for j := 0; j < 3; j++ {
        if j == 1 {
            continue OuterLoop  // 跳到外层循环的下一次迭代
        }
        fmt.Printf("i=%d, j=%d\n", i, j)
    }
}
```

### goto

```go
// goto 跳转（谨慎使用）
func example() {
    i := 0
Loop:
    if i < 5 {
        fmt.Println(i)
        i++
        goto Loop
    }
}

// 常见用途：错误处理跳转
func process() error {
    if err := step1(); err != nil {
        goto Cleanup
    }
    if err := step2(); err != nil {
        goto Cleanup
    }
    return nil

Cleanup:
    cleanup()
    return errors.New("process failed")
}
```

::: warning 注意
goto 不能跳转到变量声明之后，也不能跳入其他代码块。尽量少用 goto，以保持代码可读性。
:::

## defer 语句

defer 用于延迟执行函数，在函数返回前执行。

```go
func main() {
    defer fmt.Println("defer 1")
    defer fmt.Println("defer 2")
    defer fmt.Println("defer 3")
    fmt.Println("main")
}
// 输出：
// main
// defer 3
// defer 2
// defer 1
```

### defer 的执行顺序

defer 是后进先出（LIFO），即栈的顺序。

### 常见用途

```go
// 资源释放
func readFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()  // 确保文件被关闭

    // 处理文件...
    return nil
}

// 解锁
func doSomething() {
    mutex.Lock()
    defer mutex.Unlock()
    
    // 临界区代码...
}

// 记录函数执行时间
func timing() func() {
    start := time.Now()
    return func() {
        fmt.Printf("耗时: %v\n", time.Since(start))
    }
}

func example() {
    defer timing()()  // 注意双括号
    // 执行代码...
    time.Sleep(time.Second)
}
```

### defer 与返回值

```go
// defer 可以修改命名返回值
func example() (result int) {
    defer func() {
        result++  // 修改返回值
    }()
    return 0  // 最终返回 1
}
```
