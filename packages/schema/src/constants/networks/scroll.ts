import scrollLogo from '@/assets/networks/scroll.png';

export default {
  name: 'Scroll',
  logo: scrollLogo,
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  scanLink: 'https://scrollscan.com',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://rpc.scroll.io',
  coingeckoNetworkId: 'scroll',
  coingeckoNativeTokenId: 'ethereum',
  wrappedToken: {
    name: 'WETH',
    address: '0x5300000000000000000000000000000000000004',
    symbol: 'WETH',
    decimals: 18,
  },
};
