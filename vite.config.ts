import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import {
  DEFAULT_SITE_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_TITLE,
  normalizeSiteUrl,
  siteUrlWithSlash,
} from './src/lib/seo'

function cuberushSeoPlugin(): Plugin {
  const siteUrl = normalizeSiteUrl(
    process.env.VITE_SITE_URL ?? DEFAULT_SITE_URL,
  )
  const siteUrlSlash = siteUrlWithSlash(siteUrl)
  const ogImage = `${siteUrlSlash}cuberush-logo.png`

  const replacements: Record<string, string> = {
    '%SITE_URL%': siteUrl,
    '%SITE_URL_SLASH%': siteUrlSlash,
    '%OG_IMAGE%': ogImage,
    '%SITE_TITLE%': SITE_TITLE,
    '%SITE_DESCRIPTION%': SITE_DESCRIPTION,
    '%SITE_KEYWORDS%': SITE_KEYWORDS,
  }

  return {
    name: 'cuberush-seo',
    transformIndexHtml(html) {
      let out = html
      for (const [token, value] of Object.entries(replacements)) {
        out = out.replaceAll(token, value)
      }
      return out
    },
    generateBundle() {
      const robots = [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${siteUrlSlash}sitemap.xml`,
      ].join('\n')

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrlSlash}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
    closeBundle() {
      const outDir = path.resolve('dist')
      const indexPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexPath)) return
      fs.copyFileSync(indexPath, path.join(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cuberushSeoPlugin(),
    {
      name: 'worker-safe-preload-helper',
      generateBundle(_, bundle) {
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (!fileName.includes('preload-helper-')) continue;
          if (chunk.type !== 'chunk') continue;
          const code = chunk.code;
          const patched = code.replace(
            /r=function\(r,i,a\)\{/,
            "r=function(r,i,a){if(typeof document==='undefined')return Promise.resolve().then(r);",
          );
          if (patched !== code) {
            chunk.code = patched;
          }
        }
      },
    },
  ],
  base: process.env.VITE_BASE_PATH ?? '/',
})
