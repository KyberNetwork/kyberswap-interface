import GlobalPolyFill from '@esbuild-plugins/node-globals-polyfill'
import lingui from '@lingui/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import svgrPlugin from 'vite-plugin-svgr'
import viteTsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',
  },
  plugins: [
    react({
      plugins: [['@lingui/swc-plugin', {}]],
    }),
    viteTsconfigPaths(),
    svgrPlugin(),
    lingui(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
      overlay: false,
    }),
  ],
  define: {
    'process.env': process.env, // help libs dont break
  },
  //https://stackoverflow.com/a/72978600/8153505
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        GlobalPolyFill({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      'react-redux': 'react-redux/dist/react-redux.js',
      '@': path.resolve(__dirname, './src/'),
      'react-dom/client': 'react-dom/profiling',
      '@walletconnect/ethereum-provider': resolve(
        __dirname,
        'node_modules/@walletconnect/ethereum-provider/dist/index.umd.js',
      ),

      //'@web3-react/core': path.resolve(__dirname, 'src/connection/web3reactShim.ts'),
    },
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    open: true,
  },
})
