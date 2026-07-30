"""Test cases for AIContextInjector."""

from pathlib import Path
from metavibe.engine.injector import AIContextInjector
from metavibe.specs.library_dict import LibraryDictionary, AIContext, GoldenPattern


def test_generate_rules_markdown(tmp_path):
    injector = AIContextInjector(Path("."))
    
    # 模拟工程字典
    lib = LibraryDictionary(
        library_name="test_lib",
        version="1.0.0",
        category="utility",
        language="python",
        ai_context=AIContext(
            summary="测试库说明",
            golden_patterns=[
                GoldenPattern(title="Test Pattern", code_snippet="print('hello')")
            ]
        )
    )

    md = injector.generate_rules_markdown(library_dicts=[lib])
    assert "test_lib" in md
    assert "Test Pattern" in md
    assert "print('hello')" in md


def test_inject_to_file(tmp_path):
    injector = AIContextInjector(Path("."))
    target_file = tmp_path / ".cursor" / "rules" / "test.mdc"
    out_file = injector.inject_to_file(target_file)
    
    assert out_file.exists()
    content = out_file.read_text(encoding="utf-8")
    assert "METAVIBE AGENT RULES" in content
