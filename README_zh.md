```text
███╗   ███╗███████╗████████╗ █████╗ ██╗   ██╗██╗██████╗ ███████╗
████╗ ████║██╔════╝╚══██╔══╝██╔══██╗██║   ██║██║██╔══██╗██╔════╝
██╔████╔██║█████╗     ██║   ███████║██║   ██║██║██████╔╝█████╗  
██║╚██╔╝██║██╔══╝     ██║   ██╔══██║╚██╗ ██╔╝██║██╔══██╗██╔══╝  
██║ ╚═╝ ██║███████╗   ██║   ██║  ██║ ╚████╔╝ ██║██████╔╝███████╗
╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝  ╚═══╝  ╚═╝╚═════╝ ╚══════╝
                                                                
```

# 🏛️ 让 AI 写出杰作。

> **AI 生成的每一行代码，都站在 Stripe、Supabase、FastAPI 等软件巨人的架构之上。**
> **Make AI build masterpieces — every line on the shoulders of giants.**

---
# MetaVibe 🚀

语言: **[English](README.md)** | **[中文](README_zh.md)**

> **AI-Native 元架构与工程防爆平台 (AI-Native Meta-Architecture & Anti-Entropy Platform for Vibe Coding)**
> 现已交付为 **DeepSeek Harness 原生插件**（`metavibe-dsh`）。

MetaVibe 是专为 **Vibe Coding** 时代打造的工程基础设施。它解决 AI 编程过程中**"重复造轮子造成的巨大 Token 浪费"**与**"缺乏长远工程约束导致的代码后期爆炸与难以维护"**两大痛点。原 Python CLI 已退役，唯一实现为基于 TypeScript 的 DeepSeek Harness（Cordis）插件。

---

## ⚡ 插件前后效果一览

| 维度 | 无插件 | 有插件（MetaVibe） |
| :--- | :--- | :--- |
| **生成结构** | 单文件、逻辑堆叠 | 黄金骨架分层、单向依赖 |
| **数据库访问** | Router 里裸 SQL | 收敛到 Repository 层 |
| **跨层依赖** | 随意 import | `metavibe_check` 硬性拦截 |
| **业务规则** | 内联在 Handler | 收敛到 Domain 纯对象 |
| **文件体积** | 无限制、易熵增崩塌 | < 300 行强制守护 |
| **样板 Token** | 每轮 3~8k 重造 | 仅 200~500（骨架+规则） |
| **范式沉淀** | 零积累 | 骨架跨项目复用 |

> **实测**：同一「用户注册 API」——无插件代码绑定骨架后 `metavibe_check` 当场报 **2 个 ERROR**；分层版 **零违规**。完整对比与真实日志见 [effect-comparison](metavibe-dsh/docs/effect-comparison.zh.md)。

## 🌟 核心理念

传统 Vibe Coding 是**"从 0 到 1 粗暴生成"**。MetaVibe 提倡**"元工厂与元架构组装"**：

1. **元架构提炼引擎 (Meta-Architecture Engine)**：利用成熟 LLM 分析优秀开源项目与经典工程理论（DDD、Clean Architecture、Unix 哲学），提炼出抽象、低熵的**元架构范式 (Meta-Architecture Specs)** 并不断沉淀。
2. **元工厂与元组件 (Meta-Factory & Meta-Components)**：将黄金工程范式封装为声明契约（Spec），AI 只需生成少量 **Slot 处理器** 代码即可完成完整工程的组装。
3. **架构防爆网格 (Anti-Entropy Guardrails)**：在 AI 持续写代码的过程中进行实时架构合规性约束，防止代码膨胀为不可维护的混乱散沙。

---

## 🧩 模型工具（DeepSeek Harness）

| 工具 | 对应已退役 CLI | 功能 |
| :--- | :--- | :--- |
| `metavibe_hub_list` | `hub list` | 列出内置黄金元架构图谱 |
| `metavibe_hub_use` | `hub use` | 绑定元架构到 `.metavibe/specs/` |
| `metavibe_check` | `check` | 防代码爆炸守卫（行数上限 + 禁止跨层 import） |
| `metavibe_inject` | `inject` | 生成高密度 Agent Rules markdown |
| `metavibe_assemble` | `assemble` | 为绑定的元架构生成 Slot 桩 |
| `metavibe_extract_prepare` | `extract prepare` | 生成 LLM 元架构提炼 Prompt |
| `metavibe_extract_parse` | `extract parse` | 解析 LLM JSON 响应为 Spec 并入库 |
| `metavibe_catalog_tree` | `catalog tree` | 知识矩阵分类浏览 |
| `metavibe_catalog_inspect` | `catalog inspect` | 检视单个案例 Skill |

---

## 🚀 使用场景速览（触发 → 工具）

| 用户说… | 代理调用 |
| :--- | :--- |
| “scaffold a clean-arch web API”（搭建整洁架构后端） | `hub_list` → `hub_use` → `assemble` |
| “check the repo for violations”（检查违规） | `check` |
| “generate agent rules”（生成规则） | `inject` |
| “extract an architecture from …”（提炼架构） | `extract_prepare` → LLM → `extract_parse` |
| “show me the CQRS reference”（查 CQRS 参考） | `catalog_tree` / `catalog_inspect` |

完整五大触发场景（含参数与产出）见 [`metavibe-dsh/README_zh.md`](metavibe-dsh/README_zh.md) → *触发与使用场景*。

## 📁 项目结构

```
MetaVibe/
├── metavibe-dsh/          # 插件本体（TypeScript，唯一实现）
│   ├── src/               # TS 源码（单文件均 < 300 行）
│   ├── tests/             # vitest 测试套件（engine + tools，36 用例）
│   ├── scripts/           # 动态演示组装脚本
│   ├── tsconfig.json / tsdown.config.ts
│   └── cordis.yml.example # 挂载到 agent preset 的示例
├── .metavibe/             # 工作区数据（specs / examples / extractors）
├── .cursor/rules/         # 生成的 Agent Rules
├── AGENT.md / ARCHITECTURE.md / DESIGN_PATTERNS.md   # 文档（中英双语）
```

完整插件指南（构建 / 挂载 / 开发）见 [`metavibe-dsh/README.md`](metavibe-dsh/README.md) 与 [`metavibe-dsh/README_zh.md`](metavibe-dsh/README_zh.md)。

---

## 🤝 贡献与演进

MetaVibe 本身完全采用 **Vibe Coding** 范式构建，并正在 dogfooding 自家的守卫（`metavibe_check` 扫描本仓库零违规）。欢迎贡献新的黄金元架构或工程库描述字典。
