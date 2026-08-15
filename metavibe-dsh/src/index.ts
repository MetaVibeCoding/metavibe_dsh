/**
 * metavibe-dsh — MetaVibe as a native DeepSeek Harness plugin.
 *
 * Follows the same contract as every `@deepseek-ai/dsh-*` plugin package:
 * named `name` / `inject` / `Config` / `apply` exports (the loader also
 * accepts them as the default export). Tools are registered through the
 * `ctx.tools` registry with `defineTool`.
 *
 * MetaVibe is a READ-ONLY architecture advisor: it exposes the golden
 * architecture map (`metavibe_hub_list`) and the best-practices catalog
 * (`metavibe_catalog_tree` / `metavibe_catalog_inspect`). It never reads or
 * writes the target workspace, so it needs no fs service, cannot stall the
 * agent loop with workspace sweeps, and never interferes with the project it
 * is advising.
 *
 * @module metavibe-dsh
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { registerTools } from './tools/index.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'metavibe'

/** Services required by the MetaVibe tool suite. */
export const inject = ['tools']

/** Deployment-facing configuration schema (schemastery). */
export const Config = z.object({})

/**
 * Register the MetaVibe model tools on `ctx.tools`.
 * @param ctx - registrant context.
 */
export function apply(ctx: Context): void {
  registerTools(ctx)
}

export default { name, inject, Config, apply }
