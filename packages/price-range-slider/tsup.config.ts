import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'price-range-slider': 'src/index.ts' },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  target: 'esnext',
  clean: true,
  dts: true,
  minify: false,
  sourcemap: true,
  onSuccess: 'tsc --noEmit',
  external: ['react', 'react-dom'],
  noExternal: ['@kyber/utils', '@kyber/eslint-config', '@kyber/tailwind-config'],
  esbuildOptions(options) {
    options.globalName = 'PriceRangeSlider';
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
