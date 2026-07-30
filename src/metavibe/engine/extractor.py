"""AI-Driven Meta-Architecture & Library Extractor Engine Module."""

import json
from pathlib import Path
from typing import Dict, Optional, Union

from metavibe.engine.loader import SpecLoader
from metavibe.specs.meta_arch import MetaArchitecture
from metavibe.specs.library_dict import LibraryDictionary


class ExtractorEngine:
    """元架构与工程库描述字典 AI 提炼引擎."""

    TEMPLATE_PATH = Path(".metavibe/extractors/prompt_template.md")

    def __init__(self, template_path: Optional[Path] = None):
        self.template_path = Path(template_path) if template_path else self.TEMPLATE_PATH

    def load_prompt_template(self) -> str:
        """读取 Meta-Extractor Prompt 模版."""
        if self.template_path.exists():
            return self.template_path.read_text(encoding="utf-8")
        return """# Meta-Architecture Extractor Prompt
请分析给定的代码片段或仓库文件结构，将其核心架构范式提取为标准的 MetaVibe MetaArchitecture JSON 表达。"""

    def prepare_extraction_prompt(self, source_code_or_tree: str, target_name: str) -> str:
        """组装供成熟 AI Model 使用的提炼提示词."""
        base_template = self.load_prompt_template()
        full_prompt = f"{base_template}\n\n"
        full_prompt += f"--- 待分析的目标代码/结构 ({target_name}) ---\n"
        full_prompt += source_code_or_tree
        full_prompt += "\n\n请直接返回合法的 MetaArchitecture JSON 对象。"
        return full_prompt

    def parse_ai_response_to_spec(self, ai_response_text: str) -> Union[MetaArchitecture, LibraryDictionary]:
        """将 AI Model 返回的响应文本提取并解析为对应 Spec."""
        # 从可能包含 Markdown 代码块的文本中清理提取 JSON
        cleaned = ai_response_text.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

        data = json.loads(cleaned)

        if "layers" in data and "slots" in data:
            return SpecLoader.load_meta_architecture(data)
        elif "library_name" in data and "ai_context" in data:
            return SpecLoader.load_library_dictionary(data)
        else:
            raise ValueError("返回的 JSON 不符合 MetaArchitecture 或 LibraryDictionary 校验定义。")

    def save_spec_to_workspace(
        self,
        spec: Union[MetaArchitecture, LibraryDictionary],
        workspace_root: Path
    ) -> Path:
        """保存解析出的 Spec 到工作区的 .metavibe/specs/ 目录中."""
        metavibe_dir = Path(workspace_root) / ".metavibe" / "specs"
        metavibe_dir.mkdir(parents=True, exist_ok=True)

        if isinstance(spec, MetaArchitecture):
            filename = f"arch_{spec.name.lower()}.json"
            content = spec.model_dump_json(indent=2)
        else:
            filename = f"lib_{spec.library_name.lower()}.json"
            content = spec.model_dump_json(indent=2)

        file_path = metavibe_dir / filename
        file_path.write_text(content, encoding="utf-8")
        return file_path
