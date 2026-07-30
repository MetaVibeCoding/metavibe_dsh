"""Test cases for HubManager."""

from pathlib import Path
from metavibe.engine.hub import HubManager


def test_list_available_specs():
    specs = HubManager.list_available_specs()
    assert len(specs) >= 2
    names = [s.name for s in specs]
    assert "clean-arch-web" in names
    assert "nextjs-app-router" in names


def test_use_spec(tmp_path):
    dest_path = HubManager.use_spec("clean-arch-web", tmp_path)
    assert dest_path.exists()
    assert ".metavibe/specs/arch_clean-arch-web.json" in str(dest_path)
