import { defineConfig } from 'tsup';

// @ts-expect-error esbuild-plugin-babel does not provide TypeScript types
import babelPlugin from 'esbuild-plugin-babel';
import { svgrPlugin } from '@kyber/svgr-esbuild-plugin';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  target: 'esnext',
  clean: true,
  dts: true,
  external: ['react', 'react-dom', '@lingui/core', '@lingui/react', '@kyber/ui', '@kyber/hooks', '@kyber/schema', '@kyber/utils'],
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
    options.globalName = 'TokenSelector';
    options.define = {
      global: 'globalThis',
    };
    options.supported = {
      bigint: true,
    };
  },
});
