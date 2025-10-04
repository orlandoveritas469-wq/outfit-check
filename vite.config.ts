import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Replace process.cwd() with '.' to avoid TypeScript type errors when node types are not available.
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    plugins: [react()],
  };
});
