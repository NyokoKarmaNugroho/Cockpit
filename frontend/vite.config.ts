import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@xyflow/react")) return "xyflow";
          if (id.includes("@supabase/supabase-js")) return "supabase";
          if (id.includes("react-router")) return "router";
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")) {
            return "react-vendor";
          }
          return "vendor";
        },
      },
    },
  },
});
