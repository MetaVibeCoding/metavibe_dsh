"""Spec and Library Dictionary Loader Module."""

import json
from pathlib import Path
from typing import Dict, List, Union
import yaml

from metavibe.specs.meta_arch import MetaArchitecture
from metavibe.specs.library_dict import LibraryDictionary


class SpecLoaderError(Exception):
    """Spec 加载与校验异常."""
    pass


class SpecLoader:
    """元规范与工程字典加载校验引擎."""

    @staticmethod
    def load_file(path: Union[str, Path]) -> dict:
        """读取 JSON 或 YAML 文件并转为字典."""
        file_path = Path(path)
        if not file_path.exists():
            raise SpecLoaderError(f"文件不存在: {path}")

        try:
            content = file_path.read_text(encoding="utf-8")
            if file_path.suffix.lower() in [".yaml", ".yml"]:
                return yaml.safe_load(content) or {}
            else:
                return json.loads(content)
        except Exception as e:
            raise SpecLoaderError(f"解析文件 {path} 失败: {str(e)}")

    @classmethod
    def load_meta_architecture(cls, source: Union[str, Path, dict]) -> MetaArchitecture:
        """解析并校验 MetaArchitecture 模型."""
        data = source if isinstance(source, dict) else cls.load_file(source)
        try:
            return MetaArchitecture.model_validate(data)
        except Exception as e:
            raise SpecLoaderError(f"元架构 Spec 校验不通过: {str(e)}")

    @classmethod
    def load_library_dictionary(cls, source: Union[str, Path, dict]) -> LibraryDictionary:
        """解析并校验 LibraryDictionary 模型."""
        data = source if isinstance(source, dict) else cls.load_file(source)
        try:
            return LibraryDictionary.model_validate(data)
        except Exception as e:
            raise SpecLoaderError(f"工程库描述字典校验不通过: {str(e)}")

    @classmethod
    def scan_workspace(cls, workspace_root: Union[str, Path]) -> Dict[str, List]:
        """扫描工作区 .metavibe 目录下的所有架构与库字典."""
        root = Path(workspace_root)
        metavibe_dir = root / ".metavibe"
        
        architectures: List[MetaArchitecture] = []
        library_dicts: List[LibraryDictionary] = []

        if not metavibe_dir.exists():
            return {"architectures": architectures, "library_dicts": library_dicts}

        # 遍历所有 json/yaml 文件进行分类试载
        for file in metavibe_dir.glob("**/*"):
            if file.suffix.lower() in [".json", ".yaml", ".yml"]:
                try:
                    data = cls.load_file(file)
                    if "layers" in data and "slots" in data:
                        architectures.append(cls.load_meta_architecture(data))
                    elif "library_name" in data and "ai_context" in data:
                        library_dicts.append(cls.load_library_dictionary(data))
                except Exception:
                    continue  # 忽略格式不符的其他配置文件

        return {
            "architectures": architectures,
            "library_dicts": library_dicts,
        }
