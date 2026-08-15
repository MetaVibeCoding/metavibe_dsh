/**
 * MetaVibe knowledge-catalog tools — mirrors `metavibe catalog tree` /
 * `metavibe catalog inspect`.
 * @module metavibe-dsh/tools/catalog
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { catalogInspect, catalogTree } from '../engine.ts'
import type { CatalogCategory } from '../engine.ts'
import type { MetaSkill } from '../specs.ts'
import { renderText, requireArg } from './helpers.ts'

/** Canonical result of `metavibe_catalog_tree`. */
export interface CatalogTreeResult {
  categories: Record<CatalogCategory, MetaSkill[]>
}

const CATEGORY_TITLES: Record<CatalogCategory, string> = {
  data_flow: '🌊 数据流模式 (Data Flow Patterns)',
  data_model: '📐 数据模型范式 (Data Models & Schemas)',
  philosophy: '🧠 设计理念 (Architectural Philosophies)',
  meta_skill: '⚡ 类 Skill 案例包 (Meta-Skills)',
}

/**
 * Register `metavibe_catalog_tree` and `metavibe_catalog_inspect`.
 * @param ctx - registrant context.
 */
export function registerCatalogTools(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'metavibe_catalog_tree',
    description:
      'List the MetaVibe knowledge matrix grouped by category: data flows (CQRS…), data model schemas (DTOs…), architectural philosophies, and meta-skill case packs. Use it to discover catalog entries before `metavibe_catalog_inspect`.',
    parameters: {},
    output: {
      schema: { type: 'object', additionalProperties: true, properties: { categories: { type: 'json' } } },
      render(_args, value) {
        const { categories } = value as CatalogTreeResult
        const lines: string[] = []
        for (const [key, title] of Object.entries(CATEGORY_TITLES) as Array<[CatalogCategory, string]>) {
          lines.push(`${title}:`)
          const items = categories[key] ?? []
          if (items.length === 0) lines.push('  (暂无案例)')
          for (const item of items) lines.push(`  • [${item.id}] - ${item.title}`)
        }
        lines.push('\n提示: 使用 `metavibe_catalog_inspect` 检视具体案例或数据流契约。')
        return renderText(lines.join('\n'))
      },
    },
    execute() {
      return Promise.resolve({ categories: catalogTree() })
    },
  }))

  ctx.tools.register(defineTool({
    name: 'metavibe_catalog_inspect',
    description:
      'Inspect one MetaVibe catalog entry by id or title (e.g. `data_flows/cqrs_flow`, `meta_skills/auth_factory`): summary, data-flow diagram, data schemas, golden example cases, and agent instructions to follow.',
    parameters: {
      id: { type: 'string', required: true, description: 'Skill id or title, e.g. `data_flows/cqrs_flow` or `cqrs_flow`.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: { id: { type: 'string' }, title: { type: 'string' }, category: { type: 'string' }, summary: { type: 'string' } },
      },
      render(_args, value) {
        const skill = value as MetaSkill
        const lines = [`🎯 ${skill.title} (${skill.id})`, `   ${skill.summary}`, '']
        if (skill.data_flow_diagram) lines.push(`🌊 数据流:\n${skill.data_flow_diagram}\n`)
        if (skill.data_schema) {
          lines.push('📐 数据模型 Schema:')
          for (const [name, schema] of Object.entries(skill.data_schema)) lines.push(`  • ${name}: ${schema}`)
          lines.push('')
        }
        if (skill.example_cases.length > 0) {
          lines.push('💡 经典案例代码:')
          for (const caseItem of skill.example_cases) lines.push(`  ▶ ${caseItem.title}\n\`\`\`\n${caseItem.code_snippet}\n\`\`\``)
        }
        if (skill.agent_instructions.length > 0) {
          lines.push('🤖 Agent 执行指令:')
          for (const inst of skill.agent_instructions) lines.push(`  └─ ${inst}`)
        }
        return renderText(lines.join('\n'))
      },
    },
    execute(args) {
      return Promise.resolve(catalogInspect(requireArg(args, 'id')))
    },
  }))
}
