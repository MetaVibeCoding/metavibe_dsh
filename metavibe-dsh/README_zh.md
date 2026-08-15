# metavibe-dsh 🚀

语言: **[English](README.md)** | **[中文](README_zh.md)**

**MetaVibe 重构为 DeepSeek Harness 原生插件 —— 面向 Vibe Coding 的只读架构顾问。** 原 Python CLI 引擎已退役；本包是唯一实现：**TypeScript 源码** + Cordis 插件 + `defineTool` 模型工具，构建流程与官方包完全一致（`tsc` → `lib/types/`，`tsdown` → `lib/index.js`）。

## 🧭 它是什么（以及不是什么）

MetaVibe 只做**建议**，绝不伸手进入被辅助的项目。

- ✅ **架构地图**（`metavibe_hub_list`）：内置黄金元架构图谱（分层 / 插槽 / 规约），用于选定顶层设计方向。
- ✅ **最佳实践库**（`metavibe_catalog_tree` / `metavibe_catalog_inspect`）：知识矩阵（数据流 / 数据模型 / 设计理念 / Meta-Skill），含黄金示例与 Agent 指令。
- ❌ 不做：扫描工作区、写文件、绑定 Spec、生成代码、在目标项目内做架构强制。

因为每个工具都是纯只读的，插件不需要 `fs` 服务、不会用全仓库扫描卡住 agent loop、也永远不会干扰它正在辅助的项目。

## 🛠️ 工具清单（3 个模型工具）

| 工具 | 功能 |
| :--- | :--- |
| `metavibe_hub_list` | 列出黄金架构地图：每个预置架构的名称、来源、版本、描述、分层与插槽 |
| `metavibe_catalog_tree` | 按分类浏览知识矩阵（数据流 / 数据模型 / 设计理念 / Meta-Skill） |
| `metavibe_catalog_inspect` | 深入检视单条知识：摘要、数据流图、Schema、黄金示例、Agent 指令 |

## 🎯 触发与使用场景

这些工具在 DeepSeek Harness 会话中的实际触发方式：代理把用户请求映射为具体工具调用。所有工具都是只读的，绝不触碰工作区。

| 用户说… | 代理调用 |
| :--- | :--- |
| “帮我选个后端架构 / 什么是整洁架构的顶层设计？” | `metavibe_hub_list` |
| “CQRS / DTO / 鉴权工厂怎么写？有没有参考案例” | `metavibe_catalog_tree` → `metavibe_catalog_inspect` |
| “支付 / Next.js / FastAPI 的黄金范式是什么？” | `metavibe_hub_list`（选预置）→ `metavibe_catalog_inspect`（看最佳实践细节） |

### 场景 — 选定顶层架构方向
1. `metavibe_hub_list` — 代理盘点黄金架构地图。
2. 代理（与用户一起）选定契合项目的预置，并基于 spec 提出分层 / 单向依赖方案。
3. 代理按 spec 起草项目结构 —— 插件只做引导，从不写文件。

### 场景 — 编码中查最佳实践
1. `metavibe_catalog_tree` — 知识矩阵总览。
2. `metavibe_catalog_inspect { "id": "data_flows/cqrs_flow" }` — 数据流图、Schema、黄金示例代码、Agent 指令。
3. 代理把范式应用进正在写的代码。

## 项目结构

```
metavibe-dsh/
├── package.json          # ESM 包元数据（name: metavibe-dsh, main: lib/index.js）
├── tsconfig.json         # 对齐官方 base：es2024 / bundler / .ts 导入 → 产出 .js
├── tsdown.config.ts      # 与官方同构：入口 lib/types/index.js → lib/index.js
├── cordis.yml.example    # 挂载示例（复制进 agent preset）
├── scripts/
│   ├── install.sh            # 一键安装脚本（装包 + profile 插件行插入，幂等）
│   ├── assemble-dynamic.mjs  # 从编译产物组装会话演示动态 Package
│   └── gen-data.mjs          # 从 skeletons/*.json 重新生成 src/data/hub.ts
├── skeletons/            # 黄金元架构源（.json spec + .md 设计文档）
├── src/                  # TS 源码（单文件均 < 300 行）
│   ├── index.ts          # Cordis 插件入口 (name/inject/Config/apply)
│   ├── engine.ts         # 只读引擎（Hub 地图 + Catalog 矩阵）
│   ├── specs.ts          # Spec 类型与解析校验（lossless JSON：缺省字段省略）
│   ├── tools/            # 分组工具注册（hub / catalog / helpers / index）
│   ├── data/             # 嵌入的 Hub / Catalog 数据 (.ts)
│   └── types/dsh.d.ts    # cordis/dsh-tools 运行时契约 ambient 类型
├── tests/                # vitest 测试（engine + tools，13 用例）
├── examples/             # 历史 before/after 对比项目（0.3 之前）
├── docs/                 # effect-comparison 文档（历史记录，0.3 之前）
└── lib/                  # 构建产物（tsc → lib/types/，tsdown → lib/index.js）
```

所有模块遵循 MetaVibe 自身防熵规则（单文件 < 300 行）。`engine.ts` + `specs.ts` 是**零依赖纯逻辑**（完全无 I/O），可独立单测；`tools/*` 只做接线。

## 安装与挂载

**推荐：一键安装脚本（插件模式，非 preset）**。[`scripts/install.sh`](scripts/install.sh) 会把包安装进 profile，并通过 `- insert:` 条目把 metavibe 行写入 profile 的 `cordis.patch.yml`——插件随 profile 一起加载，**所有会话**都带工具，无需选 preset：

```bash
cd metavibe-dsh
bash scripts/install.sh                # web profile（默认）
bash scripts/install.sh --profile tui  # 安装到其他 profile
```

安装后**重启 `dsh web`**，`metavibe_hub_list` / `metavibe_catalog_tree` / `metavibe_catalog_inspect` 在全部会话中可用。

**按会话隔离（agent preset）**：若只想让某个 preset 带工具，把 [`cordis.yml.example`](cordis.yml.example) 中的行复制到该 preset 的 `agent.cordis.yml` 即可，无需配置。

> 🚀 **上架 DSH 插件生态**（npm publish → `dsh plugin add metavibe-dsh` → 挂载）→ 见 [`PUBLISHING.zh.md`](PUBLISHING.zh.md)。

## 历史

- **0.3.0** — 收敛为只读架构顾问：移除 `metavibe_check` / `metavibe_hub_use` / `metavibe_assemble` / `metavibe_inject` / `metavibe_extract_*`（它们会扫描、写入或在目标工作区生成代码）。插件现在只消费 `tools` 注册表——不再需要 `fs` 服务、无配置、无沙箱写入。
- **≤ 0.2.x** — 防熵工具集（守卫检查、Spec 绑定、规则注入、Slot 装配、架构提炼）。历史前后对比见 `docs/effect-comparison.zh.md`。
