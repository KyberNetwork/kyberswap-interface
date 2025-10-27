import { ChainId } from '@kyberswap/ks-sdk-core'

import plasmaIcon from 'assets/networks/plasma.svg'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const plasmaInfo: NetworkInfo = {
  chainId: ChainId.PLASMA,
  route: 'plasma',
  ksSettingRoute: 'plasma',
  priceRoute: 'plasma',
  aggregatorRoute: 'plasma',
  name: 'Plasma',
  icon: plasmaIcon,

  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://plasmascan.to',
  etherscanName: 'Plasmascan',
  bridgeURL: 'https://www.plasma.to/chain',
  nativeToken: {
    symbol: 'XPL',
    name: 'XPL',
    logo: plasmaIcon,
    decimal: 18,
  },
  defaultRpcUrl: 'https://rpc.plasma.to',
  multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  classic: {
    defaultSubgraph: 'https://graph-query.linea.build/subgraphs/name/kybernetwork/kyberswap-classic-linea',
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
    defaultSubgraph: 'https://graph-query.linea.build/subgraphs/name/kybernetwork/kyberswap-elastic-linea',
    startBlock: 1769,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: ['0x7D5ba536ab244aAA1EA42aB88428847F25E3E676'],
    farmv2Quoter: '0x6AFeb9EDd6Cf44fA8E89b1eee28284e6dD7705C8',
    farmV2S: ['0x3d6afe2fb73ffed2e3dd00c501a174554e147a43'],
  },
  limitOrder: null,
  averageBlockTimeInSeconds: 2, // TODO: check these info
  coingeckoNetworkId: NOT_SUPPORT,
  coingeckoNativeTokenId: NOT_SUPPORT,
  dexToCompare: NOT_SUPPORT,
  geckoTermialId: NOT_SUPPORT,
}

export default plasmaInfo
