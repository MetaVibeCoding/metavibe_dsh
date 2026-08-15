/**
 * Anti-entropy guardrail engine — mirrors `src/metavibe/engine/guardrail.py`.
 *
 * Pure checks over one file's text plus an fs-seam directory sweep. I/O enters
 * only through the injected fs seam.
 *
 * @module metavibe-dsh/guardrail
 */

import type { FsSeam } from './fs-utils.ts'
import { walkTree } from './fs-utils.ts'
import type { MetaArch } from './specs.ts'

/** Code extensions the guardrail engine inspects. */
export const CODE_EXTENSIONS: ReadonlySet<string> = new Set(['.py', '.ts', '.tsx', '.js', '.jsx', '.go', '.rs'])

/** One guardrail finding. */
export interface Violation {
  file_path: string
  line_number?: number
  rule_type: 'line_limit' | 'forbidden_import' | 'system'
  message: string
  severity: 'WARNING' | 'ERROR'
}

/** Result of a guardrail sweep. */
export interface GuardrailReport {
  total_files_scanned: number
  passed: boolean
  violations: Violation[]
}

/**
 * Run the anti-entropy guardrail over one code file.
 * @param file - file with workspace-relative path and full text.
 * @param metaArch - bound architecture, if any.
 * @param maxLines - single-file line cap.
 * @returns zero or more violations.
 */
export function checkFile(file: { rel: string; text: string }, metaArch: MetaArch | undefined, maxLines: number): Violation[] {
  const violations: Violation[] = []
  const lines = file.text.split(/\r?\n/)
  if (lines.length > maxLines) {
    violations.push({
      file_path: file.rel,
      rule_type: 'line_limit',
      message: `单文件包含 ${lines.length} 行，已超过建议上限 (${maxLines} 行)。推荐进行解耦拆包。`,
      severity: 'WARNING',
    })
  }
  const rules = metaArch?.guardrails.forbidden_imports ?? []
  if (rules.length > 0) {
    const relLower = file.rel.toLowerCase()
    lines.forEach((raw, idx) => {
      const line = raw.trim()
      if (!line.startsWith('import ') && !line.startsWith('from ')) return
      const lineLower = line.toLowerCase()
      for (const rule of rules) {
        if (!relLower.includes(rule.from.toLowerCase())) continue
        if (lineLower.includes(rule.import.toLowerCase())) {
          violations.push({
            file_path: file.rel,
            line_number: idx + 1,
            rule_type: 'forbidden_import',
            message: `违反架构分层硬规则: 层级 [${rule.from}] 禁止导入 [${rule.import}]。(匹配: ${line})`,
            severity: 'ERROR',
          })
        }
      }
    })
  }
  return violations
}

/**
 * Sweep a workspace for line-limit and cross-layer-import violations.
 * @param fs - the mounted fs seam.
 * @param opts - workspace root, line cap, and bound architecture.
 * @returns the aggregated report.
 */
export async function runGuardrail(
  fs: FsSeam,
  opts: { cwd: string; signal?: AbortSignal; maxLines: number; metaArch?: MetaArch | undefined },
): Promise<GuardrailReport> {
  const rootTarget = await fs.resolve('.', { cwd: opts.cwd, signal: opts.signal })
  const files = await walkTree(fs, rootTarget, opts.signal)
  const report: GuardrailReport = { total_files_scanned: 0, passed: true, violations: [] }
  for (const file of files) {
    if (!CODE_EXTENSIONS.has(file.rel.slice(file.rel.lastIndexOf('.')))) continue
    report.total_files_scanned += 1
    const text = await fs.readText(file.target, opts.signal)
    const violations = checkFile({ rel: file.rel, text }, opts.metaArch, opts.maxLines)
    report.violations.push(...violations)
  }
  if (report.violations.some((v) => v.severity === 'ERROR')) report.passed = false
  return report
}
