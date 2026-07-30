"""Test cases for ExtractorEngine."""

from pathlib import Path
from metavibe.engine.extractor import ExtractorEngine
from metavibe.specs.meta_arch import MetaArchitecture


def test_prepare_prompt():
    engine = ExtractorEngine()
    prompt = engine.prepare_extraction_prompt("class User: pass", "UserModel")
    assert "UserModel" in prompt
    assert "class User: pass" in prompt


def test_parse_ai_response():
    engine = ExtractorEngine()
    sample_response = """
    ```json
    {
      "name": "CleanArchitectureWeb",
      "source": "Clean Architecture Theory",
      "version": "1.0.0",
      "description": "通用整洁架构",
      "layers": [{"name": "Domain", "rules": ["无外部依赖"]}],
      "slots": [{"name": "RepositorySlot", "description": "仓储层接口"}]
    }
    ```
    """
    spec = engine.parse_ai_response_to_spec(sample_response)
    assert isinstance(spec, MetaArchitecture)
    assert spec.name == "CleanArchitectureWeb"


def test_save_spec(tmp_path):
    engine = ExtractorEngine()
    spec = MetaArchitecture(
        name="TestSave",
        source="Test",
        description="Test",
        layers=[],
        slots=[]
    )
    saved_file = engine.save_spec_to_workspace(spec, tmp_path)
    assert saved_file.exists()
    assert "arch_testsave.json" in saved_file.name
