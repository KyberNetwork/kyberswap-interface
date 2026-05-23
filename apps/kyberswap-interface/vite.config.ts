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
    // @wagmi/connectors v8 statically references @base-org/account inside baseAccount.js for
    // an unused connector. The package ships ES2025 import-attribute syntax that esbuild 0.18
    // cannot parse. Exclude from pre-bundling — the dynamic import inside is never reached
    // because we don't register the baseAccount() connector.
    exclude: ['@base-org/account'],
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
    dedupe: ['react', 'react-dom'],
    alias: {
      querystring: 'query-string',
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      'react-redux': 'react-redux/dist/react-redux.js',
      '@': path.resolve(__dirname, './src/'),
      'react-dom/client': 'react-dom/profiling',
      // WalletConnect ethereum-provider 2.21+ renamed the ESM bundle from index.es.js to
      // index.js — point the alias at the new path so Vite's pre-bundle resolver finds it.
      '@walletconnect/ethereum-provider': resolve(
        __dirname,
        'node_modules/@walletconnect/ethereum-provider/dist/index.js',
      ),

      //'@web3-react/core': path.resolve(__dirname, 'src/connection/web3reactShim.ts'),
    },
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    open: false,
  },
})
