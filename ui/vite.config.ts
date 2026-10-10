import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/**
 * The backend runs at http://localhost:8000 (see src/aegis/config/settings.py).
 *
 * FastAPI has no CORS middleware configured yet, so in development we proxy
 * `/api` through Vite. That keeps the browser on a single origin (localhost:5173)
 * and avoids adding CORS to the backend just to serve the UI.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});