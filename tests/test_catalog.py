"""Test cases for CatalogManager."""

from pathlib import Path
from metavibe.engine.catalog import CatalogManager


def test_get_catalog_tree():
    manager = CatalogManager()
    tree = manager.get_catalog_tree()
    
    assert "data_flow" in tree
    assert "data_model" in tree
    assert "philosophy" in tree
    assert "meta_skill" in tree

    # 验证是否能查到内置案例
    cqrs = [s for s in tree["data_flow"] if "cqrs" in s.id]
    assert len(cqrs) > 0


def test_inspect_skill():
    manager = CatalogManager()
    skill = manager.inspect_skill("data_flows/cqrs_flow")
    
    assert skill.id == "data_flows/cqrs_flow"
    assert "CQRS" in skill.title
    assert skill.data_flow_diagram is not None
    assert len(skill.example_cases) > 0
