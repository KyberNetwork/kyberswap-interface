import { ChainId } from '@kyberswap/ks-sdk-core'

import BnbLogo from 'assets/images/bnb-logo.png'
import bnbIcon from 'assets/networks/bnb.svg'
import { NetworkInfo } from 'constants/networks/type'

const NOT_SUPPORT = null

const bnbInfo: NetworkInfo = {
  chainId: ChainId.BSCMAINNET,
  route: 'bnb',
  ksSettingRoute: 'bsc',
  priceRoute: 'bsc',
  poolFarmRoute: 'bsc',
  aggregatorRoute: 'bsc',
  name: 'BNB Chain',
  icon: bnbIcon,
  iconSelected: NOT_SUPPORT,

  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-bsc',
  etherscanUrl: 'https://bscscan.com',
  etherscanName: 'BscScan',
  bridgeURL: 'https://www.bnbchain.org/en/bridge',
  nativeToken: {
    symbol: 'BNB',
    name: 'BNB',
    logo: BnbLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://bsc.kyberengineering.io',
  multicall: '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-bsc',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x78df70615ffc8066cc0887917f2Cd72092C86409',
      factory: '0x878dFE971d44e9122048308301F540910Bbd934c',
    },
    claimReward: NOT_SUPPORT,
    fairlaunch: [
      '0x597e3FeDBC02579232799Ecd4B7edeC4827B0435',
      '0x3D88bDa6ed7dA31E15E86A41CA015Ea50771448E',
      '0x829c27fd3013b944cbE76E92c3D6c45767c0C789',
      '0xc49b3b43565b76E5ba7A98613263E7bFdEf1140c',
      '0xcCAc8DFb75120140A5469282a13E9A60B1751276',
      '0x31De05f28568e3d3D612BFA6A78B356676367470',
    ],
    fairlaunchV2: ['0x8c312c9721c53a2e0bb11b3b0fc1742f6861bd4f', '0x3474b537da4358A08f916b1587dccdD9585376A4'],
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-bsc',
    startBlock: 28337666,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: ['0x7D5ba536ab244aAA1EA42aB88428847F25E3E676'],
    farmv2Quoter: '0x6AFeb9EDd6Cf44fA8E89b1eee28284e6dD7705C8',
    farmV2S: ['0x3D6AfE2fB73fFEd2E3dD00c501A174554e147a43', '0xf2BcDf38baA52F6b0C1Db5B025DfFf01Ae1d6dBd'],
  },
  limitOrder: '*',
  averageBlockTimeInSeconds: 3,
  coingeckoNetworkId: 'binance-smart-chain',
  coingeckoNativeTokenId: 'binancecoin',
  deBankSlug: 'bsc',
  dexToCompare: 'pancake',
  geckoTermialId: 'bsc',
}

export default bnbInfo
