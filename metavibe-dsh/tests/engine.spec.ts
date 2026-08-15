/**
 * Engine unit tests — parsing/validation, guardrails, rules, extraction,
 * Hub, Catalog, and workspace scanning over the in-memory fs seam.
 * Mirrors the scope of `src/metavibe/engine/*` behaviour.
 * @module metavibe-dsh/tests/engine
 */

import { describe, expect, it } from 'vitest'
import {
  buildExtractionPrompt,
  buildSlotStub,
  catalogInspect,
  catalogTree,
  checkFile,
  classifySpec,
  generateRules,
  hubFind,
  hubList,
  hubUse,
  parseAiResponse,
  parseLibraryDict,
  parseMetaArch,
  parseMetaSkill,
  scanWorkspace,
  serializeSpec,
  specFileName,
} from '../src/engine.ts'
import { runGuardrail } from '../src/guardrail.ts'
import { MemFs } from './fs-mem.ts'

const MINIMAL_ARCH = {
  name: 'TestArch',
  source: 'tests',
  description: 'a test architecture',
  layers: [],
  slots: [],
  guardrails: { max_file_lines: 300, forbidden_imports: [] },
}

describe('classifySpec', () => {
  it('detects meta_arch vs library_dict vs neither', () => {
    expect(classifySpec({ layers: [], slots: [] })).toBe('meta_arch')
    expect(classifySpec({ library_name: 'x', ai_context: {} })).toBe('library_dict')
    expect(classifySpec({ name: 'x' })).toBeNull()
    expect(classifySpec(null)).toBeNull()
    expect(classifySpec('x')).toBeNull()
  })
})

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
})

describe('parseLibraryDict / parseMetaSkill', () => {
  it('parses a library dict with defaults', () => {
    const lib = parseLibraryDict({ library_name: 'zustand', ai_context: { summary: 's' } })
    expect(lib.category).toBe('library')
    expect(lib.ai_context.golden_patterns).toEqual([])
    expect(Object.hasOwn(lib, 'architectural_guardrails')).toBe(false)
  })

  it('omits absent skill fields', () => {
    const skill = parseMetaSkill({ id: 'a', title: 'A', summary: 's' })
    expect(Object.hasOwn(skill, 'data_flow_diagram')).toBe(false)
    expect(Object.hasOwn(skill, 'data_schema')).toBe(false)
    const withDiagram = parseMetaSkill({ id: 'b', title: 'B', summary: 's', data_flow_diagram: '->' })
    expect(withDiagram.data_flow_diagram).toBe('->')
  })
})

describe('guardrails', () => {
  const arch = hubFind('clean-arch-web')

  it('flags line-limit violations as WARNING', () => {
    const text = Array.from({ length: 350 }, (_, i) => `# line ${i}`).join('\n')
    const [v] = checkFile({ rel: 'src/big.py', text }, arch, 300)
    expect(v?.rule_type).toBe('line_limit')
    expect(v?.severity).toBe('WARNING')
  })

  it('flags forbidden cross-layer imports as ERROR', () => {
    const violations = checkFile({ rel: 'src/domain/entity.py', text: 'from infrastructure.repo import X\n' }, arch, 300)
    expect(violations[0]?.rule_type).toBe('forbidden_import')
    expect(violations[0]?.severity).toBe('ERROR')
    expect(violations[0]?.line_number).toBe(1)
  })

  it('keeps clean files clean', () => {
    expect(checkFile({ rel: 'src/presentation/main.py', text: 'from domain.entity import E\n' }, arch, 300)).toEqual([])
  })

  it('sweeps a workspace through the fs seam', async () => {
    const fs = new MemFs(new Map([
      ['src/domain/x.py', 'from infrastructure.repo import X\n'],
      ['src/presentation/y.py', 'from domain.entity import E\n'],
      ['src/huge.py', Array.from({ length: 400 }, () => '# l').join('\n')],
    ]))
    const report = await runGuardrail(fs, { cwd: '.', maxLines: 300, metaArch: arch })
    expect(report.total_files_scanned).toBe(3)
    expect(report.passed).toBe(false)
    expect(report.violations.some((v) => v.severity === 'ERROR')).toBe(true)
    expect(report.violations.some((v) => v.rule_type === 'line_limit')).toBe(true)
  })
})

