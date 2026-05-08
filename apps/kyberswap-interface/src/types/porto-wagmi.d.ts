// Porto ships its wagmi connector under the `porto/wagmi` subpath via package.json
// `exports`, but tsconfig uses `moduleResolution: "node"` which doesn't honour exports.
// Rather than switching the whole project to `bundler` (breaks legacy deps like
// swiper@8 and @zkmelabs/widget which lack typed exports), declare a thin shim that
// preserves wagmi's connector contract for the wagmiConfig.connectors array.
declare module 'porto/wagmi' {
  import type { CreateConnectorFn } from '@wagmi/core'
  export const porto: (parameters?: Record<string, unknown>) => CreateConnectorFn
}
