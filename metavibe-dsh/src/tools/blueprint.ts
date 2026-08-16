/**
 * MetaVibe blueprint tool — flow-first architecture advisory (read-only).
 * @module metavibe-dsh/tools/blueprint
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { blueprintFor, classifyFlows } from '../engine.ts'
import type { Blueprint } from '../engine.ts'
import { renderText, requireArg } from './helpers.ts'

/**
 * Register `metavibe_blueprint` — the flow-first advisory: classify the
 * requested information flows, match the golden architecture(s), and compose
 * a blueprint recommendation (layers/slots/guardrails) with alternatives and
 * gap suggestions. Pure read-only synthesis over the embedded knowledge.
 * @param ctx - registrant context.
 */
export function registerBlueprintTool(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'metavibe_blueprint',
    description:
      'Flow-first architecture advisory: given the information flows a system needs (write / read / event / integration / realtime / task — Chinese or English), classify them, match the golden architecture(s) that realize those flows, and compose a blueprint recommendation (layers / slots / guardrails) with alternatives and gap suggestions pointing at catalog knowledge. Read-only — never reads or writes the workspace.',
    parameters: {
      flows: { type: 'string', required: true, description: 'Describe the information flows the system needs, e.g. "写入订单、查询报表、接收支付回调事件、对接第三方支付SDK".' },
      preferred: { type: 'string', description: 'Optional architecture name to bias the recommendation (see `metavibe_hub_list`).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          flows: { type: 'array', items: { type: 'string' } },
          recommendation: { type: 'json' },
          coverage: { type: 'json' },
          alternatives: { type: 'array', items: { type: 'json' } },
          suggestions: { type: 'array', items: { type: 'json' } },
        },
      },
      render(_args, value) {
        const blueprint = value as Blueprint
        const lines = [`🧭 信息流识别: ${blueprint.flows.length ? blueprint.flows.join(', ') : '(未识别到已知信息流 — 可描述 写/读/事件/集成/实时/任务)'}`]
        const recommendation = blueprint.recommendation
        if (recommendation) {
          lines.push(`🏛 推荐蓝图: ${recommendation.name} (${recommendation.source}, v${recommendation.version})`)
          lines.push(`   ${recommendation.description}`)
          lines.push(`   ✓ 覆盖信息流: ${blueprint.coverage.matched.join(', ') || '-'}`)
          lines.push(`   ✗ 未覆盖: ${blueprint.coverage.missing.join(', ') || '-'}`)
          lines.push(`   layers: ${recommendation.layers.map((l) => l.name).join(' → ') || '-'}`)
          if (recommendation.slots.length > 0) lines.push(`   slots: ${recommendation.slots.map((s) => s.name).join(', ')}`)
          const forbidden = recommendation.guardrails.forbidden_imports
          if (forbidden.length > 0) lines.push(`   guardrails: ${forbidden.map((r) => `禁止[${r.from}]→[${r.import}]`).join('; ')}`)
        } else {
          lines.push('ℹ 未匹配到蓝图——请补充信息流描述，或先用 `metavibe_hub_list` 浏览架构地图。')
        }
        if (blueprint.alternatives.length > 0) {
          lines.push(`备选: ${blueprint.alternatives.map((a) => `${a.name}(${a.covered.join('+') || '—'})`).join(' | ')}`)
        }
        if (blueprint.suggestions.length > 0) {
          lines.push('缺口与建议:')
          for (const s of blueprint.suggestions) lines.push(`   · ${s.title}(${s.flow}) → ${s.skill}: ${s.description}`)
        }
        return renderText(lines.join('\n'))
      },
    },
    execute(args) {
      const flows = classifyFlows(requireArg(args, 'flows'))
      const preferred = typeof args.preferred === 'string' && args.preferred.length > 0 ? args.preferred : undefined
      return Promise.resolve(blueprintFor(flows, preferred))
    },
  }))
}
