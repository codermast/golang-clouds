---
order : 15
---

# math

在 Go 语言中，`math` 包提供了基本的数学函数和常量。以下是一些常用的 `math` 包的 API 及其详细说明：


## 1. 常量

数学常量
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Pi:", math.Pi)
    fmt.Println("E:", math.E)
    fmt.Println("Phi:", math.Phi)
    fmt.Println("Sqrt2:", math.Sqrt2)
    fmt.Println("SqrtE:", math.SqrtE)
    fmt.Println("SqrtPi:", math.SqrtPi)
    fmt.Println("SqrtPhi:", math.SqrtPhi)
}
```

## 2. 基本数学函数

`math.Abs`
返回浮点数的绝对值。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Abs(-3.14):", math.Abs(-3.14))
}
```

`math.Pow`
返回 x 的 y 次方。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Pow(2, 3):", math.Pow(2, 3))
}
```

`math.Sqrt`
返回 x 的平方根。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Sqrt(16):", math.Sqrt(16))
}
```

`math.Ceil` 和 `math.Floor`
返回大于或等于 x 的最小整数和小于或等于 x 的最大整数。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Ceil(3.14):", math.Ceil(3.14))
    fmt.Println("Floor(3.14):", math.Floor(3.14))
}
```

`math.Round`
返回 x 四舍五入后的整数值。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Round(3.14):", math.Round(3.14))
    fmt.Println("Round(3.54):", math.Round(3.54))
}
```

## 3. 三角函数

`math.Sin`, `math.Cos`, `math.Tan`
返回 x 的正弦、余弦和正切值（x 为弧度）。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Sin(π/2):", math.Sin(math.Pi/2))
    fmt.Println("Cos(π/2):", math.Cos(math.Pi/2))
    fmt.Println("Tan(π/4):", math.Tan(math.Pi/4))
}
```

`math.Asin`, `math.Acos`, `math.Atan`
返回 x 的反正弦、反余弦和反正切值。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Asin(1):", math.Asin(1))
    fmt.Println("Acos(0):", math.Acos(0))
    fmt.Println("Atan(1):", math.Atan(1))
}
```

## 4. 指数和对数函数

`math.Exp` 和 `math.Log`
返回 e 的 x 次方和 x 的自然对数。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Exp(1):", math.Exp(1))
    fmt.Println("Log(E):", math.Log(math.E))
}
```

`math.Log10` 和 `math.Log2`
返回 x 的以 10 为底和以 2 为底的对数。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Log10(100):", math.Log10(100))
    fmt.Println("Log2(8):", math.Log2(8))
}
```

## 5. 最大值和最小值

`math.Max` 和 `math.Min`
返回两个数中的最大值和最小值。
```go
package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Max(3, 5):", math.Max(3, 5))
    fmt.Println("Min(3, 5):", math.Min(3, 5))
}
```

## 6. 随机数

虽然 `math` 包本身不提供随机数生成功能，但 Go 标准库中的 `math/rand` 包提供了相关功能。以下是一些常用的 `math/rand` 包 API：

生成随机整数
```go
package main

import (
    "fmt"
    "math/rand"
    "time"
)

func main() {
    rand.Seed(time.Now().UnixNano()) // 设置种子
    fmt.Println("Random Int:", rand.Int())
    fmt.Println("Random Intn (0-99):", rand.Intn(100))
}
```

生成随机浮点数
```go
package main

import (
    "fmt"
    "math/rand"
    "time"
)

func main() {
    rand.Seed(time.Now().UnixNano()) // 设置种子
    fmt.Println("Random Float32:", rand.Float32())
    fmt.Println("Random Float64:", rand.Float64())
}
```

通过以上这些 `math` 包中的基本 API，你可以方便地在 Go 程序中进行各种数学计算。无论是基本的算术运算、三角函数、指数和对数函数，还是随机数生成，都可以通过这些 API 实现。