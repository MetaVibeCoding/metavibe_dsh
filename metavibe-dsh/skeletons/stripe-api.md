# Stripe API 设计骨架（stripe-api）

> 从 [Stripe API Design Guide](https://stripe.com/docs/api) 与其支付架构提炼的设计骨架。绑定：`metavibe_hub_use stripe-api`

## 核心思想

Stripe 是**资源化 API + 事件驱动**的支付体系范本：对外是一套统一、幂等的 REST 资源；对内是"支付核心 → 渠道适配"的严格隔离，渠道升级不影响领域模型。

## 分层设计骨架

```
src/api            资源化 REST API（DTO 进出，幂等键防重放）
  └── v1/payment_intents, v1/charges, ...
src/payment-core   领域核心（PaymentIntent/Charge 状态机、金额最小单位）
src/events         事件总线（领域真相来源，Webhook 出站签名）
src/channels       渠道适配器（卡/钱包/银行，统一 ChannelAdapter 接口）
src/ledger         append-only 账本（对账、不可变分录）
```

| 层 | 职责 | 硬规则 |
| :--- | :--- | :--- |
| `api` | 传输 + 校验 | 只露 DTO；写操作带 Idempotency-Key；禁止直连 ledger/channels |
| `payment-core` | 业务状态机 | 纯领域，零框架依赖；金额一律最小货币单位整数 |
| `events` | 异步真相 | 事件 schema 版本化；Webhook 签名 + 重试 |
| `channels` | 外部渠道 | 实现统一接口；SDK 异常映射为领域错误码 |
| `ledger` | 账本 | append-only，禁止原地改账 |

## 关键数据流

```
Client ──POST /v1/payment_intents(idempotency-key)──▶ api
  api → payment-core（创建 PaymentIntent，状态机推进）
  payment-core → channels.ChannelAdapterSlot（发起渠道扣款）
  channels ──异步回执──▶ events（payment.succeeded）
  events → WebhookHandlerSlot（通知商户，签名验证）
  events → ledger（append 分录）→ 对账
```

## 扩展插槽

- `ChannelAdapterSlot`：接入新支付渠道（支付宝/微信/钱包…）
- `WebhookHandlerSlot`：订阅领域事件做业务联动
- `IdempotencyStoreSlot`：幂等键存储（Redis/DB）

## 在 MetaVibe 中落地

```text
metavibe_hub_use { "name": "stripe-api" }     # 绑定骨架
metavibe_assemble                             # 生成 ChannelAdapterSlot 等插槽桩
# 之后每次改动代码：
metavibe_check                                # 校验 api/payment-core 未越层 import
metavibe_inject                               # 生成 Agent 规则，AI 编码自动遵循
```

## 守卫（metavibe_check 强制执行）

- `payment-core` 禁止 import `channels` / `ledger`（领域不依赖渠道与账本）
- `api` 禁止直接 import `ledger` / `channels`（传输层不直连基础设施）
