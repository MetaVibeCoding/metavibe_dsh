// Vitest config for metavibe-dsh.
// Tests import the TypeScript sources directly (`.ts` extensions, matching
// the tsconfig allowImportingTsExtensions setup the official packages use).
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
  },
})
