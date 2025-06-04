import { defineConfig } from 'tsup';

import { svgrPlugin } from '@kyber/svgr-esbuild-plugin';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  target: 'esnext',
  clean: true,
  dts: true,
  external: ['react', 'react-dom'],
  esbuildPlugins: [svgrPlugin()],
  esbuildOptions(options) {
    options.globalName = 'UI';
    options.define = {
      global: 'globalThis',
    };
    options.supported = {
      bigint: true,
    };
  },
});
