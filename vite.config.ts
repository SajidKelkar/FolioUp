import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;
          if (id.includes('/pdf-lib/')) return 'pdf-lib';
          if (id.includes('/pdfjs-dist/')) return 'pdf-renderer';
          if (id.includes('/jszip/')) return 'archive';
          if (id.includes('/framer-motion/')) return 'motion';
          if (id.includes('/react-router/')) return 'router';
          if (id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('/react/')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
