import { ChainId } from '@kyberswap/ks-sdk-core'

import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const bttcInfo: EVMNetworkInfo = {
  chainId: ChainId.BTTC,
  route: 'bittorrent',
  ksSettingRoute: 'bttc',
  priceRoute: 'bttc',
  poolFarmRoute: 'bttc',
  aggregatorRoute: 'bttc',
  name: 'BitTorrent',
  icon: 'https://storage.googleapis.com/ks-setting-a3aa20b7/4877aa34-b675-4fb3-8de2-15ab8a8f6a53.svg',
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: 'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/bttc-blocks',
  etherscanUrl: 'https://bttcscan.com',
  etherscanName: 'Bttcscan',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'BTT',
    name: 'BTT',
    logo: 'https://storage.googleapis.com/ks-setting-a3aa20b7/4877aa34-b675-4fb3-8de2-15ab8a8f6a53.svg',
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://bttc.kyberengineering.io',
  multicall: '0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54',
  classic: {
    defaultSubgraph: 'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-bttc',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0xEaE47c5D99f7B31165a7f0c5f7E0D6afA25CFd55',
      factory: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
    },
    claimReward: '0x1a91f5ADc7cB5763d35A26e98A18520CB9b67e70',
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: [
      '0x8e9Bd30D15420bAe4B7EC0aC014B7ECeE864373C',
      '0xa107e6466Be74361840059a11e390200371a7538',
      '0x89929Bc485cE72D2Af7b7283B40b921e9F4f80b3',
    ],
  },
  elastic: {
    defaultSubgraph: 'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-bttc',
    startBlock: 21964498,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: [],
  },
  limitOrder: NOT_SUPPORT,
  averageBlockTimeInSeconds: 2, // TODO: check these info
  coingeckoNetworkId: 'tron',
  coingeckoNativeTokenId: 'bittorrent',
  deBankSlug: EMPTY,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: 'bttc',
}

export default bttcInfo
