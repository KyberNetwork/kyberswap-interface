import GlobalPolyFill from '@esbuild-plugins/node-globals-polyfill'
import lingui from '@lingui/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { realpathSync } from 'fs'
import { createRequire } from 'module'
import path, { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import svgrPlugin from 'vite-plugin-svgr'
import viteTsconfigPaths from 'vite-tsconfig-paths'

// Anchor `createRequire` at `connect-evm`'s real path so we can resolve
// MetaMask SDK transitive deps that pnpm doesn't symlink into the app.
const connectEvmRealPath = realpathSync(resolve(__dirname, 'node_modules/@metamask/connect-evm'))
const requireFromSdk = createRequire(connectEvmRealPath + '/package.json')

const mwpCoreEsm = dirname(requireFromSdk.resolve('@metamask/mobile-wallet-protocol-core/package.json'))
const eciesjsEntry = requireFromSdk.resolve('eciesjs')

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
    // Force ESM pre-bundle for the MetaMask SDK chain — CJS-only packages
    // dynamically imported by the SDK otherwise come back with undefined
    // named exports at runtime.
    include: [
      '@metamask/mobile-wallet-protocol-core',
      '@metamask/mobile-wallet-protocol-dapp-client',
      '@metamask/connect-multichain',
    ],
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
    dedupe: ['styled-components', 'react', 'react-dom'],
    // Array form (rather than object) so we can use regex `find` for the
    // `eciesjs` entries below.
    alias: [
      { find: 'querystring', replacement: 'query-string' },
      { find: /^process$/, replacement: 'process/browser' },
      { find: /^stream$/, replacement: 'stream-browserify' },
      { find: /^zlib$/, replacement: 'browserify-zlib' },
      { find: /^util$/, replacement: 'util' },
      { find: 'react-redux', replacement: 'react-redux/dist/react-redux.js' },
      { find: '@', replacement: path.resolve(__dirname, './src/') },
      { find: 'react-dom/client', replacement: 'react-dom/profiling' },
      // WalletConnect 2.21+ renamed the ESM bundle from index.es.js to index.js.
      {
        find: '@walletconnect/ethereum-provider',
        replacement: resolve(__dirname, 'node_modules/@walletconnect/ethereum-provider/dist/index.js'),
      },
      // mwp-core ships both CJS and ESM but declares only "main" — force the .mjs.
      {
        find: '@metamask/mobile-wallet-protocol-core',
        replacement: resolve(mwpCoreEsm, 'dist/index.mjs'),
      },
      // eciesjs uses `Object.defineProperty(exports, X, { get })` for its
      // named exports, which esbuild's CJS-to-ESM analyzer doesn't extract.
      // Route through a local proxy that captures the getter values via
      // namespace import. Exact-match regex so the proxy's own sub-path
      // import (resolved by the next entry) isn't rewritten back here.
      { find: /^eciesjs$/, replacement: resolve(__dirname, 'src/types/eciesjsProxy.ts') },
      { find: /^eciesjs\/dist\/index\.js$/, replacement: eciesjsEntry },
    ],
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    open: false,
  },
})
