# 将 metavibe-dsh 上架到 DSH 插件生态

DeepSeek Harness **没有独立的插件市场网站**。插件生态**就是 npm registry**：插件以 npm 包形式发布，部署方用 `dsh plugin add <package>` 安装（该命令在 profile 目录内转发给 `pnpm`），再在 agent preset 的 `agent.cordis.yml` 中挂载一行。因此 **发布到 npm 就是完整的"上架"**。

English version: [PUBLISHING.md](PUBLISHING.md)

---

## 0. 前置条件

- npm 账号：`npm login`（或 `pnpm login`）。
- 包可正常构建：`pnpm run build`（产出 `lib/`）。
- 测试通过：`pnpm test`。
- 包名在 npm 未被占用（`metavibe-dsh` 已确认可用）。

## 1. 发布到 npm

```bash
cd metavibe-dsh
pnpm run build                 # tsc → lib/types/ + tsdown → lib/index.js
pnpm test                      # 冒烟
npm publish                    # 或 pnpm publish
```

`publishConfig.access: public` 已配置；`files` 同时发布 `lib/`（构建产物）与 `src/`（TS 源码）——使用者既能拿到打包产物也能看到源码。

### 版本管理

遵循语义化版本，发布前先升版：

```bash
npm version patch   # 0.2.0 → 0.2.1
npm publish
git push metavibe_dsh main --tags
```

## 2. 安装到任意 DSH 部署

```bash
dsh plugin --profile tui add metavibe-dsh   # tui profile
# 或 web profile：
dsh plugin --profile web add metavibe-dsh
```

该命令会在 profile 目录内执行 `pnpm add metavibe-dsh`，包像其他插件一样进入部署的 node_modules。

> **最简路径**：直接运行捆绑的安装脚本，它一次完成本步 + 挂载（第 3 步）：
>
> ```bash
> bash scripts/install.sh
> ```

> 宿主部署需提供 peer 依赖 `@deepseek-ai/cordis`、`@deepseek-ai/dsh-tools`——标准 DSH 部署均已自带。

## 3. 作为显式 profile 层插件安装

`metavibe-dsh` 自带 `dsh.bundle` 声明（package.json 指向包内 bundle `cordis.patch.yml`），因此 `dsh plugin add metavibe-dsh`——或捆绑脚本 `bash scripts/install.sh`——安装包并**自动把它追加进 profile 的 `dsh.profile.bundles` 层列表**。插件随 profile 加载，3 个工具在**每个会话**都可用，无需手工编辑 patch、无需选 preset。

（若想按会话隔离，把 [`cordis.yml.example`](cordis.yml.example) 中的行复制进某个 agent preset 的 `agent.cordis.yml` 即可。）

`metavibe-dsh` 不发布服务，可平铺挂载，无需 `isolate` realm。重启/重建 DSH 后，会话即可使用 3 个 `metavibe_*` 工具。

## 4. 验证

在新会话中让代理：

- "列出内置黄金元架构" → 调用 `metavibe_hub_list`
- "CQRS / DTO 怎么组织？" → 调用 `metavibe_catalog_tree` / `metavibe_catalog_inspect`

或在插件清单 UI / 动态检视中直接查看工具注册表。

## 5. 更进一步：进入官方生态

若希望 `metavibe-dsh` 成为官方一级包 `@deepseek-ai/dsh-metavibe`（与 `dsh-tool-fs`、`dsh-tool-todo` 并列、走官方发布管线）：

1. 将包加入 [`deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness) monorepo 的 `packages/`（本仓库 `src/` 已对齐官方 tsconfig/tsdown 约定，迁移主要是搬文件）。
2. 改名为 `@deepseek-ai/dsh-metavibe`，peer 依赖改用 `workspace:`。
3. 提 PR，由维护者走官方 `release:publish` 流程（`scripts/release/publish.ts`）。

在此之前，把独立的 `metavibe-dsh` 发布到 npm 就是完整且受支持的路径——任何 DSH 部署都能安装并挂载。
