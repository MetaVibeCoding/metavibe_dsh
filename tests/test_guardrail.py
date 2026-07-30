"""Test cases for GuardrailEngine."""

from pathlib import Path
from metavibe.engine.guardrail import GuardrailEngine
from metavibe.specs.meta_arch import MetaArchitecture, ArchGuardrails, ForbiddenImport


def test_guardrail_scan_self():
    engine = GuardrailEngine(max_file_lines=300)
    report = engine.scan_directory(Path("."))
    assert report.total_files_scanned > 0
    assert report.passed is True


def test_forbidden_import_detection(tmp_path):
    # 创建一个违反分层 Rule 的假文件
    domain_file = tmp_path / "domain" / "user.py"
    domain_file.parent.mkdir(parents=True)
    domain_file.write_text("import sqlite3\nprint('db connected')", encoding="utf-8")

    meta_arch = MetaArchitecture(
        name="TestCleanArch",
        source="Test",
        description="Test",
        guardrails=ArchGuardrails(
            forbidden_imports=[
                ForbiddenImport(**{"from": "domain", "import": "sqlite3"})
            ]
        )
    )

    engine = GuardrailEngine(max_file_lines=300, meta_arch=meta_arch)
    report = engine.scan_directory(tmp_path)
    
    assert report.passed is False
    assert len(report.violations) == 1
    assert report.violations[0].rule_type == "forbidden_import"
    assert report.violations[0].severity == "ERROR"
