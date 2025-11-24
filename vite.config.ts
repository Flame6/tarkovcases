import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Development server configuration
// Port: Defaults to 5174 (matches production server.cjs)
// Note: This is for dev mode only. Production uses server.cjs via PM2.

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const allowedHosts = env.VITE_ALLOWED_HOSTS 
      ? env.VITE_ALLOWED_HOSTS.split(',') 
      : [];
    
    return {
      plugins: [react()],
      server: {
        port: parseInt(env.PORT || '5174'),
        host: '127.0.0.1',
        strictPort: true,
        ...(allowedHosts.length > 0 && { allowedHosts })
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      publicDir: 'public'
    };
});
