"""Meta-Architecture Specification Pydantic Models."""

from typing import List, Optional
from pydantic import BaseModel, Field


class LayerRule(BaseModel):
    """架构层级及其守卫规则."""
    name: str = Field(description="层级名称，如 Domain, Application, Presentation")
    path: Optional[str] = Field(None, description="推荐在代码库中的目录路径，如 src/domain")
    rules: List[str] = Field(default_factory=list, description="该层级别的硬规则列表")


class SlotSpec(BaseModel):
    """元架构中留出的业务或功能插槽."""
    name: str = Field(description="插槽名称，如 AuthAdapterSlot, StorageSlot")
    interface_type: Optional[str] = Field(None, description="接口或类型契约")
    description: str = Field(description="插槽功能说明")


class ForbiddenImport(BaseModel):
    """禁止的依赖引入关系."""
    from_layer: str = Field(alias="from", description="源层级")
    forbidden_import: str = Field(alias="import", description="禁止引入的被调层级")


class ArchGuardrails(BaseModel):
    """元架构防代码爆炸约束."""
    max_file_lines: int = Field(default=300, description="单文件行数限制上限")
    forbidden_imports: List[ForbiddenImport] = Field(default_factory=list, description="禁止的跨层导入规则")


class MetaArchitecture(BaseModel):
    """元架构根定义模型."""
    name: str = Field(description="元架构名称")
    source: str = Field(description="提炼来源，如 Clean Architecture, Next.js Router")
    version: str = Field(default="1.0.0", description="架构版本")
    description: str = Field(description="元架构概述与适用场景")
    layers: List[LayerRule] = Field(default_factory=list, description="架构分层与规则列表")
    slots: List[SlotSpec] = Field(default_factory=list, description="业务扩展插槽列表")
    guardrails: ArchGuardrails = Field(default_factory=ArchGuardrails, description="防爆规约")
