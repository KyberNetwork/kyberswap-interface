import { lingui } from '@lingui/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint'
import svgrPlugin from 'vite-plugin-svgr'
import viteTsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build',
  },
  plugins: [
    // eslint({ lintOnStart: true }),
    eslint({ cache: true }),
    react({
      babel: {
        // Use .babelrc files, necessary to use LinguiJS CLI
        babelrc: true,
      },
    }),
    viteTsconfigPaths(),
    svgrPlugin(),
    lingui(),
  ],
  define: {
    'process.env': process.env, // help libs dont break
  },
})
