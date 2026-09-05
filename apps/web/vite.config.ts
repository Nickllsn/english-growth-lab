import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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
    proxy: {
      "/api": "http://127.0.0.1:4310"
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./test/setup.ts"
  }
});
