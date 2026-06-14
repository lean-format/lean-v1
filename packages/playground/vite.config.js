import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [react(), wasm()],
  base: '/lean-v1/playground/',
  server: {
    port: 5173,
    open: true
  }
});


