---
order : 14
---

# time


在 Go 语言中，`time` 包提供了处理时间和日期的功能。以下是一些常用的 `time` 包的 API 及其详细说明：


## 1. 获取当前时间

### `time.Now`
获取当前时间。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    now := time.Now()
    fmt.Println("Current time:", now)
}
```

## 2. 格式化和解析时间

### `Format`
将时间格式化为字符串。`Go` 使用一个参考时间 `Mon Jan 2 15:04:05 MST 2006` 来指定格式。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    now := time.Now()
    formatted := now.Format("2006-01-02 15:04:05")
    fmt.Println("Formatted time:", formatted)
}
```

### `Parse`
将字符串解析为时间。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    layout := "2006-01-02 15:04:05"
    str := "2024-07-05 12:34:56"
    t, err := time.Parse(layout, str)
    if err != nil {
        fmt.Println("Error parsing time:", err)
        return
    }
    fmt.Println("Parsed time:", t)
}
```

## 3. 时间操作

### `Add`
将指定的时间段添加到时间。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    now := time.Now()
    later := now.Add(2 * time.Hour)
    fmt.Println("Current time:", now)
    fmt.Println("Two hours later:", later)
}
```

### `Sub`
计算两个时间之间的差值。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    now := time.Now()
    earlier := now.Add(-2 * time.Hour)
    duration := now.Sub(earlier)
    fmt.Println("Current time:", now)
    fmt.Println("Two hours earlier:", earlier)
    fmt.Println("Difference:", duration)
}
```

### `AddDate`
在年、月、日上进行加减操作。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    now := time.Now()
    nextYear := now.AddDate(1, 0, 0)
    fmt.Println("Current time:", now)
    fmt.Println("Next year:", nextYear)
}
```

## 4. 时间比较

### `Before`, `After`, `Equal`
比较两个时间。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    now := time.Now()
    future := now.Add(2 * time.Hour)
    past := now.Add(-2 * time.Hour)

    fmt.Println("Future is after now:", future.After(now))
    fmt.Println("Past is before now:", past.Before(now))
    fmt.Println("Now is equal to now:", now.Equal(now))
}
```

## 5. 定时器和计时器

### `time.Sleep`
让当前 goroutine 休眠指定时间。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    fmt.Println("Sleeping for 2 seconds...")
    time.Sleep(2 * time.Second)
    fmt.Println("Awake!")
}
```

### `time.NewTimer`
创建一个定时器，并在指定时间后发送一个信号。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    timer := time.NewTimer(2 * time.Second)
    fmt.Println("Waiting for timer...")
    <-timer.C
    fmt.Println("Timer expired!")
}
```

### `time.NewTicker`
创建一个滴答计时器，每隔指定时间发送一个信号。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ticker := time.NewTicker(1 * time.Second)
    go func() {
        for t := range ticker.C {
            fmt.Println("Tick at", t)
        }
    }()

    time.Sleep(5 * time.Second)
    ticker.Stop()
    fmt.Println("Ticker stopped")
}
```

## 6. 时间戳

### `Unix`, `UnixNano`
获取 Unix 时间戳。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    now := time.Now()
    fmt.Println("Unix timestamp:", now.Unix())
    fmt.Println("Unix nanosecond timestamp:", now.UnixNano())
}
```

### `time.Unix`
将 Unix 时间戳转换为时间。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    timestamp := int64(1625477745)
    t := time.Unix(timestamp, 0)
    fmt.Println("Time from Unix timestamp:", t)
}
```

## 7. 时间区和本地化

### `time.FixedZone`
创建一个固定时区。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    loc := time.FixedZone("UTC-8", -8*60*60)
    t := time.Date(2024, 7, 5, 12, 0, 0, 0, loc)
    fmt.Println("Time in UTC-8:", t)
}
```

### `time.LoadLocation`
加载一个时区位置。
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    loc, err := time.LoadLocation("America/New_York")
    if err != nil {
        fmt.Println("Error loading location:", err)
        return
    }
    t := time.Now().In(loc)
    fmt.Println("Current time in New York:", t)
}
```

通过以上这些 `time` 包中的基本 API，你可以方便地在 Go 程序中处理时间和日期相关的操作。无论是获取当前时间、格式化时间、时间计算还是处理不同的时区，都可以通过这些 API 实现。