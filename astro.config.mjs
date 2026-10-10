import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import process from 'node:process';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: process.env.SITE_URL ?? 'https://processor-architecture-guide.bjtk7rg7ct.chatgpt.site',
  vite: { build: { assetsInlineLimit: 4096 } }
});
