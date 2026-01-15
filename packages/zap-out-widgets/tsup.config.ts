import { sassPlugin } from 'esbuild-sass-plugin';
import { defineConfig } from 'tsup';

// @ts-expect-error esbuild-plugin-babel does not provide TypeScript types
import babelPlugin from 'esbuild-plugin-babel';
import { svgrPlugin } from '@kyber/svgr-esbuild-plugin';

export default defineConfig({
  entry: { 'zap-out-widget': 'src/index.tsx' },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  target: 'esnext',
  clean: true,
  dts: true, // This generates type declaration files
  minify: false, // Set to true if you want to minify the output
  sourcemap: true,
  onSuccess: 'tsc --noEmit',
  external: ['react', 'react-dom'], // Externals
  noExternal: ['@kyber/ui', '@kyber/utils', '@kyber/hooks', '@kyber/schema'],
  loader: {
    '.png': 'dataurl',
  },

  esbuildPlugins: [
    svgrPlugin(),
    sassPlugin(),
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
    options.globalName = 'ZapOutWidget';
    options.define = {
      global: 'globalThis',
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
