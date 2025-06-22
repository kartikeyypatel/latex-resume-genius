import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  console.log("VITE_GEMINI_API_KEY loaded:", env.VITE_GEMINI_API_KEY ? `Exists (ends with ...${env.VITE_GEMINI_API_KEY.slice(-4)})` : "NOT FOUND");

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`[VITE_PROXY_DEBUG] Intercepted request: ${proxyReq.path}`);
              const apiKey = env.VITE_GEMINI_API_KEY;
              const originalPath = proxyReq.path.split('?')[0];
              if (apiKey) {
                proxyReq.path = `${originalPath}?key=${apiKey}`;
                console.log(`[VITE_PROXY_DEBUG] Attaching API key. New path: ${proxyReq.path}`);
              } else {
                console.error("[VITE_PROXY_DEBUG] VITE_GEMINI_API_KEY is not set in .env.local");
              }
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`[VITE_PROXY_DEBUG] Received response from target with status: ${proxyRes.statusCode}`);
            });
            proxy.on('error', (err, req, res) => {
              console.error('[VITE_PROXY_DEBUG] Proxy error:', err);
            });
          },
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
});
