import arcLogo from '@/assets/networks/arc.svg';

// Arc's native asset is USDC and it exposes a built-in ERC-20 interface backed by the same balance,
// so no wrapped-native contract exists. `wrappedToken` points at that interface — the form every
// pool and the zap router work in — and reports 6 decimals, unlike the 18 the native interface uses.
export default {
  name: 'Arc',
  logo: arcLogo,
  nativeLogo: 'https://storage.googleapis.com/ks-setting-1d682dca/755d9eee-8d2d-44b8-ad38-1f2765f036ce.png',
  scanLink: 'https://arc.etherscan.io',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://rpc.mainnet.arc.io',
  coingeckoNetworkId: null,
  coingeckoNativeTokenId: null,
  nativeIsErc20: true,
  wrappedToken: {
    name: 'USDC',
    address: '0x3600000000000000000000000000000000000000',
    symbol: 'USDC',
    decimals: 6,
  },
};
