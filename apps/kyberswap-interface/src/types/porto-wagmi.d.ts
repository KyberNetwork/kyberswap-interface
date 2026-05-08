// Porto ships its wagmi connector under the `porto/wagmi` subpath via package.json
// `exports`, but tsconfig uses `moduleResolution: "node"` which doesn't honour exports.
// Rather than switching the whole project to `bundler` (breaks legacy deps like
// swiper@8 and @zkmelabs/widget which lack typed exports), declare a thin shim.
declare module 'porto/wagmi' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const porto: (...args: any[]) => any
}
