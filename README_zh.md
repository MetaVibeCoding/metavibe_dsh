# MetaVibe 🚀

语言: **[English](README.md)** | **[中文](README_zh.md)**

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

## 🧩 核心特性与命令行工具

### 1. 🏛️ `metavibe hub` —— 预置黄金元架构图谱
从系统内置的黄金元架构图谱库中一键载入架构规约：
```bash
# 查看所有可用的预置黄金元架构
metavibe hub list

# 载入 clean-arch-web 黄金元架构到当前工程
metavibe hub use clean-arch-web
```

### 2. 🔍 `metavibe extract` —— AI 智能元架构提炼引擎
使用大模型（Gemini / Claude / GPT）分析任意开源项目源码或架构文档，提炼低熵 Spec：
```bash
# 准备向 AI Model 发送的结构提炼 Meta-Prompt
metavibe extract prepare --source ./some-repo --name MyPattern

# 将 AI 返回的 JSON 自动解析入库
metavibe extract parse --file ai_response.json
```

### 3. 💉 `metavibe inject` —— AI Context 注射器 (节省 90%+ Token)
一键将工程元架构、库规范与黄金/反范式代码高密度压缩为给 Cursor / Windsurf / Claude Code / Antigravity 使用的 Agent Rules：
```bash
metavibe inject --output .cursor/rules/metavibe.mdc
```

### 4. ⚙️ `metavibe assemble` —— 元工厂与 Slot 插槽装配
基于选定的元架构，自动在工程中生成强类型的扩展插槽 Handler 存根（Stub）：
```bash
metavibe assemble --output src/slots
```

### 5. 🛡️ `metavibe check` —— 架构静态防代码爆炸检查
实时检测代码文件体积膨胀与非法跨层 import 依赖：
```bash
metavibe check --max-lines 300
```
