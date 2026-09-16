import { ChainId } from '@kyberswap/ks-sdk-core'

import arcIcon from 'assets/networks/arc.svg'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const arcInfo: NetworkInfo = {
  chainId: ChainId.ARC,
  route: 'arc',
  ksSettingRoute: 'arc',
  priceRoute: 'arc',
  aggregatorRoute: 'arc',
  name: 'Arc',
  icon: arcIcon,

  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://explorer.arc.io',
  etherscanName: 'Arc Explorer',
  bridgeURL: '',
  // USDC is Arc's native asset. The native interface reports 18 decimals so wallets and
  // `eth_getBalance` behave like any EVM chain, while the ERC-20 interface below reports 6 to match
  // USDC everywhere else. Both read the same underlying balance.
  nativeToken: {
    symbol: 'USDC',
    name: 'USDC',
    logo: arcIcon,
    decimal: 18,
    erc20Interface: {
      payNativeOnSwap: true,
    },
  },
  defaultRpcUrl: 'https://rpc.mainnet.arc.io',
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
  limitOrder: '*',
  averageBlockTimeInSeconds: 1,
  coingeckoNetworkId: NOT_SUPPORT,
  coingeckoNativeTokenId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
}

export default arcInfo
