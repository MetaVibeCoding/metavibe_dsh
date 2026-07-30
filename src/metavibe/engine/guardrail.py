"""Anti-Entropy Guardrail Engine Module."""

import re
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field

from metavibe.specs.meta_arch import MetaArchitecture


class Violation(BaseModel):
    """违规项结构."""
    file_path: str = Field(description="文件路径")
    line_number: Optional[int] = Field(None, description="违规行号")
    rule_type: str = Field(description="规则类型: line_limit | forbidden_import | layer_boundary")
    message: str = Field(description="详细警示信息")
    severity: str = Field(default="WARNING", description="严重程度: WARNING | ERROR")


class GuardrailReport(BaseModel):
    """Guardrail 扫描报告."""
    total_files_scanned: int = 0
    passed: bool = True
    violations: List[Violation] = Field(default_factory=list)


class GuardrailEngine:
    """架构防代码爆炸防护网格引擎."""

    # 默认忽略的通配目录
    IGNORE_DIRS = {".git", ".venv", "node_modules", "dist", "build", "__pycache__", ".metavibe"}
    # 关注的代码文件扩展名
    CODE_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs"}

    def __init__(self, max_file_lines: int = 300, meta_arch: Optional[MetaArchitecture] = None):
        self.max_file_lines = max_file_lines
        self.meta_arch = meta_arch

    def scan_directory(self, target_dir: Path) -> GuardrailReport:
        """扫描指定目录下的所有代码文件，检测行数溢出与非法 import."""
        report = GuardrailReport()
        target_path = Path(target_dir).resolve()

        if not target_path.exists():
            report.passed = False
            report.violations.append(Violation(
                file_path=str(target_dir),
                rule_type="system",
                message="扫描目标路径不存在",
                severity="ERROR"
            ))
            return report

        for file_path in target_path.rglob("*"):
            if file_path.is_file() and file_path.suffix in self.CODE_EXTENSIONS:
                # 检查路径是否包含被忽略的目录
                if any(part in self.IGNORE_DIRS for part in file_path.parts):
                    continue

                report.total_files_scanned += 1
                self._check_file(file_path, target_path, report)

        if any(v.severity == "ERROR" for v in report.violations):
            report.passed = False

        return report

    def _check_file(self, file_path: Path, root_path: Path, report: GuardrailReport):
        """对单个文件执行行数与 import 校验."""
        relative_path = file_path.relative_to(root_path)

        try:
            lines = file_path.read_text(encoding="utf-8", errors="ignore").splitlines()
        except Exception:
            return

        # 1. 单文件行数上限检测
        if len(lines) > self.max_file_lines:
            report.violations.append(Violation(
                file_path=str(relative_path),
                rule_type="line_limit",
                message=f"单文件包含 {len(lines)} 行，已超过建议上限 ({self.max_file_lines} 行)。推荐进行解耦拆包。",
                severity="WARNING"
            ))

        # 2. 如果存在元架构规范，执行跨层 import 检测
        if self.meta_arch and self.meta_arch.guardrails.forbidden_imports:
            for idx, line in enumerate(lines, 1):
                line_str = line.strip()
                for rule in self.meta_arch.guardrails.forbidden_imports:
                    # 假定当前文件属于 from_layer
                    if rule.from_layer.lower() in str(relative_path).lower():
                        # 检查 import 语句是否包含被禁用的模块名
                        if (line_str.startswith("import ") or line_str.startswith("from ")) and rule.forbidden_import.lower() in line_str.lower():
                            report.violations.append(Violation(
                                file_path=str(relative_path),
                                line_number=idx,
                                rule_type="forbidden_import",
                                message=f"违反架构分层硬规则: 层级 [{rule.from_layer}] 禁止导入 [{rule.forbidden_import}]。(匹配: {line_str})",
                                severity="ERROR"
                            ))
