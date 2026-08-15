# FastAPI Web 服务设计骨架（fastapi-web）

> 从 FastAPI + Pydantic 最佳实践提炼的设计骨架。绑定：`metavibe_hub_use fastapi-web`

## 核心思想

**Router 只做传输，Service 编排用例，Repository 隔离存储，Domain 保持纯净**——用依赖注入把依赖方向倒置到接口上，让核心业务可单测、可替换存储。

## 分层设计骨架

```
src/router      HTTP 解包 + Pydantic DTO 校验 + 错误映射（薄）
src/service     用例编排（一个方法一个用例，事务边界）
src/repository  ORM 隔离（SQLAlchemy），返回领域模型
src/domain      纯实体/值对象/领域规则（零框架依赖）
```

| 层 | 职责 | 硬规则 |
| :--- | :--- | :--- |
| `router` | 传输 | 禁止访问 DB / 写业务逻辑；response_model 声明 DTO |
| `service` | 编排 | 依赖注入获得 Repository；事务边界在此 |
| `repository` | 存储 | 隔离 ORM；禁止泄漏 SQLAlchemy 对象 |
| `domain` | 领域 | 无 FastAPI/SQLAlchemy 依赖 |

## 关键数据流

```
Client ──POST /users──▶ router（DTO 校验）
  router → service.execute(cmd)          # 用例
  service → repository（经 DBSessionSlot）
  repository → domain（实体规则校验）→ 持久化
  service → router → response_model(DTO)
```

## 扩展插槽

- `DBSessionSlot`：数据库会话工厂（读写分离 / 分库）
- `CacheSlot`：缓存后端（Redis 等）
- `AuthDependencySlot`：鉴权依赖（JWT / OAuth2）

## 在 MetaVibe 中落地

```text
metavibe_hub_use { "name": "fastapi-web" }
metavibe_assemble                    # 生成 DBSessionSlot / AuthDependencySlot 桩
metavibe_check                       # 校验 router/domain 未越层
metavibe_inject                      # 生成 Agent 规则
```

## 守卫（metavibe_check 强制执行）

- `router` 禁止 import `repository` / `sqlalchemy`（Router 不碰存储）
- `domain` 禁止 import `sqlalchemy` / `fastapi`（领域保持纯净）
