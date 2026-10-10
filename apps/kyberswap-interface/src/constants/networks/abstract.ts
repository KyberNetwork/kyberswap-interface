import { ChainId } from '@kyberswap/ks-sdk-core'

import abstractIcon from 'assets/networks/abstract.png'
import ethereumIcon from 'assets/networks/ethereum.svg'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const abstractInfo: NetworkInfo = {
  chainId: ChainId.ABSTRACT,
  route: 'abstract',
  ksSettingRoute: 'abstract',
  priceRoute: 'abstract',
  aggregatorRoute: 'abstract',
  name: 'Abstract',
  icon: abstractIcon,

  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://abscan.org',
  etherscanName: 'Abscan',
  bridgeURL: '',
  nativeToken: {
    symbol: 'ETH',
    name: 'Ether',
    logo: ethereumIcon,
    decimal: 18,
  },
  defaultRpcUrl: 'https://api.mainnet.abs.xyz',
  multicall: '0xAa4De41dba0Ca5dCBb288b7cC6b708F3aaC759E7',
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
  },
  elastic: {
    defaultSubgraph: '',
    startBlock: 0,
    coreFactory: '',
    nonfungiblePositionManager: '',
    tickReader: '',
    initCodeHash: '',
    quoter: '',
    routers: '',
    farms: [],
  },
  limitOrder: NOT_SUPPORT,
  averageBlockTimeInSeconds: 0.2,
  coingeckoNetworkId: NOT_SUPPORT,
  coingeckoNativeTokenId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
}

export default abstractInfo
