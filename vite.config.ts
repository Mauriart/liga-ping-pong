import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa: funciona igual en local y en GitHub Pages (/liga-ping-pong/)
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 5180 },
  test: { environment: "node" },
} as never);
