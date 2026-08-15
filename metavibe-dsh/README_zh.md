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
