import { ChainId } from '@kyberswap/ks-sdk-core'

import { NetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const avaxTestnetInfo: NetworkInfo = {
  chainId: ChainId.AVAXTESTNET,
  route: 'avalanche-testnet',
  ksSettingRoute: 'avalanche',
  priceRoute: 'avalanche',
  aggregatorRoute: 'avalanche',
  poolFarmRoute: EMPTY,
  name: 'Avalanche Testnet',
  icon: 'https://storage.googleapis.com/ks-setting-1d682dca/e72081b5-cb5f-4fb6-b771-ac189bdfd7c81699420213175.png',

  iconSelected: NOT_SUPPORT,

  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/ducquangkstn/ethereum-block-fuji',
  etherscanUrl: 'https://testnet.snowtrace.io',
  etherscanName: 'Snowtrace',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'AVAX',
    name: 'AVAX',
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/e72081b5-cb5f-4fb6-b771-ac189bdfd7c81699420213175.png',
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  multicall: '0x5D605e78bc699fB565E6E6a1fa2d940C40F8ce25',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/ducquangkstn/dmm-exchange-fuij',
    static: {
      zap: EMPTY,
      router: EMPTY,
      factory: EMPTY,
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: EMPTY,
      router: '0x19395624C030A11f58e820C3AeFb1f5960d9742a',
      factory: '0x7900309d0b1c8D3d665Ae40e712E8ba4FC4F5453',
    },
    claimReward: NOT_SUPPORT,
    fairlaunch: [],
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/viet-nv/elastic-fuji',
    startBlock: 12351427,
    coreFactory: '0x6992a3c0613485644a634bfe22ea97b04f0916aa',
    nonfungiblePositionManager: '0x0C1f1B3608C10DD4E95EBca5a776f004B7EDFdb2',
    tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x9CFf23e05A18b6f8Aff587B7fEf64F9580A6C85E',
    routers: '0xd74134d330FB567abD08675b57dD588a7447b5Ac',
    farms: [],
  },
  limitOrder: NOT_SUPPORT,
  averageBlockTimeInSeconds: 1.85,
  coingeckoNetworkId: 'avalanche',
  coingeckoNativeTokenId: 'avalanche-2',
  deBankSlug: EMPTY,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
}

export default avaxTestnetInfo
