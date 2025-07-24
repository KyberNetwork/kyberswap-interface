import mantleLogo from '@/assets/networks/mantle.png';

export default {
  name: 'Mantle',
  logo: mantleLogo,
  nativeLogo:
    'https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png',
  scanLink: 'https://mantlescan.info',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://rpc.mantle.xyz',
  coingeckoNetworkId: 'mantle',
  coingeckoNativeTokenId: 'mnt',
  wrappedToken: {
    name: 'WMNT',
    address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
    symbol: 'WMNT',
    decimals: 18,
  },
};
