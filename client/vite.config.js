import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist', // default but explicit for clarity
    emptyOutDir: true, // clears previous builds
  },
  server: {
    port: 5173, // dev server port
  },
});
