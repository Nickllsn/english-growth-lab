import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("recharts") || id.includes("victory-vendor")) {
            return "charts";
          }
          if (id.includes("react-router") || id.includes("react-dom")) {
            return "react";
          }
        }
      }
    }
  },
  server: {
    allowedHosts: [".trycloudflare.com"],
    fs: {
      allow: [workspaceRoot]
    },
    proxy: {
      "/api": "http://127.0.0.1:4310"
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./test/setup.ts"
  }
});
