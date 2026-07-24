import robinhoodLogo from '@/assets/networks/robinhood.svg';

export default {
  name: 'Robinhood',
  logo: robinhoodLogo,
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  scanLink: 'https://robinscan.io',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://rpc.mainnet.chain.robinhood.com',
  coingeckoNetworkId: 'robinhood',
  coingeckoNativeTokenId: 'ethereum',
  wrappedToken: {
    name: 'WETH',
    address: '0x0bd7d308f8e1639fab988df18a8011f41eacad73',
    symbol: 'WETH',
    decimals: 18,
  },
};
