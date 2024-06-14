import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
    svgr(),
    react(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
      overlay: false,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/components/index.ts"),
      name: "Widgets",
      formats: ["es", "umd"],
      fileName: (format) => `liquidity-widget.${format}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
