"""Test cases for MetaFactory."""

from pathlib import Path
from metavibe.engine.hub import HubManager
from metavibe.engine.factory import MetaFactory


def test_assemble_slots(tmp_path):
    # 模拟先引入 clean-arch-web 到 tmp_path
    HubManager.use_spec("clean-arch-web", tmp_path)

    factory = MetaFactory(tmp_path)
    generated = factory.assemble_workspace_slots(tmp_path / "src" / "slots")

    assert len(generated) == 2  # RepositorySlot & AuthAdapterSlot
    assert (tmp_path / "src" / "slots" / "slot_repositoryslot.py").exists()
    assert (tmp_path / "src" / "slots" / "slot_authadapterslot.py").exists()
