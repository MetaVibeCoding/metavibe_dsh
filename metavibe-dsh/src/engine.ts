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
