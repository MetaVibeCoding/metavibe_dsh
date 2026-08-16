/**
 * Tool-suite tests — registration shape plus execute/render smoke tests for
 * the four READ-ONLY `metavibe_*` tools. Mirrors the spirit of the official
 * `tool-todo/tests/tool-todo.spec.ts` registration checks.
 * @module metavibe-dsh/tests/tools
 */

import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { registerTools } from '../src/tools/index.ts'

/** Capture `defineTool` calls and expose the plugin `ctx.tools` surface. */
function registerSuite(): { tools: ToolDefinition[]; ctx: Context; exec: ToolRunContext } {
  const tools: ToolDefinition[] = []
  const ctx = {
    tools: {
      register(definition: unknown): unknown {
        tools.push(definition as ToolDefinition)
        return () => {}
      },
    },
  } as unknown as Context
  registerTools(ctx)
  const exec = { signal: new AbortController().signal } as ToolRunContext
  return { tools, ctx, exec }
}

describe('registration', () => {
  it('registers the four read-only metavibe_* tools', () => {
    const { tools } = registerSuite()
    const names = tools.map((t) => t.name)
    expect(names).toEqual([
      'metavibe_hub_list',
      'metavibe_catalog_tree',
      'metavibe_catalog_inspect',
      'metavibe_blueprint',
    ])
  })

  it('declares JSON-schema parameters and lossless output schemas', () => {
    const { tools } = registerSuite()
    for (const tool of tools) {
      expect(tool.parameters).toBeDefined()
      expect(tool.output.schema).toBeDefined()
      expect(() => JSON.stringify(tool.output.schema)).not.toThrow()
      expect(typeof tool.output.render).toBe('function')
      expect(typeof tool.execute).toBe('function')
    }
  })
})

describe('hub tool — architecture map', () => {
  it('lists the built-in architectures and renders the map', async () => {
    const { tools, exec } = registerSuite()
    const result = await tools[0]!.execute({}, exec)
    const specs = (result as { specs: Array<{ name: string }> }).specs
    expect(specs.map((s) => s.name)).toContain('clean-arch-web')
    const blocks = tools[0]!.output.render({}, result)
    expect(blocks[0]!.text).toContain('clean-arch-web')
  })
})

describe('catalog tools — best practices', () => {
  it('renders the knowledge tree', async () => {
    const { tools, exec } = registerSuite()
    const result = await tools[1]!.execute({}, exec)
    const blocks = tools[1]!.output.render({}, result)
    expect(blocks[0]!.text).toContain('data_flows/cqrs_flow')
  })

  it('inspects a skill and renders its guidance', async () => {
    const { tools, exec } = registerSuite()
    const result = (await tools[2]!.execute({ id: 'cqrs_flow' }, exec)) as { id: string }
    expect(result.id).toBe('data_flows/cqrs_flow')
    const blocks = tools[2]!.output.render({}, result)
    expect(blocks[0]!.text).toContain('CQRS')
  })

  it('rejects an unknown id', async () => {
    const { tools, exec } = registerSuite()
    await expect(tools[2]!.execute({ id: 'missing' }, exec)).rejects.toThrow(/未找到/)
  })
})

describe('blueprint tool — flow-first advisory', () => {
  it('composes a blueprint from an information-flow description', async () => {
    const { tools, exec } = registerSuite()
    const result = (await tools[3]!.execute({ flows: '写入订单、查询报表、接收订单变更事件' }, exec)) as {
      flows: string[]
      recommendation: { name: string } | undefined
    }
    expect(result.flows).toEqual(expect.arrayContaining(['write', 'read', 'event']))
    expect(result.recommendation?.name).toBe('stripe-api')
    const blocks = tools[3]!.output.render({}, result)
    expect(blocks[0]!.text).toContain('推荐蓝图')
  })

  it('handles unrecognized flows gracefully', async () => {
    const { tools, exec } = registerSuite()
    const result = (await tools[3]!.execute({ flows: '随便描述' }, exec)) as { flows: string[]; recommendation?: unknown }
    expect(result.flows).toEqual([])
    expect(result.recommendation).toBeUndefined()
    const blocks = tools[3]!.output.render({}, result)
    expect(blocks[0]!.text).toContain('未匹配到蓝图')
  })
})
