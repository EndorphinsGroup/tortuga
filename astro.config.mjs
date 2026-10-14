import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tortuga-surf.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
