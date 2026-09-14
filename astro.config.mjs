import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const site = process.env.PUBLIC_SITE_URL ?? 'https://example.com';

export default defineConfig({
  site,
  output: 'static',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
