# MetaVibe 🚀

Language: **[English](README.md)** | **[中文](README_zh.md)**

> **AI-Native Meta-Architecture & Anti-Entropy Platform for Vibe Coding**
> Now delivered as a **native DeepSeek Harness plugin** (`metavibe-dsh`).

MetaVibe is an engineering infrastructure for the **Vibe Coding** era. It solves two pain points of AI-assisted programming: **huge Token waste from repeated boilerplate generation** and **codebase collapse from missing long-term architectural constraints**. The Python CLI has been retired — the single implementation is a DeepSeek Harness (Cordis) plugin written in TypeScript.

---

## 🌟 Core Philosophy

Traditional Vibe Coding works by **"brute-force generation from 0 to 1"**. MetaVibe advocates **"meta-factory & meta-architecture assembly"**:

1. **Meta-Architecture Extraction Engine** — mature LLMs analyze top open-source projects and classic engineering theories (DDD, Clean Architecture, Unix Philosophy), extracting abstract, low-entropy **Meta-Architecture Specs** into a growing knowledge base.
2. **Meta-Factory & Meta-Components** — golden engineering paradigms are packaged as declarative contracts (Specs). The AI Agent only generates minimal **Slot Handlers/Config** to assemble a complete application.
3. **Anti-Entropy Guardrails** — real-time architectural compliance enforcement while AI writes code, preventing the codebase from dissolving into unmaintainable spaghetti.

---

## 🧩 Model Tools (DeepSeek Harness)

| Tool | Mirrors the retired CLI | Purpose |
| :--- | :--- | :--- |
| `metavibe_hub_list` | `hub list` | List built-in golden meta-architecture specs |
| `metavibe_hub_use` | `hub use` | Bind an architecture into `.metavibe/specs/` |
| `metavibe_check` | `check` | Anti-entropy guardrail (line limits + forbidden imports) |
| `metavibe_inject` | `inject` | Generate high-density Agent Rules markdown |
| `metavibe_assemble` | `assemble` | Generate Slot stubs for the bound architecture |
| `metavibe_extract_prepare` | `extract prepare` | Build the LLM meta-extraction prompt |
| `metavibe_extract_parse` | `extract parse` | Parse the LLM JSON response into a Spec |
| `metavibe_catalog_tree` | `catalog tree` | Browse the knowledge matrix by category |
| `metavibe_catalog_inspect` | `catalog inspect` | Inspect one catalog skill in depth |

---

## 🚀 Quick Use Cases (trigger → tool)

| When the user says… | The agent calls |
| :--- | :--- |
| “scaffold a clean-arch web API” | `hub_list` → `hub_use` → `assemble` |
| “check the repo for violations” | `check` |
| “generate agent rules” | `inject` |
| “extract an architecture from …” | `extract_prepare` → LLM → `extract_parse` |
| “show me the CQRS reference” | `catalog_tree` / `catalog_inspect` |

See [`metavibe-dsh/README.md`](metavibe-dsh/README.md) → *Triggers & Usage Scenarios* for the five full scenarios with parameters and outcomes.

## 📁 Project Structure

```
MetaVibe/
├── metavibe-dsh/          # The plugin (TypeScript, single implementation)
│   ├── src/               # TS sources (every file < 300 lines)
│   ├── tests/             # vitest suite (engine + tools, 36 cases)
│   ├── scripts/           # dynamic-demo assembly script
│   ├── tsconfig.json / tsdown.config.ts
│   └── cordis.yml.example # how to mount the plugin into a preset
├── .metavibe/             # workspace data (specs / examples / extractors)
├── .cursor/rules/         # generated Agent Rules
├── AGENT.md / ARCHITECTURE.md / DESIGN_PATTERNS.md   # docs (EN/ZH)
```

See [`metavibe-dsh/README.md`](metavibe-dsh/README.md) for the full plugin guide (build, mount, development).

---

## 🤝 Contribution & Evolution

MetaVibe is built with the **Vibe Coding** paradigm itself — and now dogfoods its own guardrails (`metavibe_check` scans this repo with zero violations). Contributions of new golden meta-architectures or library spec dictionaries are welcome.
