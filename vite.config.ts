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
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/react-dom/") ||
            id.includes("/react-router") ||
            id.includes("/scheduler/") ||
            (id.includes("/react/") && !id.includes("react-hook") && !id.includes("react-day") && !id.includes("react-resizable"))
          ) {
            return "react-vendor";
          }
          if (id.includes("@tanstack/react-query")) {
            return "tanstack-query";
          }
          if (id.includes("recharts")) {
            return "recharts";
          }
          if (id.includes("@radix-ui")) {
            return "radix-ui";
          }
          return "vendor";
        },
      },
    },
  },
}));
