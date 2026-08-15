/**
 * Spec parsing & validation — mirrors `src/metavibe/specs/*.py`.
 *
 * Every parser returns plain lossless-JSON objects: absent optional fields are
 * OMITTED (never `undefined`), so results can cross tool/harness JSON
 * boundaries safely. Required fields are validated with descriptive errors.
 *
 * @module metavibe-dsh/specs
 */

/* ------------------------------ types ------------------------------ */

/** One architecture layer with its hard rules. */
export interface LayerSpec {
  name: string
  path?: string
  rules: string[]
}

/** One extension slot of an architecture. */
export interface SlotSpec {
  name: string
  interface_type?: string
  description: string
}

/** A forbidden cross-layer import edge. */
export interface ForbiddenImport {
  from: string
  import: string
}

/** Architecture anti-entropy guardrails. */
export interface ArchGuardrails {
  max_file_lines: number
  forbidden_imports: ForbiddenImport[]
}

/** Normalized MetaArchitecture (snake_case JSON keys, mirrors the Python model). */
export interface MetaArch {
  name: string
  source: string
  version: string
  description: string
  layers: LayerSpec[]
  slots: SlotSpec[]
  guardrails: ArchGuardrails
}

/** A recommended golden pattern snippet. */
export interface GoldenPattern {
  title: string
  scenario?: string
  code_snippet: string
}

/** A forbidden anti-pattern warning. */
export interface AntiPattern {
  warning: string
  avoid_code?: string
  reason: string
}

/** AI-facing context of a library dictionary. */
export interface AIContext {
  summary: string
  golden_patterns: GoldenPattern[]
  anti_patterns: AntiPattern[]
}

/** Slot binding of a library dictionary. */
export interface MetaSlotBinding {
  slot_name: string
  provided_interfaces: string[]
}

/** Layering constraints of a library dictionary. */
export interface LibraryGuardrails {
  allowed_layers: string[]
  forbidden_layers: string[]
}

/** Normalized LibraryDictionary (mirrors the Python model). */
export interface LibraryDict {
  library_name: string
  version: string
  category: string
  language: string
  ai_context: AIContext
  meta_slot_bindings: MetaSlotBinding[]
  architectural_guardrails?: LibraryGuardrails
}

/** One golden example case of a catalog skill. */
export interface ExampleCase {
  title: string
  code_snippet: string
  explanation?: string
}

/** Normalized MetaSkill (mirrors the Python model). */
export interface MetaSkill {
  id: string
  title: string
  category: string
  tags: string[]
  summary: string
  data_flow_diagram?: string
  data_schema?: Record<string, string>
  example_cases: ExampleCase[]
  agent_instructions: string[]
}

/** The two Spec kinds the engine understands. */
export type SpecKind = 'meta_arch' | 'library_dict'

/** Unknown parsed payload narrowed to a plain record. */
type SpecRecord = Record<string, unknown>

function isRecord(value: unknown): value is SpecRecord {
  return value !== null && typeof value === 'object'
}

/* ---------------------------- classification ---------------------------- */

/**
 * Classify a parsed spec object into one of the two Spec kinds.
 * @param data - parsed JSON payload.
 * @returns `'meta_arch'`, `'library_dict'`, or `null` when neither.
 */
export function classifySpec(data: unknown): SpecKind | null {
  if (isRecord(data)) {
    if ('layers' in data && 'slots' in data) return 'meta_arch'
    if ('library_name' in data && 'ai_context' in data) return 'library_dict'
  }
  return null
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(message)
  return value
}

function stringsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/* ------------------------------ meta arch ------------------------------ */

/**
 * Validate and normalize a MetaArchitecture payload (mirrors `MetaArchitecture`).
 * @param data - raw spec payload.
 * @returns normalized architecture with snake_case JSON keys.
 */
export function parseMetaArch(data: unknown): MetaArch {
  if (!isRecord(data)) throw new Error('invalid MetaArchitecture: expected a JSON object')
  const name = requireString(data.name, 'invalid MetaArchitecture: `name` must be a non-empty string')
  const description = requireString(data.description, 'invalid MetaArchitecture: `description` must be a non-empty string')
  const layers: LayerSpec[] = Array.isArray(data.layers)
    ? data.layers.map((layer) => {
        if (!isRecord(layer) || typeof layer.name !== 'string') throw new Error('invalid MetaArchitecture: every layer needs a `name`')
        return {
          name: layer.name,
          ...(typeof layer.path === 'string' ? { path: layer.path } : {}),
          rules: stringsOf(layer.rules),
        }
      })
    : []
  const slots: SlotSpec[] = Array.isArray(data.slots)
    ? data.slots.map((slot) => {
        if (!isRecord(slot) || typeof slot.name !== 'string') throw new Error('invalid MetaArchitecture: every slot needs a `name`')
        return {
          name: slot.name,
          ...(typeof slot.interface_type === 'string' ? { interface_type: slot.interface_type } : {}),
          description: typeof slot.description === 'string' ? slot.description : '',
        }
      })
    : []
  const rawGuardrails = isRecord(data.guardrails) ? data.guardrails : {}
  const forbiddenImports: ForbiddenImport[] = Array.isArray(rawGuardrails.forbidden_imports)
    ? rawGuardrails.forbidden_imports
        .filter((rule): rule is ForbiddenImport => isRecord(rule) && typeof rule.from === 'string' && typeof rule.import === 'string')
        .map((rule) => ({ from: rule.from, import: rule.import }))
    : []
  return {
    name,
    source: typeof data.source === 'string' ? data.source : 'MetaVibe Spec Hub',
    version: typeof data.version === 'string' ? data.version : '1.0.0',
    description,
    layers,
    slots,
    guardrails: {
      max_file_lines: Number.isFinite(rawGuardrails.max_file_lines) ? (rawGuardrails.max_file_lines as number) : 300,
      forbidden_imports: forbiddenImports,
    },
  }
}

