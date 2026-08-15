```text
███╗   ███╗███████╗████████╗ █████╗ ██╗   ██╗██╗██████╗ ███████╗
████╗ ████║██╔════╝╚══██╔══╝██╔══██╗██║   ██║██║██╔══██╗██╔════╝
██╔████╔██║█████╗     ██║   ███████║██║   ██║██║██████╔╝█████╗  
██║╚██╔╝██║██╔══╝     ██║   ██╔══██║╚██╗ ██╔╝██║██╔══██╗██╔══╝  
██║ ╚═╝ ██║███████╗   ██║   ██║  ██║ ╚████╔╝ ██║██████╔╝███████╗
╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝  ╚═══╝  ╚═╝╚═════╝ ╚══════╝
                                                                
```

# 🏛️ MAKE AI BUILD MASTERPIECES.

> **Every line the AI writes, architected on the shoulders of software giants.**

---
# MetaVibe 🚀

Language: **[English](README.md)** | **[中文](README_zh.md)**

> **AI-Native Architecture Map & Best-Practices Advisor for Vibe Coding**
> Now delivered as a **native DeepSeek Harness plugin** (`metavibe-dsh`).

MetaVibe is a **read-only architecture advisor** for the Vibe Coding era. It exists to answer one question well: *"which top-level design direction and which golden engineering practices fit this project?"* — as a global map of proven architectures and a best-practices knowledge matrix, injected into the agent's context with minimal tokens. It **proposes**; it never reaches into the project being worked on.

---

## 🧭 What it is (and what it is not)

| MetaVibe does… | MetaVibe never does… |
| :--- | :--- |
| Propose top-level design directions from a golden architecture map | Scan the target workspace file-by-file |
| Provide golden patterns / anti-patterns from a best-practices catalog | Write spec files, rules files, or code into the target project |
| Distill classic engineering theory (DDD, Clean Architecture, Unix) into low-entropy specs | Enforce guardrails by blocking the agent's normal working loop |
| Keep the knowledge base growing as reusable meta-architecture | Bind or "install" anything into another project |

## 🧩 Model Tools (DeepSeek Harness)

| Tool | Purpose |
| :--- | :--- |
| `metavibe_hub_list` | List the golden architecture map (layers / slots / guardrails per preset) |
| `metavibe_catalog_tree` | Browse the knowledge matrix by category |
| `metavibe_catalog_inspect` | Inspect one catalog entry in depth (diagram / schemas / golden examples / instructions) |

> The pre-0.3 guardrail suite (`metavibe_check`, `metavibe_hub_use`, `metavibe_assemble`, `metavibe_inject`, `metavibe_extract_*`) was removed: those tools scanned, wrote to, or generated code in the target workspace, which is outside the advisor role.

## 🚀 Quick Use Cases (trigger → tool)

| When the user says… | The agent calls |
| :--- | :--- |
| “What architecture should I use for a clean-arch web API?” | `metavibe_hub_list` |
| “How do I structure CQRS / DTOs / an auth factory?” | `metavibe_catalog_tree` → `metavibe_catalog_inspect` |
| “Give me the golden patterns for payments / Next.js / FastAPI” | `metavibe_hub_list` → `metavibe_catalog_inspect` |

See [`metavibe-dsh/README.md`](metavibe-dsh/README.md) → *Triggers & Usage Scenarios* for the full scenarios.

## 📁 Project Structure

```
MetaVibe/
├── metavibe-dsh/          # The plugin (TypeScript, single implementation)
│   ├── src/               # TS sources (every file < 300 lines, read-only engine)
│   ├── tests/             # vitest suite (engine + tools, 13 cases)
│   ├── scripts/           # dynamic-demo assembly + data generation scripts
│   ├── tsconfig.json / tsdown.config.ts
│   └── cordis.yml.example # how to mount the plugin into a preset
├── .metavibe/             # spec data (architecture / library / extractor templates)
├── skeletons/             # golden meta-architecture sources
├── AGENT.md / ARCHITECTURE.md / DESIGN_PATTERNS.md   # docs (EN/ZH)
```

## 🤝 Contribution & Evolution

MetaVibe is built with the **Vibe Coding** paradigm itself — and stays scoped: the plugin only **maps and advises**, so it can assist any project without entangling itself in that project's code. Contributions of new golden meta-architectures or best-practice catalog entries are welcome.
