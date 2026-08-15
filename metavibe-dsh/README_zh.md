# metavibe-dsh 🚀

语言: **[English](README.md)** | **[中文](README_zh.md)**

**MetaVibe 重构为 DeepSeek Harness 原生插件** —— 把 MetaVibe 的 Python CLI 引擎（`src/metavibe/engine/*`）以 DSH 插件契约重写：**TypeScript 源码** + Cordis 插件 + `defineTool` 模型工具 + `ctx.fs` 文件访问缝，构建流程与官方包完全一致（`tsc` → `lib/types/`，`tsdown` → `lib/index.js`）。

> 本仓库已完全迁移到 DeepSeek Harness 插件形态，Python 版 CLI 已移除；`metavibe-dsh` 是唯一实现。

代码完全遵循 DeepSeek Harness 原生插件风格（与 `@deepseek-ai/dsh-tool-fs` 同一契约，参考官方源码 `deepseek-harness/packages/fs/tool-fs/src`）：

- ESM 模块，命名导出 `name` / `inject` / `Config` / `apply`（并同时作为 default 导出，兼容 loader 归一化）；
- 配置使用 `@deepseek-ai/schemastery` 的 `z.object`，`tsconfig` 对齐官方 base（es2024 / bundler resolution / `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`）；
- 工具用 `@deepseek-ai/dsh-tools` 的 `defineTool` 注册到 `ctx.tools`，输出 schema 遵循 value schema DSL；
- 所有文件 I/O 只经过抽象 `ctx.fs` 缝（`resolve` / `readText` / `writeText` / `listDir` / `stat`），不触碰 `node:fs` 或全局；
- 无服务发布 → 可直接平铺挂载进 agent preset，无需 `isolate` realm。

## 工具清单（9 个模型工具）

| 工具 | 对应原 CLI | 功能 |
| :--- | :--- | :--- |
| `metavibe_hub_list` | `metavibe hub list` | 列出内置黄金元架构图谱 |
| `metavibe_hub_use` | `metavibe hub use` | 绑定元架构到 `.metavibe/specs/` |
| `metavibe_check` | `metavibe check` | 防代码爆炸守卫（行数上限 + 禁止跨层 import） |
| `metavibe_inject` | `metavibe inject` | 生成高密度 Agent Rules markdown（可落盘） |
| `metavibe_assemble` | `metavibe assemble` | 为绑定的元架构生成 Slot 桩 |
| `metavibe_extract_prepare` | `metavibe extract prepare` | 生成 LLM 元架构提炼 Prompt |
| `metavibe_extract_parse` | `metavibe extract parse` | 解析 LLM JSON 响应并入库 |
| `metavibe_catalog_tree` | `metavibe catalog tree` | 知识矩阵分类浏览 |
| `metavibe_catalog_inspect` | `metavibe catalog inspect` | 检视单个案例 Skill |

## 🎯 触发与使用场景

这些工具在 DeepSeek Harness 会话中的实际触发方式：代理把用户的请求映射为具体工具调用。所有工具默认使用会话工作目录，除非显式传入 `path`。

### 触发速查表（用户请求 → 工具调用）

| 用户说… | 代理调用 |
| :--- | :--- |
| “帮我初始化一个整洁架构的后端项目” / “scaffold a clean-arch web API” | `metavibe_hub_list` → `metavibe_hub_use` → `metavibe_assemble` |
| “检查这个项目的架构 / 有没有违规” / “check the repo for violations” | `metavibe_check` |
| “给 AI 生成项目规则 / 省点 token” / “generate agent rules” | `metavibe_inject` |
| “从 xx 仓库提炼一下架构范式” / “extract an architecture from …” | `metavibe_extract_prepare` → `metavibe_extract_parse` |
| “CQRS 怎么写？有没有参考案例” / “show me the CQRS reference” | `metavibe_catalog_tree` / `metavibe_catalog_inspect` |

### 场景 1 — 初始化新项目
*触发：用户要求搭建新项目 / 绑定架构。*

1. `metavibe_hub_list` — 代理盘点内置黄金 Spec。
2. `metavibe_hub_use { "name": "clean-arch-web" }` — 写入 `.metavibe/specs/arch_clean-arch-web.json`。
3. `metavibe_assemble` — 生成 `src/slots/slot_repositoryslot.py`、`slot_authadapterslot.py` 等桩。

*产出：* 架构已绑定、插槽桩就绪；此后代理每次改动代码都可运行 `metavibe_check` 守护，确保代码始终在规约内。

### 场景 2 — 存量代码库健康巡检
*触发：用户要求审查项目，或开发中代理主动巡检。*

调用 `metavibe_check { "path": ".", "max_lines": 300 }` 并解读报告：

