import monadLogo from '@/assets/networks/monad.svg';

export default {
  name: 'Monad',
  logo: monadLogo,
  nativeLogo: monadLogo,
  scanLink: 'https://mainnet-beta.monvision.io',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://rpc.monad.xyz',
  coingeckoNetworkId: 'monad',
  coingeckoNativeTokenId: 'mon',
  wrappedToken: {
    name: 'WMON',
    address: '0x3bd359c1119da7da1d913d1c4d2b7c461115433a',
    symbol: 'WMON',
    decimals: 18,
  },
};
