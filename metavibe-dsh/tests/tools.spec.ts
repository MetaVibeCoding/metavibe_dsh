/**
 * Tool-suite tests — registration shape plus execute/render smoke tests for
 * every `metavibe_*` tool over the in-memory fs seam. Mirrors the spirit of
 * the official `tool-todo/tests/tool-todo.spec.ts` registration checks.
 * @module metavibe-dsh/tests/tools
 */

import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { registerTools } from '../src/tools/index.ts'
import type { FsSeam } from '../src/fs-utils.ts'
import { MemFs } from './fs-mem.ts'

/** Capture `defineTool` calls and expose the plugin `ctx.tools` surface. */
function registerSuite(fs: FsSeam): { tools: ToolDefinition[]; ctx: Context; exec: ToolRunContext } {
  const tools: ToolDefinition[] = []
  const ctx = {
    fs,
    tools: {
      register(definition: unknown): unknown {
        tools.push(definition as ToolDefinition)
        return () => {}
      },
    },
  } as unknown as Context
  registerTools(ctx, {})
  const exec = { signal: new AbortController().signal } as ToolRunContext
  return { tools, ctx, exec }
}

const MINIMAL_ARCH_RESPONSE = JSON.stringify({
  name: 'DemoAPI',
  source: 'demo',
  description: 'd',
  layers: [],
  slots: [],
  guardrails: { max_file_lines: 300, forbidden_imports: [] },
})

describe('registration', () => {
  it('registers the nine metavibe_* tools', () => {
    const { tools } = registerSuite(new MemFs())
    const names = tools.map((t) => t.name)
    expect(names).toEqual([
      'metavibe_hub_list',
      'metavibe_hub_use',
      'metavibe_check',
      'metavibe_inject',
      'metavibe_assemble',
      'metavibe_extract_prepare',
      'metavibe_extract_parse',
      'metavibe_catalog_tree',
      'metavibe_catalog_inspect',
    ])
  })

  it('declares JSON-schema parameters and lossless output schemas', () => {
    const { tools } = registerSuite(new MemFs())
    for (const tool of tools) {
      expect(tool.parameters).toBeDefined()
      expect(tool.output.schema).toBeDefined()
      expect(() => JSON.stringify(tool.output.schema)).not.toThrow()
      expect(typeof tool.output.render).toBe('function')
      expect(typeof tool.execute).toBe('function')
    }
  })
})

describe('hub tools', () => {
  it('lists the built-in hub', async () => {
    const { tools, exec } = registerSuite(new MemFs())
    const result = await tools[0]!.execute({}, exec)
    const specs = (result as { specs: Array<{ name: string }> }).specs
    expect(specs.map((s) => s.name)).toContain('clean-arch-web')
    const blocks = tools[0]!.output.render({}, result)
    expect(blocks[0]!.text).toContain('clean-arch-web')
  })

  it('binds an architecture into the workspace', async () => {
    const fs = new MemFs()
    const { tools, exec } = registerSuite(fs)
    const result = (await tools[1]!.execute({ name: 'clean-arch-web' }, exec)) as { destination: string }
    expect(result.destination).toBe('.metavibe/specs/arch_clean-arch-web.json')
    const content = await fs.readText({ targetKey: result.destination, displayPath: result.destination })
    expect(JSON.parse(content).name).toBe('clean-arch-web')
  })

  it('rejects an unknown architecture name', async () => {
    const { tools, exec } = registerSuite(new MemFs())
    await expect(tools[1]!.execute({ name: 'nope' }, exec)).rejects.toThrow(/未找到/)
  })
})

describe('guardrail tools', () => {
  it('scans a workspace', async () => {
    const fs = new MemFs(new Map([['src/domain/x.py', 'from infrastructure.repo import X\n']]))
    const { tools, exec } = registerSuite(fs)
    // metavibe_check is index 2; bind clean-arch-web first so imports are checked
    await tools[1]!.execute({ name: 'clean-arch-web' }, exec)
    const result = (await tools[2]!.execute({}, exec)) as { passed: boolean; violations: Array<{ severity: string }> }
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.severity === 'ERROR')).toBe(true)
  })

  it('injects rules markdown (and writes when output is given)', async () => {
    const fs = new MemFs()
    const { tools, exec } = registerSuite(fs)
    await tools[1]!.execute({ name: 'clean-arch-web' }, exec)
    const result = (await tools[3]!.execute({}, exec)) as { markdown: string; written_to?: string }
    expect(result.markdown).toContain('clean-arch-web')
    expect(result.written_to).toBeUndefined()
    const written = (await tools[3]!.execute({ output: '.metavibe/rules/demo.md' }, exec)) as { written_to?: string }
    expect(written.written_to).toBe('.metavibe/rules/demo.md')
  })

  it('assemble requires a bound architecture', async () => {
    const { tools, exec } = registerSuite(new MemFs())
    await expect(tools[4]!.execute({}, exec)).rejects.toThrow(/未发现已绑定的元架构/)
  })
})

describe('extract tools', () => {
  it('prepares a prompt from a file', async () => {
    const fs = new MemFs(new Map([['src/specs.ts', 'export const x = 1\n']]))
    const { tools, exec } = registerSuite(fs)
    const result = (await tools[5]!.execute({ source: 'src/specs.ts', name: 'P' }, exec)) as { prompt: string; source_kind: string }
    expect(result.source_kind).toBe('file')
    expect(result.prompt).toContain('(P)')
    expect(result.prompt).toContain('export const x = 1')
  })

  it('parses an LLM response (validate-only)', async () => {
    const { tools, exec } = registerSuite(new MemFs())
    const result = (await tools[6]!.execute({ response: MINIMAL_ARCH_RESPONSE, save: false }, exec)) as {
      kind: string
      spec: { name: string }
      saved_to?: string
    }
    expect(result.kind).toBe('meta_arch')
    expect(result.spec.name).toBe('DemoAPI')
    expect(result.saved_to).toBeUndefined()
    const blocks = tools[6]!.output.render({}, result)
    expect(blocks[0]!.text).toContain('DemoAPI')
  })

  it('parses and saves a spec by default', async () => {
    const fs = new MemFs()
    const { tools, exec } = registerSuite(fs)
    const result = (await tools[6]!.execute({ response: MINIMAL_ARCH_RESPONSE }, exec)) as { saved_to: string }
    expect(result.saved_to).toBe('.metavibe/specs/arch_demoapi.json')
  })
})

describe('catalog tools', () => {
  it('renders the knowledge tree', async () => {
    const { tools, exec } = registerSuite(new MemFs())
    const result = await tools[7]!.execute({}, exec)
    const blocks = tools[7]!.output.render({}, result)
    expect(blocks[0]!.text).toContain('data_flows/cqrs_flow')
  })

  it('inspects a skill', async () => {
    const { tools, exec } = registerSuite(new MemFs())
    const result = (await tools[8]!.execute({ id: 'cqrs_flow' }, exec)) as { id: string }
    expect(result.id).toBe('data_flows/cqrs_flow')
  })
})
