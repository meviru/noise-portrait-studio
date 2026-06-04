import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('/node_modules/fabric')) return 'fabric'
          if (id.includes('/node_modules/simplex-noise')) return 'simplex-noise'
          if (id.includes('/node_modules/framer-motion')) return 'framer-motion'
          if (id.includes('/node_modules/jspdf')) return 'jspdf'
          if (id.includes('/node_modules/zustand')) return 'zustand'
        },
      },
    },
  },
})