describe('rules & slots', () => {
  it('generates rules markdown with architecture and library sections', () => {
    const arch = hubFind('clean-arch-web')
    const lib = parseLibraryDict({ library_name: 'fastapi', ai_context: { summary: 's' } })
    const md = generateRules([arch], [lib])
    expect(md).toContain('# MetaVibe Agent Guidance & Anti-Entropy Guardrails')
    expect(md).toContain('### 元架构: clean-arch-web')
    expect(md).toContain('### 库: fastapi')
    expect(md).toContain('禁止 `[domain]` 导入 `[infrastructure]`')
  })

  it('builds a slot stub', () => {
    const stub = buildSlotStub({ name: 'AuthAdapterSlot', description: 'auth' }, 'clean-arch-web')
    expect(stub).toContain('class AuthAdapterSlotProtocol(Protocol)')
    expect(stub).toContain('class BaseAuthAdapterSlot')
  })
})

describe('extraction', () => {
  it('builds an extraction prompt', () => {
    const prompt = buildExtractionPrompt('code', 'MyPattern')
    expect(prompt).toContain('--- 待分析的目标代码/结构 (MyPattern) ---')
    expect(prompt).toContain('code')
  })

  it('parses fenced and bare JSON responses', () => {
    const fenced = parseAiResponse(`\`\`\`json\n${JSON.stringify(MINIMAL_ARCH)}\n\`\`\``)
    expect(fenced.kind).toBe('meta_arch')
    expect(fenced.spec.name).toBe('TestArch')
    const bare = parseAiResponse(JSON.stringify({ library_name: 'x', ai_context: { summary: 's' } }))
    expect(bare.kind).toBe('library_dict')
  })

  it('rejects invalid JSON and unknown shapes', () => {
    expect(() => parseAiResponse('not json')).toThrow(/JSON/)
    expect(() => parseAiResponse(JSON.stringify({ name: 'x' }))).toThrow(/不符合/)
  })
})

describe('hub', () => {
  it('lists built-in architectures', () => {
    const names = hubList().map((s) => s.name)
    expect(names).toContain('clean-arch-web')
    expect(names).toContain('design-patterns-gold')
    expect(names).toContain('nextjs-app-router')
  })

  it('finds by case-insensitive name and rejects unknown', () => {
    expect(hubFind('CLEAN-ARCH-WEB').name).toBe('clean-arch-web')
    expect(() => hubFind('nope')).toThrow(/未找到/)
  })

  it('copies a spec into the workspace', async () => {
    const fs = new MemFs()
    const rel = await hubUse(fs, 'clean-arch-web', { cwd: '.' })
    expect(rel).toBe('.metavibe/specs/arch_clean-arch-web.json')
    const content = await fs.readText({ targetKey: rel, displayPath: rel })
    expect(JSON.parse(content).name).toBe('clean-arch-web')
  })
})

describe('catalog', () => {
  it('groups skills by category', () => {
    const tree = catalogTree()
    expect(tree.data_flow.map((s) => s.id)).toContain('data_flows/cqrs_flow')
    expect(tree.data_model).toHaveLength(1)
    expect(tree.philosophy).toHaveLength(1)
    expect(tree.meta_skill).toHaveLength(1)
  })

  it('finds skills by id or title substring', () => {
    expect(catalogInspect('cqrs_flow').id).toBe('data_flows/cqrs_flow')
    expect(catalogInspect('auth_factory').category).toBe('meta_skill')
    expect(() => catalogInspect('missing')).toThrow(/未找到/)
  })
})

describe('scanWorkspace', () => {
  it('classifies specs under .metavibe and ignores non-spec files', async () => {
    const fs = new MemFs(new Map([
      ['.metavibe/specs/arch_a.json', JSON.stringify({ name: 'A', description: 'a', layers: [], slots: [], guardrails: {} })],
      ['.metavibe/specs/lib_b.json', JSON.stringify({ library_name: 'b', ai_context: { summary: 's' } })],
      ['.metavibe/specs/schema.json', JSON.stringify({ $schema: 'x' })],
      ['.metavibe/README.md', 'not a spec'],
    ]))
    const { architectures, library_dicts } = await scanWorkspace(fs, { cwd: '.' })
    expect(architectures.map((a) => a.name)).toEqual(['A'])
    expect(library_dicts.map((l) => l.library_name)).toEqual(['b'])
  })

  it('returns empty when .metavibe is absent', async () => {
    const fs = new MemFs()
    const result = await scanWorkspace(fs, { cwd: '.' })
    expect(result).toEqual({ architectures: [], library_dicts: [] })
  })
})

describe('serialization', () => {
  it('round-trips spec JSON and file names', () => {
    const arch = parseMetaArch(MINIMAL_ARCH)
    expect(JSON.parse(serializeSpec(arch)).name).toBe('TestArch')
    expect(specFileName('meta_arch', arch)).toBe('arch_testarch.json')
    const lib = parseLibraryDict({ library_name: 'MyLib', ai_context: { summary: 's' } })
    expect(specFileName('library_dict', lib)).toBe('lib_mylib.json')
  })
})
