/**
 * In-memory `FsSeam` for tests — mirrors the contract of the host `ctx.fs`
 * seam so engine tests run without any harness dependency.
 * @module metavibe-dsh/tests/fs-mem
 */

import type { FsDirEntry, FsInfo, FsSeam, FsTarget } from '../src/fs-utils.ts'

function normalize(p: string): string {
  const parts: string[] = []
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return parts.join('/')
}

/** A minimal in-memory filesystem backed by a path -> content map. */
export class MemFs implements FsSeam {
  /** Directories that exist even without children, e.g. an empty `.metavibe`. */
  private dirs = new Set<string>()

  constructor(private files = new Map<string, string>()) {}

  mkdir(path: string): void {
    this.dirs.add(normalize(path))
  }

  private targetFor(path: string): FsTarget {
    const p = normalize(path)
    return { targetKey: p, displayPath: p || '.' }
  }

  async resolve(path: string, opts?: { cwd?: string; signal?: AbortSignal }): Promise<FsTarget> {
    const base = opts?.cwd !== undefined ? normalize(opts.cwd) : ''
    return this.targetFor(base ? `${base}/${path}` : path)
  }

  async stat(target: FsTarget): Promise<FsInfo | undefined> {
    const key = normalize(target.targetKey)
    if (this.dirs.has(key)) return { type: 'directory' }
    const content = this.files.get(key)
    if (content !== undefined) return { type: 'file', size: content.length }
    // a path is a directory when it is a prefix of a stored file
    for (const p of this.files.keys()) {
      if (p.startsWith(`${key}/`)) return { type: 'directory' }
    }
    return undefined
  }

  async readText(target: FsTarget): Promise<string> {
    const content = this.files.get(normalize(target.targetKey))
    if (content === undefined) throw new Error(`FS_NOT_FOUND: ${target.displayPath}`)
    return content
  }

  async writeText(target: FsTarget, content: string): Promise<unknown> {
    this.files.set(normalize(target.targetKey), content)
    return { operation: 'create' }
  }

  async listDir(target: FsTarget): Promise<FsDirEntry[]> {
    const prefix = normalize(target.targetKey)
    const parent = prefix ? `${prefix}/` : ''
    const children = new Map<string, 'file' | 'directory'>()
    if (this.dirs.has(prefix)) {
      for (const p of this.dirs) {
        const rest = p.startsWith(parent) ? p.slice(parent.length) : ''
        if (rest && !rest.includes('/')) children.set(rest, 'directory')
      }
    }
    for (const p of this.files.keys()) {
      if (!p.startsWith(parent) || p === prefix) continue
      const rest = p.slice(parent.length)
      const head = rest.split('/')[0]!
      if (rest.includes('/')) children.set(head, 'directory')
      else children.set(head, 'file')
    }
    return [...children.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, type]) => ({ name, type, target: this.targetFor(parent ? `${prefix}/${name}` : name) }))
  }
}
