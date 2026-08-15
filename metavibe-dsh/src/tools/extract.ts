/**
 * MetaVibe LLM-extraction tools — mirrors `metavibe extract prepare` /
 * `metavibe extract parse`.
 * @module metavibe-dsh/tools/extract
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { CODE_EXTENSIONS, buildExtractionPrompt, parseAiResponse, serializeSpec, specFileName, walkTree } from '../engine.ts'
import type { LibraryDict, MetaArch, SpecKind } from '../specs.ts'
import { asString, renderJson, renderText, requireArg, sessionCwd } from './helpers.ts'

/** Canonical result of `metavibe_extract_prepare`. */
export interface PrepareResult {
  prompt: string
  source: string
  source_kind: string
}

/** Canonical result of `metavibe_extract_parse`. */
export interface ParseResult {
  kind: SpecKind
  spec: MetaArch | LibraryDict
  saved_to?: string
}

/**
 * Register `metavibe_extract_prepare` and `metavibe_extract_parse`.
 * @param ctx - registrant context.
 */
export function registerExtractTools(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'metavibe_extract_prepare',
    description:
      'Build the Meta-Extractor prompt for a mature LLM (Gemini/Claude/GPT) from a source file or directory, extracting a low-entropy Meta-Architecture spec rather than copying code. Pass the returned prompt to an LLM, then feed its JSON response to `metavibe_extract_parse`.',
    parameters: {
      source: { type: 'string', required: true, description: 'Source file or directory to analyze.' },
      name: { type: 'string', description: 'Target project/pattern name (default `TargetProject`).' },
      preview: { type: 'boolean', description: 'For a directory: also inline the head of up to 5 code files (default false).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: { prompt: { type: 'string' }, source: { type: 'string' }, source_kind: { type: 'string' } },
      },
      render(_args, value) {
        const { prompt, source, source_kind } = value as PrepareResult
        return renderText(`✨ AI Meta-Extractor Prompt 准备完毕 (source: ${source}, kind: ${source_kind})\n\n${prompt}`)
      },
    },
    async execute(args, exec) {
      const source = requireArg(args, 'source')
      const cwd = sessionCwd(exec) ?? '.'
      const sourceTarget = await ctx.fs.resolve(source, { cwd, signal: exec.signal })
      const info = await ctx.fs.stat(sourceTarget, exec.signal)
      if (!info) throw new Error(`文件不存在: ${source}`)
      let text: string
      if (info.type === 'directory') {
        const files = await walkTree(ctx.fs, sourceTarget, exec.signal)
        const cap = 200
        const shown = files.slice(0, cap)
        const treeLines = shown.map((f) => `${f.rel}${f.size !== undefined ? ` (${f.size}B)` : ''}`)
        if (files.length > cap) treeLines.push(`... (${files.length - cap} more files omitted)`)
        text = `Directory file tree:\n${treeLines.join('\n')}`
        if (args.preview === true) {
          const previewFiles = files.filter((f) => CODE_EXTENSIONS.has(f.rel.slice(f.rel.lastIndexOf('.')))).slice(0, 5)
          for (const f of previewFiles) {
            const content = await ctx.fs.readText(f.target, exec.signal)
            const head = content.split(/\r?\n/).slice(0, 60).join('\n')
            text += `\n\n--- preview: ${f.rel} ---\n${head}`
          }
        }
      } else {
        text = await ctx.fs.readText(sourceTarget, exec.signal)
      }
      const prompt = buildExtractionPrompt(text, asString(args.name) ?? 'TargetProject')
      return { prompt, source, source_kind: info.type }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'metavibe_extract_parse',
    description:
      'Parse an LLM Meta-Extractor JSON response (plain JSON or fenced with ```json) into a validated MetaArchitecture or LibraryDictionary spec and save it to `<workspace>/.metavibe/specs/`. Set `save: false` to only validate and return the spec.',
    parameters: {
      response: { type: 'string', required: true, description: "The LLM's raw extraction response text." },
      path: { type: 'string', description: 'Workspace root; defaults to the session working directory.' },
      save: { type: 'boolean', description: 'Whether to persist the spec to `.metavibe/specs/` (default true).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: { kind: { type: 'string' }, spec: { type: 'json' }, saved_to: { type: 'string' } },
      },
      render(_args, value) {
        const { spec, saved_to } = value as ParseResult
        const saved = saved_to ? `\n✔ 元架构 Spec 成功保存至: [${saved_to}]` : ''
        return renderText(renderJson(spec) + saved)
      },
    },
    async execute(args, exec) {
      const response = requireArg(args, 'response')
      const cwd = asString(args.path) ?? sessionCwd(exec) ?? '.'
      const { kind, spec } = parseAiResponse(response)
      const result: ParseResult = { kind, spec }
      if (args.save !== false) {
        const relPath = `.metavibe/specs/${specFileName(kind, spec)}`
        const target = await ctx.fs.resolve(relPath, { cwd, signal: exec.signal })
        await ctx.fs.writeText(target, serializeSpec(spec), undefined, exec.signal)
        result.saved_to = relPath
      }
      return result
    },
  }))
}
