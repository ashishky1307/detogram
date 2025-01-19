import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
<<<<<<< HEAD
    build: {
      outDir: 'build',
    },
=======

  build: {
    outDir: 'build',  // Ensure this points to the 'build' folder if that’s your intended output directory
  },
>>>>>>> f985755 (Add new icons and assets, update vite configuration)
});
