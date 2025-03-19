import { svgrPlugin } from "@kyber/svgr-esbuild-plugin";
import { sassPlugin } from "esbuild-sass-plugin";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { "liquidity-widget": "src/components/index.ts" },
  format: ["esm", "cjs"],
  outDir: "dist",
  target: "esnext",
  clean: true,
  dts: true, // This generates type declaration files
  minify: false, // Set to true if you want to minify the output
  sourcemap: true,
  onSuccess: "tsc --noEmit",
  external: ["react", "react-dom"], // Externals
  noExternal: ["@kyber/ui", "@kyber/utils", "@kyber/utils", "@kyber/hooks"],
  loader: {
    ".png": "dataurl",
  },

  esbuildPlugins: [svgrPlugin(), sassPlugin()],
  esbuildOptions(options) {
    options.globalName = "Widgets";
    options.define = {
      global: "globalThis",
    };
    options.supported = {
      bigint: true,
    };
  },
  banner: {
    js: `
      // eslint-disable
    `,
  },
});
