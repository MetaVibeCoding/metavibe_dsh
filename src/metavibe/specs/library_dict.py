"""Engineering Library Specification Dictionary Models."""

from typing import List, Optional
from pydantic import BaseModel, Field


class GoldenPattern(BaseModel):
    """AI 推荐最佳代码范式."""
    title: str = Field(description="范式标题")
    scenario: Optional[str] = Field(None, description="适用场景")
    code_snippet: str = Field(description="黄金代码片段")


class AntiPattern(BaseModel):
    """禁止 AI 编写的反范式警示."""
    warning: str = Field(description="警告提示")
    avoid_code: Optional[str] = Field(None, description="应避免的代码")
    reason: str = Field(description="禁止原因说明")


class AIContext(BaseModel):
    """面向 AI Agent 优化的高密度上下文."""
    summary: str = Field(description="功能高密度摘要")
    golden_patterns: List[GoldenPattern] = Field(default_factory=list, description="黄金代码范式列表")
    anti_patterns: List[AntiPattern] = Field(default_factory=list, description="禁用反范式列表")


class MetaSlotBinding(BaseModel):
    """绑定到的元架构 Slot."""
    slot_name: str = Field(description="元架构中的 Slot 名称")
    provided_interfaces: List[str] = Field(default_factory=list, description="暴露的接口列表")


class ArchitecturalGuardrails(BaseModel):
    """分层摆放规约."""
    allowed_layers: List[str] = Field(default_factory=list, description="允许使用的架构层")
    forbidden_layers: List[str] = Field(default_factory=list, description="禁止使用的架构层")


class LibraryDictionary(BaseModel):
    """工程库描述字典根模型."""
    library_name: str = Field(description="库名称，如 fastapi, zustand")
    version: str = Field(description="版本依赖范围")
    category: str = Field(description="库分类")
    language: str = Field(description="适用语言")
    ai_context: AIContext = Field(description="AI 上下文契约")
    meta_slot_bindings: List[MetaSlotBinding] = Field(default_factory=list, description="元架构插槽绑定")
    architectural_guardrails: Optional[ArchitecturalGuardrails] = Field(None, description="架构摆放与防爆约束")
