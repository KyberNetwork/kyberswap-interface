import GlobalPolyFill from '@esbuild-plugins/node-globals-polyfill'
import lingui from '@lingui/vite-plugin'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
import checker from 'vite-plugin-checker'
import svgrPlugin from 'vite-plugin-svgr'
import viteTsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks:
          //   id => {
          //   // if (id.includes('src/components')) return 'components'
          //   // if (id.includes('src/state')) return 'state'
          //   // if (id.includes('src/constants')) return 'constants'
          //
          //   if (id.includes('node_modules')) {
          //     if (id.includes('lodash')) return 'lodash'
          //
          //     if (id.includes('ethers')) return 'ethers'
          //
          //     if (id.includes('@kyberswap/ks-sdk-solana')) return 'ks-solana'
          //
          //     if (id.includes('@kyberswap')) return 'ks-evm'
          //     if (id.includes('@datadog') || id.includes('sentry') || id.includes('mixpanel')) return 'tracking'
          //     if (id.includes('firebase')) return 'firebase'
          //     if (id.includes('recharts') || id.includes('lightweight-charts')) return 'chart'
          //
          //     return 'vendor'
          //   }
          // },
          {
            lodash: ['lodash'],
            ether: ['ethers'],
            kyberswap: ['@kyberswap/ks-sdk-core', '@kyberswap/ks-sdk-classic', '@kyberswap/ks-sdk-elastic'],
            'kyberswap-solana': ['@kyberswap/ks-sdk-solana'],
            tracking: [
              '@datadog/browser-rum',
              '@sentry/react',
              '@sentry/tracing',
              'mixpanel-browser',
              'react-gtm-module',
            ],
            recharts: ['recharts'],
            'lightweight-charts': ['lightweight-charts'], // used only in add liquidity page
            firebase: ['@firebase/firestore', '@firebase/app'],
            styled: ['styled-components', 'react-feather', 'inter-ui'],
            graphql: ['graphql'],
            'react-window': [
              'react-window',
              'react-indiana-drag-scroll',
              'react-virtualized-auto-sizer',
              'react-window-infinite-loader',
              'react-rnd',
              'react-spring',
              'react-popper',
              'swiper',
            ],
            fetch: ['axios', 'swr'],
            redux: ['@reduxjs/toolkit', 'react-redux', 'redux-localstorage-simple'],
          },
      },
    },
  },
  plugins: [
    react({
      babel: {
        // Use .babelrc files, necessary to use LinguiJS CLI
        babelrc: true,
        plugins: ['macros'],
      },
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
    splitVendorChunkPlugin(),
    visualizer(),
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
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
