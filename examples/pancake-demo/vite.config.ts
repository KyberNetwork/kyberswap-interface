import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
      overlay: false,
    }),
  ],
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
