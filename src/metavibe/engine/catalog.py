"""Catalog & MetaSkill Progressive Traversal Engine Module."""

import json
from pathlib import Path
from typing import Dict, List, Optional

from metavibe.specs.skill import MetaSkill


class CatalogManager:
    """分门别类的案例、数据流模型与“类 Skill”层级翻阅引擎."""

    CATALOG_DIR = Path(__file__).parent.parent / "catalog"

    def __init__(self, workspace_root: Optional[Path] = None):
        self.workspace_root = Path(workspace_root) if workspace_root else None

    def scan_all_skills(self) -> List[MetaSkill]:
        """扫描内置 catalog 目录与工作区下所有 MetaSkill."""
        skills: List[MetaSkill] = []
        
        # 1. 扫描内置 catalog 目录
        if self.CATALOG_DIR.exists():
            for json_file in self.CATALOG_DIR.rglob("*.json"):
                try:
                    data = json.loads(json_file.read_text(encoding="utf-8"))
                    skills.append(MetaSkill.model_validate(data))
                except Exception:
                    continue

        # 2. 扫描工作区 .metavibe/catalog 目录
        if self.workspace_root:
            user_catalog = self.workspace_root / ".metavibe" / "catalog"
            if user_catalog.exists():
                for json_file in user_catalog.rglob("*.json"):
                    try:
                        data = json.loads(json_file.read_text(encoding="utf-8"))
                        skills.append(MetaSkill.model_validate(data))
                    except Exception:
                        continue

        return skills

    def get_catalog_tree(self) -> Dict[str, List[MetaSkill]]:
        """构建按类别 (category) 分组的结构化层级树."""
        all_skills = self.scan_all_skills()
        tree: Dict[str, List[MetaSkill]] = {
            "data_flow": [],
            "data_model": [],
            "philosophy": [],
            "meta_skill": []
        }

        for skill in all_skills:
            cat = skill.category if skill.category in tree else "meta_skill"
            tree[cat].append(skill)

        return tree

    def inspect_skill(self, skill_id_or_name: str) -> MetaSkill:
        """根据 ID 或名称精确检索检视某个 MetaSkill."""
        all_skills = self.scan_all_skills()
        target = skill_id_or_name.lower().strip()

        for skill in all_skills:
            if skill.id.lower() == target or skill.title.lower() == target or target in skill.id.lower():
                return skill

        raise ValueError(f"Catalog 中未找到符合条件 [{skill_id_or_name}] 的数据流/案例 Skill。可以使用 `metavibe catalog tree` 查看层级树。")
