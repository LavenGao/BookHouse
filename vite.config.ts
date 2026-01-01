import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for the BookHouse MVP.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
  // base: "/bookhouse/" // Enable when deploying to GitHub Pages under a repo subpath.
});
