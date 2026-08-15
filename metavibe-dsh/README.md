# metavibe-dsh 🚀

**MetaVibe 重构为 DeepSeek Harness 原生插件** —— 把 MetaVibe 的 Python CLI 引擎（`src/metavibe/engine/*`）以 DSH 插件契约重写：**TypeScript 源码** + Cordis 插件 + `defineTool` 模型工具 + `ctx.fs` 文件访问缝，构建流程与官方包完全一致（`tsc` → `lib/types/`，`tsdown` → `lib/index.js`）。

代码完全遵循 DeepSeek Harness 原生插件风格（与 `@deepseek-ai/dsh-tool-fs` 同一契约，参考官方源码 `/Users/joffrey/projects/ai/deepseek-harness/packages/fs/tool-fs/src`）：

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

## 🎯 Triggers & Usage Scenarios

How these tools actually get triggered inside a DeepSeek Harness session: the agent maps a user request to a concrete tool call. All tools default to the session working directory unless a `path` is given.

### Trigger cheat-sheet (user request → tool call)

| When the user says… | The agent calls |
| :--- | :--- |
| “帮我初始化一个整洁架构的后端项目” / “scaffold a clean-arch web API” | `metavibe_hub_list` → `metavibe_hub_use` → `metavibe_assemble` |
| “检查这个项目的架构 / 有没有违规” / “check the repo for violations” | `metavibe_check` |
| “给 AI 生成项目规则 / 省点 token” / “generate agent rules” | `metavibe_inject` |
| “从 xx 仓库提炼一下架构范式” / “extract an architecture from …” | `metavibe_extract_prepare` → `metavibe_extract_parse` |
| “CQRS 怎么写？有没有参考案例” / “show me the CQRS reference” | `metavibe_catalog_tree` / `metavibe_catalog_inspect` |

### Scenario 1 — Project bootstrap
*Trigger: the user asks to set up a new project / bind an architecture.*

1. `metavibe_hub_list` — the agent inventories the built-in golden specs.
2. `metavibe_hub_use { "name": "clean-arch-web" }` — writes `.metavibe/specs/arch_clean-arch-web.json`.
3. `metavibe_assemble` — generates `src/slots/slot_repositoryslot.py`, `slot_authadapterslot.py`, … stubs.

*Outcome:* the architecture is bound and slot stubs are ready; from then on the agent can run `metavibe_check` after every change to keep the code inside the guardrails.

### Scenario 2 — Codebase health sweep
*Trigger: the user asks to audit the project, or the agent proactively sweeps during development.*

Call `metavibe_check { "path": ".", "max_lines": 300 }` and read the report:

- `ERROR` (forbidden cross-layer import) — blocks; the agent must fix it.
- `WARNING` (file over the line cap) — refactoring candidate.

*Outcome:* iterate `metavibe_check` → fix → re-check until `passed: true`.

### Scenario 3 — Rule injection for AI agents
*Trigger: the user wants agent rules for Cursor / Windsurf / Claude Code, or wants to save tokens in the session.*

Call `metavibe_inject` (returns markdown) or `metavibe_inject { "output": ".cursor/rules/metavibe.mdc" }` to persist the file.

*Outcome:* a high-density rules document (layer rules, slots, golden patterns, anti-patterns) that every later agent session follows automatically.

### Scenario 4 — Architecture extraction from a repo
*Trigger: the user wants to distill an open-source repo into a reusable spec.*

1. `metavibe_extract_prepare { "source": "<repo-or-file>", "name": "MyPattern", "preview": true }` — builds the Meta-Extractor prompt.
2. Send the prompt to Gemini / Claude / GPT — it returns a MetaArchitecture JSON.
3. `metavibe_extract_parse { "response": "<that JSON>" }` — validates and saves it into `.metavibe/specs/`.

*Outcome:* the new spec is immediately usable by `metavibe_check`, `metavibe_assemble`, and `metavibe_inject`.

### Scenario 5 — Knowledge lookup while coding
*Trigger: the agent needs a reference (CQRS / DTO / auth factory) mid-coding.*

Call `metavibe_catalog_tree` for the overview, then `metavibe_catalog_inspect { "id": "data_flows/cqrs_flow" }` for one entry.

*Outcome:* data-flow diagram, schemas, golden example code, and agent instructions — reusable in the code being written.

