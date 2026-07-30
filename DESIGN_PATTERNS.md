# 软件设计模式全景总结与黄金范式指南 🏛️

> **MetaVibe 工程理论汇聚**：本文档梳理并精炼了软件工程中最常见、最有效的设计模式。它们被提炼为 MetaVibe 可理解、可约束的元架构范式 (Meta-Architecture Specs)。

---

## 一、 经典 GoF 设计模式精髓 (Object-Oriented Design Patterns)

### 1. 创建型模式 (Creational Patterns) —— 降低实例化耦合

#### 🛠️ 1.1 工厂模式 & 抽象工厂 (Factory & Abstract Factory)
- **核心思想**：将对象的创建逻辑与实际使用逻辑剥离，使用者只需声明接口/契约，由工厂负责实例化。
- **最佳场景**：多数据库适配（MySQL/PostgreSQL/MongoDB）、第三方支付通道（Stripe/WeChat/PayPal）。
- **MetaVibe 元架构表达**：对应系统的 **[Plugin/Adapter Slot]** 结构。

```python
# 黄金范式：适配器工厂
class PaymentFactory:
    _adapters = {"stripe": StripeAdapter, "paypal": PayPalAdapter}

    @classmethod
    def create(cls, channel: str) -> PaymentProtocol:
        adapter_cls = cls._adapters.get(channel)
        if not adapter_cls:
            raise ValueError(f"Unsupported payment channel: {channel}")
        return adapter_cls()
```

#### 🔌 1.2 依赖注入与 DI 容器 (Dependency Injection & IoC)
- **核心思想**：对象不自己创建依赖项，而是通过构造函数或参数被动接收依赖。
- **最佳场景**：解耦单元测试（Mocking）、Web 框架 Service 层注入（如 FastAPI `Depends`）。
- **禁忌 (Anti-Pattern)**：在业务对象内部写死 `db = MysqlConnection()`。

---

### 2. 结构型模式 (Structural Patterns) —— 优化类与对象的组合

#### 🔌 2.1 适配器模式 (Adapter Pattern)
- **核心思想**：将一个类的接口转换成客户希望的另外一个接口，使得原本由于接口不兼容而不能一起工作的类可以一起工作。
- **最佳场景**：接入遗留系统、统一多源数据格式转换。

#### 🛡️ 2.2 代理模式与装饰器模式 (Proxy & Decorator Pattern)
- **核心思想**：在不修改原对象代码的前提下，为其透明地添加额外功能（如权限校验、日志记录、缓存拦截、熔断保护）。
- **最佳场景**：Python/TS 装饰器 `@require_auth`、缓存装饰器 `@lru_cache`、RPC 客户端代理。

```python
# 黄金范式：无侵入缓存装饰器
def cache_response(ttl_seconds: int = 60):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{args}:{kwargs}"
            if cached := await redis.get(key):
                return json.loads(cached)
            result = await func(*args, **kwargs)
            await redis.set(key, json.dumps(result), ex=ttl_seconds)
            return result
        return wrapper
    return decorator
```

#### 🏢 2.3 外观模式 (Facade Pattern)
- **核心思想**：为子系统中的一组接口提供一个一致的高层接口，降低外部与子系统内部复杂度的直接耦合。
- **最佳场景**：复杂 SDK 包装、微服务客户端封装。

---

### 3. 行为型模式 (Behavioral Patterns) —— 优化对象间的通信与职责分配

#### 🎯 3.1 策略模式 (Strategy Pattern)
- **核心思想**：定义一系列算法/业务逻辑，把它们一个个封装起来，并且使它们可以相互替换，避免庞大的 `if-else` / `switch` 嵌套。
- **最佳场景**：不同等级用户的打折策略、不同类型文件的解析策略。

```python
# 黄金范式：策略字典映射
STRATEGIES = {
    "VIP": VipDiscountStrategy(),
    "REGULAR": RegularDiscountStrategy(),
}
discount = STRATEGIES.get(user_type, DefaultStrategy()).calculate(price)
```

#### 🔗 3.2 责任链模式 / 中间件模式 (Chain of Responsibility / Middleware)
- **核心思想**：为请求创建一条接收者对象链。隐式让多个对象都有机会处理请求，沿着链传递直至被处理。
- **最佳场景**：Web 框架 HTTP 请求处理管道（Auth -> RateLimit -> CORS -> Logger -> Handler）。

#### 📢 3.3 观察者 / 发布-订阅模式 (Observer / Pub-Sub)
- **核心思想**：定义对象间的一种一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都会收到通知并自动更新。
- **最佳场景**：事件驱动架构 (Event-Driven Architecture)、前端 UI 状态响应机制（RxJS / Vue Reactivity）。

---

## 二、 现代架构范式 (Modern System Architecture Patterns)

| 范式名称 | 核心理念 | 适用场景 | 架构防爆作用 |
| :--- | :--- | :--- | :--- |
| **CQRS (读写责任分离)** | 将写操作 (Command) 与读操作 (Query) 完全物理/逻辑分离 | 高并发读写系统、复杂领域模型 | 解决读写模型互斥膨胀问题 |
| **Repository Pattern (仓储范式)** | 将领域模型与持久化技术细节（SQL/ORM）隔离 | DDD / Clean Architecture 项目 | 隔离数据库依赖，使领域层可纯净测试 |
| **Circuit Breaker (熔断器模式)** | 第三方服务异常时快速失败，防止级联崩溃 | 微服务 / 外部 API 频繁调用系统 | 保证系统的雪崩防御与自我修复能力 |
| **Sidecar Pattern (边车模式)** | 辅助功能独立运行于主程序旁的边车进程 | Kubernetes / Envoy 网关 | 无侵入解耦业务代码与运维治理 |

---

## 三、 前端与现代 UI 状态模式 (Frontend Patterns)

1. **Unidirectional Data Flow (单向数据流)**：
   - **Flux / Redux / Zustand 原则**：State -> View -> Action -> Dispatcher -> State 循环流转，禁止视图直接隐式修改状态，保证状态变更可追踪。
2. **Atomic Component & Component Slot (原子组件与插槽模式)**：
   - 将 UI 解构为 Atom (原子) -> Molecule (分子) -> Organism (生物)，并留出 Render Prop / Slot 增强通用性。

---

## 四、 AI Agent 现代智能体模式 (AI Agent Architecture Patterns)

1. **ReAct Pattern (Reasoning + Acting)**：
   - AI Agent 的“思考-工具调用-感知观察-再思考”循环闭环。
2. **Router & Sub-Agent Orchestration (智能路由与子 Agent 协同)**：
   - 主 Agent 根据意图分类（Routing），将专门任务下发给极度专注的 Sub-Agent（如 CodeRefactorAgent, SecurityAuditAgent），解决单一 Agent 膨胀乱套问题。

---

## 💡 如何在 MetaVibe 中应用这些模式？

在 MetaVibe 中，上述设计模式被统一转译为：
- **`layers` 约束**：定义模式的代码位置（如 Repository 只能在 `Infrastructure` 层）。
- **`slots` 挂载**：策略模式与工厂模式被映射为标准的 MetaVibe Slot。
- **`anti_patterns` 拦截**：如果 AI 编写了违反策略模式的 200 行 `if-else` 或在 Router 内写 SQL，`metavibe check` 将直接阻断报警！
