---
order : 16
---
# crypto

在 Go 语言中，`crypto` 包提供了一组用于加密和解密的功能。以下是一些常用的 `crypto` 包及其子包的 API 及其详细说明：

## 1. `crypto/md5`

### `md5.Sum`
计算数据的 MD5 哈希值。
```go
package main

import (
    "crypto/md5"
    "fmt"
    "io"
)

func main() {
    data := "Hello, World!"
    hash := md5.Sum([]byte(data))
    fmt.Printf("MD5: %x\n", hash)
}
```

### `md5.New`
创建一个新的 MD5 哈希。
```go
package main

import (
    "crypto/md5"
    "fmt"
    "io"
)

func main() {
    hasher := md5.New()
    io.WriteString(hasher, "Hello, ")
    io.WriteString(hasher, "World!")
    fmt.Printf("MD5: %x\n", hasher.Sum(nil))
}
```

## 2. `crypto/sha1`

### `sha1.Sum`
计算数据的 SHA-1 哈希值。
```go
package main

import (
    "crypto/sha1"
    "fmt"
)

func main() {
    data := "Hello, World!"
    hash := sha1.Sum([]byte(data))
    fmt.Printf("SHA-1: %x\n", hash)
}
```

### `sha1.New`
创建一个新的 SHA-1 哈希。
```go
package main

import (
    "crypto/sha1"
    "fmt"
    "io"
)

func main() {
    hasher := sha1.New()
    io.WriteString(hasher, "Hello, ")
    io.WriteString(hasher, "World!")
    fmt.Printf("SHA-1: %x\n", hasher.Sum(nil))
}
```

## 3. `crypto/sha256`

### `sha256.Sum256`
计算数据的 SHA-256 哈希值。
```go
package main

import (
    "crypto/sha256"
    "fmt"
)

func main() {
    data := "Hello, World!"
    hash := sha256.Sum256([]byte(data))
    fmt.Printf("SHA-256: %x\n", hash)
}
```

### `sha256.New`
创建一个新的 SHA-256 哈希。
```go
package main

import (
    "crypto/sha256"
    "fmt"
    "io"
)

func main() {
    hasher := sha256.New()
    io.WriteString(hasher, "Hello, ")
    io.WriteString(hasher, "World!")
    fmt.Printf("SHA-256: %x\n", hasher.Sum(nil))
}
```

## 4. `crypto/aes`

### `aes.NewCipher`
创建一个新的 AES 加密器。
```go
package main

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "fmt"
    "io"
)

func main() {
    key := []byte("example key 1234")
    plaintext := []byte("some really really really long plaintext")

    block, err := aes.NewCipher(key)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    ciphertext := make([]byte, aes.BlockSize+len(plaintext))
    iv := ciphertext[:aes.BlockSize]
    if _, err := io.ReadFull(rand.Reader, iv); err != nil {
        fmt.Println("Error:", err)
        return
    }

    stream := cipher.NewCFBEncrypter(block, iv)
    stream.XORKeyStream(ciphertext[aes.BlockSize:], plaintext)

    fmt.Printf("Encrypted: %x\n", ciphertext)

    // 解密
    stream = cipher.NewCFBDecrypter(block, iv)
    stream.XORKeyStream(ciphertext[aes.BlockSize:], ciphertext[aes.BlockSize:])
    fmt.Printf("Decrypted: %s\n", ciphertext[aes.BlockSize:])
}
```

## 5. `crypto/rsa`

### 生成 RSA 密钥对
```go
package main

import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/x509"
    "encoding/pem"
    "fmt"
    "os"
)

func main() {
    // 生成私钥
    privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
    if err != nil {
        fmt.Println("Error generating RSA key:", err)
        return
    }

    // 保存私钥到文件
    privateFile, err := os.Create("private.pem")
    if err != nil {
        fmt.Println("Error creating file:", err)
        return
    }
    defer privateFile.Close()

    privateKeyBytes := x509.MarshalPKCS1PrivateKey(privateKey)
    pem.Encode(privateFile, &pem.Block{
        Type:  "RSA PRIVATE KEY",
        Bytes: privateKeyBytes,
    })

    // 生成公钥
    publicKey := &privateKey.PublicKey

    // 保存公钥到文件
    publicFile, err := os.Create("public.pem")
    if err != nil {
        fmt.Println("Error creating file:", err)
        return
    }
    defer publicFile.Close()

    publicKeyBytes, err := x509.MarshalPKIXPublicKey(publicKey)
    if err != nil {
        fmt.Println("Error marshalling public key:", err)
        return
    }
    pem.Encode(publicFile, &pem.Block{
        Type:  "RSA PUBLIC KEY",
        Bytes: publicKeyBytes,
    })

    fmt.Println("RSA key pair generated and saved to files.")
}
```

