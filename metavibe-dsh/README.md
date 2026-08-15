# metavibe-dsh 🚀

Language: **[English](README.md)** | **[中文](README_zh.md)**

**MetaVibe rebuilt as a native DeepSeek Harness plugin.** The original Python CLI engine (`src/metavibe/engine/*`) is retired; this package is the single implementation: **TypeScript sources** + Cordis plugin + `defineTool` model tools + the `ctx.fs` filesystem seam, built with the exact pipeline the official packages use (`tsc` → `lib/types/`, `tsdown` → `lib/index.js`).

The code follows the native DeepSeek Harness plugin contract (same as `@deepseek-ai/dsh-tool-fs`; reference source: `deepseek-harness/packages/fs/tool-fs/src`):

- ESM module with named `name` / `inject` / `Config` / `apply` exports (also provided as the default export for loader normalization);
- Config declared with `@deepseek-ai/schemastery` `z.object`; `tsconfig` mirrors the official base (es2024 / bundler resolution / `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`);
- Tools registered on `ctx.tools` with `defineTool`; output schemas follow the value schema DSL;
- Every byte of file I/O flows through the abstract `ctx.fs` seam (`resolve` / `readText` / `writeText` / `listDir` / `stat`) — never `node:fs` or globals;
- Publishes no service, so it mounts flat into an agent preset — no `isolate` realm needed.

## 🛠️ Tools (9 model tools)

| Tool | Retired CLI equivalent | Purpose |
| :--- | :--- | :--- |
| `metavibe_hub_list` | `metavibe hub list` | List the built-in golden meta-architecture specs |
| `metavibe_hub_use` | `metavibe hub use` | Bind an architecture into `.metavibe/specs/` |
| `metavibe_check` | `metavibe check` | Anti-entropy guardrail (line limits + forbidden imports) |
| `metavibe_inject` | `metavibe inject` | Generate high-density Agent Rules markdown (optional write) |
| `metavibe_assemble` | `metavibe assemble` | Generate Slot stubs for bound architectures |
| `metavibe_extract_prepare` | `metavibe extract prepare` | Build the LLM meta-extraction prompt |
| `metavibe_extract_parse` | `metavibe extract parse` | Parse the LLM JSON response into a Spec |
| `metavibe_catalog_tree` | `metavibe catalog tree` | Browse the knowledge matrix by category |
| `metavibe_catalog_inspect` | `metavibe catalog inspect` | Inspect one catalog skill in depth |

## 🎯 Triggers & Usage Scenarios

How these tools actually get triggered inside a DeepSeek Harness session: the agent maps a user request to a concrete tool call. All tools default to the session working directory unless a `path` is given.

### Trigger cheat-sheet (user request → tool call)

| When the user says… | The agent calls |
| :--- | :--- |
| “scaffold a clean-arch web API” / “set up a new backend project” | `metavibe_hub_list` → `metavibe_hub_use` → `metavibe_assemble` |
| “check the repo for violations” / “audit the architecture” | `metavibe_check` |
| “generate agent rules” / “save tokens in this session” | `metavibe_inject` |
| “extract an architecture from …” / “distill this repo into a spec” | `metavibe_extract_prepare` → `metavibe_extract_parse` |
| “show me the CQRS reference” / “how do I structure a DTO?” | `metavibe_catalog_tree` / `metavibe_catalog_inspect` |

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

## 📁 Structure

```
metavibe-dsh/
├── package.json          # ESM package metadata (name: metavibe-dsh, main: lib/index.js)
├── tsconfig.json         # mirrors official base: es2024 / bundler / .ts imports → .js on emit
├── tsdown.config.ts      # same shape as official: entry lib/types/index.js → lib/index.js
├── cordis.yml.example    # mounting example (copy into an agent preset)
├── scripts/
│   ├── assemble-dynamic.mjs  # assemble the session demo Package 1:1 from compiled output
│   └── gen-data.mjs          # regenerate src/data/hub.ts from skeletons/*.json
├── skeletons/            # golden meta-architecture sources (.json spec + .md design doc)
├── src/                  # TypeScript sources (every file < 300 lines)
│   ├── index.ts          # Cordis plugin entry (name/inject/Config/apply)
│   ├── engine.ts         # engine core (workspace scan / extraction / Hub / Catalog + re-exports)
│   ├── specs.ts          # Spec types & parsing (lossless JSON: absent fields omitted)
│   ├── fs-utils.ts       # ctx.fs seam helpers (FsSeam interface / resolveTarget / walkTree)
│   ├── guardrail.ts      # anti-entropy checks (line caps + forbidden imports)
│   ├── rules.ts          # Agent Rules injection + slot stub assembly
│   ├── tools/            # grouped tool registration (hub / guardrail / extract / catalog / helpers / index)
│   ├── data/             # embedded Hub / Catalog data (.ts)
│   └── types/dsh.d.ts    # ambient types for the cordis / dsh-tools runtime contract
├── tests/                # vitest suite (engine + tools, 36 cases)
├── examples/             # reproducible before/after effect-comparison projects
├── docs/                 # effect-comparison documentation (EN/ZH)
└── lib/                  # build output (tsc → lib/types/, tsdown → lib/index.js)
```

All modules honor MetaVibe's own anti-entropy rules (single files < 300 lines). `engine.ts` + `specs.ts` + `fs-utils.ts` + `guardrail.ts` + `rules.ts` are **dependency-free pure logic** (all I/O through the injected `FsSeam`) and unit-testable standalone; `tools/*` only wires the contract.

## 🔨 Build

```bash
pnpm install       # devDeps: typescript / tsdown / @types/node / schemastery
pnpm test          # vitest
pnpm run typecheck # tsc --noEmit
pnpm run build     # tsc → lib/types/ + tsdown → lib/index.js
```

`@deepseek-ai/dsh-tools` / `@deepseek-ai/cordis` / `@deepseek-ai/dsh-fs` are peerDependencies supplied by the host deployment. The npm-registry versions of these packages are older than the runtime API, so they are NOT installed for type checking; `src/types/dsh.d.ts` declares the exact contract the plugin consumes.

## 📦 Install & Mount

1. Install the package into the DSH deployment's node_modules (either):
   ```bash
   # Option A: link
   cd <dsh-deployment>/node_modules && npm link /path/to/metavibe-dsh
   # Option B: file: dependency (if the deployment manages a package.json)
   npm install /path/to/metavibe-dsh
   ```
   Ensure the peer deps `@deepseek-ai/cordis`, `@deepseek-ai/dsh-tools` are provided by the deployment.
2. Copy the row from `cordis.yml.example` into the target agent preset's `agent.cordis.yml` (`plugins:` list).
3. Restart / rebuild DSH; the `metavibe_*` tools are available in new sessions.

> 🚀 **Publishing to the DSH plugin ecosystem** (npm publish → `dsh plugin add metavibe-dsh` → mount) → see [`PUBLISHING.md`](PUBLISHING.md).

## ↔️ Differences from the retired Python version

- **No YAML support**: `scan_workspace` only recognizes `.json` (the old loader used PyYAML; all data is JSON anyway).
- **`extract prepare` is more useful for directories**: lists the file tree (optionally inlines the head of up to 5 code files via `preview`) instead of the old path placeholder.
- **`inject` returns text by default**: writing to disk is now an explicit `output` argument.
- Data is embedded as modules, so the plugin is self-contained and runs in any workspace (no dependency on the MetaVibe repo itself).
