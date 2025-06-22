import bscLogo from '@/assets/networks/bsc.png';

export default {
  name: 'BSC',
  nativeLogo: 'https://storage.googleapis.com/ks-setting-1d682dca/d15d102e-6c7c-42f7-9dc4-79f3b1f9cc9b.png',
  logo: bscLogo,
  scanLink: 'https://bscscan.com',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://bsc.kyberengineering.io',
  coingeckoNetworkId: 'binance-smart-chain',
  coingeckoNativeTokenId: 'binancecoin',
  wrappedToken: {
    name: 'WBNB',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    symbol: 'WBNB',
    decimals: 18,
  },
};
