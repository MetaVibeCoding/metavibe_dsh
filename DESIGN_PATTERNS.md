# Software Design Patterns & Golden Paradigms Matrix 🏛️

Language: **[English](DESIGN_PATTERNS.md)** | **[中文](DESIGN_PATTERNS_zh.md)**

> **MetaVibe Engineering Knowledge Hub**: A comprehensive matrix of the most effective software design patterns, extracted into machine-readable Meta-Architecture Specs for AI Agents.

---

## 1. Classic GoF Design Patterns

### 1.1 Creational Patterns — Decoupling Instantiation

#### 🛠️ Factory & Abstract Factory Pattern
- **Core Concept**: Separates object creation from usage. Clients declare interface contracts while factories handle instantiation.
- **Best Use Cases**: Multi-database adapters (MySQL/PostgreSQL/MongoDB), third-party payment gateways (Stripe/PayPal).
- **MetaVibe Spec Mapping**: Represented as system **[Plugin / Adapter Slots]**.

```python
# Golden Pattern: Adapter Factory
class PaymentFactory:
    _adapters = {"stripe": StripeAdapter, "paypal": PayPalAdapter}

    @classmethod
    def create(cls, channel: str) -> PaymentProtocol:
        adapter_cls = cls._adapters.get(channel)
        if not adapter_cls:
            raise ValueError(f"Unsupported payment channel: {channel}")
        return adapter_cls()
```

#### 🔌 Dependency Injection (DI) & IoC Container
- **Core Concept**: Objects receive dependencies passively via constructors or parameters rather than instantiating them internally.
- **Best Use Cases**: Decoupling unit tests (mocking), FastAPI `Depends` injection.
- **Anti-Pattern**: Hardcoding `db = MysqlConnection()` inside domain objects.

---

### 1.2 Structural Patterns — Optimizing Composition

#### 🔌 Adapter Pattern
- **Core Concept**: Converts a class interface into another interface expected by clients, enabling incompatible classes to work together seamlessly.
- **Best Use Cases**: Integrating legacy systems, standardizing multi-source API payloads.

#### 🛡️ Proxy & Decorator Pattern
- **Core Concept**: Transparently adds cross-cutting concerns (authentication, logging, caching, rate-limiting) without mutating target objects.
- **Best Use Cases**: `@require_auth` decorators, `@lru_cache` decorators, RPC client proxies.

```python
# Golden Pattern: Transparent Caching Decorator
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

#### 🏢 Facade Pattern
- **Core Concept**: Provides a unified, high-level interface to a complex set of interfaces in a subsystem.

---

### 1.3 Behavioral Patterns — Object Communication & Responsibility

#### 🎯 Strategy Pattern (🔥 Highly Recommended for AI Coding)
- **Core Concept**: Encapsulates a family of algorithms/business rules, making them interchangeable.
- **Anti-Entropy Impact**: **Eliminates giant, unmaintainable 200-line `if-else` / `switch` blocks**.

```python
# Golden Pattern: Strategy Dispatcher Dict
STRATEGIES = {
    "VIP": VipDiscountStrategy(),
    "REGULAR": RegularDiscountStrategy(),
}
discount = STRATEGIES.get(user_type, DefaultStrategy()).calculate(price)
```

#### 🔗 Chain of Responsibility / Middleware Pattern
- **Core Concept**: Passes requests along a chain of handlers (e.g., HTTP pipeline: `CORS -> Auth -> RateLimit -> Logger -> Controller`).

#### 📢 Observer / Pub-Sub Pattern
- **Core Concept**: Defines a one-to-many dependency so that when one object changes state, all dependents are notified automatically (Event-Driven Architecture).

---

## 2. Modern System Architecture Patterns

| Pattern Name | Core Mechanism | Primary Use Case & Anti-Entropy Impact |
| :--- | :--- | :--- |
| **CQRS (Command Query Responsibility Segregation)** | Separates write models (Commands) from read models (Queries) | High-concurrency systems; prevents read/write domain model contamination |
| **Repository Pattern** | Isolates domain entities from ORM/SQL database technologies | Clean Architecture; keeps Domain layer pure & easily testable |
| **Circuit Breaker** | Fails fast on external API timeouts to prevent cascade outages | Microservices; protects system from cascading failures |
| **Sidecar Pattern** | Deploys auxiliary logic (logging, proxy) in an isolated process | Kubernetes / Envoy Mesh; decouples infra from business logic |

---

## 3. Frontend & Modern UI State Patterns

1. **Unidirectional Data Flow**:
   - **Flux / Redux / Zustand Principle**: `State -> View -> Action -> Dispatcher -> State` loop. Prevents views from mutating state implicitly; ensures 100% state traceability.
2. **Atomic Component & Component Slots**:
   - Deconstructs UI into Atoms -> Molecules -> Organisms, exposing Render Props / Slots for maximum reuse.

---

## 4. AI Agent Architecture Patterns

1. **ReAct Pattern (Reasoning + Acting)**:
   - Loop of `Thinking -> Tool Calling -> Observation -> Re-thinking` for autonomous agents.
2. **Router & Sub-Agent Orchestration**:
   - Intent-based routing to delegate specialized tasks to dedicated Sub-Agents (`CodeRefactorAgent`, `SecurityAuditAgent`), preventing single-agent prompt bloat.

---

## 💡 Usage in MetaVibe

In MetaVibe, these design patterns are translated into:
- **`layers` Constraints**: Architectural location rules for patterns.
- **`slots` Bindings**: Strategy and Factory patterns mapped to MetaVibe Slots.
- **`anti_patterns` Interception**: `metavibe check` blocks AI if it writes a 200-line `if-else` or direct SQL in routers!
