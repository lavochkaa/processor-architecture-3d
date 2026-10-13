import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import process from 'node:process';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: process.env.SITE_URL ?? 'https://processor-architecture-guide.bjtk7rg7ct.chatgpt.site',
  vite: {
    // A running dev server must not reuse React's production JSX optimizer output.
    cacheDir: process.env.NODE_ENV === 'production' ? 'node_modules/.vite-production' : 'node_modules/.vite-development',
    build: { assetsInlineLimit: 4096 }
  }
});
