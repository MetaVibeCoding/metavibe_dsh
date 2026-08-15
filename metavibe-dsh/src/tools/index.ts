/**
 * MetaVibe tool-suite entry — registers every `metavibe_*` model tool.
 * @module metavibe-dsh/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import { registerCatalogTools } from './catalog.ts'
import { registerExtractTools } from './extract.ts'
import { registerGuardrailTools } from './guardrail.ts'
import type { GuardrailToolConfig } from './guardrail.ts'
import { registerHubTools } from './hub.ts'

/**
 * Register the whole MetaVibe tool suite on a plugin context.
 * @param ctx - registrant context.
 * @param config - resolved row config.
 */
export function registerTools(ctx: Context, config: GuardrailToolConfig): void {
  registerHubTools(ctx)
  registerGuardrailTools(ctx, config)
  registerExtractTools(ctx)
  registerCatalogTools(ctx)
}
