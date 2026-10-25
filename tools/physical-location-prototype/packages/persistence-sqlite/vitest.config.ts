import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Test against source, not a stale dist build.
      '@sample-operations/core': resolve(here, '../../packages/core/src/index.ts'),
    },
  },
});
