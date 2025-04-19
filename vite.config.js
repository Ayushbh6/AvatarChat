import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Expose .env as process.env instead of import.meta.env
    define: {
      'process.env': env
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'esnext'
    },
    server: {
      port: parseInt(process.env.PORT || '3000'),
      host: '0.0.0.0',
      proxy: {
        '/api/transcribe': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },
    preview: {
      port: parseInt(process.env.PORT || '3000'),
      host: '0.0.0.0',
      allowedHosts: ['jubilant-harmony-production.up.railway.app']
    }
  };
}); 