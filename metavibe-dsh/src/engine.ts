/**
 * MetaVibe engine core — read-only knowledge surfaces only.
 *
 * MetaVibe is an architecture advisor: it answers "which golden architecture
 * or best practice fits this project?" without ever scanning or modifying the
 * target workspace. Every function here is pure — no filesystem, no network,
 * no globals — so the model tools stay thin read-only projections over the
 * embedded data.
 *
 * @module metavibe-dsh/engine
 */

import type { MetaArch, MetaSkill } from './specs.ts'
import { parseMetaArch, parseMetaSkill } from './specs.ts'
import { CATALOG_SKILLS } from './data/catalog.ts'
import { HUB_SPECS } from './data/hub.ts'

export { parseMetaArch, parseMetaSkill } from './specs.ts'
export type {
  ArchGuardrails,
  ExampleCase,
  ForbiddenImport,
  LayerSpec,
  MetaArch,
  MetaSkill,
  SlotSpec,
} from './specs.ts'

/* ------------------------------------------------------------------ *
 * Hub — the golden architecture map (mirrors src/metavibe/engine/hub.py) *
 * ------------------------------------------------------------------ */

/**
 * List every built-in golden meta-architecture (the architecture map).
 * @returns the normalized specs, each with layers / slots / guardrails.
 */
export function hubList(): MetaArch[] {
  return HUB_SPECS.map(parseMetaArch)
}

/* ------------------------------------------------------------------ *
 * Catalog — the best-practices knowledge matrix (mirrors catalog.py)  *
 * ------------------------------------------------------------------ */

/** Category keys of the knowledge matrix. */
export type CatalogCategory = 'data_flow' | 'data_model' | 'philosophy' | 'meta_skill'

/**
 * Group the knowledge-matrix skills by category
 * (mirrors `CatalogManager.get_catalog_tree`).
 * @param skills - default to the built-in catalog.
 * @returns skills grouped by category.
 */
export function catalogTree(skills: readonly MetaSkill[] = CATALOG_SKILLS): Record<CatalogCategory, MetaSkill[]> {
  const tree: Record<CatalogCategory, MetaSkill[]> = { data_flow: [], data_model: [], philosophy: [], meta_skill: [] }
  for (const raw of skills) {
    const skill = parseMetaSkill(raw)
    const key: CatalogCategory = skill.category in tree ? (skill.category as CatalogCategory) : 'meta_skill'
    const bucket = tree[key]
    if (bucket) bucket.push(skill)
    else tree[key] = [skill]
  }
  return tree
}

/**
 * Look up a skill by exact id/title or substring of its id
 * (mirrors `CatalogManager.inspect_skill`).
 * @param query - id or title.
 * @param skills - default to the built-in catalog.
 * @returns the matching skill.
 */
export function catalogInspect(query: string, skills: readonly MetaSkill[] = CATALOG_SKILLS): MetaSkill {
  const target = query.toLowerCase().trim()
  for (const raw of skills) {
    const skill = parseMetaSkill(raw)
    if (skill.id.toLowerCase() === target || skill.title.toLowerCase() === target || skill.id.toLowerCase().includes(target)) return skill
  }
  throw new Error(`Catalog 中未找到符合条件 [${query}] 的数据流/案例 Skill。可以使用 \`metavibe_catalog_tree\` 查看层级树。`)
}

/* ------------------------------------------------------------------ *
 * Blueprint advisory — the flow-first lens                            *
 * (信息流路径 → 常见范式匹配 → 架构蓝图合成)                             *
 * ------------------------------------------------------------------ */

/** One canonical information-flow primitive (the flow-first vocabulary). */
export interface FlowPrimitive {
  name: string
  title: string
  description: string
  skill: string
  keywords: string[]
}

