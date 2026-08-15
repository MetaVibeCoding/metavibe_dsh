/**
 * Ambient type declarations for the DeepSeek Harness runtime surfaces this
 * plugin consumes (`@deepseek-ai/cordis` context and `@deepseek-ai/dsh-tools`
 * tool DSL).
 *
 * The published `@deepseek-ai/dsh-tools` registry version is older than the
 * runtime this plugin targets, so the package is NOT installed for type
 * checking. These declarations describe the exact subset of the runtime
 * contract the plugin uses; at runtime the host deployment supplies the real
 * packages through `peerDependencies`.
 */

declare module '@deepseek-ai/dsh-tools' {
  /** A plain content block rendered to the model. */
  export interface ContentBlock {
    type: 'text'
    text: string
  }

  /** Execution context handed to a tool's `execute`. */
  export interface ToolRunContext {
    agent?: { session?: { header?: { cwd?: string } } }
    signal: AbortSignal
  }

  export interface ValueSchemaAnnotations {
    description?: string
  }
  export interface StringValueSchemaSpec extends ValueSchemaAnnotations {
    type: 'string'
    enum?: readonly string[]
    const?: string
  }
  export interface IntegerValueSchemaSpec extends ValueSchemaAnnotations {
    type: 'integer'
    enum?: readonly number[]
    const?: number
  }
  export interface BooleanValueSchemaSpec extends ValueSchemaAnnotations {
    type: 'boolean'
    enum?: readonly boolean[]
    const?: boolean
  }
  export interface ArrayValueSchemaSpec extends ValueSchemaAnnotations {
    type: 'array'
    items?: ValueSchemaSpec
  }
  export interface ObjectValueSchemaSpec extends ValueSchemaAnnotations {
    type: 'object'
    properties?: ParameterSchemaSpec
    additionalProperties: boolean
  }
  export interface JsonValueSchemaSpec extends ValueSchemaAnnotations {
    type: 'json'
  }
  export type ValueSchemaSpec =
    | StringValueSchemaSpec
    | IntegerValueSchemaSpec
    | BooleanValueSchemaSpec
    | ArrayValueSchemaSpec
    | ObjectValueSchemaSpec
    | JsonValueSchemaSpec

  export type ParameterPropertySpec = ValueSchemaSpec & { required?: true }
  export type ParameterSchemaSpec = Record<string, ParameterPropertySpec>

  export interface ToolDefinition {
    name: string
    description: string
    parameters: ParameterSchemaSpec
    output: {
      schema: ValueSchemaSpec
      render(args: Record<string, unknown>, value: unknown): ContentBlock[]
    }
    execute(args: Record<string, unknown>, exec: ToolRunContext): Promise<unknown> | unknown
  }

  export function defineTool(options: ToolDefinition): ToolDefinition
}

declare module '@deepseek-ai/cordis' {
  /** Minimal FsTarget shape the plugin relies on. */
  interface FsTargetShape {
    targetKey: string
    displayPath: string
  }

  /** The restricted Cordis context this plugin consumes. */
  export interface Context {
    get<T = unknown>(name: string): T | undefined
    on(name: string, listener: (...args: any[]) => unknown): () => void
    provide(name: string, value: unknown): () => void
    effect(callback: () => unknown, label?: string): () => void
    tools: { register(definition: unknown): unknown }
    fs: {
      resolve(path: string, opts?: { cwd?: string; signal?: AbortSignal | undefined }): Promise<FsTargetShape>
      stat(target: FsTargetShape, signal?: AbortSignal): Promise<{ type: 'file' | 'directory' | 'other'; size?: number } | undefined>
      readText(target: FsTargetShape, signal?: AbortSignal): Promise<string>
      writeText(target: FsTargetShape, content: string, expected?: unknown, signal?: AbortSignal): Promise<unknown>
      listDir(
        target: FsTargetShape,
        signal?: AbortSignal,
      ): Promise<Array<{ name: string; type: 'file' | 'directory' | 'other'; target: FsTargetShape; size?: number }>>
    }
  }
}
