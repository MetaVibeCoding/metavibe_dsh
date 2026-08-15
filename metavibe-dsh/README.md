# metavibe-dsh 🚀

Language: **[English](README.md)** | **[中文](README_zh.md)**

**MetaVibe as a native DeepSeek Harness plugin — a read-only architecture advisor for Vibe Coding.** The original Python CLI engine is retired; this package is the single implementation: **TypeScript sources** + Cordis plugin + `defineTool` model tools, built with the exact pipeline the official packages use (`tsc` → `lib/types/`, `tsdown` → `lib/index.js`).

## 🧭 What it is (and what it is not)

MetaVibe **advises** — it never reaches into the project being worked on.

- ✅ **Architecture map** (`metavibe_hub_list`): the built-in golden meta-architectures (layers / slots / guardrails) to pick a top-level design direction.
- ✅ **Best-practices catalog** (`metavibe_catalog_tree` / `metavibe_catalog_inspect`): the knowledge matrix (data flows, data models, philosophies, meta-skills) with golden examples and agent instructions.
- ❌ No workspace scanning, no file writes, no spec binding, no code generation, no guardrail enforcement inside the target project.

Because every tool is pure and read-only, the plugin needs no `fs` service, cannot stall the agent loop with workspace sweeps, and never interferes with the project it is advising.

## 🛠️ Tools (3 model tools)

| Tool | Purpose |
| :--- | :--- |
| `metavibe_hub_list` | List the golden architecture map: name, source, version, description, layers and slots per preset |
| `metavibe_catalog_tree` | Browse the knowledge matrix by category (data flows / data models / philosophies / meta-skills) |
| `metavibe_catalog_inspect` | Inspect one catalog entry in depth: summary, data-flow diagram, schemas, golden examples, agent instructions |

## 🎯 Triggers & Usage Scenarios

How these tools get triggered inside a DeepSeek Harness session: the agent maps a user request to a concrete tool call. All tools are read-only and never touch the workspace.

| When the user says… | The agent calls |
| :--- | :--- |
| “What architecture should I use for a clean-arch web API?” / “帮我选个后端架构” | `metavibe_hub_list` |
| “How do I structure CQRS / DTOs / an auth factory?” | `metavibe_catalog_tree` → `metavibe_catalog_inspect` |
| “Give me the golden patterns for payments / Next.js / FastAPI” | `metavibe_hub_list` (pick the preset) → `metavibe_catalog_inspect` (best practice details) |

### Scenario — choose a top-level architecture direction
1. `metavibe_hub_list` — the agent inventories the golden architecture map.
2. The agent (and the user) pick the preset that fits the project, and the agent proposes the layer/one-way-dependency plan from the spec.
3. The agent drafts the project structure following the spec — the plugin only guides, it never writes files.

### Scenario — look up a best practice while coding
1. `metavibe_catalog_tree` — overview of the knowledge matrix.
2. `metavibe_catalog_inspect { "id": "data_flows/cqrs_flow" }` — data-flow diagram, schemas, golden example code, agent instructions.
3. The agent applies the pattern in the code it is writing.

## 📁 Structure

```
metavibe-dsh/
├── package.json          # ESM package metadata (name: metavibe-dsh, main: lib/index.js)
├── tsconfig.json         # mirrors official base: es2024 / bundler / .ts imports → .js on emit
├── tsdown.config.ts      # same shape as official: entry lib/types/index.js → lib/index.js
├── cordis.yml.example    # mounting example (copy into an agent preset)
├── scripts/
│   ├── install.sh            # one-command installer (explicit dsh.bundle profile-layer plugin)
│   ├── assemble-dynamic.mjs  # assemble the session demo Package 1:1 from compiled output
│   └── gen-data.mjs          # regenerate src/data/hub.ts from skeletons/*.json
├── skeletons/            # golden meta-architecture sources (.json spec + .md design doc)
├── src/                  # TypeScript sources (every file < 300 lines)
│   ├── index.ts          # Cordis plugin entry (name/inject/Config/apply)
│   ├── engine.ts         # read-only engine (Hub map + Catalog matrix)
│   ├── specs.ts          # Spec types & parsing (lossless JSON: absent fields omitted)
│   ├── tools/            # grouped tool registration (hub / catalog / helpers / index)
│   ├── data/             # embedded Hub / Catalog data (.ts)
│   └── types/dsh.d.ts    # ambient types for the cordis / dsh-tools runtime contract
├── tests/                # vitest suite (engine + tools, 13 cases)
├── examples/             # historical before/after effect-comparison projects (pre-0.3)
├── docs/                 # effect-comparison documentation (historical, pre-0.3)
└── lib/                  # build output (tsc → lib/types/, tsdown → lib/index.js)
```

All modules honor MetaVibe's own anti-entropy rules (single files < 300 lines). `engine.ts` + `specs.ts` are **dependency-free pure logic** (no I/O at all) and unit-testable standalone; `tools/*` only wires the contract.

## 🔨 Build

```bash
pnpm install       # devDeps: typescript / tsdown / @types/node / schemastery
pnpm test          # vitest
pnpm run typecheck # tsc --noEmit
pnpm run build     # tsc → lib/types/ + tsdown → lib/index.js
```

`@deepseek-ai/dsh-tools` / `@deepseek-ai/cordis` are peerDependencies supplied by the host deployment. The npm-registry versions of these packages are older than the runtime API, so they are NOT installed for type checking; `src/types/dsh.d.ts` declares the exact contract the plugin consumes.

## 📦 Install & Mount

**Recommended — explicit profile-layer plugin.** The package declares `dsh.bundle` (see `package.json`), so installing it with the one-command installer makes it a first-class plugin of the profile: `dsh plugin add` installs the package **and** automatically appends it to the profile's `dsh.profile.bundles` layer list. The plugin loads with the profile and the tools are available in **every session** — no manual patch editing, no agent preset to pick:

```bash
cd metavibe-dsh
bash scripts/install.sh                # web profile (default)
bash scripts/install.sh --profile tui  # a different profile
```

After installing, **restart `dsh web`**; `metavibe_hub_list` / `metavibe_catalog_tree` / `metavibe_catalog_inspect` appear in all sessions.

**Per-session alternative (agent preset):** if you only want the tools in one preset, copy the row from [`cordis.yml.example`](cordis.yml.example) into that preset's `agent.cordis.yml` instead. No config needed.

> 🚀 **Publishing to the DSH plugin ecosystem** (npm publish → `dsh plugin add metavibe-dsh` → mount) → see [`PUBLISHING.md`](PUBLISHING.md).

## ↔️ History

- **0.3.0** — scoped to a read-only architecture advisor: `metavibe_check` / `metavibe_hub_use` / `metavibe_assemble` / `metavibe_inject` / `metavibe_extract_*` were removed (they scanned, wrote to, or generated code in the target workspace). The plugin now consumes only the `tools` registry — no `fs` service, no config, no sandbox writes.
- **≤ 0.2.x** — the anti-entropy suite (guardrail check, spec binding, rule injection, slot assembly, extraction). See `docs/effect-comparison.md` for the historical before/after record.
