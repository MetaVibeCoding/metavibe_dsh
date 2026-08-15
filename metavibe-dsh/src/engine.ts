/**
 * MetaVibe engine core.
 *
 * A dependency-free port of the MetaVibe Python engine
 * (`src/metavibe/engine/*`) into the native DeepSeek Harness idiom:
 * pure functions plus an injected fs seam for every byte of I/O.
 * Nothing here touches `node:fs`, `process.cwd`, or any global; targets
 * and cancellation signals are always passed in, so the logic is testable
 * and the same code runs in a mounted plugin or a dynamic Package.
 *
 * Split into small modules to honor MetaVibe's own anti-entropy rule
 * (single files under 300 lines): `specs` (parsing/validation),
 * `fs-utils` (fs seam helpers), `guardrail` (checks), `rules`
 * (injection + slot assembly), and this module (workspace scan, LLM
 * extraction, Hub, and Catalog).
 *
 * @module metavibe-dsh/engine
 */

import type { FsSeam } from './fs-utils.ts'
import { resolveTarget, SPEC_SUFFIXES, walkTree } from './fs-utils.ts'
import type { LibraryDict, MetaArch, MetaSkill, SpecKind } from './specs.ts'
import { classifySpec, parseLibraryDict, parseMetaArch, parseMetaSkill, serializeSpec } from './specs.ts'
import { CATALOG_SKILLS } from './data/catalog.ts'
import { HUB_SPECS } from './data/hub.ts'
import { PROMPT_TEMPLATE } from './data/prompt-template.ts'

export { checkFile, CODE_EXTENSIONS, runGuardrail } from './guardrail.ts'
export type { GuardrailReport, Violation } from './guardrail.ts'
export { assembleSlots, buildSlotStub, generateRules } from './rules.ts'
export { IGNORED_DIRS, resolveTarget, SPEC_SUFFIXES, walkTree } from './fs-utils.ts'
export type { FsDirEntry, FsInfo, FsSeam, FsTarget } from './fs-utils.ts'
export { classifySpec, parseLibraryDict, parseMetaArch, parseMetaSkill, serializeSpec, specFileName } from './specs.ts'
export type {
  AIContext,
  AntiPattern,
  ArchGuardrails,
  ExampleCase,
  ForbiddenImport,
  GoldenPattern,
  LayerSpec,
  LibraryDict,
  LibraryGuardrails,
  MetaArch,
  MetaSkill,
  MetaSlotBinding,
  SlotSpec,
  SpecKind,
} from './specs.ts'

/** Result of a workspace spec scan. */
export interface ScanResult {
  architectures: MetaArch[]
  library_dicts: LibraryDict[]
}

/** One parsed LLM extraction response. */
export interface ParsedResponse {
  kind: SpecKind
  spec: MetaArch | LibraryDict
}

/* ------------------------------------------------------------------ *
 * Workspace scan — mirrors src/metavibe/engine/loader.py              *
 * ------------------------------------------------------------------ */

/**
 * Scan `<workspace>/.metavibe` and classify every spec file into
 * architectures and library dictionaries (mirrors `SpecLoader.scan_workspace`).
 * @param fs - the mounted fs seam.
 * @param opts - workspace root.
 * @returns the classified specs.
 */
export async function scanWorkspace(fs: FsSeam, opts: { cwd: string; signal?: AbortSignal }): Promise<ScanResult> {
  const architectures: MetaArch[] = []
  const library_dicts: LibraryDict[] = []
  const metavibeDir = await resolveTarget(fs, '.metavibe', { cwd: opts.cwd, signal: opts.signal })
  const info = await fs.stat(metavibeDir, opts.signal)
  if (!info || info.type !== 'directory') return { architectures, library_dicts }
  const files = await walkTree(fs, metavibeDir, opts.signal)
  for (const file of files) {
    if (!SPEC_SUFFIXES.has(file.rel.slice(file.rel.lastIndexOf('.')).toLowerCase())) continue
    let data: unknown
    try {
      data = JSON.parse(await fs.readText(file.target, opts.signal))
    } catch {
      continue // ignore malformed companion files
    }
    const kind = classifySpec(data)
    try {
      if (kind === 'meta_arch') architectures.push(parseMetaArch(data))
      else if (kind === 'library_dict') library_dicts.push(parseLibraryDict(data))
    } catch {
      // ignore specs that fail validation
    }
  }
  return { architectures, library_dicts }
}

