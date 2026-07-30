"""AI Agent Context Injector & Token Optimizer Module."""

from pathlib import Path
from typing import List, Optional

from metavibe.engine.loader import SpecLoader
from metavibe.specs.meta_arch import MetaArchitecture
from metavibe.specs.library_dict import LibraryDictionary


class AIContextInjector:
    """AI 上下文注射器：生成极简低熵 Prompt/Rules，实现 90%+ Token 节省."""

    def __init__(self, workspace_root: Path):
        self.workspace_root = Path(workspace_root)

    def generate_rules_markdown(
        self,
        architectures: Optional[List[MetaArchitecture]] = None,
        library_dicts: Optional[List[LibraryDictionary]] = None
    ) -> str:
        """根据元架构与工程字典生成超高密度的 Agent Markdown 规则."""
        if architectures is None or library_dicts is None:
            scanned = SpecLoader.scan_workspace(self.workspace_root)
            architectures = architectures or scanned.get("architectures", [])
            library_dicts = library_dicts or scanned.get("library_dicts", [])

        lines: List[str] = [
          "<!-- METAVIBE AGENT RULES - AUTO GENERATED (DO NOT EDIT MANUALLY) -->",
          "# MetaVibe Agent Guidance & Anti-Entropy Guardrails\n",
          "> 本规则由 MetaVibe 自动注入。AI Agent 在生成与修改代码时必须遵守以下范式。\n"
        ]

        # 1. 注入元架构分层与插槽
        if architectures:
            lines.append("## 📐 绑定的元架构规则 (Meta-Architectures)")
            for arch in architectures:
                lines.append(f"### 元架构: {arch.name} ({arch.version})")
                lines.append(f"_{arch.description}_\n")

                if arch.layers:
                    lines.append("**架构分层硬规约:**")
                    for layer in arch.layers:
                        lines.append(f"- **{layer.name}**: {', '.join(layer.rules)}")
                    lines.append("")

                if arch.slots:
                    lines.append("**可用扩展插槽 (Slots):**")
                    for slot in arch.slots:
                        lines.append(f"- `[{slot.name}]`: {slot.description}")
                    lines.append("")

                if arch.guardrails.forbidden_imports:
                    lines.append("**禁止的跨层依赖 (Forbidden Imports):**")
                    for fi in arch.guardrails.forbidden_imports:
                        lines.append(f"- 禁止 `[{fi.from_layer}]` 导入 `[{fi.forbidden_import}]`")
                    lines.append("")

        # 2. 注入工程库字典 (Golden & Anti-Patterns)
        if library_dicts:
            lines.append("## 📦 工程库黄金范式与反范式 (Library Specs)")
            for lib in library_dicts:
                lines.append(f"### 库: {lib.library_name} ({lib.version}) [{lib.category}]")
                lines.append(f"_{lib.ai_context.summary}_\n")

                if lib.ai_context.golden_patterns:
                    lines.append("**黄金代码范式 (Golden Patterns):**")
                    for gp in lib.ai_context.golden_patterns:
                        lines.append(f"```title=\"{gp.title}\"")
                        lines.append(gp.code_snippet)
                        lines.append("```\n")

                if lib.ai_context.anti_patterns:
                    lines.append("**警惕反范式 (Anti-Patterns - DO NOT USE):**")
                    for ap in lib.ai_context.anti_patterns:
                        lines.append(f"- ⚠️ **{ap.warning}**: {ap.reason}")
                    lines.append("")

                if lib.architectural_guardrails:
                    g = lib.architectural_guardrails
                    if g.allowed_layers:
                        lines.append(f"- **允许使用层级**: `{', '.join(g.allowed_layers)}`")
                    if g.forbidden_layers:
                        lines.append(f"- **禁止使用层级**: `{', '.join(g.forbidden_layers)}`")
                    lines.append("")

        return "\n".join(lines)

    def inject_to_file(self, output_file: Path) -> Path:
        """直接将生成的规则写入目标规则文件（如 .cursor/rules/metavibe.mdc）."""
        content = self.generate_rules_markdown()
        out_path = Path(output_file)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(content, encoding="utf-8")
        return out_path
