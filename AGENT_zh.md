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

- **包与构建管理**：MetaVibe 是 DeepSeek Harness 插件，使用 `pnpm` 管理依赖，`tsc` + `tsdown` 构建（在 `metavibe-dsh/` 目录内）。
  - 安装依赖：`pnpm install`
  - 运行测试：`pnpm test`（vitest）
  - 类型检查：`pnpm run typecheck`
  - 构建：`pnpm run build`
- **只读顾问**：`metavibe-dsh` 只做地图与建议（`metavibe_hub_list` / `metavibe_catalog_*`），绝不扫描、写入或在目标工作区生成代码——agent loop 不受干扰。
