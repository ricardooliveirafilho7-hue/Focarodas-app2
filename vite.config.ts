import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';

const normalizeSupabaseUrl = (value: string) =>
  value
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const supabaseTarget = normalizeSupabaseUrl(env.SUPABASE_URL || '');
  const serverSupabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
  const browserProxyKey = env.VITE_SUPABASE_ANON_KEY || 'local-dev-proxy-key';
  const useLocalSupabaseProxy = Boolean(
    supabaseTarget &&
    serverSupabaseKey &&
    env.VITE_SUPABASE_URL?.includes('/supabase')
  );

  const proxy: Record<string, string | ProxyOptions> = useLocalSupabaseProxy
    ? {
        '/supabase': {
          target: supabaseTarget,
          changeOrigin: true,
          secure: true,
          rewrite: currentPath => currentPath.replace(/^\/supabase/, ''),
          configure(proxyServer) {
            proxyServer.on('proxyReq', (proxyReq, req) => {
              proxyReq.setHeader('apikey', serverSupabaseKey);

              const authorization = req.headers.authorization;
              const placeholderBearer = `Bearer ${browserProxyKey}`;
              if (!authorization || authorization === placeholderBearer || authorization === 'Bearer placeholder') {
                proxyReq.setHeader('Authorization', `Bearer ${serverSupabaseKey}`);
              }
            });
          },
        },
      }
    : {};

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      open: '/',
      proxy,
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            host: '127.0.0.1',
            protocol: 'ws',
          },
    },
  };
});
