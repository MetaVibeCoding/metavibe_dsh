# Plugin Effect Comparison (with real guardrail logs)

> Same task — "user register / fetch API" — generated twice: **without the plugin**
> (classic vibe coding) vs **with the plugin** (bound to the `fastapi-web` skeleton).
> Reproducible examples: [`examples/compare-before`](../examples/compare-before) and
> [`examples/compare-after`](../examples/compare-after). All guardrail output below
> is **real `metavibe_check` output**.

Chinese version: [effect-comparison.zh.md](effect-comparison.zh.md)

---

## 1. Same task, two results

### ❌ Without the plugin

One 37-line file `src/router/users.py`: routing + validation + business rules + raw SQL mixed together.

```python
import sqlalchemy                          # router depends on the DB directly
from sqlalchemy import text

@router.post("/users")
async def create_user(email: str, password: str):
    if len(password) < 8:                  # business rule inline in the router
        raise HTTPException(400, "password too short")
    with engine.connect() as conn:         # router touches the DB, no repository
        ...
```

### ✅ With the plugin (layered by the `fastapi-web` skeleton)

Four files, one-way dependencies, single responsibility:

```
src/router/users.py          transport: DTO validation + delegate to service
src/service/user_service.py  orchestration: use cases, transaction boundary
src/repository/user_repository.py  storage isolation: SQLAlchemy lives only here
src/domain/user.py           pure dataclass + password rule, zero framework deps
```

## 2. Real guardrail logs

**Without-plugin code, scanned after binding the skeleton** (guardrail log messages are emitted in Chinese by the tool — reproduced verbatim):

```text
📊 扫描文件总数: 1
⚠️ 告警列表 (2):
  [ERROR] src/router/users.py:5  — 违反架构分层硬规则: 层级 [router] 禁止导入 [sqlalchemy]。(匹配: import sqlalchemy)
  [ERROR] src/router/users.py:7  — 违反架构分层硬规则: 层级 [router] 禁止导入 [sqlalchemy]。(匹配: from sqlalchemy import text)
❌ 检查失败：检测到硬性架构阻断错误 (ERROR)。
```

**Layered code, same guardrail** (verbatim tool output):

```text
📊 扫描文件总数: 4
✔ 架构规约校验完美通过！无代码行数溢出与非法跨层依赖。
```

## 3. Ten-dimension comparison

| Dimension | Without plugin | With plugin |
| :--- | :--- | :--- |
| Initial structure | random, re-invented every time | `hub_use` binds a golden skeleton |
| Boilerplate | 3–8k tokens re-generated per task | stubs via `assemble`, rules via `inject` (200–500 tokens) |
| Layering | none enforced | router/service/repository/domain, one-way deps |
| Dependency direction | arbitrary imports, cycles common | hard rules: router↛repository/sqlalchemy, domain↛frameworks |
| DB access | raw SQL in routers | confined to the repository layer |
| Business rules | inline in handlers | converged into pure domain objects |
| Guardrails | none — entropy collapse past ~3k lines | `metavibe_check` blocks violations on every change |
| AI context | re-reads all boilerplate every turn | high-density rules injected once |
| Reuse | zero pattern accumulation | skeletons accumulate and spread across projects |
| Maintainability | big files, tight coupling | small files (<300 lines), high cohesion |

## 4. Workflow difference

| Step | Without | With |
| :--- | :--- | :--- |
| 1 | "write a user register API" | `metavibe_hub_list` → `metavibe_hub_use fastapi-web` |
| 2 | AI improvises one file | `metavibe_assemble` scaffolds slot stubs |
| 3 | — | generate layered router/service/repository/domain |
| 4 | nothing checks it | `metavibe_check` blocks and fixes violations |
| 5 | next project starts from zero | `metavibe_inject` persists rules for every agent |

## 5. Conclusion

The plugin's value is **what it blocks and shapes**:

1. **Blocks**: cross-layer imports, router→DB, domain→framework, oversized files — intercepted by `metavibe_check` (real logs: 2 ERRORs caught).
2. **Shapes**: the same task goes from a single raw-SQL file to four clean layers with predefined boundaries — AI only fills the slots.
3. **Accumulates**: skeletons and rules compound across projects.

> Vision: **Make AI build masterpieces — every line on the shoulders of giants.**
