/**
 * MetaVibe guardrail & assembly tools — mirrors `metavibe check`,
 * `metavibe inject`, and `metavibe assemble`.
 * @module metavibe-dsh/tools/guardrail
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { assembleSlots, generateRules, runGuardrail, scanWorkspace } from '../engine.ts'
import type { GuardrailReport } from '../guardrail.ts'
import { asString, renderText, sessionCwd } from './helpers.ts'

/** Resolved deployment-facing config for the guardrail tool group. */
export interface GuardrailToolConfig {
  maxFileLines?: number
  slotsOutput?: string
}

/** Canonical result of `metavibe_inject`. */
export interface InjectResult {
  markdown: string
  written_to?: string
}

/** Canonical result of `metavibe_assemble`. */
export interface AssembleResult {
  files: string[]
  created: string[]
}

/**
 * Register `metavibe_check`, `metavibe_inject`, and `metavibe_assemble`.
 * @param ctx - registrant context.
 * @param config - resolved row config.
 */
export function registerGuardrailTools(ctx: Context, config: GuardrailToolConfig): void {
  const maxFileLines = config.maxFileLines ?? 300
  const slotsOutput = config.slotsOutput ?? 'src/slots'

  ctx.tools.register(defineTool({
    name: 'metavibe_check',
    description:
      'Run the anti-entropy architecture guardrail over a workspace: single-file line-limit warnings plus hard ERROR violations when a bound meta-architecture forbids cross-layer imports. Skips .git/.venv/node_modules/dist/build/__pycache__/.metavibe.',
    parameters: {
      path: { type: 'string', description: 'Project root to scan; defaults to the session working directory.' },
      max_lines: { type: 'integer', description: 'Single-file line cap (default 300).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          total_files_scanned: { type: 'integer' },
          passed: { type: 'boolean' },
          violations: { type: 'array', items: { type: 'json' } },
        },
      },
      render(_args, value) {
        const report = value as GuardrailReport
        const lines = [`📊 扫描文件总数: ${report.total_files_scanned}`]
        if (report.violations.length === 0) {
          lines.push('✔ 架构规约校验完美通过！无代码行数溢出与非法跨层依赖。')
          return renderText(lines.join('\n'))
        }
        lines.push(`⚠️ 告警列表 (${report.violations.length}):`)
        for (const v of report.violations) {
          const sev = v.severity === 'ERROR' ? 'ERROR' : 'WARN'
          const at = v.line_number ? `:${v.line_number}` : ''
          lines.push(`  [${sev}] ${v.file_path}${at} — ${v.message}`)
        }
        lines.push(report.passed ? '\n[yellow]告警项为建议重构项目，未触发阻断性 ERROR。[/yellow]' : '\n❌ 检查失败：检测到硬性架构阻断错误 (ERROR)。')
        return renderText(lines.join('\n'))
      },
    },
    async execute(args, exec) {
      const cwd = asString(args.path) ?? sessionCwd(exec) ?? '.'
      const maxLines = typeof args.max_lines === 'number' ? args.max_lines : maxFileLines
      const { architectures } = await scanWorkspace(ctx.fs, { cwd, signal: exec.signal })
      return runGuardrail(ctx.fs, { cwd, signal: exec.signal, maxLines, metaArch: architectures[0] })
    },
  }))

  ctx.tools.register(defineTool({
    name: 'metavibe_inject',
    description:
      'Compress bound meta-architectures and library dictionaries into one high-density Agent Rules markdown document (saves 90%+ of context tokens). Returns the markdown; pass `output` to also write it to a rules file (e.g. `.cursor/rules/metavibe.mdc`).',
    parameters: {
      path: { type: 'string', description: 'Workspace root containing `.metavibe/specs/`; defaults to the session working directory.' },
      output: { type: 'string', description: 'Optional destination file path to write the generated rules to.' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true, properties: { markdown: { type: 'string' }, written_to: { type: 'string' } } },
      render(_args, value) {
        const { markdown } = value as InjectResult
        return renderText(markdown)
      },
    },
    async execute(args, exec) {
      const cwd = asString(args.path) ?? sessionCwd(exec) ?? '.'
      const { architectures, library_dicts } = await scanWorkspace(ctx.fs, { cwd, signal: exec.signal })
      const markdown = generateRules(architectures, library_dicts)
      const result: InjectResult = { markdown }
      const output = asString(args.output)
      if (output) {
        const target = await ctx.fs.resolve(output, { cwd, signal: exec.signal })
        await ctx.fs.writeText(target, markdown, undefined, exec.signal)
        result.written_to = output
      }
      return result
    },
  }))

  ctx.tools.register(defineTool({
    name: 'metavibe_assemble',
    description:
      "Generate Python Protocol + Base slot-handler stubs for every slot of the workspace's bound meta-architecture(s). Existing stub files are never overwritten. Requires a bound architecture (run `metavibe_hub_use` first).",
    parameters: {
      path: { type: 'string', description: 'Workspace root; defaults to the session working directory.' },
      output: { type: 'string', description: 'Output directory for stub files (default `src/slots`).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          files: { type: 'array', items: { type: 'string' } },
          created: { type: 'array', items: { type: 'string' } },
        },
      },
      render(_args, value) {
        const { files, created } = value as AssembleResult
        const lines = [`✔ 已成功生成并关联 [${files.length}] 个 Slot 插槽存根代码:`]
        for (const f of files) lines.push(`  └─ ${f}${created.includes(f) ? ' (created)' : ' (kept)'}`)
        return renderText(lines.join('\n'))
      },
    },
    async execute(args, exec) {
      const cwd = asString(args.path) ?? sessionCwd(exec) ?? '.'
      const { architectures } = await scanWorkspace(ctx.fs, { cwd, signal: exec.signal })
      if (architectures.length === 0) {
        throw new Error('工作区内未发现已绑定的元架构 Spec。请先运行 `metavibe hub use <name>`。')
      }
      const outDir = asString(args.output) ?? slotsOutput
      return assembleSlots(ctx.fs, architectures, { cwd, outDir, signal: exec.signal })
    },
  }))
}