/* ------------------------------------------------------------------ *
 * Extraction — mirrors src/metavibe/engine/extractor.py               *
 * ------------------------------------------------------------------ */

/**
 * Assemble the Meta-Extractor prompt sent to a mature LLM
 * (mirrors `ExtractorEngine.prepare_extraction_prompt`).
 * @param sourceText - source code, file tree, or doc text to analyze.
 * @param targetName - name of the analyzed project/pattern.
 * @param template - prompt template; defaults to the built-in one.
 * @returns the full prompt.
 */
export function buildExtractionPrompt(sourceText: string, targetName: string, template: string = PROMPT_TEMPLATE): string {
  return `${template}\n\n--- 待分析的目标代码/结构 (${targetName}) ---\n${sourceText}\n\n请直接返回合法的 MetaArchitecture JSON 对象。`
}

/**
 * Extract and parse an LLM extraction response into a validated Spec
 * (mirrors `ExtractorEngine.parse_ai_response_to_spec`). Handles Markdown
 * fenced blocks and returns the canonical `model_dump_json`-style object.
 * @param aiResponseText - raw model output (may contain ```json fences).
 * @returns the classified, validated spec.
 */
export function parseAiResponse(aiResponseText: string): ParsedResponse {
  let cleaned = String(aiResponseText).trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7).split('```')[0]!.trim()
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3).split('```')[0]!.trim()
  }
  let data: unknown
  try {
    data = JSON.parse(cleaned)
  } catch (error) {
    throw new Error(`解析 AI 响应失败: 响应不是合法 JSON (${(error as Error).message})`)
  }
  const kind = classifySpec(data)
  if (kind === 'meta_arch') return { kind, spec: parseMetaArch(data) }
  if (kind === 'library_dict') return { kind, spec: parseLibraryDict(data) }
  throw new Error('返回的 JSON 不符合 MetaArchitecture 或 LibraryDictionary 校验定义。')
}

/* ------------------------------------------------------------------ *
 * Hub — mirrors src/metavibe/engine/hub.py                            *
 * ------------------------------------------------------------------ */

/** List every built-in golden meta-architecture (mirrors `HubManager.list_available_specs`). */
export function hubList(): MetaArch[] {
  return HUB_SPECS.map(parseMetaArch)
}

/**
 * Find a built-in architecture by name (case-insensitive)
 * (mirrors `HubManager.use_spec` lookup).
 * @param name - architecture name.
 * @returns the normalized spec.
 */
export function hubFind(name: string): MetaArch {
  const found = HUB_SPECS.find((spec) => spec.name.toLowerCase() === name.toLowerCase())
  if (!found) throw new Error(`Hub 中未找到名为 [${name}] 的元架构。可以使用 \`metavibe hub list\` 查看可用列表。`)
  return parseMetaArch(found)
}

/**
 * Copy a built-in architecture spec into `<workspace>/.metavibe/specs/`
 * (mirrors `HubManager.use_spec`). `writeText` creates parent directories.
 * @param fs - the mounted fs seam.
 * @param name - architecture name, e.g. `clean-arch-web`.
 * @param opts - workspace root.
 * @returns the relative destination path.
 */
export async function hubUse(fs: FsSeam, name: string, opts: { cwd: string; signal?: AbortSignal }): Promise<string> {
  const spec = hubFind(name)
  const relPath = `.metavibe/specs/arch_${name.toLowerCase()}.json`
  const target = await resolveTarget(fs, relPath, { cwd: opts.cwd, signal: opts.signal })
  await fs.writeText(target, serializeSpec(spec), undefined, opts.signal)
  return relPath
}

/* ------------------------------------------------------------------ *
 * Catalog — mirrors src/metavibe/engine/catalog.py                    *
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
  throw new Error(`Catalog 中未找到符合条件 [${query}] 的数据流/案例 Skill。可以使用 \`metavibe catalog tree\` 查看层级树。`)
}
