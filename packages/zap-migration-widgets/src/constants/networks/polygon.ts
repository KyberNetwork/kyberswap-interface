import { ChainId } from '@/schema';

export default {
  chainId: ChainId.PolygonPos,
  name: 'Polygon POS',
  logo: 'https://polygonscan.com/assets/poly/images/svg/logos/token-light.svg?v=24.2.3.1',
  nativeLogo: 'https://storage.googleapis.com/ks-setting-1d682dca/10d6d017-945d-470d-87eb-6a6f89ce8b7e.png',
  scanLink: 'https://polygonscan.com',
  multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  defaultRpc: 'https://polygon-rpc.com',
  wrappedToken: {
    name: 'WPOL',
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    symbol: 'WPOL',
    decimals: 18,
  },
  zapPath: 'polygon',
};
