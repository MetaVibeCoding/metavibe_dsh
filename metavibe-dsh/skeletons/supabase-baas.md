# Supabase BaaS 设计骨架（supabase-baas）

> 从 [Supabase](https://supabase.com) 开源后端架构提炼的设计骨架。绑定：`metavibe_hub_use supabase-baas`

## 核心思想

"数据库即产品"：**Postgres schema 是产品契约**，上层 API（PostgREST 即时 CRUD）、Realtime、Auth、Storage 都是围绕数据库的薄服务；**RLS 行级安全是安全边界**，客户端永远不能绕过。

## 分层设计骨架

```
src/client-sdk     SDK（仅 anon key，永不接触 service_role）
src/api            即时 API：表即端点；Auth/Storage/Realtime 独立子服务
src/realtime       WAL 逻辑复制 → 频道订阅（行/列级权限过滤）
src/database       Postgres schema + RLS 策略 + 迁移（同源管理）
```

| 层 | 职责 | 硬规则 |
| :--- | :--- | :--- |
| `client-sdk` | 客户端访问 | 只带 anon key；禁止绕过 API 直连 DB |
| `api` | 即时端点 | 所有访问经 RLS 校验；子服务隔离 |
| `realtime` | 变更订阅 | 基于 WAL；按权限过滤频道 |
| `database` | 契约与安全 | schema/迁移/RLS 同源；密钥不出服务端 |

## 关键数据流

```
Client ──anon key──▶ api (PostgREST) ──▶ database（RLS 策略判定）
  database ──WAL──▶ realtime ──频道──▶ 订阅客户端（权限过滤）
  api/auth ──OAuth/邮箱──▶ AuthProviderSlot → JWT → RLS 上下文
```

## 扩展插槽

- `AuthProviderSlot`：邮箱 / 第三方 OAuth 登录提供方
- `StorageBucketSlot`：对象存储适配器（S3 兼容）
- `RlsPolicySlot`：行级安全策略定义

## 在 MetaVibe 中落地

```text
metavibe_hub_use { "name": "supabase-baas" }
metavibe_assemble                    # 生成 AuthProviderSlot 等桩
metavibe_check                       # 校验 client-sdk 未越层
metavibe_inject                      # 生成 Agent 规则
```

## 守卫（metavibe_check 强制执行）

- `client-sdk` 禁止 import `database`（SDK 永不直连库）
- `api` 禁止 import `client-sdk`（服务端不反向依赖客户端）
