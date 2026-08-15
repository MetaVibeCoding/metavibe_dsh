# Publishing metavibe-dsh to the DSH plugin ecosystem

DeepSeek Harness has **no separate plugin marketplace website**. The plugin
ecosystem **is the npm registry**: plugins are npm packages installed into a
DSH profile with `dsh plugin add <package>` (which forwards to `pnpm` inside
the profile directory), then mounted as a row in an agent preset's
`agent.cordis.yml`. Publishing to npm is therefore the entire "storefront".

Chinese version: [PUBLISHING.zh.md](PUBLISHING.zh.md)

---

## 0. Prerequisites

- An npm account: `npm login` (or `pnpm login`).
- The package must build cleanly: `pnpm run build` (produces `lib/`).
- Tests pass: `pnpm test`.
- The name is free on npm (verified for `metavibe-dsh`).

## 1. Publish the package

```bash
cd metavibe-dsh
pnpm run build                 # tsc → lib/types/ + tsdown → lib/index.js
pnpm test                      # sanity
npm publish                    # or: pnpm publish
```

`publishConfig.access: public` is already set (unscoped packages are public by
default anyway). The `files` field ships `lib/` (build output) and `src/`
(TS sources) — consumers get the bundle **and** the source.

### Versioning

Follow semantic versioning and bump before publishing:

```bash
npm version patch   # 0.2.0 → 0.2.1
npm publish
git push metavibe_dsh main --tags
```

## 2. Install into any DSH deployment

```bash
dsh plugin --profile tui add metavibe-dsh   # tui profile
# or, for the web profile:
dsh plugin --profile web add metavibe-dsh
```

This forwards to `pnpm add metavibe-dsh` inside the profile directory, so the
package lands in the deployment's node_modules exactly like any other plugin.

> **Easiest path:** run the bundled installer, which does this step AND mounts
> the tools into a preset (step 3) in one command:
>
> ```bash
> bash scripts/install.sh
> ```

> The host deployment must provide the peer dependencies
> `@deepseek-ai/cordis`, `@deepseek-ai/dsh-tools`.
> A standard DSH deployment already ships them.

## 3. Load it as a profile-level plugin (recommended)

The bundled installer (`bash scripts/install.sh`) inserts the metavibe row into
the profile's `cordis.patch.yml` via an `- insert:` entry, so the plugin loads
with the profile and the three tools are available in EVERY session — no agent
preset to pick:

```yaml
# <profile>/cordis.patch.yml
- insert:
    - id: tool-metavibe
      name: metavibe-dsh
```

(If you prefer per-session scoping, copy the same row into one agent preset's
`agent.cordis.yml` instead — see [`cordis.yml.example`](cordis.yml.example).)

`metavibe-dsh` publishes no service, so it mounts flat — no `isolate` realm
needed. Restart / rebuild DSH; sessions expose the three `metavibe_*` tools.

## 4. Verify

In a new session, ask the agent:

- "list the built-in meta-architectures" → it calls `metavibe_hub_list`
- "how do I structure CQRS / DTOs?" → it calls `metavibe_catalog_tree` / `metavibe_catalog_inspect`

or check the tool registry directly (dynamic-inspect / plugin inventory UI).

## 5. Going further: the official ecosystem

If you want `metavibe-dsh` to become a first-party
`@deepseek-ai/dsh-metavibe` package (listed alongside `dsh-tool-fs`,
`dsh-tool-todo`, … and released through the official pipeline):

1. Add the package to the [`deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)
   monorepo under `packages/` (this repo's `src/` already follows the official
   tsconfig/tsdown conventions, so the move is mostly relocating files).
2. Rename to `@deepseek-ai/dsh-metavibe` and use `workspace:` peer deps.
3. Open a PR; the maintainers run the official `release:publish` flow
   (`scripts/release/publish.ts`).

Until then, publishing the standalone `metavibe-dsh` package to npm is the
complete, supported path — any DSH deployment can install and mount it.
