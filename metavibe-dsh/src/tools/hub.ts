/**
 * MetaVibe Hub tools — mirrors `metavibe hub list` / `metavibe hub use`.
 * @module metavibe-dsh/tools/hub
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { hubList, hubUse } from '../engine.ts'
import type { MetaArch } from '../specs.ts'
import { asString, renderText, requireArg, sessionCwd } from './helpers.ts'

/** Canonical result of `metavibe_hub_list`. */
export interface HubListResult {
  specs: MetaArch[]
}

/** Canonical result of `metavibe_hub_use`. */
export interface HubUseResult {
  destination: string
  name: string
}

/**
 * Register `metavibe_hub_list` and `metavibe_hub_use`.
 * @param ctx - registrant context.
 */
export function registerHubTools(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'metavibe_hub_list',
    description:
      'List the built-in golden meta-architecture specs (MetaVibe Spec Hub): name, source, version, description, layers and slots for each preset. Use it before `metavibe_hub_use` to choose an architecture to bind to the current project.',
    parameters: {},
    output: {
      schema: { type: 'object', additionalProperties: true, properties: { specs: { type: 'array', items: { type: 'json' } } } },
      render(_args, value) {
        const { specs } = value as HubListResult
        const lines = specs.map((s) => `• ${s.name}  (${s.source}, v${s.version})\n  ${s.description}\n  layers: ${s.layers.map((l) => l.name).join(', ') || '-'}\n  slots: ${s.slots.map((sl) => sl.name).join(', ') || '-'}`)
        return renderText(lines.length ? lines.join('\n\n') : 'Hub 中暂无可用预置 Spec。')
      },
    },
    execute() {
      return Promise.resolve({ specs: hubList() })
    },
  }))

  ctx.tools.register(defineTool({
    name: 'metavibe_hub_use',
    description:
      'Bind a built-in golden meta-architecture to a workspace by copying its spec into `<workspace>/.metavibe/specs/arch_<name>.json`. After binding, `metavibe_check` enforces its layers and `metavibe_assemble` generates its slot stubs.',
    parameters: {
      name: { type: 'string', required: true, description: 'Architecture name, e.g. `clean-arch-web`, `nextjs-app-router`, `design-patterns-gold` (see `metavibe_hub_list`).' },
      path: { type: 'string', description: 'Workspace root; defaults to the session working directory.' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true, properties: { destination: { type: 'string' }, name: { type: 'string' } } },
      render(_args, value) {
        const { name, destination } = value as HubUseResult
        return renderText(`✔ 已成功将 [${name}] 黄金元架构载入工程: [${destination}]`)
      },
    },
    async execute(args, exec) {
      const name = requireArg(args, 'name')
      const cwd = asString(args.path) ?? sessionCwd(exec) ?? '.'
      const destination = await hubUse(ctx.fs, name, { cwd, signal: exec.signal })
      return { destination, name }
    },
  }))
}
