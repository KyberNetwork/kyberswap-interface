import { ChainId } from '@kyberswap/ks-sdk-core'

import VELAS from 'assets/networks/velas-network.png'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const velasInfo: EVMNetworkInfo = {
  chainId: ChainId.VELAS,
  route: 'velas',
  ksSettingRoute: 'velas',
  priceRoute: 'velas',
  poolFarmRoute: 'velas',
  aggregatorRoute: 'velas',
  name: 'Velas',
  icon: VELAS,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: 'https://velas-graph.kyberengineering.io/subgraphs/name/kybernetwork/velas-blocks',
  etherscanUrl: 'https://evmexplorer.velas.com',
  etherscanName: 'Velas EVM Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.VELAS}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'VLX',
    name: 'VLX',
    logo: VELAS,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://evmexplorer.velas.com/rpc',
  multicall: '0x1877Ec0770901cc6886FDA7E7525a78c2Ed4e975',
  classic: {
    defaultSubgraph: 'https://velas-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-velas',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0xEaE47c5D99f7B31165a7f0c5f7E0D6afA25CFd55',
      factory: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
    },
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph: 'https://velas-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-velas',
    startBlock: 99665516,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: [],
  },
  limitOrder: {
    development: NOT_SUPPORT,
    production: NOT_SUPPORT,
  },
  averageBlockTimeInSeconds: 0.4,
  coingeckoNetworkId: 'velas',
  coingeckoNativeTokenId: 'velas',
  deBankSlug: EMPTY,
  trueSightId: NOT_SUPPORT,
  dexToCompare: 'wagyuswap',
  geckoTermialId: 'velas',
}

export default velasInfo
