import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const lineaTestnetInfo: EVMNetworkInfo = {
  chainId: ChainId.LINEA,
  route: 'linea',
  ksSettingRoute: 'linea',
  priceRoute: 'linea',
  poolFarmRoute: 'linea',
  aggregatorRoute: 'linea',
  name: 'Linea',
  icon: 'https://linea.build/apple-touch-icon.png',
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: '', // TODO
  etherscanUrl: 'https://lineascan.build',
  etherscanName: 'Linea Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.LINEA}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'LineaETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://rpc.linea.build',
  multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  classic: {
    defaultSubgraph: '', // TODO
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
    defaultSubgraph: '', // TODO
    startBlock: 1769,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: [],
  },
  limitOrder: {
    production: NOT_SUPPORT,
    development: NOT_SUPPORT,
  },
  averageBlockTimeInSeconds: 2, // TODO: check these info
  coingeckoNetworkId: NOT_SUPPORT,
  coingeckoNativeTokenId: NOT_SUPPORT,
  deBankSlug: EMPTY,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
}

export default lineaTestnetInfo