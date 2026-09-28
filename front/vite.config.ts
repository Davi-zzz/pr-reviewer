import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, forward /api to the API server (pnpm server in the parent folder)
    proxy: {
      '/api': process.env.API_URL || 'http://127.0.0.1:3000',
    },
  },
});
