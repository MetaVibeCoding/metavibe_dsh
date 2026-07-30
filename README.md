# MetaVibe 🚀

> **AI-Native 元架构与工程防防爆平台 (AI-Native Meta-Architecture & Anti-Entropy Platform for Vibe Coding)**

MetaVibe 是一个专为 **Vibe Coding** 时代打造的工程基础设施。它旨在解决 AI 编程过程中**“重复造轮子造成的巨大 Token 浪费”**以及**“缺乏长远工程约束导致的代码后期爆炸与难以维护”**两大痛点。

---

## 🌟 核心理念

传统的 Vibe Coding 是**“从 0 到 1 粗暴生成”**：AI 每次接到需求，都会重新生成庞大的脚手架、HTML/CSS 布局、状态管理和 DB 增删改查逻辑。

**MetaVibe 提倡“元工厂与元架构组装”**：
1. **元架构提炼引擎 (Meta-Architecture Engine)**：直接利用成熟大模型（LLM）的跨语言代码理解能力，分析优秀开源软件与经典工程理论（如 DDD、Clean Architecture、Unix 哲学），提炼出抽象、低熵的**元架构范式 (Meta-Architecture Specs)** 与硬约束规约，并使其知识图谱随着社区不断增长。
2. **元工厂与元组件 (Meta-Factory & Meta-Components)**：将黄金工程范式封装为 AI 极易读取的声明契约（Spec），让 AI 只需生成少量的**业务插槽 (Slots)** 代码，即可完成完整工程的组装。
3. **架构防防爆网格 (Anti-Entropy Guardrails)**：在 AI 持续写代码的过程中，进行实时架构合规性约束，防止代码膨胀为不可维护的混乱散沙。

---

## 💥 为什么需要 MetaVibe？

| 维度 | 传统 Vibe Coding 方式 | 借助 MetaVibe 方式 |
| :--- | :--- | :--- |
| **Token 消耗** | 每次需求都需要 3000~8000 Tokens 生成底座代码 | 仅需 200~500 Tokens 生成配置文件与业务回调（**节省 90%+**） |
| **代码熵增** | 随行数增加呈指数级混乱，3000 行后极易“坍塌爆炸” | 由硬约束 Guardrails 守护，保持高内聚、低耦合的模块状态 |
| **工程质量** | 缺乏错误处理、类型安全和测试规范，仅停留在 MVP Demo 级 | 直接复用经过提炼的工业级黄金架构范式（Production-Ready） |
| **架构积累** | 每次项目都是从零开始，没有任何范式沉淀 | 提炼出的元架构可沉淀、复用并跨项目递增成长 |

---

## 🧩 核心特性

- **🤖 彻底 Agent-First**：整个项目协议与指令对 Cursor, Windsurf, Claude Code, Antigravity 等 AI Agent 彻底友好。
- **🔍 智能元架构提炼 (AI-Driven Extractor)**：无需编写死板的 AST 解析器，直接使用成熟 AI Model 对优秀项目进行模式提取。
- **🛡️ 架构防防爆网格 (Anti-Entropy)**：防止 AI 将 Controller 与 DB 混写，防止单文件体积爆炸。
- **📦 递增的领域元架构库 (Growing Knowledge Graph)**：涵盖 Web 全栈、微服务、AI Agent 系统、量化交易等多领域黄金规范。

---

## 🛠️ 项目结构

```
MetaVibe/
├── AGENT.md                 # 🤖 AI Agent 开发与协同指引（Dogfooding 范例）
├── ARCHITECTURE.md          # 📐 元架构提炼机制与元工厂规格文档
├── .metavibe/               # ⚙️ MetaVibe 引擎配置与基石 Specs
│   ├── config.json          #    核心配置文件
│   ├── specs/               #    提炼出的元架构 Schema
│   └── extractors/          #    AI 提炼元架构使用的 Meta-Prompt 模版
└── pyproject.toml           # 🐍 项目依赖管理 (基于 uv)
```

---

## 🤝 贡献与演进

MetaVibe 自身完全采用 **Vibe Coding** 模式迭代构建。无论是新增元架构提炼模板还是优化防爆规约，都可以直接引导 AI Agent 参考 [AGENT.md](file:///Users/joffrey/projects/ai/MetaVibe/AGENT.md) 共同推进。
