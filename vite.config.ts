import path from 'node:path'
import { rari } from 'rari/vite'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  plugins: [
    rari({
      csp: {
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
