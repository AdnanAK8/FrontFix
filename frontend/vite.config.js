import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ponytail: use relative base so build runs under /ui or any static host
export default defineConfig({
  base: './',
  plugins: [react()],
});
