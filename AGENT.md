# AGENT.md - AI Agent Collaboration & Dogfooding Rules

Language: **[English](AGENT.md)** | **[中文](AGENT_zh.md)**

> Mandatory Collaboration Rules for All AI Agents (Cursor, Windsurf, Claude Code, Antigravity) Contributing to MetaVibe.

---

## 🎯 Core Directives

1. **Vibe-Native First**: Every feature, structure, or tool design must prioritize AI Agent productivity and Token efficiency.
2. **Minimal Token Principle**: Avoid outputting meaningless boilerplate code. Prefer declarative configs, specs, or centralized factories over redundant code generation.
3. **Anti-Entropy Rules**:
   - **Single File Limit**: Keep core logic files strictly under 300 lines. Warn and refactor into sub-modules if exceeded.
   - **Single Responsibility**: Schema definitions, engine logic, and Meta-Prompt templates must be physically isolated.
   - **Strong Typing**: All Python/TypeScript modules must provide strict type declarations (Pydantic / Interfaces).

---

## ⚙️ Environment & Commands

- **Package & Build Management**: MetaVibe is a DeepSeek Harness plugin managed with `pnpm` and built with `tsc` + `tsdown` (inside `metavibe-dsh/`).
  - Install: `pnpm install`
  - Test: `pnpm test` (vitest)
  - Typecheck: `pnpm run typecheck`
  - Build: `pnpm run build`
- **Anti-Entropy Self-Check**: run `metavibe_check` on this workspace; it must report zero violations (build artifacts under `lib/`/`dist/` are ignored).