/* --------------------------- library dictionary --------------------------- */

/**
 * Validate and normalize a LibraryDictionary payload (mirrors `LibraryDictionary`).
 * @param data - raw dictionary payload.
 * @returns normalized dictionary.
 */
export function parseLibraryDict(data: unknown): LibraryDict {
  if (!isRecord(data)) throw new Error('invalid LibraryDictionary: expected a JSON object')
  const libraryName = requireString(data.library_name, 'invalid LibraryDictionary: `library_name` must be a non-empty string')
  const aiContext = isRecord(data.ai_context) ? data.ai_context : {}
  if (typeof aiContext.summary !== 'string') throw new Error('invalid LibraryDictionary: `ai_context.summary` must be a string')
  const architectural = isRecord(data.architectural_guardrails) ? data.architectural_guardrails : undefined
  return {
    library_name: libraryName,
    version: typeof data.version === 'string' ? data.version : '1.0.0',
    category: typeof data.category === 'string' ? data.category : 'library',
    language: typeof data.language === 'string' ? data.language : '',
    ai_context: {
      summary: aiContext.summary,
      golden_patterns: Array.isArray(aiContext.golden_patterns) ? (aiContext.golden_patterns as GoldenPattern[]) : [],
      anti_patterns: Array.isArray(aiContext.anti_patterns) ? (aiContext.anti_patterns as AntiPattern[]) : [],
    },
    meta_slot_bindings: Array.isArray(data.meta_slot_bindings) ? (data.meta_slot_bindings as MetaSlotBinding[]) : [],
    ...(architectural
      ? {
          architectural_guardrails: {
            allowed_layers: stringsOf(architectural.allowed_layers),
            forbidden_layers: stringsOf(architectural.forbidden_layers),
          },
        }
      : {}),
  }
}

/* ------------------------------- meta skill ------------------------------- */

/**
 * Validate and normalize a MetaSkill payload (mirrors `MetaSkill`).
 * @param data - raw catalog payload.
 * @returns normalized skill.
 */
export function parseMetaSkill(data: unknown): MetaSkill {
  if (!isRecord(data)) throw new Error('invalid MetaSkill: expected a JSON object')
  const id = requireString(data.id, 'invalid MetaSkill: `id` must be a non-empty string')
  const title = requireString(data.title, 'invalid MetaSkill: `title` must be a non-empty string')
  const summary = requireString(data.summary, 'invalid MetaSkill: `summary` must be a string')
  const skill: MetaSkill = {
    id,
    title,
    category: typeof data.category === 'string' ? data.category : 'meta_skill',
    tags: stringsOf(data.tags),
    summary,
    example_cases: Array.isArray(data.example_cases) ? (data.example_cases as ExampleCase[]) : [],
    agent_instructions: stringsOf(data.agent_instructions),
  }
  if (typeof data.data_flow_diagram === 'string') skill.data_flow_diagram = data.data_flow_diagram
  if (isRecord(data.data_schema)) skill.data_schema = data.data_schema as Record<string, string>
  return skill
}

/* ------------------------------- serialization ------------------------------- */

/**
 * Serialize a validated spec to pretty JSON (mirrors `model_dump_json(indent=2)`).
 * @param spec - validated spec object.
 * @returns pretty JSON text.
 */
export function serializeSpec(spec: MetaArch | LibraryDict): string {
  return JSON.stringify(spec, null, 2)
}

/** Default workspace filename for a spec, mirroring `ExtractorEngine.save_spec_to_workspace`. */
export function specFileName(kind: SpecKind, spec: MetaArch | LibraryDict): string {
  if (kind === 'meta_arch') {
    const arch = spec as MetaArch
    return `arch_${arch.name.toLowerCase()}.json`
  }
  const lib = spec as LibraryDict
  return `lib_${lib.library_name.toLowerCase()}.json`
}
