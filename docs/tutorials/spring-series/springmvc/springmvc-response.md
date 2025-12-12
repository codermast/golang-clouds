---
order: 3
---

# SpringMVC - 响应处理

## 返回视图

### 返回视图名称

```java
@Controller
public class ViewController {
    
    // 返回逻辑视图名，由视图解析器解析
    @GetMapping("/hello")
    public String hello() {
        return "hello";  // 解析为 /WEB-INF/views/hello.jsp
    }
    
    // 带路径的视图
    @GetMapping("/user/list")
    public String userList() {
        return "user/list";  // 解析为 /WEB-INF/views/user/list.jsp
    }
}
```

### 转发与重定向

```java
@Controller
public class ForwardController {
    
    // 转发（forward:）- URL 不变，一次请求
    @GetMapping("/forward")
    public String forward() {
        return "forward:/target";
    }
    
    // 重定向（redirect:）- URL 改变，两次请求
    @GetMapping("/redirect")
    public String redirect() {
        return "redirect:/target";
    }
    
    // 重定向到外部地址
    @GetMapping("/external")
    public String external() {
        return "redirect:https://www.baidu.com";
    }
}
```

### Model 传递数据

```java
@Controller
public class ModelController {
    
    // 使用 Model
    @GetMapping("/model")
    public String model(Model model) {
        model.addAttribute("name", "张三");
        model.addAttribute("age", 25);
        return "user";
    }
    
    // 使用 ModelMap
    @GetMapping("/modelMap")
    public String modelMap(ModelMap modelMap) {
        modelMap.addAttribute("name", "张三");
        return "user";
    }
    
    // 使用 Map
    @GetMapping("/map")
    public String map(Map<String, Object> map) {
        map.put("name", "张三");
        return "user";
    }
    
    // 使用 ModelAndView
    @GetMapping("/mav")
    public ModelAndView modelAndView() {
        ModelAndView mav = new ModelAndView();
        mav.setViewName("user");
        mav.addObject("name", "张三");
        return mav;
    }
}
```

## 返回 JSON

### @ResponseBody

```java
@Controller
public class JsonController {
    
    // 返回单个对象
    @GetMapping("/user")
    @ResponseBody
    public User getUser() {
        User user = new User();
        user.setId(1L);
        user.setName("张三");
        return user;  // 自动转为 JSON
    }
    
    // 返回集合
    @GetMapping("/users")
    @ResponseBody
    public List<User> getUsers() {
        return Arrays.asList(
            new User(1L, "张三"),
            new User(2L, "李四")
        );
    }
    
    // 返回 Map
    @GetMapping("/map")
    @ResponseBody
    public Map<String, Object> getMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("code", 200);
        map.put("message", "success");
        return map;
    }
}
```

### @RestController

`@RestController` = `@Controller` + `@ResponseBody`

```java
@RestController
@RequestMapping("/api")
public class ApiController {
    
    @GetMapping("/user")
    public User getUser() {
        return new User(1L, "张三");  // 自动转为 JSON
    }
    
    @GetMapping("/users")
    public List<User> getUsers() {
        return userService.findAll();
    }
}
```

### 统一响应格式

```java
// 统一响应类
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }
    
    public static <T> Result<T> error(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }
    
    // getter/setter...
}

// 使用
@RestController
@RequestMapping("/api")
public class ApiController {
    
    @GetMapping("/user/{id}")
    public Result<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user != null) {
            return Result.success(user);
        }
        return Result.error(404, "用户不存在");
    }
}
```

### ResponseEntity

精确控制响应状态码和响应头：

```java
@RestController
public class ResponseEntityController {
    
    @GetMapping("/user/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/user")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User saved = userService.save(user);
        URI location = URI.create("/api/user/" + saved.getId());
        return ResponseEntity.created(location).body(saved);
    }
    
    // 自定义响应头
    @GetMapping("/custom")
    public ResponseEntity<String> custom() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Custom-Header", "custom-value");
        return new ResponseEntity<>("Hello", headers, HttpStatus.OK);
    }
}
```

## 文件下载

```java
@Controller
public class DownloadController {
    
    // 方式一：使用 ResponseEntity
    @GetMapping("/download")
    public ResponseEntity<byte[]> download() throws IOException {
        // 读取文件
        Path path = Paths.get("/path/to/file.pdf");
        byte[] content = Files.readAllBytes(path);
        
        // 设置响应头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", 
            URLEncoder.encode("文件.pdf", "UTF-8"));
        
        return new ResponseEntity<>(content, headers, HttpStatus.OK);
    }
    
    // 方式二：使用 HttpServletResponse
    @GetMapping("/download2")
    public void download2(HttpServletResponse response) throws IOException {
        Path path = Paths.get("/path/to/file.pdf");
        
        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition", 
            "attachment; filename=" + URLEncoder.encode("文件.pdf", "UTF-8"));
        
        Files.copy(path, response.getOutputStream());
    }
}
```

## JSON 配置

### Jackson 配置

```java
@Configuration
public class JacksonConfig {
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // 日期格式
        mapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
        
        // 时区
        mapper.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai"));
        
        // 忽略空值
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        
        // 忽略未知属性
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        return mapper;
    }
}
```

### 常用 Jackson 注解

```java
public class User {
    private Long id;
    
    @JsonProperty("user_name")  // JSON 字段名
    private String name;
    
    @JsonIgnore  // 不序列化
    private String password;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private Date createTime;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)  // 空值不序列化
    private String remark;
}
```

## 内容协商

根据请求返回不同格式的数据：

```java
@RestController
public class ContentNegotiationController {
    
    // 根据 Accept 头返回不同格式
    @GetMapping(value = "/user", 
                produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
    public User getUser() {
        return new User(1L, "张三");
    }
}
```

配置内容协商：

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer
            .favorParameter(true)          // 支持参数方式
            .parameterName("format")       // 参数名
            .defaultContentType(MediaType.APPLICATION_JSON)
            .mediaType("json", MediaType.APPLICATION_JSON)
            .mediaType("xml", MediaType.APPLICATION_XML);
    }
}
```

访问方式：
- `/user` - 返回 JSON（默认）
- `/user?format=xml` - 返回 XML
- `/user`（Accept: application/xml）- 返回 XML
