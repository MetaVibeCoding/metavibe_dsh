/**
 * Context injection & slot assembly — mirrors
 * `src/metavibe/engine/injector.py` and `src/metavibe/engine/factory.py`.
 *
 * @module metavibe-dsh/rules
 */

import type { FsSeam } from './fs-utils.ts'
import type { LibraryDict, MetaArch, SlotSpec } from './specs.ts'

/**
 * Render the high-density Agent Rules markdown for the given specs
 * (mirrors `AIContextInjector.generate_rules_markdown`).
 * @param architectures - bound meta-architectures.
 * @param libraryDicts - bound library dictionaries.
 * @returns the generated markdown.
 */
export function generateRules(architectures: MetaArch[], libraryDicts: LibraryDict[]): string {
  const lines: string[] = [
    '<!-- METAVIBE AGENT RULES - AUTO GENERATED (DO NOT EDIT MANUALLY) -->',
    '# MetaVibe Agent Guidance & Anti-Entropy Guardrails\n',
    '> 本规则由 MetaVibe 自动注入。AI Agent 在生成与修改代码时必须遵守以下范式。\n',
  ]
  if (architectures.length > 0) {
    lines.push('## 📐 绑定的元架构规则 (Meta-Architectures)')
    for (const arch of architectures) {
      lines.push(`### 元架构: ${arch.name} (${arch.version})`)
      lines.push(`_${arch.description}_\n`)
      if (arch.layers.length > 0) {
        lines.push('**架构分层硬规约:**')
        for (const layer of arch.layers) lines.push(`- **${layer.name}**: ${layer.rules.join(', ')}`)
        lines.push('')
      }
      if (arch.slots.length > 0) {
        lines.push('**可用扩展插槽 (Slots):**')
        for (const slot of arch.slots) lines.push(`- \`[${slot.name}]\`: ${slot.description}`)
        lines.push('')
      }
      if (arch.guardrails.forbidden_imports.length > 0) {
        lines.push('**禁止的跨层依赖 (Forbidden Imports):**')
        for (const fi of arch.guardrails.forbidden_imports) lines.push(`- 禁止 \`[${fi.from}]\` 导入 \`[${fi.import}]\``)
        lines.push('')
      }
    }
  }
  if (libraryDicts.length > 0) {
    lines.push('## 📦 工程库黄金范式与反范式 (Library Specs)')
    for (const lib of libraryDicts) {
      lines.push(`### 库: ${lib.library_name} (${lib.version}) [${lib.category}]`)
      lines.push(`_${lib.ai_context.summary}_\n`)
      if (lib.ai_context.golden_patterns.length > 0) {
        lines.push('**黄金代码范式 (Golden Patterns):**')
        for (const gp of lib.ai_context.golden_patterns) {
          lines.push(`\`\`\`title="${gp.title}"`)
          lines.push(gp.code_snippet)
          lines.push('```\n')
        }
      }
      if (lib.ai_context.anti_patterns.length > 0) {
        lines.push('**警惕反范式 (Anti-Patterns - DO NOT USE):**')
        for (const ap of lib.ai_context.anti_patterns) lines.push(`- ⚠️ **${ap.warning}**: ${ap.reason}`)
        lines.push('')
      }
      const g = lib.architectural_guardrails
      if (g) {
        if (g.allowed_layers.length > 0) lines.push(`- **允许使用层级**: \`${g.allowed_layers.join(', ')}\``)
        if (g.forbidden_layers.length > 0) lines.push(`- **禁止使用层级**: \`${g.forbidden_layers.join(', ')}\``)
        lines.push('')
      }
    }
  }
  return lines.join('\n')
}

/**
 * Build the Python Protocol + Base stub for one slot
 * (mirrors `MetaFactory._generate_slot_stub`).
 * @param slot - the slot to scaffold.
 * @param archName - owning architecture name.
 * @returns the stub source text.
 */
export function buildSlotStub(slot: SlotSpec, archName: string): string {
  const desc = slot.description ?? ''
  return [
    `"""MetaVibe Auto-Generated Slot Handler for [${slot.name}] (${archName})."""`,
    '',
    'from typing import Protocol, Any',
    '',
    `class ${slot.name}Protocol(Protocol):`,
    `    """Slot Interface Contract for ${slot.name}."""`,
    `    # Description: ${desc}`,
    '',
    '    def execute(self, *args: Any, **kwargs: Any) -> Any:',
    '        ...',
    '',
    `class Base${slot.name}:`,
    `    """Default Base Implementation for Slot: ${slot.name}."""`,
    '',
    '    def execute(self, *args: Any, **kwargs: Any) -> Any:',
    `        raise NotImplementedError("Slot [${slot.name}] Handler Pending Vibe Coding Implementation.")`,
    '',
  ].join('\n')
}

/**
 * Assemble slot stubs for every bound architecture into `outDir`
 * (mirrors `MetaFactory.assemble_workspace_slots`). Existing files are kept
 * untouched; `writeText` creates parent directories atomically.
 * @param fs - the mounted fs seam.
 * @param architectures - bound architectures.
 * @param opts - workspace root and output directory.
 * @returns relative paths, split into all files and newly created ones.
 */
export async function assembleSlots(
  fs: FsSeam,
  architectures: MetaArch[],
  opts: { cwd: string; outDir: string; signal?: AbortSignal },
): Promise<{ files: string[]; created: string[] }> {
  const files: string[] = []
  const created: string[] = []
  for (const arch of architectures) {
    for (const slot of arch.slots) {
      const filename = `slot_${slot.name.toLowerCase()}.py`
      const relPath = `${opts.outDir}/${filename}`
      const target = await fs.resolve(relPath, { cwd: opts.cwd, signal: opts.signal })
      const info = await fs.stat(target, opts.signal)
      if (info && info.type === 'file') {
        files.push(relPath) // keep existing business logic
        continue
      }
      await fs.writeText(target, buildSlotStub(slot, arch.name), undefined, opts.signal)
      files.push(relPath)
      created.push(relPath)
    }
  }
  return { files, created }
}
