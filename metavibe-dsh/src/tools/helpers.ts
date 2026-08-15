/**
 * Shared tool helpers.
 * @module metavibe-dsh/tools/helpers
 */

import type { ContentBlock } from '@deepseek-ai/dsh-tools'

/** Require a non-empty string tool argument, mirroring the schema's `required`. */
export function requireArg(args: Record<string, unknown>, key: string): string {
  const value = args[key]
  if (typeof value !== 'string' || value.length === 0) throw new Error(`missing required argument \`${key}\``)
  return value
}

/** Render one canonical value as a plain text content block. */
export function renderText(text: string): ContentBlock[] {
  return [{ type: 'text', text }]
}
