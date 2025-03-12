import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react(), svgr()],
  define: {
    "process.env": {},
    global: {},
  },
  optimizeDeps: {
    exclude: ["js-big-decimal"],
  },
});
