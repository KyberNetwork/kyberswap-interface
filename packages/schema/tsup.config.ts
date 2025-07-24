import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/zap.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  loader: {
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl',
    '.gif': 'dataurl',
    '.svg': 'dataurl',
  },
});
