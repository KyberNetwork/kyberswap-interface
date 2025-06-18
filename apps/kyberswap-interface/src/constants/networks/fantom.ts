import { ChainId } from '@kyberswap/ks-sdk-core'

import fantomIcon from 'assets/networks/fantom.svg'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const fantomInfo: NetworkInfo = {
  chainId: ChainId.FANTOM,
  route: 'fantom',
  ksSettingRoute: 'fantom',
  priceRoute: 'fantom',
  aggregatorRoute: 'fantom',
  name: 'Fantom',
  icon: fantomIcon,
  iconSelected: NOT_SUPPORT,

  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/fantom-blocks',
  etherscanUrl: 'https://explorer.fantom.network',
  etherscanName: 'Ftmscan',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'FTM',
    name: 'FTM',
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/2cd8adf9-b4b0-41f7-b83d-4a13b4e9ca6f1699420090962.png',
    decimal: 18,
  },
  defaultRpcUrl: 'https://rpc.fantom.network',
  multicall: '0x878dFE971d44e9122048308301F540910Bbd934c',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-fantom',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x5d5A5a0a465129848c2549669e12cDC2f8DE039A',
      factory: '0x78df70615ffc8066cc0887917f2Cd72092C86409',
    },
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-fantom',
    startBlock: 62645510,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: [],
  },
  limitOrder: '*',
  averageBlockTimeInSeconds: 1,
  coingeckoNetworkId: 'fantom',
  coingeckoNativeTokenId: 'fantom',
  dexToCompare: 'spookyswap',
  geckoTermialId: 'fantom',
}

export default fantomInfo
