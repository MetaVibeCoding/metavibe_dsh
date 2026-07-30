# MetaVibe 🚀

Language: **[English](README.md)** | **[中文](README_zh.md)**

> **AI-Native Meta-Architecture & Anti-Entropy Platform for Vibe Coding**

MetaVibe is an engineering infrastructure specifically designed for the **Vibe Coding** era. It addresses two major pain points in AI-assisted programming: **huge Token waste from repeating boilerplate generation** and **codebase collapse due to the lack of long-term architectural constraints**.

---

## 🌟 Core Philosophy

Traditional Vibe Coding operates on **"Brute-force Generation from 0 to 1"**: AI regenerates massive scaffolding, HTML/CSS layouts, state management, and DB CRUD logic for every single requirement.

**MetaVibe Advocates "Meta-Factory & Meta-Architecture Assembly"**:
1. **Meta-Architecture Extraction Engine**: Leverages mature LLMs' cross-language understanding to analyze top-tier open-source projects and classic engineering theories (e.g., DDD, Clean Architecture, Unix Philosophy), extracting abstract, low-entropy **Meta-Architecture Specs** and hard guardrails into a continuously growing knowledge graph.
2. **Meta-Factory & Meta-Components**: Packages golden engineering paradigms into declarative contracts (Specs). AI Agent only needs to generate minimal **Slot Handlers/Config**, completing full-featured application assembly.
3. **Anti-Entropy Guardrails**: Enforces real-time architectural compliance while AI writes code, preventing the codebase from dissolving into unmaintainable spaghetti.

---

## 💥 Why MetaVibe?

| Dimension | Traditional Vibe Coding | MetaVibe-Powered Coding |
| :--- | :--- | :--- |
| **Token Consumption** | 3000~8000 Tokens required per prompt to generate boilerplate | Only 200~500 Tokens needed for config & handlers (**90%+ Saved**) |
| **Code Entropy** | Exponentially messy as lines grow; collapses after 3000 lines | Guarded by hard architectural rules; high cohesion & low coupling |
| **Engineering Quality** | Lacks error handling, type safety, and test specs (MVP Demo level) | Directly reuses extracted industrial-grade golden architectures (Production-Ready) |
| **Pattern Accumulation** | Starts from scratch every time with zero pattern accumulation | Extracted meta-architectures are reusable, composable, and grow continuously |

---

## 🧩 Core Features & CLI Commands

### 1. 🏛️ `metavibe hub` —— Preset Golden Meta-Architecture Graph
Load preset golden architecture specs from the built-in library with a single command:
```bash
# List all available preset golden meta-architectures
metavibe hub list

# Load clean-arch-web meta-architecture into current project
metavibe hub use clean-arch-web
```

### 2. 🔍 `metavibe extract` —— AI Meta-Architecture Extractor
Analyze any open-source codebase or architectural doc with LLMs to extract low-entropy Specs:
```bash
# Prepare Meta-Prompt for LLM extraction
metavibe extract prepare --source ./some-repo --name MyPattern

# Parse LLM JSON response and save to workspace
metavibe extract parse --file ai_response.json
```

### 3. 💉 `metavibe inject` —— AI Context Injector (90%+ Token Savings)
Compress meta-architectures, library specs, golden patterns, and anti-patterns into high-density Agent Rules for Cursor / Windsurf / Claude Code / Antigravity:
```bash
metavibe inject --output .cursor/rules/metavibe.mdc
```

### 4. ⚙️ `metavibe assemble` —— Meta-Factory & Slot Assembler
Automatically generate strongly-typed slot handler stubs in your workspace:
```bash
metavibe assemble --output src/slots
```

### 5. 🛡️ `metavibe check` —— Anti-Entropy Architecture Guardrails
Real-time detection of file size bloat (>300 lines) and illegal cross-layer imports:
```bash
metavibe check --max-lines 300
```

---

## 🛠️ Project Structure

```
MetaVibe/
├── AGENT.md                 # 🤖 AI Agent Guidelines & Dogfooding Rules (English)
├── AGENT_zh.md              # 🤖 AI Agent 指引 (中文)
├── ARCHITECTURE.md          # 📐 Architecture Spec & Library Dict Specification (English)
├── DESIGN_PATTERNS.md       # 🏛️ Software Design Patterns Matrix (English)
├── .metavibe/               # ⚙️ MetaVibe Engine Configs & Specs
│   ├── config.json
│   └── specs/
├── src/
│   └── metavibe/            # 📦 MetaVibe Engine Core
│       ├── engine/          #    loader, guardrail, injector, extractor, hub, factory
│       ├── hub/             #    Built-in Spec Hub Data
│       └── specs/           #    Pydantic Schema Definitions
├── tests/                   # 🧪 Complete Test Suite (100% Pass)
└── pyproject.toml           # 🐍 Project Dependency Management (uv)
```

---

## 🤝 Contribution & Evolution

MetaVibe itself is built entirely using the **Vibe Coding** paradigm. Contributions to add new golden meta-architectures or library spec dictionaries are welcome!
