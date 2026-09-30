import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [{
    name: 'publish-design-research',
    closeBundle() {
      cpSync(resolve('design/research/penthouse-layout'), resolve('dist/design/research/penthouse-layout'), { recursive: true });
      cpSync(resolve('design/research/penthouse-rebuild'), resolve('dist/design/research/penthouse-rebuild'), { recursive: true });
      cpSync(resolve('design/research/penthouse-atmosphere'), resolve('dist/design/research/penthouse-atmosphere'), { recursive: true });
    },
  }],
});
