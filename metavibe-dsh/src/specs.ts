/**
 * Spec parsing & validation for the two knowledge surfaces MetaVibe ships:
 * Meta-Architectures (the golden architecture map) and Meta-Skills (the
 * best-practices catalog).
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

/** One information-flow path an architecture realizes (the flow-first lens). */
export interface FlowSpec {
  name: string
  description?: string
}

/** Normalized MetaArchitecture (snake_case JSON keys, mirrors the Python model). */
export interface MetaArch {
  name: string
  source: string
  version: string
  description: string
  flows: FlowSpec[]
  layers: LayerSpec[]
  slots: SlotSpec[]
  guardrails: ArchGuardrails
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

/** Unknown parsed payload narrowed to a plain record. */
type SpecRecord = Record<string, unknown>

function isRecord(value: unknown): value is SpecRecord {
  return value !== null && typeof value === 'object'
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
  const flows: FlowSpec[] = Array.isArray(data.flows)
    ? data.flows
        .filter((flow): flow is FlowSpec => isRecord(flow) && typeof flow.name === 'string')
        .map((flow) => ({
          name: flow.name,
          ...(typeof flow.description === 'string' ? { description: flow.description } : {}),
        }))
    : []
  return {
    name,
    source: typeof data.source === 'string' ? data.source : 'MetaVibe Spec Hub',
    version: typeof data.version === 'string' ? data.version : '1.0.0',
    description,
    flows,
    layers,
    slots,
    guardrails: {
      max_file_lines: Number.isFinite(rawGuardrails.max_file_lines) ? (rawGuardrails.max_file_lines as number) : 300,
      forbidden_imports: forbiddenImports,
    },
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
