# AGENT.md - AI Agent 运行与开发协同规约

语言: **[English](AGENT.md)** | **[中文](AGENT_zh.md)**

> 本文件是所有参与 MetaVibe 项目开发的 AI Agent（包括 Cursor, Windsurf, Claude Code, Antigravity 等）必须严格遵守的最高协同规则。

---

## 🎯 核心指导原则 (Core Directives)

1. **Vibe-Native 优先**：任何功能、结构或工具设计，必须以“是否提升了 AI Agent 开发效率与 Token 利用率”为第一标准。
2. **极简 Token 原则**：避免输出无意义的样板代码。能用声明配置、契约 Spec 或集中工厂解决的，绝不重复生成多份代码。
3. **架构防防爆法则 (Anti-Entropy Rules)**：
   - **单文件上限**：核心逻辑文件代码行数严格控制在 300 行以内。一旦超出，必须提示重构拆分为子模块。
   - **职责单一**：Schema 定义、引擎逻辑、提示词模板（Meta-Prompts）必须物理隔离。
   - **类型与状态强校验**：所有 Python/TypeScript 模块必须提供明确的类型声明（Pydantic / Type / Interface）。

---

## ⚙️ 环境与工具命令

- **包与环境管理**：本项目严格使用 `uv` 管理 Python 环境与依赖。
  - 创建环境：`uv venv`
  - 依赖安装：`uv pip install -e .` 或 `uv add <package>`
