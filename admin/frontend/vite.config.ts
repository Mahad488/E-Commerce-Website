import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    open: true,
    fs: {
      allow: [
        // Allow serving files from the workspace root and src
        path.resolve(import.meta.dirname, "../.."),
      ],
    },
  },
});
