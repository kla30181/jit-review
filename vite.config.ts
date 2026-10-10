import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'serve' ? '/' : '/jit-review/',
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  server: { host: '0.0.0.0', port: 3065 },
}));
