import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  server: { port: 5173 },
  base: "./",
  build: { target: "es2022", outDir: "dist", emptyOutDir: true }
});
