/**
 * Engine unit tests — spec parsing/validation plus the two read-only
 * knowledge surfaces: Hub (architecture map) and Catalog (best practices).
 * Mirrors the scope of `src/engine/*` behaviour.
 * @module metavibe-dsh/tests/engine
 */

import { describe, expect, it } from 'vitest'
import { blueprintFor, catalogInspect, catalogTree, classifyFlows, hubList, parseMetaArch, parseMetaSkill } from '../src/engine.ts'

const MINIMAL_ARCH = {
  name: 'TestArch',
  source: 'tests',
  description: 'a test architecture',
  layers: [],
  slots: [],
  guardrails: { max_file_lines: 300, forbidden_imports: [] },
}

describe('parseMetaArch', () => {
  it('rejects missing required fields', () => {
    expect(() => parseMetaArch({})).toThrow(/name/)
    expect(() => parseMetaArch({ name: 'x' })).toThrow(/description/)
  })

  it('applies defaults and omits absent optional keys (lossless JSON)', () => {
    const arch = parseMetaArch({ name: 'X', description: 'd', layers: [{ name: 'L' }], slots: [{ name: 'S', description: 'sd' }] })
    expect(arch.version).toBe('1.0.0')
    expect(arch.source).toBe('MetaVibe Spec Hub')
    expect(arch.guardrails.max_file_lines).toBe(300)
    expect(arch.flows).toEqual([])
    expect(Object.hasOwn(arch.layers[0]!, 'path')).toBe(false)
    expect(Object.hasOwn(arch.slots[0]!, 'interface_type')).toBe(false)
    expect(Object.keys(arch).every((k) => arch[k as keyof typeof arch] !== undefined)).toBe(true)
  })

  it('filters malformed forbidden imports', () => {
    const arch = parseMetaArch({
      ...MINIMAL_ARCH,
      guardrails: { forbidden_imports: [{ from: 'domain', import: 'infra' }, { from: 1, import: 'x' }, null] },
    })
    expect(arch.guardrails.forbidden_imports).toEqual([{ from: 'domain', import: 'infra' }])
  })

  it('parses the flows annotation (flow-first lens)', () => {
    const arch = parseMetaArch({ ...MINIMAL_ARCH, flows: [{ name: 'write' }, { name: 'event', description: 'webhook' }] })
    expect(arch.flows).toEqual([{ name: 'write' }, { name: 'event', description: 'webhook' }])
  })
})

describe('parseMetaSkill', () => {
  it('omits absent optional fields', () => {
    const skill = parseMetaSkill({ id: 'a', title: 'A', summary: 's' })
    expect(Object.hasOwn(skill, 'data_flow_diagram')).toBe(false)
    expect(Object.hasOwn(skill, 'data_schema')).toBe(false)
    const withDiagram = parseMetaSkill({ id: 'b', title: 'B', summary: 's', data_flow_diagram: '->' })
    expect(withDiagram.data_flow_diagram).toBe('->')
  })
})

describe('hub — architecture map', () => {
  it('lists built-in architectures', () => {
    const names = hubList().map((s) => s.name)
    expect(names).toContain('clean-arch-web')
    expect(names).toContain('design-patterns-gold')
    expect(names).toContain('nextjs-app-router')
  })
})

describe('catalog — best practices', () => {
  it('groups skills by category', () => {
    const tree = catalogTree()
    expect(tree.data_flow).toHaveLength(7) // cqrs + 6 flow primitives
    expect(tree.data_flow.map((s) => s.id)).toContain('data_flows/cqrs_flow')
    expect(tree.data_flow.map((s) => s.id)).toContain('data_flows/write_path')
    expect(tree.data_model).toHaveLength(1)
    expect(tree.philosophy).toHaveLength(1)
    expect(tree.meta_skill).toHaveLength(2) // auth_factory + dsh_plugin_paradigm
  })

  it('finds skills by id or title substring', () => {
    expect(catalogInspect('cqrs_flow').id).toBe('data_flows/cqrs_flow')
    expect(catalogInspect('auth_factory').category).toBe('meta_skill')
    expect(() => catalogInspect('missing')).toThrow(/未找到/)
  })
})

describe('blueprint — flow-first advisory', () => {
  it('classifies information flows from free text', () => {
    expect(classifyFlows('写入订单、查询报表、接收支付回调事件、对接第三方支付SDK')).toEqual(expect.arrayContaining(['write', 'read', 'event', 'integration']))
    expect(classifyFlows('nothing specific here')).toEqual([])
  })

  it('recommends the architecture covering the most flows', () => {
    const blueprint = blueprintFor(['write', 'read', 'event'])
    expect(blueprint.recommendation?.name).toBe('stripe-api')
    expect(blueprint.coverage.matched).toEqual(['write', 'read', 'event'])
  })

  it('reports alternatives and gap suggestions', () => {
    expect(blueprintFor(['read', 'realtime']).recommendation?.name).toBe('supabase-baas')
    expect(blueprintFor(['read', 'realtime']).suggestions).toEqual([])
    expect(blueprintFor(['read', 'task']).suggestions.some((s) => s.flow === 'task')).toBe(true)
  })

  it('returns no recommendation for unknown flows', () => {
    expect(blueprintFor([]).recommendation).toBeUndefined()
  })
})