### 加密和解密
```go
package main

import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/x509"
    "encoding/pem"
    "fmt"
    "io/ioutil"
    "os"
)

func main() {
    // 加载公钥
    publicKeyFile, err := os.Open("public.pem")
    if err != nil {
        fmt.Println("Error opening public key file:", err)
        return
    }
    defer publicKeyFile.Close()

    publicKeyBytes, err := ioutil.ReadAll(publicKeyFile)
    if err != nil {
        fmt.Println("Error reading public key file:", err)
        return
    }

    block, _ := pem.Decode(publicKeyBytes)
    publicKey, err := x509.ParsePKIXPublicKey(block.Bytes)
    if err != nil {
        fmt.Println("Error parsing public key:", err)
        return
    }

    // 加密
    plaintext := []byte("Hello, RSA encryption!")
    ciphertext, err := rsa.EncryptPKCS1v15(rand.Reader, publicKey.(*rsa.PublicKey), plaintext)
    if err != nil {
        fmt.Println("Error encrypting:", err)
        return
    }
    fmt.Printf("Encrypted: %x\n", ciphertext)

    // 加载私钥
    privateKeyFile, err := os.Open("private.pem")
    if err != nil {
        fmt.Println("Error opening private key file:", err)
        return
    }
    defer privateKeyFile.Close()

    privateKeyBytes, err := ioutil.ReadAll(privateKeyFile)
    if err != nil {
        fmt.Println("Error reading private key file:", err)
        return
    }

    block, _ = pem.Decode(privateKeyBytes)
    privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
    if err != nil {
        fmt.Println("Error parsing private key:", err)
        return
    }

    // 解密
    decrypted, err := rsa.DecryptPKCS1v15(rand.Reader, privateKey, ciphertext)
    if err != nil {
        fmt.Println("Error decrypting:", err)
        return
    }
    fmt.Printf("Decrypted: %s\n", decrypted)
}
```

## 6. `crypto/hmac`

### `hmac.New` 和 `hmac.Sum`
使用 HMAC（基于哈希的消息认证码）进行数据完整性验证。
```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "fmt"
)

func main() {
    key := []byte("mysecretkey")
    message := []byte("Hello, World!")

    mac := hmac.New(sha256.New, key)
    mac.Write(message)
    expectedMAC := mac.Sum(nil)

    fmt.Printf("HMAC: %x\n", expectedMAC)
}
```

## 7. `crypto/ecdsa`

### 生成 ECDSA 密钥对
```go
package main

import (
    "crypto/ecdsa"
    "crypto/elliptic"
    "crypto/rand"
    "crypto/x509"
    "encoding/pem"
    "fmt"
    "os"
)

func main() {
    // 生成私钥
    privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
    if err != nil {
        fmt.Println("Error generating ECDSA key:", err)
        return
    }

    // 保存私钥到文件
    privateFile, err := os.Create("ecdsa_private.pem")
    if err != nil {
        fmt.Println("Error creating file:", err)
        return
    }
    defer privateFile.Close()

    privateKeyBytes, err := x509.MarshalECPrivateKey(privateKey)
    if err != nil {
        fmt.Println("Error marshalling private key:", err)
        return
    }
    pem.Encode(privateFile, &pem.Block{
        Type:  "EC PRIVATE KEY",
        Bytes: privateKeyBytes,
    })

    // 生成公钥
   

 publicKey := &privateKey.PublicKey

    // 保存公钥到文件
    publicFile, err := os.Create("ecdsa_public.pem")
    if err != nil {
        fmt.Println("Error creating file:", err)
        return
    }
    defer publicFile.Close()

    publicKeyBytes, err := x509.MarshalPKIXPublicKey(publicKey)
    if err != nil {
        fmt.Println("Error marshalling public key:", err)
        return
    }
    pem.Encode(publicFile, &pem.Block{
        Type:  "EC PUBLIC KEY",
        Bytes: publicKeyBytes,
    })

    fmt.Println("ECDSA key pair generated and saved to files.")
}
```

### 签名和验证
```go
package main

import (
    "crypto/ecdsa"
    "crypto/elliptic"
    "crypto/rand"
    "crypto/sha256"
    "crypto/x509"
    "encoding/pem"
    "fmt"
    "io/ioutil"
    "os"
)

func main() {
    // 加载私钥
    privateKeyFile, err := os.Open("ecdsa_private.pem")
    if err != nil {
        fmt.Println("Error opening private key file:", err)
        return
    }
    defer privateKeyFile.Close()

    privateKeyBytes, err := ioutil.ReadAll(privateKeyFile)
    if err != nil {
        fmt.Println("Error reading private key file:", err)
        return
    }

    block, _ := pem.Decode(privateKeyBytes)
    privateKey, err := x509.ParseECPrivateKey(block.Bytes)
    if err != nil {
        fmt.Println("Error parsing private key:", err)
        return
    }

    // 签名
    message := []byte("Hello, ECDSA signature!")
    hash := sha256.Sum256(message)
    r, s, err := ecdsa.Sign(rand.Reader, privateKey, hash[:])
    if err != nil {
        fmt.Println("Error signing:", err)
        return
    }
    fmt.Printf("Signature: (r: %x, s: %x)\n", r, s)

    // 加载公钥
    publicKeyFile, err := os.Open("ecdsa_public.pem")
    if err != nil {
        fmt.Println("Error opening public key file:", err)
        return
    }
    defer publicKeyFile.Close()

    publicKeyBytes, err := ioutil.ReadAll(publicKeyFile)
    if err != nil {
        fmt.Println("Error reading public key file:", err)
        return
    }

    block, _ = pem.Decode(publicKeyBytes)
    publicKey, err := x509.ParsePKIXPublicKey(block.Bytes)
    if err != nil {
        fmt.Println("Error parsing public key:", err)
        return
    }

    // 验证
    valid := ecdsa.Verify(publicKey.(*ecdsa.PublicKey), hash[:], r, s)
    fmt.Println("Signature valid:", valid)
}
```

通过以上这些 `crypto` 包及其子包中的基本 API，你可以方便地在 Go 程序中实现各种加密和解密操作，包括哈希计算、对称加密、非对称加密、数字签名和验证等。