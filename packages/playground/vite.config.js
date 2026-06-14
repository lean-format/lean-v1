import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/lean-v1/playground/',
  resolve: {
    alias: {
      '@lean-format/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: true
  }
});


