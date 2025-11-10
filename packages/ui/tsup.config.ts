import { defineConfig } from 'tsup';

// @ts-expect-error esbuild-plugin-babel does not provide TypeScript types
import babelPlugin from 'esbuild-plugin-babel';
import { svgrPlugin } from '@kyber/svgr-esbuild-plugin';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  target: 'esnext',
  clean: true,
  dts: true,
  external: ['react', 'react-dom', '@lingui/core', '@lingui/react'],
  esbuildPlugins: [
    svgrPlugin(),
    babelPlugin({
      filter: /\.[jt]sx?$/,
      config: {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-typescript', { allowDeclareFields: true, allExtensions: true, isTSX: true }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
        plugins: ['babel-plugin-macros'],
      },
    }),
  ],
  esbuildOptions(options) {
    options.globalName = 'UI';
    options.define = {
      global: 'globalThis',
    };
    options.supported = {
      bigint: true,
    };
    options.loader = {
      '.ttf': 'file',
      '.png': 'dataurl',
    };
  },
});
