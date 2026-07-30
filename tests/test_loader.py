"""Test cases for SpecLoader."""

from pathlib import Path
from metavibe.engine.loader import SpecLoader


def test_load_fastapi_library_dict():
    sample_path = Path(".metavibe/examples/fastapi_library_dict.json")
    lib = SpecLoader.load_library_dictionary(sample_path)
    assert lib.library_name == "fastapi"
    assert lib.category == "framework"
    assert len(lib.ai_context.golden_patterns) > 0


def test_scan_workspace():
    results = SpecLoader.scan_workspace(Path("."))
    assert "library_dicts" in results
    assert len(results["library_dicts"]) >= 2  # fastapi & zustand
