---
order: 5
---

# SpringMVC - 异常处理

## 概述

Spring MVC 提供了多种异常处理机制，可以将异常处理逻辑从业务代码中分离出来，实现统一的异常处理。

## 异常处理方式

### 1. @ExceptionHandler（控制器级别）

在控制器中处理该控制器的异常：

```java
@Controller
public class UserController {
    
    @GetMapping("/user/{id}")
    public String getUser(@PathVariable Long id) {
        // 可能抛出异常的业务代码
        User user = userService.findById(id);
        if (user == null) {
            throw new UserNotFoundException("用户不存在: " + id);
        }
        return "user";
    }
    
    // 处理该控制器中的 UserNotFoundException
    @ExceptionHandler(UserNotFoundException.class)
    public String handleUserNotFound(UserNotFoundException e, Model model) {
        model.addAttribute("error", e.getMessage());
        return "error/404";
    }
    
    // 处理多种异常
    @ExceptionHandler({IllegalArgumentException.class, NullPointerException.class})
    public String handleMultiException(Exception e, Model model) {
        model.addAttribute("error", e.getMessage());
        return "error/400";
    }
}
```

### 2. @ControllerAdvice（全局异常处理）

定义全局异常处理器，处理所有控制器的异常：

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    // 处理特定异常
    @ExceptionHandler(UserNotFoundException.class)
    public String handleUserNotFound(UserNotFoundException e, Model model) {
        model.addAttribute("error", e.getMessage());
        return "error/404";
    }
    
    // 处理参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public String handleValidation(MethodArgumentNotValidException e, Model model) {
        BindingResult result = e.getBindingResult();
        List<String> errors = result.getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.toList());
        model.addAttribute("errors", errors);
        return "error/400";
    }
    
    // 处理所有其他异常
    @ExceptionHandler(Exception.class)
    public String handleException(Exception e, Model model) {
        model.addAttribute("error", "系统异常，请稍后重试");
        return "error/500";
    }
}
```

### 3. @RestControllerAdvice（返回 JSON）

`@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 业务异常
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }
    
    // 参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return Result.error(400, message);
    }
    
    // 参数绑定异常
    @ExceptionHandler(BindException.class)
    public Result<Void> handleBind(BindException e) {
        String message = e.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return Result.error(400, message);
    }
    
    // 请求方法不支持
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public Result<Void> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        return Result.error(405, "请求方法不支持: " + e.getMethod());
    }
    
    // 404 异常
    @ExceptionHandler(NoHandlerFoundException.class)
    public Result<Void> handleNotFound(NoHandlerFoundException e) {
        return Result.error(404, "接口不存在: " + e.getRequestURL());
    }
    
    // 兜底处理
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        // 记录日志
        log.error("系统异常", e);
        return Result.error(500, "系统异常，请稍后重试");
    }
}
```

## 自定义异常

### 业务异常基类

```java
public class BusinessException extends RuntimeException {
    
    private Integer code;
    private String message;
    
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }
    
    public BusinessException(String message) {
        this(500, message);
    }
    
    // getter...
}
```

### 具体业务异常

```java
// 用户不存在异常
public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(Long userId) {
        super(404, "用户不存在: " + userId);
    }
}

// 权限不足异常
public class PermissionDeniedException extends BusinessException {
    public PermissionDeniedException() {
        super(403, "权限不足");
    }
}

// 参数错误异常
public class InvalidParameterException extends BusinessException {
    public InvalidParameterException(String message) {
        super(400, message);
    }
}
```

## 统一响应结果

```java
@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    private Long timestamp;
    
    public Result() {
        this.timestamp = System.currentTimeMillis();
    }
    
    public static <T> Result<T> success() {
        return success(null);
    }
    
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
    
    public static <T> Result<T> error(String message) {
        return error(500, message);
    }
}
```

## 完整示例

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    /**
     * 业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException e) {
        log.warn("业务异常: {}", e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }
    
    /**
     * 参数校验异常（@RequestBody）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.warn("参数校验失败: {}", message);
        return Result.error(400, message);
    }
    
    /**
     * 参数校验异常（@RequestParam, @PathVariable）
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public Result<Void> handleConstraintViolation(ConstraintViolationException e) {
        String message = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));
        log.warn("参数校验失败: {}", message);
        return Result.error(400, message);
    }
    
    /**
     * 参数绑定异常
     */
    @ExceptionHandler(BindException.class)
    public Result<Void> handleBind(BindException e) {
        String message = e.getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.warn("参数绑定失败: {}", message);
        return Result.error(400, message);
    }
    
    /**
     * 缺少必要参数
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public Result<Void> handleMissingParameter(MissingServletRequestParameterException e) {
        log.warn("缺少必要参数: {}", e.getParameterName());
        return Result.error(400, "缺少必要参数: " + e.getParameterName());
    }
    
    /**
     * 请求方法不支持
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public Result<Void> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.warn("请求方法不支持: {}", e.getMethod());
        return Result.error(405, "请求方法不支持: " + e.getMethod());
    }
    
    /**
     * 请求内容类型不支持
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public Result<Void> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException e) {
        log.warn("内容类型不支持: {}", e.getContentType());
        return Result.error(415, "内容类型不支持");
    }
    
    /**
     * 404 异常（需要配置：spring.mvc.throw-exception-if-no-handler-found=true）
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public Result<Void> handleNotFound(NoHandlerFoundException e) {
        log.warn("接口不存在: {}", e.getRequestURL());
        return Result.error(404, "接口不存在");
    }
    
    /**
     * 兜底异常处理
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(500, "系统异常，请稍后重试");
    }
}
```

## 配置 404 异常

默认情况下，Spring MVC 不会为 404 抛出异常，需要配置：

```properties
# application.properties
spring.mvc.throw-exception-if-no-handler-found=true
spring.web.resources.add-mappings=false
```

或者使用错误页面：

```java
@Controller
public class ErrorController implements org.springframework.boot.web.servlet.error.ErrorController {
    
    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Integer statusCode = (Integer) request.getAttribute("javax.servlet.error.status_code");
        if (statusCode == 404) {
            return "error/404";
        }
        return "error/500";
    }
}
```