/** The canonical information-flow primitives metavibe recognizes. */
export const FLOW_PRIMITIVES: readonly FlowPrimitive[] = [
  { name: 'write', title: '写路径', description: '命令/变更如何进入系统并落地（Command → Handler → Domain → Repository）', skill: 'data_flows/write_path', keywords: ['写', '写入', '提交', '保存', '更新', '删除', '命令', 'command', 'create', 'insert', 'update', 'delete', 'post'] },
  { name: 'read', title: '读路径', description: '查询/展示如何组装（Query → Handler → DTO → View/Response）', skill: 'data_flows/read_path', keywords: ['读', '查询', '报表', '搜索', '列表', '展示', 'query', 'read', 'get', 'list', 'search', 'view'] },
  { name: 'event', title: '事件流', description: '领域事件如何发布/订阅/投影（publish → bus → handlers → projections）', skill: 'data_flows/event_stream', keywords: ['事件', '回调', 'webhook', '消息', '通知', '订阅', '发布', 'event', 'webhook', 'callback', 'message', 'notify', 'publish', 'subscribe'] },
  { name: 'integration', title: '外部集成流', description: '第三方 API/SDK/数据库适配如何隔离（adapter → port → domain）', skill: 'data_flows/integration_flow', keywords: ['对接', '集成', '第三方', '支付', '网关', 'api', 'sdk', 'adapter', 'integrat', 'third-party', 'payment', 'gateway'] },
  { name: 'realtime', title: '实时流', description: '变更如何推送订阅方（WAL/复制 → 频道 → 客户端）', skill: 'data_flows/realtime_flow', keywords: ['实时', '推送', 'websocket', 'realtime', 'subscription', 'push', 'live', 'stream'] },
  { name: 'task', title: '异步任务流', description: '后台作业如何调度执行（queue → worker → ack）', skill: 'data_flows/task_flow', keywords: ['异步', '后台', '队列', '定时', '任务', '作业', 'async', 'queue', 'worker', 'job', 'scheduled', 'cron', 'batch'] },
]

/**
 * Classify a free-text description into recognized information-flow primitives.
 * @param description - the user's information-flow description (Chinese or English).
 * @returns matched flow primitive names.
 */
export function classifyFlows(description: string): string[] {
  const text = String(description ?? '').toLowerCase()
  const matched: string[] = []
  for (const primitive of FLOW_PRIMITIVES) {
    if (primitive.keywords.some((keyword) => text.includes(keyword.toLowerCase()))) matched.push(primitive.name)
  }
  return matched
}

/** One scored architecture candidate in a blueprint recommendation. */
export interface BlueprintCandidate {
  name: string
  source: string
  description: string
  covered: string[]
  missing: string[]
  unused: number
  score: number
}

/** The composed flow-first blueprint recommendation. */
export interface Blueprint {
  flows: string[]
  recommendation?: MetaArch
  coverage: { matched: string[]; missing: string[] }
  alternatives: BlueprintCandidate[]
  suggestions: Array<{ flow: string; title: string; skill: string; description: string }>
}

/**
 * Compose a flow-first architecture blueprint: score every golden
 * architecture by how many requested information flows it realizes, then
 * report the best fit (layers/slots/guardrails), alternatives, and gap
 * suggestions pointing at catalog knowledge. Pure read-only synthesis.
 * @param flows - recognized flow primitive names (from `classifyFlows`).
 * @param preferred - optional architecture name to bias the ranking.
 * @returns the blueprint recommendation (lossless JSON, absent fields omitted).
 */
export function blueprintFor(flows: string[], preferred?: string): Blueprint {
  const architectures = hubList()
  const requested = new Set(flows)
  const candidates: BlueprintCandidate[] = architectures.map((arch) => {
    const realized = new Set(arch.flows.map((f) => f.name))
    const covered = flows.filter((f) => realized.has(f))
    const unused = arch.flows.filter((f) => !requested.has(f.name)).length
    let score = covered.length * 2 + (covered.length === flows.length && flows.length > 0 ? 1 : 0)
    if (preferred !== undefined && arch.name === preferred) score += 1
    return { name: arch.name, source: arch.source, description: arch.description, covered, missing: flows.filter((f) => !realized.has(f)), unused, score }
  })
  candidates.sort((x, y) => (y.score !== x.score ? y.score - x.score : x.unused - y.unused))
  const best = flows.length === 0 ? undefined : candidates.find((c) => c.score > 0)
  const recommendation = best ? architectures.find((a) => a.name === best.name) : undefined
  const suggestions = FLOW_PRIMITIVES
    .filter((p) => flows.includes(p.name) && !(recommendation?.flows.some((f) => f.name === p.name) ?? false))
    .map((p) => ({ flow: p.name, title: p.title, skill: p.skill, description: p.description }))
  return {
    flows,
    ...(recommendation ? { recommendation } : {}),
    coverage: {
      matched: recommendation ? flows.filter((f) => recommendation.flows.some((x) => x.name === f)) : [],
      missing: recommendation ? flows.filter((f) => !recommendation.flows.some((x) => x.name === f)) : flows,
    },
    alternatives: candidates.filter((c) => c.score > 0 && c.name !== (recommendation?.name ?? '')).slice(0, 3),
    suggestions,
  }
}
