import { defineConfig, mergeConfig } from 'vitest/config'

import base from './vite.config'

// vite.config now exports a config CALLBACK (`({ mode }) => config`) so it can gate esbuild on the build
// mode. mergeConfig() rejects the function form ("Cannot merge config in form of callback"), so resolve it
// to a plain object first. mode 'test' keeps esbuild console-stripping off, which is what we want here.
const baseConfig = typeof base === 'function' ? base({ command: 'serve', mode: 'test' }) : base

// SSR render smoke test (Phase 1). Runs in a `node` environment (no real DOM) so that
// SSR-unsafe code surfaces, with a deliberately minimal browser-global shim in
// test/smoke.setup.ts for third-party libraries that touch globals at import/render time
// (e.g. react-device-detect reads navigator.userAgent; wagmi/mipd dispatch an EIP-6963 event).
// Reuses vite.config so svgr (`?react`), lingui (`.po`), tsconfig path aliases, and `define`
// all apply. Kept separate from vite.config so vite-plugin-checker doesn't run on tests.
export default mergeConfig(
  baseConfig,
  defineConfig({
    // Force the same flag a real Vite SSR/prerender build sets, so SSR-incompatible wallet SDKs
    // (e.g. porto's iframe Dialog) are excluded from the wagmi config during the smoke render.
    define: { 'import.meta.env.SSR': 'true' },
    test: {
      environment: 'node',
      globals: false,
      // The first route transforms the entire app module graph through Vite (cold) — generous.
      testTimeout: 60000,
      hookTimeout: 60000,
      include: ['src/**/*.smoke.test.{ts,tsx}'],
      setupFiles: ['./test/smoke.setup.ts'],
      server: {
        deps: {
          inline: [/^@kyber\//, /^@kyberswap\//, 'wagmi', '@wagmi/core', 'viem', 'mipd', /^@lingui\//],
        },
      },
    },
  }),
)
