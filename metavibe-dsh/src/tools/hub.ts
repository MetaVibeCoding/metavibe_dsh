/**
 * MetaVibe Hub tool — the golden architecture map (read-only).
 * @module metavibe-dsh/tools/hub
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { hubList } from '../engine.ts'
import type { MetaArch } from '../specs.ts'
import { renderText } from './helpers.ts'

/** Canonical result of `metavibe_hub_list`. */
export interface HubListResult {
  specs: MetaArch[]
}

/**
 * Register `metavibe_hub_list` — the read-only architecture map.
 * @param ctx - registrant context.
 */
export function registerHubTools(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'metavibe_hub_list',
    description:
      'List the built-in golden meta-architecture map (MetaVibe Spec Hub): name, source, version, description, layers and slots for each preset. Use it to choose a top-level architecture direction for a new or existing project. Read-only — never reads or writes the workspace.',
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
}
