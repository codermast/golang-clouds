---
order: 2
---

# SpringMVC - 请求处理

## @RequestMapping

`@RequestMapping` 用于映射请求 URL 到处理方法。

### 基本使用

```java
@Controller
@RequestMapping("/user")  // 类级别，设置基础路径
public class UserController {
    
    // 访问路径：/user/list
    @RequestMapping("/list")
    public String list() {
        return "user/list";
    }
    
    // 访问路径：/user/detail
    @RequestMapping("/detail")
    public String detail() {
        return "user/detail";
    }
}
```

### 请求方法限定

```java
// 限定 GET 请求
@RequestMapping(value = "/get", method = RequestMethod.GET)

// 限定 POST 请求
@RequestMapping(value = "/post", method = RequestMethod.POST)

// 多种请求方法
@RequestMapping(value = "/multi", method = {RequestMethod.GET, RequestMethod.POST})
```

### 快捷注解

| 注解           | 等价于                                         |
| :------------- | :--------------------------------------------- |
| @GetMapping    | @RequestMapping(method = RequestMethod.GET)    |
| @PostMapping   | @RequestMapping(method = RequestMethod.POST)   |
| @PutMapping    | @RequestMapping(method = RequestMethod.PUT)    |
| @DeleteMapping | @RequestMapping(method = RequestMethod.DELETE) |
| @PatchMapping  | @RequestMapping(method = RequestMethod.PATCH)  |

```java
@RestController
@RequestMapping("/api/users")
public class UserApiController {
    
    @GetMapping
    public List<User> list() { ... }
    
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) { ... }
    
    @PostMapping
    public User create(@RequestBody User user) { ... }
    
    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User user) { ... }
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { ... }
}
```

### 其他属性

```java
@RequestMapping(
    value = "/test",           // 请求路径
    method = RequestMethod.GET, // 请求方法
    params = "id",              // 必须包含参数 id
    headers = "Content-Type=application/json",  // 请求头
    consumes = "application/json",  // 请求内容类型
    produces = "application/json"   // 响应内容类型
)
```

## 参数绑定

### 基本类型参数

```java
// URL: /user?id=1&name=张三
@GetMapping("/user")
public String getUser(Integer id, String name) {
    // id = 1, name = "张三"
    return "user";
}
```

### @RequestParam

```java
@GetMapping("/user")
public String getUser(
    @RequestParam("userId") Integer id,           // 参数名映射
    @RequestParam(required = false) String name,  // 非必须
    @RequestParam(defaultValue = "1") Integer page // 默认值
) {
    return "user";
}
```

### @PathVariable 路径变量

```java
// URL: /user/1
@GetMapping("/user/{id}")
public String getUser(@PathVariable("id") Integer userId) {
    return "user";
}

// URL: /user/1/order/100
@GetMapping("/user/{userId}/order/{orderId}")
public String getOrder(
    @PathVariable Integer userId,
    @PathVariable Integer orderId
) {
    return "order";
}
```

### POJO 对象绑定

```java
public class User {
    private Long id;
    private String name;
    private Integer age;
    // getter/setter
}

// URL: /user?id=1&name=张三&age=25
@PostMapping("/user")
public String saveUser(User user) {
    // 自动绑定到 User 对象
    return "success";
}
```

### 嵌套对象绑定

```java
public class User {
    private String name;
    private Address address;  // 嵌套对象
}

public class Address {
    private String city;
    private String street;
}

// URL: /user?name=张三&address.city=北京&address.street=长安街
@PostMapping("/user")
public String saveUser(User user) {
    // user.getAddress().getCity() = "北京"
    return "success";
}
```

### 数组和集合

```java
// URL: /delete?ids=1&ids=2&ids=3
@PostMapping("/delete")
public String delete(Integer[] ids) {
    // ids = [1, 2, 3]
    return "success";
}

// List 需要 @RequestParam
@PostMapping("/delete")
public String delete(@RequestParam List<Integer> ids) {
    return "success";
}
```

### @RequestBody

接收 JSON 请求体：

```java
@PostMapping("/user")
public String saveUser(@RequestBody User user) {
    // JSON 自动转为 User 对象
    return "success";
}

@PostMapping("/users")
public String saveUsers(@RequestBody List<User> users) {
    // JSON 数组转为 List
    return "success";
}
```

### @RequestHeader

获取请求头：

```java
@GetMapping("/header")
public String getHeader(
    @RequestHeader("User-Agent") String userAgent,
    @RequestHeader("Accept") String accept
) {
    return "header";
}
```

### @CookieValue

获取 Cookie：

```java
@GetMapping("/cookie")
public String getCookie(
    @CookieValue("JSESSIONID") String sessionId,
    @CookieValue(value = "token", required = false) String token
) {
    return "cookie";
}
```

### HttpServletRequest/HttpServletResponse

```java
@GetMapping("/servlet")
public String servlet(HttpServletRequest request, HttpServletResponse response) {
    String param = request.getParameter("param");
    HttpSession session = request.getSession();
    return "servlet";
}
```

## RESTful 风格

REST（Representational State Transfer）是一种软件架构风格，使用 URL 定位资源，用 HTTP 方法描述操作。

### 传统 vs RESTful

| 操作     | 传统方式          | RESTful 方式    |
| :------- | :---------------- | :-------------- |
| 查询所有 | /user/list        | GET /users      |
| 查询单个 | /user/detail?id=1 | GET /users/1    |
| 新增     | /user/add         | POST /users     |
| 修改     | /user/update?id=1 | PUT /users/1    |
| 删除     | /user/delete?id=1 | DELETE /users/1 |

### RESTful API 示例

```java
@RestController
@RequestMapping("/api/users")
public class UserRestController {
    
    @Autowired
    private UserService userService;
    
    // GET /api/users - 查询所有
    @GetMapping
    public List<User> list() {
        return userService.findAll();
    }
    
    // GET /api/users/1 - 查询单个
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    // POST /api/users - 新增
    @PostMapping
    public User create(@RequestBody User user) {
        return userService.save(user);
    }
    
    // PUT /api/users/1 - 修改
    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        return userService.update(user);
    }
    
    // DELETE /api/users/1 - 删除
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        userService.deleteById(id);
    }
    
    // GET /api/users?page=1&size=10 - 分页查询
    @GetMapping(params = {"page", "size"})
    public Page<User> page(
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer size
    ) {
        return userService.findPage(page, size);
    }
}
```

### HiddenHttpMethodFilter

浏览器表单只支持 GET 和 POST，可以通过隐藏域模拟 PUT/DELETE：

```xml
<!-- web.xml -->
<filter>
    <filter-name>hiddenHttpMethodFilter</filter-name>
    <filter-class>org.springframework.web.filter.HiddenHttpMethodFilter</filter-class>
</filter>
<filter-mapping>
    <filter-name>hiddenHttpMethodFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

```html
<!-- 模拟 PUT 请求 -->
<form action="/users/1" method="post">
    <input type="hidden" name="_method" value="PUT">
    <input type="text" name="name">
    <button type="submit">提交</button>
</form>

<!-- 模拟 DELETE 请求 -->
<form action="/users/1" method="post">
    <input type="hidden" name="_method" value="DELETE">
    <button type="submit">删除</button>
</form>
```
