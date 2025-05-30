import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react(), svgr()],
  define: {
    "process.env": {},
    global: {},
  },
  optimizeDeps: {
    exclude: ["js-big-decimal"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
