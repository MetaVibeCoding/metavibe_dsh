/**
 * Shared tool helpers.
 * @module metavibe-dsh/tools/helpers
 */

import type { ContentBlock, ToolRunContext } from '@deepseek-ai/dsh-tools'

/** Session working directory for a tool call, when the caller is an agent. */
export function sessionCwd(exec: ToolRunContext): string | undefined {
  return exec?.agent?.session?.header?.cwd
}

/** Narrow an `unknown` tool argument to a string, or `undefined`. */
export function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/** Require a non-empty string tool argument, mirroring the schema's `required`. */
export function requireArg(args: Record<string, unknown>, key: string): string {
  const value = asString(args[key])
  if (value === undefined) throw new Error(`missing required argument \`${key}\``)
  return value
}

/** Render one canonical value as a plain text content block. */
export function renderText(text: string): ContentBlock[] {
  return [{ type: 'text', text }]
}

/** Pretty-print a canonical value as JSON text. */
export function renderJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
