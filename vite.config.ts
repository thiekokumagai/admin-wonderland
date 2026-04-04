import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        // Only split recharts — aggressive vendor/react splitting caused
        // "Cannot read properties of undefined (reading 'forwardRef')" in prod
        // (React not initialized before dependent chunks).
        manualChunks(id) {
          if (id.includes("node_modules/recharts")) {
            return "recharts";
          }
        },
      },
    },
  },
}));
