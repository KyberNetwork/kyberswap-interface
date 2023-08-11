import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const zkEvm: EVMNetworkInfo = {
  chainId: ChainId.ZKEVM,
  route: 'polygon-zkevm',
  ksSettingRoute: 'polygon-zkevm',
  priceRoute: 'polygon-zkevm',
  poolFarmRoute: 'polygon-zkevm',
  aggregatorRoute: 'polygon-zkevm',
  name: 'Polygon zkEVM',
  icon: 'https://wallet.polygon.technology/assets/img/zkEVM.svg',
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph:
    'https://polygon-zkevm-graph.kyberengineering.io/subgraphs/name/kybernetwork/polygon-zkevm-blocks',
  etherscanUrl: 'https://zkevm.polygonscan.com/',
  etherscanName: 'Polygon zkEVM Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.ZKEVM}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://zkevm-rpc.com',
  multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  classic: {
    defaultSubgraph:
      'https://polygon-zkevm-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-polygon-zkevm',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph:
      'https://polygon-zkevm-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-polygon-zkevm',
    startBlock: 4164470,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: ['0x86844C008F8799Ed0F067b3Dd886ea433Cc5e37c'],
    farmv2Quoter: '0x6AFeb9EDd6Cf44fA8E89b1eee28284e6dD7705C8',
    farmV2S: ['0xbD07Eaa92C701810df78eAa4e1c697a0206405E0'],
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

export default zkEvm
