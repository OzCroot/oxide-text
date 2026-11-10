import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

// Tauri expects a fixed dev port. 1420 is the Tauri default, and other Tauri projects use it,
// so this project uses its own.
export default defineConfig({
  root: "ui",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "ui") } },
  clearScreen: false,
  server: { port: 1430, strictPort: true },
  build: { outDir: "../dist", emptyOutDir: true, target: "es2022" },
  test: { environment: "node", include: ["**/*.test.ts"] },
});
