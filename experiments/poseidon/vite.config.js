import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = (name) => fileURLToPath(new URL(name, import.meta.url));

export default defineConfig({
  root: here('./'),
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  build: {
    target: 'esnext',
    rolldownOptions: {
      input: {
        index: here('index.html'),
        glitter: here('sun-glitter/index.html'),
        whitecaps: here('whitecaps/index.html'),
      },
    },
  },
  optimizeDeps: { rolldownOptions: { transform: { target: 'esnext' } } },
});
