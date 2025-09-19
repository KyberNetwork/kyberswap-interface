import lineaLogo from '@/assets/networks/linea.svg';

export default {
  name: 'Linea',
  logo: lineaLogo,
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/8fca1ea5-2637-48bc-bb08-c734065442fe1693634037115.png',
  scanLink: 'https://lineascan.build',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://rpc.linea.build',
  coingeckoNetworkId: null,
  coingeckoNativeTokenId: null,
  wrappedToken: {
    name: 'WETH',
    address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    symbol: 'WETH',
    decimals: 18,
  },
};
