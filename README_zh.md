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

> **AI-Native 架构地图与最佳实践顾问（Architecture Map & Best-Practices Advisor for Vibe Coding）**
> 现已交付为 **DeepSeek Harness 原生插件**（`metavibe-dsh`）。

MetaVibe 是面向 **Vibe Coding** 时代的**只读架构顾问**。它专注回答一个问题：*"这个项目应该采用什么顶层设计方向、哪些黄金工程实践？"* —— 以一张经过验证的**架构全局地图**和**最佳实践知识矩阵**呈现，用极低 Token 注入 Agent 上下文。它只**提议**，绝不伸手进入被辅助的项目。

---

## 🧭 它是什么（以及不是什么）

| MetaVibe 会… | MetaVibe 绝不会… |
| :--- | :--- |
| 从黄金架构地图给出顶层设计方向 | 逐文件扫描目标工作区 |
| 从最佳实践库给出黄金范式 / 反范式 | 向目标项目写入 Spec、规则文件或代码 |
| 把经典工程理论（DDD、Clean Architecture、Unix 哲学）提炼为低熵 Spec | 通过阻断 Agent 正常循环来强制架构 |
| 让知识库以可复用元架构的方式持续沉淀 | 向其他项目"绑定 / 安装"任何东西 |

## 🧩 模型工具（DeepSeek Harness）

| 工具 | 功能 |
| :--- | :--- |
| `metavibe_hub_list` | 列出黄金架构地图（每个预置的分层 / 插槽 / 规约） |
| `metavibe_catalog_tree` | 按分类浏览知识矩阵 |
| `metavibe_catalog_inspect` | 深入检视单条知识（图 / Schema / 黄金示例 / 指令） |

> 0.3 之前的守卫工具集（`metavibe_check`、`metavibe_hub_use`、`metavibe_assemble`、`metavibe_inject`、`metavibe_extract_*`）已移除：它们会扫描、写入或在目标工作区生成代码，超出了顾问角色。

## 🚀 使用场景速览（触发 → 工具）

| 用户说… | 代理调用 |
| :--- | :--- |
| “整洁架构 Web API 该用什么架构？” | `metavibe_hub_list` |
| “CQRS / DTO / 鉴权工厂怎么组织？” | `metavibe_catalog_tree` → `metavibe_catalog_inspect` |
| “支付 / Next.js / FastAPI 的黄金范式是什么？” | `metavibe_hub_list` → `metavibe_catalog_inspect` |

完整场景见 [`metavibe-dsh/README_zh.md`](metavibe-dsh/README_zh.md) → *触发与使用场景*。

## 📁 项目结构

```
MetaVibe/
├── metavibe-dsh/          # 插件本体（TypeScript，唯一实现）
│   ├── src/               # TS 源码（单文件均 < 300 行，只读引擎）
│   ├── tests/             # vitest 测试套件（engine + tools，13 用例）
│   ├── scripts/           # 动态演示组装与数据生成脚本
│   ├── tsconfig.json / tsdown.config.ts
│   └── cordis.yml.example # 挂载到 agent preset 的示例
├── .metavibe/             # spec 数据（架构 / 库 / 提炼模板）
├── skeletons/             # 黄金元架构源
├── AGENT.md / ARCHITECTURE.md / DESIGN_PATTERNS.md   # 文档（中英双语）
```

## 🤝 贡献与演进

MetaVibe 本身完全采用 **Vibe Coding** 范式构建，并保持边界：插件只做**地图与建议**，因此可以在不纠缠于项目代码的前提下辅助任何项目。欢迎贡献新的黄金元架构或最佳实践目录条目。