📊 **Plugin effect comparison** (real guardrail logs + reproducible before/after examples) → [`docs/effect-comparison.md`](docs/effect-comparison.md) · [`docs/effect-comparison.zh.md`](docs/effect-comparison.zh.md)

## 结构

```
metavibe-dsh/
├── package.json          # ESM 包元数据 (name: metavibe-dsh, main: lib/index.js)
├── tsconfig.json         # 对齐官方 base：es2024 / bundler / .ts 导入改写 .js
├── tsdown.config.ts      # 与官方同构：entry lib/types/index.js → lib/index.js
├── cordis.yml.example    # 挂载示例（复制到 agent preset）
├── scripts/
│   └── assemble-dynamic.mjs  # 从编译产物 1:1 组装会话演示动态 Package
├── src/                  # TypeScript 源码（单文件均 < 300 行）
│   ├── index.ts          # Cordis 插件入口 (name/inject/Config/apply)
│   ├── engine.ts         # 引擎主模块（工作区扫描 / LLM 提炼 / Hub / Catalog + 再导出）
│   ├── specs.ts          # Spec 类型与解析校验（lossless JSON：缺失字段不输出 undefined）
│   ├── fs-utils.ts       # ctx.fs 缝工具（FsSeam 接口 / resolveTarget / walkTree）
│   ├── guardrail.ts      # 防代码爆炸检查（行数上限 + 禁止跨层 import）
│   ├── rules.ts          # Agent Rules 注入 + Slot 桩装配
│   ├── tools/            # 分组工具注册（hub / guardrail / extract / catalog / helpers / index）
│   ├── data/             # 从 src/metavibe/hub 与 src/metavibe/catalog 生成的嵌入数据 (.ts)
│   └── types/dsh.d.ts    # cordis/dsh-tools 运行时契约为本地 ambient 类型
└── lib/                  # 构建产物（tsc → lib/types/，tsdown → lib/index.js）
```

所有模块均遵守 MetaVibe 自身 anti-entropy 规约（单文件 < 300 行）。`engine.ts` + `specs.ts` + `fs-utils.ts` + `guardrail.ts` + `rules.ts` 是**零依赖纯逻辑**（所有 I/O 通过注入的 `FsSeam`），可独立单测；`tools/*` 只做契约接线。

## 构建

```bash
pnpm install       # devDeps: typescript / tsdown / @types/node / schemastery
pnpm run typecheck # tsc --noEmit
pnpm run build     # tsc → lib/types/ + tsdown → lib/index.js
```

`@deepseek-ai/dsh-tools` / `@deepseek-ai/cordis` / `@deepseek-ai/dsh-fs` 为 peerDependencies（宿主运行时提供，registry 版本与运行时 API 不符故不安装类型包，改用 `src/types/dsh.d.ts` 的 ambient 声明描述所用契约）。

## 安装与挂载

1. 将本目录安装进 DSH 部署的 node_modules（任选其一）：
   ```bash
   # 方式 A：链接
   cd <dsh-deployment>/node_modules && npm link /path/to/metavibe-dsh
   # 方式 B：file: 依赖（若部署使用 package.json 管理）
   npm install /path/to/metavibe-dsh
   ```
   确保 peer 依赖 `@deepseek-ai/cordis`、`@deepseek-ai/dsh-tools` 已由部署提供。
2. 复制 `cordis.yml.example` 中的行到目标 agent preset 的 `agent.cordis.yml`（`plugins:` 列表）。
3. 重启/重建 DSH，新会话即可使用 `metavibe_*` 工具。

## 与 Python 版的差异

- **无 YAML 支持**：`scan_workspace` 只识别 `.json`（原 loader 用 PyYAML；数据本身全是 JSON）。
- **`extract prepare` 对目录更实用**：列出文件树（+可选 `preview` 内联前 5 个代码文件头部），而非原版的纯路径占位。
- **`inject` 默认只返回文本**：写盘改为显式 `output` 参数。
- 数据嵌入为 JS 模块，插件自包含、可在任意工作区运行（不依赖 MetaVibe 仓库本体）。

## 开发

```bash
node --check src/engine.js src/tools.js src/index.js
# 引擎独立冒烟测试（零依赖）：
node --input-type=module -e "import('./src/engine.js').then(async (e) => { console.log(e.hubList().map(s => s.name)); })"
```
