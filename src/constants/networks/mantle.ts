import { NetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const mantle: NetworkInfo = {
  chainId: 5000,
  route: 'mantle',
  ksSettingRoute: 'mantle',
  priceRoute: 'mantle',
  poolFarmRoute: 'mantle',
  aggregatorRoute: 'mantle',
  name: 'Mantle',
  icon: 'https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png',

  iconSelected: NOT_SUPPORT,

  defaultBlockSubgraph: '',
  etherscanUrl: 'https://explorer.mantle.xyz',
  etherscanName: 'Mantle scan',
  bridgeURL: 'https://bridge.mantle.xyz',
  nativeToken: {
    symbol: 'MNT',
    name: 'MNT',
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/2bccd96f-b100-4ca1-858e-d8353ab0d0861710387147471.png',
    decimal: 18,
    minForGas: 2 * 10 ** 17,
  },
  defaultRpcUrl: 'https://rpc.ankr.com/mantle',
  multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  classic: {
    defaultSubgraph: '',
    static: {
      zap: '',
      router: '',
      factory: '',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
    fairlaunchV3: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph: 'https://scroll-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-scroll',
    startBlock: 36376,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: ['0x7D5ba536ab244aAA1EA42aB88428847F25E3E676'],
    farmv2Quoter: '0x6AFeb9EDd6Cf44fA8E89b1eee28284e6dD7705C8',
    farmV2S: [],
    'farmV2.1S': ['0x3D6AfE2fB73fFEd2E3dD00c501A174554e147a43', '0xf2BcDf38baA52F6b0C1Db5B025DfFf01Ae1d6dBd'],
    zap: {
      router: '0x30C5322E4e08AD500c348007f92f120ab4E2b79e',
      validator: '0xf0096e5B4AAfeEA1DF557264091569ba125c1172',
      executor: '0x8ac7895130e3be8654fff544ae20bf2a93ef19d1',
      helper: '0x214061F0e250A27a49f609d9caf2987a7bC8fA6B',
    },
  },
  limitOrder: '*',
  averageBlockTimeInSeconds: 2.0, // dont use for base
  coingeckoNetworkId: 'mantle',
  coingeckoNativeTokenId: 'mnt',
  deBankSlug: EMPTY,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
}

export default mantle
