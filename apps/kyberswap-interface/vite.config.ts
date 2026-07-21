import GlobalPolyFill from '@esbuild-plugins/node-globals-polyfill'
import lingui from '@lingui/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { realpathSync } from 'fs'
import { createRequire } from 'module'
import path, { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import { compression, defineAlgorithm } from 'vite-plugin-compression2'
import svgrPlugin from 'vite-plugin-svgr'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import zlib from 'zlib'

// Anchor `createRequire` at `connect-evm`'s real path so we can resolve
// MetaMask SDK transitive deps that pnpm doesn't symlink into the app.
const connectEvmRealPath = realpathSync(resolve(__dirname, 'node_modules/@metamask/connect-evm'))
const requireFromSdk = createRequire(connectEvmRealPath + '/package.json')

const mwpCoreEsm = dirname(requireFromSdk.resolve('@metamask/mobile-wallet-protocol-core/package.json'))
const eciesjsEntry = requireFromSdk.resolve('eciesjs')

// scripts/prerender.mjs sets this before createServer. The browser process/Buffer polyfill
// (GlobalPolyFill, below) is an esbuild@0.24 plugin; injected into Vite 4's esbuild@0.18 dep
// optimizer it crashes the prerender's scan with "Invalid command: on-resolve". Node already has
// process/Buffer, so the polyfill is unnecessary there — skip it for the prerender (dev server and
// client build, which run in a browser context, still get it).
const isSsrPrerender = process.env.SSR_PRERENDER === '1'

// React's profiling build adds profiler instrumentation (bigger + slower renders). Only alias to it
// when explicitly profiling (VITE_PROFILE=1) — production must use the standard react-dom/client.
const isProfiling = process.env.VITE_PROFILE === '1'

// ANALYZE=1 writes build/stats.html — an interactive treemap of the bundle (run via `pnpm analyze`).
const isAnalyze = process.env.ANALYZE === '1'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Strip debug logging from the production bundle only. Drop the NOISE (console.log/info/debug via
  // `pure` — removed when their unused return makes the call dead) + all `debugger`, but KEEP
  // console.error/warn: there's no Sentry/console-capture, so those are the only signal for prod
  // failures (e.g. the lazy firebase init error handlers). dev/stg keep everything for debugging.
  // `legalComments: 'none'` drops license/banner comments to trim the entry chunk.
  esbuild:
    mode === 'production'
      ? { pure: ['console.log', 'console.info', 'console.debug'], drop: ['debugger'], legalComments: 'none' }
      : {},
  build: {
    outDir: 'build',
    // Emit build/manifest.json so the prerender step (scripts/prerender.mjs) can rewrite the dev asset
    // URLs that ssrLoadModule produces (/src/assets/x.svg) to the hashed production URLs
    // (/assets/x-<hash>.svg) — fixing 404s and keeping <img src> identical to the client render.
    // (NB: on a Vite 5 upgrade the manifest moves to build/.vite/manifest.json — update the read path.)
    manifest: true,
  },
  // For the build-time prerender (scripts/prerender.mjs loads src/entry-server.tsx via Vite's SSR
  // transform): inline the workspace + browser-oriented ESM deps that ship extensionless imports /
  // CSS imports, which Node's strict ESM resolver rejects when externalized. react/react-dom stay
  // external (they're CJS — Node loads them fine; bundling them breaks on `module is not defined`).
  // Only affects SSR (the client build ignores `ssr`).
  ssr: {
    noExternal: [
      /^@kyber\//,
      /^@kyberswap\//,
      'wagmi',
      '@wagmi/core',
      'viem',
      'mipd',
      /^@lingui\//,
      '@formo/analytics',
      'react-date-picker',
      'react-calendar',
      'use-sound', // ESM-only; must be transformed for SSR (prerender loads the whole App graph)
    ],
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
    // Dynamic import keeps Vite 4's CJS config loader from `require`-ing this ESM-only package
    // (it only loads when ANALYZE=1). Vite awaits Promise entries in the plugins array.
    ...(isAnalyze
      ? [
          import('rollup-plugin-visualizer').then(({ visualizer }) =>
            visualizer({ filename: 'build/stats.html', template: 'treemap', gzipSize: true }),
          ),
        ]
      : []),
    // Precompress text assets to .br (brotli-11) and .gz so nginx can serve them with brotli_static /
    // gzip_static — brotli-11's large window compresses these big bundles ~40% smaller than the on-the-fly
    // gzip-6 nginx would otherwise produce. Skipped for the analyze and prerender passes; originals are
    // kept as the fallback for clients that don't advertise `br`.
    ...(!isSsrPrerender && !isAnalyze
      ? [
          compression({
            include: /\.(?:js|mjs|css|html|json|svg|ico|txt|xml|wasm)$/i,
            threshold: 1024,
            skipIfLargerOrEqual: true,
            deleteOriginalAssets: false,
            algorithms: [
              defineAlgorithm('brotliCompress', { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }),
              defineAlgorithm('gzip', { level: 9 }),
            ],
          }),
        ]
      : []),
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
      // TradeRouting is lazy-loaded. Pre-bundle its CJS dependency up front so discovering it later
      // does not invalidate the optimized dependency graph while the module is being imported.
      'react-indiana-drag-scroll',
      '@metamask/mobile-wallet-protocol-core',
      '@metamask/mobile-wallet-protocol-dapp-client',
      '@metamask/connect-multichain',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: isSsrPrerender
        ? []
        : [
            // Cast: GlobalPolyFill returns an esbuild@0.24 Plugin, but Vite 4 types
            // `esbuildOptions.plugins` against esbuild@0.18 (its bundled version).
            // The `PluginBuild.initialOptions.packages` union differs between the
            // two — runtime is fine, only TS errors. Drop the cast once Vite is on
            // esbuild 0.21+.
            GlobalPolyFill({
              process: true,
              buffer: true,
            }) as any,
          ],
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    // Array form (rather than object) so we can use regex `find` for the
    // `eciesjs` entries below.
    alias: [
      { find: 'querystring', replacement: 'query-string' },
      { find: /^process$/, replacement: 'process/browser' },
      { find: /^stream$/, replacement: 'stream-browserify' },
      { find: /^zlib$/, replacement: 'browserify-zlib' },
      { find: /^util$/, replacement: 'util' },
      { find: '@', replacement: path.resolve(__dirname, './src/') },
      ...(isProfiling ? [{ find: 'react-dom/client', replacement: 'react-dom/profiling' }] : []),
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
}))
