/**
 * metavibe-dsh — MetaVibe as a native DeepSeek Harness plugin.
 *
 * Follows the same contract as every `@deepseek-ai/dsh-*` plugin package:
 * named `name` / `inject` / `Config` / `apply` exports (the loader also
 * accepts them as the default export). Tools are registered through the
 * `ctx.tools` registry with `defineTool`; every byte of file I/O flows
 * through the abstract `ctx.fs` seam.
 *
 * @module metavibe-dsh
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { registerTools } from './tools/index.ts'
import type { GuardrailToolConfig } from './tools/guardrail.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'metavibe'

/** Services required by the MetaVibe tool suite. */
export const inject = ['tools', 'fs']

/** Deployment-facing configuration schema (schemastery). */
export const Config: z<GuardrailToolConfig> = z.object({
  maxFileLines: z.number().default(300),
  slotsOutput: z.string().default('src/slots'),
})

/**
 * Register the MetaVibe model tools on `ctx.tools`.
 * @param ctx - registrant context.
 * @param config - resolved row config.
 */
export function apply(ctx: Context, config: GuardrailToolConfig): void {
  registerTools(ctx, config)
}

export default { name, inject, Config, apply }
