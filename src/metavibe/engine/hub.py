"""Spec Hub Manager Module."""

import shutil
from pathlib import Path
from typing import Dict, List

from metavibe.engine.loader import SpecLoader
from metavibe.specs.meta_arch import MetaArchitecture


class HubManager:
    """内置黄金元架构图谱 Hub 管理器."""

    DATA_DIR = Path(__file__).parent.parent / "hub" / "data"

    @classmethod
    def list_available_specs(cls) -> List[MetaArchitecture]:
        """列出 Hub 内所有预置的黄金元架构."""
        specs: List[MetaArchitecture] = []
        if not cls.DATA_DIR.exists():
            return specs

        for file in cls.DATA_DIR.glob("*.json"):
            try:
                spec = SpecLoader.load_meta_architecture(file)
                specs.append(spec)
            except Exception:
                continue
        return specs

    @classmethod
    def use_spec(cls, spec_name: str, workspace_root: Path) -> Path:
        """从 Hub 中复制预置 Spec 到目标的 .metavibe/specs/ 目录中."""
        target_file = None
        for file in cls.DATA_DIR.glob("*.json"):
            try:
                spec = SpecLoader.load_meta_architecture(file)
                if spec.name.lower() == spec_name.lower():
                    target_file = file
                    break
            except Exception:
                continue

        if not target_file:
            raise ValueError(f"Hub 中未找到名为 [{spec_name}] 的元架构。可以使用 `metavibe hub list` 查看可用列表。")

        dest_dir = Path(workspace_root) / ".metavibe" / "specs"
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / f"arch_{spec_name.lower()}.json"

        shutil.copy(target_file, dest_path)
        return dest_path
