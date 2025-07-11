// vite.config.ts
import { defineConfig } from "file:///Users/kane/Documents/Workspace/kyber/kyberswap-interface/node_modules/.pnpm/vite@3.2.11/node_modules/vite/dist/node/index.js";
import react from "file:///Users/kane/Documents/Workspace/kyber/kyberswap-interface/node_modules/.pnpm/@vitejs+plugin-react@2.2.0_vite@3.2.11/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { NodeGlobalsPolyfillPlugin } from "file:///Users/kane/Documents/Workspace/kyber/kyberswap-interface/node_modules/.pnpm/@esbuild-plugins+node-globals-polyfill@0.1.1_esbuild@0.24.0/node_modules/@esbuild-plugins/node-globals-polyfill/dist/index.js";
import nodePolyfills from "file:///Users/kane/Documents/Workspace/kyber/kyberswap-interface/node_modules/.pnpm/rollup-plugin-polyfill-node@0.11.0_rollup@3.29.5/node_modules/rollup-plugin-polyfill-node/dist/index.js";
import svgr from "file:///Users/kane/Documents/Workspace/kyber/kyberswap-interface/node_modules/.pnpm/@svgr+rollup@8.1.0_rollup@3.29.5_typescript@5.6.3/node_modules/@svgr/rollup/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react(), svgr()],
  define: {
    global: "globalThis"
  },
  build: {
    target: ["esnext"],
    rollupOptions: {
      plugins: [nodePolyfills()]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
      define: {
        global: "globalThis"
      },
      supported: {
        bigint: true
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true
        })
      ]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMva2FuZS9Eb2N1bWVudHMvV29ya3NwYWNlL2t5YmVyL2t5YmVyc3dhcC1pbnRlcmZhY2UvYXBwcy9zd2FwLXdpZGdldHMtcmVhY3QtZGVtb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2thbmUvRG9jdW1lbnRzL1dvcmtzcGFjZS9reWJlci9reWJlcnN3YXAtaW50ZXJmYWNlL2FwcHMvc3dhcC13aWRnZXRzLXJlYWN0LWRlbW8vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2thbmUvRG9jdW1lbnRzL1dvcmtzcGFjZS9reWJlci9reWJlcnN3YXAtaW50ZXJmYWNlL2FwcHMvc3dhcC13aWRnZXRzLXJlYWN0LWRlbW8vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgTm9kZUdsb2JhbHNQb2x5ZmlsbFBsdWdpbiB9IGZyb20gXCJAZXNidWlsZC1wbHVnaW5zL25vZGUtZ2xvYmFscy1wb2x5ZmlsbFwiO1xuaW1wb3J0IG5vZGVQb2x5ZmlsbHMgZnJvbSBcInJvbGx1cC1wbHVnaW4tcG9seWZpbGwtbm9kZVwiO1xuaW1wb3J0IHN2Z3IgZnJvbSBcIkBzdmdyL3JvbGx1cFwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIHN2Z3IoKV0sXG4gIGRlZmluZToge1xuICAgIGdsb2JhbDogXCJnbG9iYWxUaGlzXCIsXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiBbXCJlc25leHRcIl0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgcGx1Z2luczogW25vZGVQb2x5ZmlsbHMoKV0sXG4gICAgfSxcbiAgICBjb21tb25qc09wdGlvbnM6IHtcbiAgICAgIHRyYW5zZm9ybU1peGVkRXNNb2R1bGVzOiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICB0YXJnZXQ6IFwiZXNuZXh0XCIsXG4gICAgICAvLyBOb2RlLmpzIGdsb2JhbCB0byBicm93c2VyIGdsb2JhbFRoaXNcbiAgICAgIGRlZmluZToge1xuICAgICAgICBnbG9iYWw6IFwiZ2xvYmFsVGhpc1wiLFxuICAgICAgfSxcbiAgICAgIHN1cHBvcnRlZDoge1xuICAgICAgICBiaWdpbnQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgLy8gRW5hYmxlIGVzYnVpbGQgcG9seWZpbGwgcGx1Z2luc1xuICAgICAgcGx1Z2luczogW1xuICAgICAgICBOb2RlR2xvYmFsc1BvbHlmaWxsUGx1Z2luKHtcbiAgICAgICAgICBidWZmZXI6IHRydWUsXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9iLFNBQVMsb0JBQW9CO0FBQ2pkLE9BQU8sV0FBVztBQUNsQixTQUFTLGlDQUFpQztBQUMxQyxPQUFPLG1CQUFtQjtBQUMxQixPQUFPLFVBQVU7QUFHakIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFBQSxFQUN6QixRQUFRO0FBQUEsSUFDTixRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUSxDQUFDLFFBQVE7QUFBQSxJQUNqQixlQUFlO0FBQUEsTUFDYixTQUFTLENBQUMsY0FBYyxDQUFDO0FBQUEsSUFDM0I7QUFBQSxJQUNBLGlCQUFpQjtBQUFBLE1BQ2YseUJBQXlCO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixnQkFBZ0I7QUFBQSxNQUNkLFFBQVE7QUFBQSxNQUVSLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxXQUFXO0FBQUEsUUFDVCxRQUFRO0FBQUEsTUFDVjtBQUFBLE1BRUEsU0FBUztBQUFBLFFBQ1AsMEJBQTBCO0FBQUEsVUFDeEIsUUFBUTtBQUFBLFFBQ1YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
