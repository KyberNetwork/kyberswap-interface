import baseLogo from '@/assets/networks/base.svg';

export default {
  name: 'Base',
  logo: baseLogo,
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  scanLink: 'https://basescan.org',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://base.kyberengineering.io',
  coingeckoNetworkId: 'base',
  coingeckoNativeTokenId: 'ethereum',
  wrappedToken: {
    name: 'ETH',
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    decimals: 18,
  },
};
