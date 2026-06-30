import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@lean-format/core': resolve(__dirname, '../core/src'),
      '@lean-format/editor': resolve(__dirname, '../editor/src'),
      '@lean-format/ui': resolve(__dirname, '../ui/src'),
    },
  },
});
