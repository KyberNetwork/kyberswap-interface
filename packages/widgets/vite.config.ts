import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import svgr from 'vite-plugin-svgr'
import eslint from 'vite-plugin-eslint'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
    eslint(),
    react(),
    svgr(),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/components/index.ts'),
      name: 'Widgets',
      formats: ['es', 'umd'],
      fileName: format => `widget.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        // "styled-components"
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          // "styled-components": "styled",
        },
      },
    },
  },
})
