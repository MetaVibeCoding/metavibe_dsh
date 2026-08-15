/**
 * Shared fs-seam helpers — the only I/O the engine performs.
 *
 * The `FsSeam` interface is the minimal surface the engine needs from the
 * host's `ctx.fs` service. The engine never touches `node:fs` or any global;
 * targets and cancellation signals are always injected, so the same code runs
 * in a mounted plugin, a dynamic Package, or a unit test with a fake seam.
 *
 * @module metavibe-dsh/fs-utils
 */

/** Opaque target identity produced by `FsSeam.resolve`. */
export interface FsTarget {
  targetKey: string
  displayPath: string
}

/** One direct child returned by `FsSeam.listDir`. */
export interface FsDirEntry {
  name: string
  type: 'file' | 'directory' | 'other'
  target: FsTarget
  size?: number
}

/** Metadata returned by `FsSeam.stat`; `undefined` means absent. */
export interface FsInfo {
  type: 'file' | 'directory' | 'other'
  size?: number
}

/** The abstract filesystem seam the engine consumes (mirrors `ctx.fs`). */
export interface FsSeam {
  resolve(path: string, opts?: { cwd?: string; signal?: AbortSignal | undefined }): Promise<FsTarget>
  stat(target: FsTarget, signal?: AbortSignal): Promise<FsInfo | undefined>
  readText(target: FsTarget, signal?: AbortSignal): Promise<string>
  writeText(target: FsTarget, content: string, expected?: unknown, signal?: AbortSignal): Promise<unknown>
  listDir(target: FsTarget, signal?: AbortSignal): Promise<FsDirEntry[]>
}

/** Directories skipped by workspace scans and guardrail sweeps. */
export const IGNORED_DIRS: ReadonlySet<string> = new Set([
  '.git',
  '.venv',
  'node_modules',
  'dist',
  'build',
  'lib',
  '__pycache__',
  '.metavibe',
])

/** Spec file suffixes accepted by the workspace loader (JSON). */
export const SPEC_SUFFIXES: ReadonlySet<string> = new Set(['.json'])

/**
 * Resolve a model-supplied path against a base directory.
 * @param fs - the mounted fs seam.
 * @param path - path to resolve; relative resolves against `cwd`.
 * @param opts - optional cwd override and cancellation signal.
 * @returns the stable target.
 */
export function resolveTarget(fs: FsSeam, path: string, { cwd, signal }: { cwd?: string; signal?: AbortSignal | undefined } = {}): Promise<FsTarget> {
  return fs.resolve(path, {
    ...(cwd !== undefined ? { cwd } : {}),
    ...(signal !== undefined ? { signal } : {}),
  })
}

/**
 * Recursively list a directory tree through the fs seam.
 * @param fs - the mounted fs seam.
 * @param dirTarget - resolved root target.
 * @param signal - cancellation signal.
 * @param rel - relative path prefix of `dirTarget`.
 * @returns every non-ignored file below the root.
 */
export async function walkTree(fs: FsSeam, dirTarget: FsTarget, signal: AbortSignal | undefined, rel = ''): Promise<Array<{ rel: string; type: 'file' | 'directory' | 'other'; target: FsTarget; size?: number }>> {
  const entries = await fs.listDir(dirTarget, signal)
  const results: Array<{ rel: string; type: 'file' | 'directory' | 'other'; target: FsTarget; size?: number }> = []
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue
    const childRel = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.type === 'directory') {
      results.push(...(await walkTree(fs, entry.target, signal, childRel)))
    } else {
      results.push({ rel: childRel, type: entry.type, target: entry.target, ...(entry.size !== undefined ? { size: entry.size } : {}) })
    }
  }
  return results
}
