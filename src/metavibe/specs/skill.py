"""MetaSkill Pydantic Models for Agent Traversal Catalog."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ExampleCase(BaseModel):
    """案例代码片段."""
    title: str = Field(description="案例标题")
    code_snippet: str = Field(description="核心代码片段")
    explanation: Optional[str] = Field(None, description="案例说明")


class MetaSkill(BaseModel):
    """类 Skill 案例与数据流模型契约."""
    id: str = Field(description="唯一标识，如 data_flow/cqrs, meta_skills/auth_factory")
    title: str = Field(description="Skill 标题")
    category: str = Field(description="分类: data_flow | data_model | philosophy | meta_skill")
    tags: List[str] = Field(default_factory=list, description="标签列表")
    summary: str = Field(description="向 LLM Agent 展现的高密度能力概述")
    data_flow_diagram: Optional[str] = Field(None, description="数据流模式图 (Mermaid/ASCII)")
    data_schema: Optional[Dict[str, str]] = Field(None, description="关键数据模型 JSON Schema/Types")
    example_cases: List[ExampleCase] = Field(default_factory=list, description="相关代码范例")
    agent_instructions: List[str] = Field(default_factory=list, description="供 Agent 遵循的执行步骤")
