import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
    global: {},
  },
  optimizeDeps: {
    // Source: https://stackoverflow.com/a/75953479/6812545
    // This helps resolve 504 (Outdated Optimize Dep)
    exclude: ["js-big-decimal"],
  },
});
