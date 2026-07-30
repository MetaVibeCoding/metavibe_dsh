"""Meta-Factory & Slot Assembly Engine Module."""

from pathlib import Path
from typing import Dict, List, Optional

from metavibe.engine.loader import SpecLoader
from metavibe.specs.meta_arch import MetaArchitecture, SlotSpec


class MetaFactory:
    """元工厂与 Slot 插槽装配生成器."""

    def __init__(self, workspace_root: Path):
        self.workspace_root = Path(workspace_root)

    def assemble_workspace_slots(self, output_dir: Optional[Path] = None) -> List[Path]:
        """扫描工作区绑定的元架构，并自动为每个未实现的 Slot 生成装配存根代码."""
        workspace_data = SpecLoader.scan_workspace(self.workspace_root)
        architectures: List[MetaArchitecture] = workspace_data.get("architectures", [])

        if not architectures:
            raise ValueError("工作区内未发现已绑定的元架构 Spec。请先运行 `metavibe hub use <name>`。")

        target_out = Path(output_dir) if output_dir else self.workspace_root / "src" / "slots"
        target_out.mkdir(parents=True, exist_ok=True)

        generated_files: List[Path] = []

        for arch in architectures:
            for slot in arch.slots:
                file_path = self._generate_slot_stub(slot, arch.name, target_out)
                generated_files.append(file_path)

        return generated_files

    def _generate_slot_stub(self, slot: SlotSpec, arch_name: str, out_dir: Path) -> Path:
        """为单个 Slot 生成 Python 或 TypeScript 插槽桩代码."""
        slot_filename = f"slot_{slot.name.lower()}.py"
        file_path = out_dir / slot_filename

        if file_path.exists():
            return file_path  # 已存在则不覆盖，避免覆盖已有业务逻辑

        code_lines = [
            f'"""MetaVibe Auto-Generated Slot Handler for [{slot.name}] ({arch_name})."""',
            "",
            "from typing import Protocol, Any",
            "",
            f"class {slot.name}Protocol(Protocol):",
            f'    """Slot Interface Contract for {slot.name}."""',
            f"    # Description: {slot.description}",
            "",
            "    def execute(self, *args: Any, **kwargs: Any) -> Any:",
            "        ...",
            "",
            f"class Base{slot.name}:",
            f'    """Default Base Implementation for Slot: {slot.name}."""',
            "",
            "    def execute(self, *args: Any, **kwargs: Any) -> Any:",
            f'        raise NotImplementedError("Slot [{slot.name}] Handler Pending Vibe Coding Implementation.")',
        ]

        file_path.write_text("\n".join(code_lines), encoding="utf-8")
        return file_path
