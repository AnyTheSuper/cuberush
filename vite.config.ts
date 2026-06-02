import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
