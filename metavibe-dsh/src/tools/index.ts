/**
 * MetaVibe tool-suite entry — registers every `metavibe_*` model tool.
 * @module metavibe-dsh/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import { registerBlueprintTool } from './blueprint.ts'
import { registerCatalogTools } from './catalog.ts'
import { registerHubTools } from './hub.ts'

/**
 * Register the MetaVibe tool suite on a plugin context.
 * @param ctx - registrant context.
 */
export function registerTools(ctx: Context): void {
  registerHubTools(ctx)
  registerCatalogTools(ctx)
  registerBlueprintTool(ctx)
}
