# MetaVibe 🚀

> **AI-Native 元架构与工程防防爆平台 (AI-Native Meta-Architecture & Anti-Entropy Platform for Vibe Coding)**

MetaVibe 是一个专为 **Vibe Coding** 时代打造的工程基础设施。它旨在解决 AI 编程过程中**“重复造轮子造成的巨大 Token 浪费”**以及**“缺乏长远工程约束导致的代码后期爆炸与难以维护”**两大痛点。

---

## 🌟 核心功能与命令行工具

### 1. 🏛️ `metavibe hub` —— 预置黄金元架构图谱
从系统内置的黄金元架构图谱库（Clean Architecture, Next.js App Router, FastAPI API）中一键载入架构规约：
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

---

## 🛠️ 项目工程结构

```
MetaVibe/
├── AGENT.md                 # 🤖 AI Agent 开发与协同指引（Dogfooding 范例）
├── ARCHITECTURE.md          # 📐 元架构提炼机制与工程库字典规格文档
├── .metavibe/               # ⚙️ MetaVibe 引擎配置与基石 Specs
│   ├── config.json          #    核心配置文件
│   ├── specs/               #    已载入/提炼的元架构 Schema
│   └── extractors/          #    AI 提炼元架构使用的 Meta-Prompt 模版
├── src/
│   └── metavibe/            # 📦 MetaVibe 核心引擎
│       ├── engine/          #    loader, guardrail, injector, extractor, hub, factory
│       ├── hub/             #    内置黄金 Spec 图谱库
│       └── specs/           #    Pydantic 模型规范
├── tests/                   # 🧪 100% 覆盖的测试套件
└── pyproject.toml           # 🐍 项目依赖管理 (基于 uv)
```

---

## 🤝 贡献与演进

MetaVibe 自身完全采用 **Vibe Coding** 模式迭代构建。欢迎添加新的黄金元架构或扩展工程库字典库！
