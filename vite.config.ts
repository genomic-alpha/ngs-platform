import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Code splitting: separate vendor chunks for caching
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/recharts')) {
            return 'recharts';
          }
          if (id.includes('node_modules/@tanstack')) {
            return 'tanstack-query';
          }
        },
      },
    },
    // Performance budget: warn if chunks exceed 200KB
    chunkSizeWarningLimit: 200,
    // Source maps for production debugging
    sourcemap: true,
    // Target modern browsers
    target: 'es2023',
  },
})
