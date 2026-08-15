# Spring Boot 分层设计骨架（spring-boot）

> 从 Spring Boot 官方分层架构最佳实践提炼的设计骨架。绑定：`metavibe_hub_use spring-boot`

## 核心思想

经典**依赖倒置 + 事务边界 + 安全过滤器链**：Controller 依赖 Service 接口、Service 依赖 Repository 接口，全部构造器注入；`@Transactional` 只出现在 Service；安全统一收敛在过滤器链。

## 分层设计骨架

```
src/controller   请求映射 + 参数校验 + DTO 封装（薄）
src/service      用例编排 + 事务边界（构造器注入）
src/repository   Spring Data 仓库 + 自定义实现
src/domain       纯 JPA 实体 + 领域逻辑
src/security     安全过滤器链 + 方法级授权
```

| 层 | 职责 | 硬规则 |
| :--- | :--- | :--- |
| `controller` | Web 传输 | 只依赖 Service 接口；禁止依赖 Repository；返回 DTO 不序列化实体 |
| `service` | 业务事务 | `@Transactional` 仅在此；禁止 field injection 与 `new` |
| `repository` | 数据访问 | 不泄漏 Entity 到 Web 层 |
| `domain` | 领域 | 不依赖 Web 层；禁止注入 Service/Repository 到实体 |
| `security` | 安全 | 过滤器链统一收敛；`@PreAuthorize` 声明在 Service 接口 |

## 关键数据流

```
Client ──▶ SecurityFilterChain（认证/授权）
  ──▶ Controller（DTO 校验）──▶ Service 接口（@PreAuthorize）
  ──▶ Service 实现（@Transactional）──▶ Repository 接口
  ──▶ JpaRepositorySlot ──▶ DB；异常 → 领域异常 → 全局异常处理器
```

## 扩展插槽

- `JpaRepositorySlot`：数据访问仓库接口
- `SecurityFilterSlot`：安全过滤器链扩展
- `MessageQueueSlot`：消息发送（Kafka / RabbitMQ）

## 在 MetaVibe 中落地

```text
metavibe_hub_use { "name": "spring-boot" }
metavibe_assemble                    # 生成 JpaRepositorySlot 等桩
metavibe_check                       # 校验 controller/domain 未越层
metavibe_inject                      # 生成 Agent 规则
```

## 守卫（metavibe_check 强制执行）

- `controller` 禁止 import `repository`（Web 层不直接依赖存储）
- `domain` 禁止 import `controller` / `repository`（领域保持纯净）
