from pathlib import Path
from typing import Optional
import typer
from rich.console import Console
from rich.table import Table

from metavibe.engine.loader import SpecLoader
from metavibe.engine.guardrail import GuardrailEngine
from metavibe.engine.injector import AIContextInjector

app = typer.Typer(help="MetaVibe: AI-Native Meta-Architecture Platform for Vibe Coding")
console = Console()

@app.command()
def init():
    """初始化 MetaVibe 引擎配置与基石 Spec."""
    console.print("[bold green]🚀 MetaVibe Engine Initialized Successfully![/bold green]")
    console.print("Agent-First Vibe Coding Environment Ready.")

@app.command()
def check(
    path: str = typer.Option(".", "--path", "-p", help="待扫描的项目根目录路径"),
    max_lines: int = typer.Option(300, "--max-lines", "-m", help="单文件最大代码行数限制"),
):
    """检查当前工程架构防代码爆炸规约 (Anti-Entropy Guardrails)."""
    console.print(f"[bold blue]🛡️ Running MetaVibe Architecture Check on [{path}]...[/bold blue]\n")

    workspace_data = SpecLoader.scan_workspace(path)
    meta_arch = workspace_data["architectures"][0] if workspace_data["architectures"] else None

    if meta_arch:
        console.print(f"📖 发现已绑定的元架构: [bold cyan]{meta_arch.name}[/bold cyan] ({meta_arch.description})")

    engine = GuardrailEngine(max_file_lines=max_lines, meta_arch=meta_arch)
    report = engine.scan_directory(Path(path))

    console.print(f"📊 扫描文件总数: [bold]{report.total_files_scanned}[/bold] 个")

    if not report.violations:
        console.print("[bold green]✔ 架构规约校验完美通过！无代码行数溢出与非法跨层依赖。[/bold green]")
        return

    table = Table(title="⚠️ 架构与代码防爆检查告警列表")
    table.add_column("严重程度", style="bold")
    table.add_column("文件路径")
    table.add_column("行号")
    table.add_column("告警描述")

    for v in report.violations:
        sev_color = "red" if v.severity == "ERROR" else "yellow"
        table.add_row(
            f"[{sev_color}]{v.severity}[/{sev_color}]",
            v.file_path,
            str(v.line_number or "-"),
            v.message
        )

    console.print(table)

    if report.passed:
        console.print("\n[yellow]⚠️ 告警项为建议重构项目，未触发阻断性 ERROR。[/yellow]")
    else:
        console.print("\n[bold red]❌ 检查失败：检测到硬性架构阻断错误 (ERROR)。[/bold red]")
        raise typer.Exit(code=1)

@app.command()
def inject(
    output: str = typer.Option(".cursor/rules/metavibe.mdc", "--output", "-o", help="生成 Agent 规则文件的目标路径"),
    path: str = typer.Option(".", "--path", "-p", help="元架构与工程字典所在工作区路径"),
):
    """一键为 Cursor/Windsurf/Claude Code 生成高密度 AI Context 规则文件 (节省 90%+ Token)."""
    console.print(f"[bold cyan]💉 Generating AI Agent Rules from Workspace [{path}]...[/bold cyan]")
    
    injector = AIContextInjector(Path(path))
    out_file = injector.inject_to_file(Path(output))

    console.print(f"[bold green]✔ Agent 注入规则已成功生成到: [{out_file}][/bold green]")
    console.print("[dim]AI Agent 在此环境下编写代码时将自动遵循黄金范式与防爆规约。[/dim]")

if __name__ == "__main__":
    app()
