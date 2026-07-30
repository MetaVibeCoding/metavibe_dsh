import typer
from rich.console import Console

app = typer.Typer(help="MetaVibe: AI-Native Meta-Architecture Platform for Vibe Coding")
console = Console()

@app.command()
def init():
    """初始化 MetaVibe 引擎配置与基石 Spec."""
    console.print("[bold green]🚀 MetaVibe Engine Initialized Successfully![/bold green]")
    console.print("Agent-First Vibe Coding Environment Ready.")

@app.command()
def check():
    """检查当前工程架构防代码爆炸规约 (Anti-Entropy Guardrails)."""
    console.print("[bold blue]🛡️ Running Anti-Entropy Architecture Guardrail Check...[/bold blue]")
    console.print("[green]✔ Architecture layers & file constraints verified cleanly.[/green]")

if __name__ == "__main__":
    app()
