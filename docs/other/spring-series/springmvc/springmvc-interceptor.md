---
order: 4
---

# SpringMVC - 拦截器

## 概述

拦截器（Interceptor）是 Spring MVC 提供的一种机制，用于在请求处理前后执行特定逻辑，类似于 Servlet 的 Filter，但更加灵活。

### 拦截器 vs 过滤器

| 特性      | 拦截器（Interceptor）     | 过滤器（Filter）          |
| :-------- | :------------------------ | :------------------------ |
| 规范      | Spring MVC                | Servlet                   |
| 使用范围  | 只能拦截 Controller       | 可以拦截所有请求          |
| 获取 Bean | 可以获取 Spring Bean      | 不能直接获取              |
| 执行顺序  | 在 DispatcherServlet 之后 | 在 DispatcherServlet 之前 |

### 执行流程

```
请求 → Filter → DispatcherServlet → Interceptor.preHandle
                                          ↓
                                     Controller
                                          ↓
                                   Interceptor.postHandle
                                          ↓
                                     视图渲染
                                          ↓
                                Interceptor.afterCompletion
                                          ↓
响应 ← Filter ← DispatcherServlet ←────────┘
```

## 创建拦截器

### 实现 HandlerInterceptor 接口

```java
@Component
public class MyInterceptor implements HandlerInterceptor {
    
    /**
     * 请求处理之前调用
     * @return true 放行，false 拦截
     */
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        System.out.println("preHandle: 请求处理前");
        
        // 获取请求信息
        String uri = request.getRequestURI();
        String method = request.getMethod();
        
        // 可以进行权限验证、登录检查等
        return true;  // 放行
    }
    
    /**
     * 请求处理之后，视图渲染之前调用
     */
    @Override
    public void postHandle(HttpServletRequest request, 
                          HttpServletResponse response, 
                          Object handler, 
                          ModelAndView modelAndView) throws Exception {
        System.out.println("postHandle: 请求处理后");
        
        // 可以修改 ModelAndView
        if (modelAndView != null) {
            modelAndView.addObject("interceptorData", "拦截器数据");
        }
    }
    
    /**
     * 整个请求完成后调用（视图渲染后）
     */
    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) throws Exception {
        System.out.println("afterCompletion: 请求完成");
        
        // 可以进行资源清理、日志记录等
    }
}
```

## 注册拦截器

### XML 配置

```xml
<mvc:interceptors>
    <!-- 拦截所有请求 -->
    <bean class="com.example.interceptor.MyInterceptor"/>
    
    <!-- 指定拦截路径 -->
    <mvc:interceptor>
        <mvc:mapping path="/admin/**"/>
        <mvc:exclude-mapping path="/admin/login"/>
        <bean class="com.example.interceptor.AdminInterceptor"/>
    </mvc:interceptor>
</mvc:interceptors>
```

### Java 配置

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private LoginInterceptor loginInterceptor;
    
    @Autowired
    private AdminInterceptor adminInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 登录拦截器
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/**")  // 拦截所有
                .excludePathPatterns(    // 排除路径
                    "/login",
                    "/register",
                    "/static/**",
                    "/error"
                );
        
        // 管理员拦截器
        registry.addInterceptor(adminInterceptor)
                .addPathPatterns("/admin/**")
                .excludePathPatterns("/admin/login");
    }
}
```

## 实战示例

### 登录拦截器

```java
@Component
public class LoginInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        // 获取 Session 中的用户信息
        HttpSession session = request.getSession();
        Object user = session.getAttribute("loginUser");
        
        if (user != null) {
            return true;  // 已登录，放行
        }
        
        // 未登录
        // 方式一：重定向到登录页
        response.sendRedirect("/login");
        return false;
        
        // 方式二：返回 JSON（API 接口）
        // response.setContentType("application/json;charset=UTF-8");
        // response.getWriter().write("{\"code\":401,\"message\":\"未登录\"}");
        // return false;
    }
}
```

### Token 验证拦截器

```java
@Component
public class TokenInterceptor implements HandlerInterceptor {
    
    @Autowired
    private TokenService tokenService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        // 获取 Token
        String token = request.getHeader("Authorization");
        
        if (token == null || token.isEmpty()) {
            sendError(response, 401, "缺少 Token");
            return false;
        }
        
        // 验证 Token
        if (!tokenService.verify(token)) {
            sendError(response, 401, "Token 无效或已过期");
            return false;
        }
        
        // 将用户信息放入请求属性
        Long userId = tokenService.getUserId(token);
        request.setAttribute("userId", userId);
        
        return true;
    }
    
    private void sendError(HttpServletResponse response, int code, String message) 
            throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(code);
        response.getWriter().write(
            String.format("{\"code\":%d,\"message\":\"%s\"}", code, message)
        );
    }
}
```

### 日志拦截器

```java
@Component
@Slf4j
public class LogInterceptor implements HandlerInterceptor {
    
    private static final String START_TIME = "requestStartTime";
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        // 记录开始时间
        request.setAttribute(START_TIME, System.currentTimeMillis());
        
        // 记录请求信息
        log.info("请求开始 - URI: {}, Method: {}, IP: {}", 
                request.getRequestURI(),
                request.getMethod(),
                getClientIP(request));
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) throws Exception {
        // 计算耗时
        Long startTime = (Long) request.getAttribute(START_TIME);
        long duration = System.currentTimeMillis() - startTime;
        
        // 记录响应信息
        log.info("请求结束 - URI: {}, Status: {}, 耗时: {}ms", 
                request.getRequestURI(),
                response.getStatus(),
                duration);
        
        // 记录异常
        if (ex != null) {
            log.error("请求异常 - URI: {}, Error: {}", 
                    request.getRequestURI(), ex.getMessage());
        }
    }
    
    private String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
```

### 跨域拦截器

```java
@Component
public class CorsInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        // 设置跨域响应头
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Max-Age", "3600");
        
        // 处理预检请求
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return false;
        }
        
        return true;
    }
}
```

## 多个拦截器执行顺序

当有多个拦截器时，执行顺序如下：

```
preHandle1 → preHandle2 → preHandle3
                  ↓
            Controller
                  ↓
postHandle3 → postHandle2 → postHandle1
                  ↓
              视图渲染
                  ↓
afterCompletion3 → afterCompletion2 → afterCompletion1
```

- preHandle：按注册顺序执行
- postHandle：按注册逆序执行
- afterCompletion：按注册逆序执行

::: warning 注意
如果某个拦截器的 preHandle 返回 false，后续拦截器的 preHandle 不会执行，但之前已执行的拦截器的 afterCompletion 会执行。
:::
