import { defineConfig } from 'tsup'
import { svgrPlugin } from '@kyber/svgr-esbuild-plugin'

export default defineConfig({
  entry: { widget: 'src/components/index.ts' },
  format: ['esm', 'cjs'], // Equivalent to 'es' and 'umd'
  outDir: 'dist',
  target: 'esnext',
  clean: true,
  dts: true, // This generates type declaration files
  minify: false, // Set to true if you want to minify the output
  external: ['react', 'react-dom'], // Externals
  noExternal: ['styled-components', '@kyber/ui', '@kyber/hooks', 'lodash.throttle'],

  esbuildPlugins: [svgrPlugin()],
  esbuildOptions(options) {
    options.globalName = 'Widgets'
    options.define = {
      global: 'globalThis',
    }
    options.supported = {
      bigint: true,
    }
  },
  banner: {
    js: `
      // eslint-disable
    `,
  },
})
