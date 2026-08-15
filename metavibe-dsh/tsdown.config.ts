// Bundle the tsc-emitted module graph into one ESM entry — the same shape
// the official DeepSeek Harness tsdown config produces (lib/types/* -> lib/*,
// fixedExtension: false keeps the emitted `.js` extension).
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['lib/types/index.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  clean: false,
  fixedExtension: false,
})
