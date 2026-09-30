import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [{
    name: 'publish-design-research',
    closeBundle() {
      cpSync(resolve('design/research/penthouse-rebuild'), resolve('dist/design/research/penthouse-rebuild'), { recursive: true });
    },
  }],
});
