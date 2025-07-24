import blastLogo from '@/assets/networks/blast.png';

export default {
  name: 'Blast',
  logo: blastLogo,
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  scanLink: 'https://blastscan.io',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://rpc.blast.io',
  coingeckoNetworkId: 'blast',
  coingeckoNativeTokenId: 'ethereum',
  wrappedToken: {
    name: 'ETH',
    address: '0x4300000000000000000000000000000000000004',
    symbol: 'WETH',
    decimals: 18,
  },
};
