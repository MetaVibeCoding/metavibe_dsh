from pathlib import Path
from typing import Optional
import typer
from rich.console import Console
from rich.table import Table
from rich.tree import Tree
from rich.panel import Panel

from metavibe.engine.loader import SpecLoader
from metavibe.engine.guardrail import GuardrailEngine
from metavibe.engine.injector import AIContextInjector
from metavibe.engine.extractor import ExtractorEngine
from metavibe.engine.hub import HubManager
from metavibe.engine.factory import MetaFactory
from metavibe.engine.catalog import CatalogManager

app = typer.Typer(help="MetaVibe: AI-Native Meta-Architecture Platform for Vibe Coding")
extract_app = typer.Typer(help="AI 元架构与工程字典提炼命令组")
hub_app = typer.Typer(help="内置黄金元架构图谱 Hub 命令组")
catalog_app = typer.Typer(help="分门别类案例、数据流、数据模型与“类 Skill”层级翻阅命令组")

app.add_typer(extract_app, name="extract")
app.add_typer(hub_app, name="hub")
app.add_typer(catalog_app, name="catalog")

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

@app.command()
def assemble(
    output: str = typer.Option("src/slots", "--output", "-o", help="Slot 桩代码输出路径"),
    path: str = typer.Option(".", "--path", "-p", help="元架构与工程字典所在工作区路径"),
):
    """基于当前工程绑定的元架构，自动装配扩展 Slot 代码插槽."""
    console.print(f"[bold cyan]⚙️ Assembling Meta-Factory Slots in Workspace [{path}]...[/bold cyan]")
    try:
        factory = MetaFactory(Path(path))
        files = factory.assemble_workspace_slots(Path(output))
        console.print(f"[bold green]✔ 已成功生成并关联 [{len(files)}] 个 Slot 插槽存根代码:[/bold green]")
        for f in files:
            console.print(f"  └─ {f}")
    except Exception as e:
        console.print(f"[bold red]❌ 装配失败: {str(e)}[/bold red]")
        raise typer.Exit(code=1)

@extract_app.command("prepare")
def extract_prepare(
    source: str = typer.Option(..., "--source", "-s", help="待分析的目标代码文件或目录路径"),
    name: str = typer.Option("TargetProject", "--name", "-n", help="目标项目/范式名称"),
):
    """生成用于发送给 AI Model 提炼元架构的 Meta-Prompt."""
    src_path = Path(source)
    if not src_path.exists():
        console.print(f"[red]❌ 文件不存在: {source}[/red]")
        raise typer.Exit(code=1)

    content = src_path.read_text(encoding="utf-8") if src_path.is_file() else f"Directory path: {src_path}"
    engine = ExtractorEngine()
    prompt = engine.prepare_extraction_prompt(content, name)

    console.print("[bold green]✨ AI Meta-Extractor Prompt 准备完毕！[/bold green]\n")
    console.print(prompt[:500] + "\n...[已截断]...\n")
    console.print("[dim]请复制上述 Prompt 发送给 Gemini / Claude / GPT 进行提炼。[/dim]")

@extract_app.command("parse")
def extract_parse(
    file: str = typer.Option(..., "--file", "-f", help="包含 AI 提炼 JSON 响应的文件路径"),
    workspace: str = typer.Option(".", "--workspace", "-w", help="保存 Spec 的工作区路径"),
):
    """将 AI Model 返回的 JSON 提炼结果解析保存入 .metavibe/specs/."""
    resp_path = Path(file)
    if not resp_path.exists():
        console.print(f"[red]❌ 文件不存在: {file}[/red]")
        raise typer.Exit(code=1)

    text = resp_path.read_text(encoding="utf-8")
    engine = ExtractorEngine()

    try:
        spec = engine.parse_ai_response_to_spec(text)
        saved_path = engine.save_spec_to_workspace(spec, Path(workspace))
        console.print(f"[bold green]✔ 元架构 Spec 成功保存至: [{saved_path}][/bold green]")
    except Exception as e:
        console.print(f"[bold red]❌ 解析 AI 响应失败: {str(e)}[/bold red]")
        raise typer.Exit(code=1)