- `ERROR`（非法跨层 import）— 阻断项，代理必须修复。
- `WARNING`（超过行数上限）— 重构候选。

*产出：* 循环 `metavibe_check` → 修复 → 复查，直到 `passed: true`。

### 场景 3 — 为 AI Agent 注入规则
*触发：用户想为 Cursor / Windsurf / Claude Code 生成规则，或希望会话内更省 Token。*

调用 `metavibe_inject`（返回 markdown），或 `metavibe_inject { "output": ".cursor/rules/metavibe.mdc" }` 落盘。

*产出：* 一份高密度规则（分层规约、插槽、黄金范式、反范式），后续所有 Agent 会话自动遵循。

### 场景 4 — 从仓库提炼元架构
*触发：用户想把某个开源仓库提炼为可复用 Spec。*

1. `metavibe_extract_prepare { "source": "<仓库或文件>", "name": "MyPattern", "preview": true }` — 生成提炼 Prompt。
2. 把 Prompt 交给 Gemini / Claude / GPT — 返回 MetaArchitecture JSON。
3. `metavibe_extract_parse { "response": "<该 JSON>" }` — 校验并保存到 `.metavibe/specs/`。

*产出：* 新 Spec 立即可被 `metavibe_check`、`metavibe_assemble`、`metavibe_inject` 使用。

### 场景 5 — 编码中查知识参考
*触发：编码中代理需要 CQRS / DTO / 鉴权工厂等参考。*

先 `metavibe_catalog_tree` 看总览，再 `metavibe_catalog_inspect { "id": "data_flows/cqrs_flow" }` 深入单条。

*产出：* 数据流图、Schema、黄金示例代码与 Agent 指令，可直接复用进正在写的代码。

## 项目结构

```
MetaVibe/
├── metavibe-dsh/          # DSH 原生插件（TypeScript，唯一实现）
│   ├── src/               # TS 源码（单文件均 < 300 行）
│   │   ├── index.ts       # Cordis 插件入口 (name/inject/Config/apply)
│   │   ├── engine.ts      # 引擎主模块（扫描 / 提炼 / Hub / Catalog + 再导出）
│   │   ├── specs.ts       # Spec 类型与解析校验（lossless JSON）
│   │   ├── fs-utils.ts    # ctx.fs 缝工具（FsSeam 接口 / walkTree）
│   │   ├── guardrail.ts   # 防代码爆炸检查
│   │   ├── rules.ts       # Agent Rules 注入 + Slot 桩装配
│   │   ├── tools/         # 分组工具注册
│   │   ├── data/          # 嵌入的 Hub / Catalog 数据 (.ts)
│   │   └── types/dsh.d.ts # cordis/dsh-tools 运行时契约 ambient 类型
│   ├── tests/             # vitest 测试（36 用例：engine + tools）
│   ├── scripts/           # 动态演示组装脚本
│   ├── tsconfig.json / tsdown.config.ts
│   └── cordis.yml.example # 挂载示例
├── .metavibe/             # 工作区数据（specs / examples / extractors）
├── .cursor/rules/         # 生成的 Agent Rules
├── AGENT.md / ARCHITECTURE.md / DESIGN_PATTERNS.md（中英双语）
```

## 安装与挂载

1. 安装依赖并构建：
   ```bash
   cd metavibe-dsh
   pnpm install
   pnpm test        # 运行测试（vitest）
   pnpm run build   # tsc → lib/types/ + tsdown → lib/index.js
   ```
2. 将包安装进 DSH 部署的 node_modules（任选其一）：
   ```bash
   cd <dsh-deployment>/node_modules && npm link /path/to/MetaVibe/metavibe-dsh
   # 或 npm install /path/to/MetaVibe/metavibe-dsh
   ```
   确保 peer 依赖 `@deepseek-ai/cordis`、`@deepseek-ai/dsh-tools`、`@deepseek-ai/dsh-fs` 已由部署提供。
3. 复制 `cordis.yml.example` 中的行到目标 agent preset 的 `agent.cordis.yml`（`plugins:` 列表）。
4. 重启/重建 DSH，新会话即可使用 `metavibe_*` 工具。

## 开发

```bash
pnpm run typecheck          # tsc --noEmit
pnpm test                   # vitest（engine 单测 + tools 集成冒烟）
pnpm run build              # 两步构建，与官方包同构
node scripts/assemble-dynamic.mjs   # 从编译产物组装会话演示动态 Package
```

`@deepseek-ai/dsh-tools` / `@deepseek-ai/cordis` / `@deepseek-ai/dsh-fs` 为 peerDependencies（宿主运行时提供；registry 版本与运行时 API 不符，故不安装类型包，改用 `src/types/dsh.d.ts` 的 ambient 声明描述所用契约）。
