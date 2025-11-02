import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Tell Vite to handle JSX correctly
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {},
  },
  server: {
    port: 5173,
    // optional: proxy API calls directly to FastAPI backend
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/symptoms': 'http://127.0.0.1:8000',
      '/prescriptions': 'http://127.0.0.1:8000',
    },
  },
});