@hub_app.command("list")
def hub_list():
    """查看 Spec Hub 中可用的预置黄金元架构列表."""
    specs = HubManager.list_available_specs()
    if not specs:
        console.print("[yellow]Hub 中暂无可用预置 Spec。[/yellow]")
        return

    table = Table(title="🏛️ MetaVibe Spec Hub - 预置黄金元架构图谱")
    table.add_column("架构标识 (Name)", style="bold cyan")
    table.add_column("来源 (Source)")
    table.add_column("描述 (Description)")

    for s in specs:
        table.add_row(s.name, s.source, s.description)

    console.print(table)

@hub_app.command("use")
def hub_use(
    name: str = typer.Argument(..., help="元架构标识名称，如 clean-arch-web, nextjs-app-router"),
    workspace: str = typer.Option(".", "--workspace", "-w", help="目标工作区路径"),
):
    """从 Hub 载入指定的黄金元架构到当前工程."""
    try:
        dest_path = HubManager.use_spec(name, Path(workspace))
        console.print(f"[bold green]✔ 已成功将 [{name}] 黄金元架构载入工程: [{dest_path}][/bold green]")
    except Exception as e:
        console.print(f"[bold red]❌ 载入失败: {str(e)}[/bold red]")
        raise typer.Exit(code=1)

@catalog_app.command("tree")
def catalog_tree(
    path: str = typer.Option(".", "--path", "-p", help="当前工作区路径"),
):
    """以可读层级树呈现所有分类案例、数据流模式、数据模型与类 Skill 包."""
    manager = CatalogManager(Path(path))
    tree_data = manager.get_catalog_tree()

    root_tree = Tree("📚 [bold magenta]MetaVibe Catalog Knowledge Matrix[/bold magenta]")

    category_titles = {
        "data_flow": "🌊 数据流模式 (Data Flow Patterns)",
        "data_model": "📐 数据模型范式 (Data Models & Schemas)",
        "philosophy": "🧠 设计理念 (Architectural Philosophies)",
        "meta_skill": "⚡ 类 Skill 案例包 (Meta-Skills)"
    }

    for cat_key, title in category_titles.items():
        cat_branch = root_tree.add(f"[bold yellow]{title}[/bold yellow]")
        items = tree_data.get(cat_key, [])
        if not items:
            cat_branch.add("[dim](暂无案例)[/dim]")
        for item in items:
            cat_branch.add(f"[bold cyan]{item.id}[/bold cyan] - {item.title}")

    console.print(root_tree)
    console.print("\n[dim]提示: 运行 `metavibe catalog inspect <id>` 按层级检视具体案例或数据流契约。[/dim]")

@catalog_app.command("inspect")
def catalog_inspect(
    query: str = typer.Argument(..., help="技能/案例标识 ID 或名称，如 data_flows/cqrs_flow"),
    path: str = typer.Option(".", "--path", "-p", help="当前工作区路径"),
):
    """按层级检视指定案例、数据流图或类 Skill 的高密度 Context 范式."""
    manager = CatalogManager(Path(path))
    try:
        skill = manager.inspect_skill(query)
        
        console.print(Panel(
            f"[bold cyan]{skill.title}[/bold cyan] ({skill.id})\n[dim]{skill.summary}[/dim]",
            title="🎯 MetaSkill Inspection",
            border_style="magenta"
        ))

        if skill.data_flow_diagram:
            console.print("\n[bold yellow]🌊 数据流模式图 (Data Flow Diagram):[/bold yellow]")
            console.print(Panel(skill.data_flow_diagram, border_style="blue"))

        if skill.data_schema:
            console.print("\n[bold yellow]📐 数据模型 Schema (Data Model Schemas):[/bold yellow]")
            for name, schema_val in skill.data_schema.items():
                console.print(f"  • [cyan]{name}[/cyan]: {schema_val}")

        if skill.example_cases:
            console.print("\n[bold yellow]💡 经典案例代码 (Example Case Snippets):[/bold yellow]")
            for case in skill.example_cases:
                console.print(f"[bold green]▶ {case.title}[/bold green]")
                console.print(f"```\n{case.code_snippet}\n```")

        if skill.agent_instructions:
            console.print("\n[bold yellow]🤖 Agent 执行指令 (Agent Instructions):[/bold yellow]")
            for inst in skill.agent_instructions:
                console.print(f"  └─ {inst}")

    except Exception as e:
        console.print(f"[bold red]❌ 检视失败: {str(e)}[/bold red]")
        raise typer.Exit(code=1)

if __name__ == "__main__":
    app()
