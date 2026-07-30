# ARCHITECTURE.md - MetaVibe 架构设计与提炼引擎规范

本文档定义了 MetaVibe 的核心架构理念、元架构提炼机制（Meta-Architecture Extractor）、元工厂规格以及工程库描述字典规范。

---

## 1. 整体系统架构图

```mermaid
graph TD
    subgraph 外部源与设计理论 (Input)
        OpenSource[开源优秀项目\nStripe/Next.js/Supabase]
        Theories[经典软件理论\nDDD/Clean Arch/GoF]
    end

    subgraph MetaVibe 提炼引擎 (Extraction)
        LLM[成熟 AI 大模型\nGemini/Claude/GPT]
        PromptTemplate[Meta-Extractor Prompt]
    end

    subgraph MetaVibe 知识库与引擎 (Core Storage)
        Specs[.metavibe/specs/\n元架构 Spec 规范图谱]
        LibDict[.metavibe/specs/\n工程库描述字典图谱]
        Guardrails[防代码爆炸硬规约]
    end

    subgraph Vibe Coding 运行时 (Output)
        Agent[开发者 Agent\nCursor/Windsurf/Antigravity]
        UserApp[最终生产级应用]
    end

    OpenSource & Theories --> PromptTemplate
    PromptTemplate --> LLM
    LLM -->|提炼出元架构 JSON/YAML| Specs
    LLM -->|提炼/生成工程库字典| LibDict
    Specs & LibDict --> Guardrails
    Specs & LibDict & Guardrails -->|极简 Context 注射| Agent
    Agent -->|低 Token / 防爆炸| UserApp
```

---

## 2. 元架构提炼引擎 (Meta-Architecture Extraction Engine)

### 2.1 提炼哲学：非抄袭的范式抽象
提炼的过程**不是复制代码**，而是抽取系统背后的“黄金骨架”与“设计法则”：
- **分层边界 (Boundary Layers)**：如 Presentation Layer -> Domain Service -> Infrastructure Layer 的隔离法则。
- **数据契约与数据流 (Data Flow Patterns)**：如 Unidirectional Data Flow、Event-Driven Command 等。
- **接口与插槽 (Interface Slots)**：保留核心功能的扩展插槽，抹去具体业务逻辑。
- **硬性约束规约 (Guardrails)**：提取项目中防止代码恶化的 Lint/Rule 机制（例如禁止循环依赖、强制 DTO 转换）。

### 2.2 提炼工作流 (Extraction Workflow)
1. **输入阶段**：指定开源仓库路径/URL 或理论书籍章节。
2. **分析阶段**：调用成熟大模型（LLM）配合 `.metavibe/extractors/prompt_template.md` 进行语义分析与结构解构。
3. **输出阶段**：生成符合 `.metavibe/specs/meta_architecture_spec.json` 结构的元架构描述文件，永久加入 MetaVibe 知识库中。

---

## 3. 元架构描述规范 (Meta-Architecture Spec Schema)

一个标准的元架构 Spec 包含以下四大维度：

```json
{
  "name": "CleanArchitectureWeb",
  "version": "1.0.0",
  "description": "基于整洁架构提炼的 Web 服务端通用元架构",
  "layers": [
    {
      "name": "Domain",
      "rules": ["不允许依赖任何外部框架或数据库库", "只能包含纯粹的数据模型与业务实体"]
    },
    {
      "name": "Application",
      "rules": ["只能通过 Interface 声明依赖，采用依赖注入"]
    }
  ],
  "slots": [
    {
      "name": "AuthAdapter",
      "type": "Interface",
      "description": "用户身份验证扩展插槽"
    }
  ],
  "guardrails": {
    "max_file_lines": 300,
    "forbidden_imports": [
      { "from": "Presentation", "import": "Database" }
    ]
  }
}
```

---

## 4. 防防爆防护网格 (Anti-Entropy Guardrails)

Guardrails 是 MetaVibe 保护 Vibe Coding 项目避免后期爆炸的核心机制：
- **Structure Lock（结构锁）**：当 AI 尝试在未经允许的层级创建新文件时阻止或纠偏。
- **Token Saver Injection（Token 节省注入）**：向 AI 屏蔽已完成组件的详细实现，仅露出的 Spec 接口，降低 Context 上下文体积。

---

## 5. 工程库描述字典规范 (Engineering Library Dictionary Spec)

**工程库描述字典 (Library Specification Dictionary)** 是供 AI Agent 快速理解任何第三方库、官方标准库或自定义元组件库的统一契约与行为范本。

它通过暴露以下四个维度，使 AI Agent 能够以最少 Token 实现最高质量的代码编写：

1. **基本元数据 (Metadata)**：库名、版本兼容范围、应用语言与类别分类。
2. **AI 上下文摘要 (AI Context)**：
   - **高密度 Summary**：1-2 句向 AI 总结该库的底层原理与适用边界。
   - **黄金范式 (Golden Patterns)**：推荐给 AI 的低 Token 最佳实践代码片段。
   - **反范式案例 (Anti-Patterns)**：明确警告并禁止 AI 编写的高风险、反架构代码。
3. **元插槽挂载 (Meta-Slot Bindings)**：申明该库能够填补元架构中的哪些插槽（Slots）。
4. **架构放置规约 (Architectural Guardrails)**：规定该库在工程结构中“允许被引入”与“禁止被引入”的分层边界。

参见定义文件：[.metavibe/specs/library_dictionary_spec.json](file:///Users/joffrey/projects/ai/MetaVibe/.metavibe/specs/library_dictionary_spec.json)
