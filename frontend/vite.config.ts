import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
    proxy: process.env.VITE_USE_API_PROXY === '1' ? { '/api': 'http://localhost:3001' } : undefined, // dev: API without Vercel
  },
});
