# 插件前后生成效果对比（实测记录）

> ⚠️ **历史记录（0.3 之前）** — 本文记录的是已移除的守卫工具集
> （`metavibe_check` / `metavibe_hub_use` / `metavibe_assemble`）。自 0.3.0 起
> MetaVibe 为只读顾问（`metavibe_hub_list` / `metavibe_catalog_*`），不再扫描或在工作区内强制执行。

> 同一任务：「用户注册 / 查询 API」，分别走**无插件（传统 Vibe Coding）**与**有插件（MetaVibe）**两条路径。
> 完整可复现实例见 [`examples/compare-before`](../examples/compare-before) 与 [`examples/compare-after`](../examples/compare-after)。
> 本文所有守卫输出均为 `metavibe_check` 的**真实运行结果**。

---

## 1. 同一任务，两种生成结果

### ❌ 无插件（传统 Vibe Coding 产物）

单个文件 `src/router/users.py`（37 行）：路由、校验、业务规则、裸 SQL 全部堆在一起。

```python
import sqlalchemy                      # ← Router 直接依赖数据库
from fastapi import APIRouter, HTTPException
from sqlalchemy import text            # ← Router 直接执行 SQL

router = APIRouter()
engine = sqlalchemy.create_engine("postgresql://localhost/app")

@router.post("/users")
async def create_user(email: str, password: str):
    if len(password) < 8:              # ← 业务规则内联在 Router
        raise HTTPException(400, "password too short")
    with engine.connect() as conn:     # ← Router 直连 DB，无仓储
        result = conn.execute(text("INSERT INTO users ... RETURNING id"), ...)
    return {"id": result.scalar(), "email": email}
```

**问题**：无法单测（Router 耦合引擎）、换库要改业务层、3000 行后必然熵增、无任何架构约束。

### ✅ 有插件（按 `fastapi-web` 骨架分层生成）

4 个文件、单向依赖、各司其职：

```
src/router/users.py        传输层：DTO 校验 + 委托 Service（不碰 DB）
src/service/user_service.py 用例编排：CreateUserUseCase / GetUserUseCase（事务边界）
src/repository/user_repository.py 存储隔离：SQLAlchemy 只在此层
src/domain/user.py         领域层：纯 dataclass + 密码规则（零框架依赖）
```

```python
# src/router/users.py —— 薄
@router.post("/users")
async def create_user(req: CreateUserRequest, use_case: CreateUserUseCase = Depends()):
    try:
        user = use_case.execute(req.email, req.password)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return {"id": user.id, "email": user.email}
```

```python
# src/domain/user.py —— 纯
@dataclass(frozen=True)
class User:
    id: int
    email: str
    password_hash: str

    @staticmethod
    def validate_password(password: str) -> None:
        if len(password) < 8:
            raise ValueError("password too short")
```

**效果**：Router/Service/Repository/Domain 各自可单测；换数据库只动 Repository；业务规则收敛在 Domain。

---

## 2. 实测守卫记录（metavibe_check 真实输出）

### 无插件代码，绑定骨架后扫描

```text
📊 扫描文件总数: 1
⚠️ 告警列表 (2):
  [ERROR] src/router/users.py:5  — 违反架构分层硬规则: 层级 [router] 禁止导入 [sqlalchemy]。(匹配: import sqlalchemy)
  [ERROR] src/router/users.py:7  — 违反架构分层硬规则: 层级 [router] 禁止导入 [sqlalchemy]。(匹配: from sqlalchemy import text)
❌ 检查失败：检测到硬性架构阻断错误 (ERROR)。
```

→ **同一份"无插件"代码，一旦绑定骨架，2 处违规立即被硬性拦截。**

### 有插件分层代码，同一守卫扫描

```text
📊 扫描文件总数: 4
✔ 架构规约校验完美通过！无代码行数溢出与非法跨层依赖。
```

→ **分层后的代码零违规、直接放行。**

> 补充实测发现：`metavibe_check path=X` 从 `X/.metavibe` 读取绑定架构（每个项目/目录可自绑定）；守卫只按路径归属层判定，所以**没有分层目录的"扁平代码"反而无从施加规则**——这正说明骨架分层 + 绑定是规则生效的前提。

---

## 3. 十个维度对比

| 维度 | 无插件（传统 Vibe Coding） | 有插件（MetaVibe） |
| :--- | :--- | :--- |
| **初始结构** | 每次从零拍脑袋，结构随机 | `hub_use` 绑定黄金骨架 → 分层目录即产品契约 |
| **样板代码** | 每轮 3000~8000 Token 重造 | `assemble` 生成插槽桩 + `inject` 规则，仅 200~500 Token |
| **分层** | 无强制分层，逻辑随处堆放 | Router/Service/Repository/Domain 物理隔离、单向依赖 |
| **依赖方向** | 随意 import，环依赖常见 | 硬规则：`router` 禁导入 `repository`/`sqlalchemy`，`domain` 禁依赖框架 |
| **数据库访问** | Router 里裸 SQL 司空见惯 | 强制收敛到 Repository，业务层只依赖接口 |
| **业务规则** | 散落在 Handler 内联 | 收敛到 Domain 纯对象，可单测 |
| **守卫** | 无，3000 行后熵增崩塌 | `metavibe_check` 每次改动实时拦截（ERROR 阻断/WARNING 提示） |
| **AI 上下文** | 每轮重复读全部样板 | `inject` 高密度规则，Agent 一轮即懂架构约束 |
| **工程复用** | 范式零沉淀，项目间不传递 | 骨架可跨项目复用、随 Hub 持续积累 |
| **可维护性** | 大文件、强耦合、改一处崩一片 | 小文件（<300 行）、高内聚、低耦合 |

---

## 4. 工作流差异

| 步骤 | 无插件 | 有插件 |
| :--- | :--- | :--- |
| 1 | 直接说"写个用户注册 API" | `metavibe_hub_list` → `metavibe_hub_use fastapi-web` |
| 2 | AI 自由发挥生成单文件 | `metavibe_assemble` 生成 DBSessionSlot 等插槽桩 |
| 3 | （无守卫） | 按骨架分层生成 Router/Service/Repository/Domain |
| 4 | 完成后无人检查 | `metavibe_check` → 违规即拦截并修复 |
| 5 | 下个项目重新来过 | `metavibe_inject` 沉淀规则，全团队 Agent 共享 |

---

## 5. 结论

**插件的核心价值不是"多写了什么"，而是"拦住并塑造了什么"**：

1. **拦住**：跨层依赖、Router 直连 DB、领域依赖框架、超长文件——全部在生成期/提交前被 `metavibe_check` 硬性拦截（实测 2 个 ERROR 当场命中）。
2. **塑造**：同一任务从"单文件裸 SQL"变为"四层各司其职"——结构、依赖方向、职责边界全部由骨架预定义，AI 只需填插槽。
3. **沉淀**：骨架与规则跨项目积累，越用越强；AI 从"每次从 0 生成"变成"在巨人骨架上填充"。

> 对应首页宣言：**Make AI build masterpieces — every line on the shoulders of giants.**
