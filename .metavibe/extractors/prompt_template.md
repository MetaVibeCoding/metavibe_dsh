# Meta-Architecture Extraction Prompt Template (元架构提炼 Meta-Prompt)

> **角色指令**：你是一位世界级顶尖软件架构师。你的任务是分析目标开源项目或软件工程理论，**提炼其核心设计范式与工程结构，而不是直接复制具体业务代码**。

---

## 🎯 提炼目标

请分析输入的代码库 / 项目文档 / 设计理论，提取以下维度的“元架构 (Meta-Architecture)”数据：

1. **架构范式与分层 (Architecture Layers)**：
   - 提取项目中的核心抽象层（例如 Domain Layer, Application Service, Infrastructure, Presentation Layer）。
   - 明确各层之间的单向依赖规则与边界条件。

2. **接口与扩展插槽 (Slots & Extensibility)**：
   - 识别系统为了可扩展性所留出的通用接口插槽（例如 Auth Adapter, Storage Engine Slot, Payment Gateway Interface）。
   - 描述每个 Slot 的功能契约。

3. **架构防代码爆炸规约 (Anti-Entropy Guardrails)**：
   - 提炼该开源项目中显式或隐式的工程约束法则（例如：禁止在 Component 内编写直接 DB 访问；单文件行数限制；强制使用传输对象 DTO 等）。

---

## 📄 输出格式

请严格将分析结果输出为符合以下 Schema 的 JSON/YAML 结构：

```json
{
  "name": "<提炼得出的元架构名称，如 StripeStyleAPI>",
  "source": "<目标项目名称或理论来源>",
  "version": "1.0.0",
  "description": "<简要说明该元架构的核心优势与适用场景>",
  "layers": [
    {
      "name": "<层级名称>",
      "path": "<推荐目录>",
      "rules": ["<该层级的规则断言 1>", "<该层级的规则断言 2>"]
    }
  ],
  "slots": [
    {
      "name": "<插槽名称>",
      "interface_type": "<类型或契约>",
      "description": "<插槽作用说明>"
    }
  ],
  "guardrails": {
    "max_file_lines": 300,
    "forbidden_imports": [
      { "from": "<源模块>", "import": "<被禁止引入的模块>" }
    ]
  }
}
```
