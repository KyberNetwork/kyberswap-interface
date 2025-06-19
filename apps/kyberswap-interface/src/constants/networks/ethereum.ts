import { ChainId } from '@kyberswap/ks-sdk-core'

import ethereumIcon from 'assets/networks/ethereum.svg'
import { KYBER_DAO_STATS_API } from 'constants/env'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const ethereumInfo: NetworkInfo = {
  chainId: ChainId.MAINNET,
  route: 'ethereum',
  ksSettingRoute: 'ethereum',
  priceRoute: 'ethereum',
  aggregatorRoute: 'ethereum',
  name: 'Ethereum',
  icon: ethereumIcon,
  iconSelected: NOT_SUPPORT,

  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-ethereum',
  etherscanUrl: 'https://etherscan.io',
  etherscanName: 'Etherscan',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'Ether',
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/9412b9e7-161f-472e-94b2-a62d2c386ab7.png',
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://ethereum.kyberengineering.io',
  multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-ethereum',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6',
      factory: '0x833e4083B7ae46CeA85695c4f7ed25CDAd8886dE',
    },
    claimReward: NOT_SUPPORT,
    fairlaunch: [
      '0xc0601973451d9369252Aee01397c0270CD2Ecd60',
      '0x0FEEa33C4dE6f37A0Fc550028FddA2401B2Ee5Ce',
      '0xc93239B33239A901143e15473e4A852a0D92c53b',
      '0x31De05f28568e3d3D612BFA6A78B356676367470',
    ],
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-mainnet',
    startBlock: 17291893,
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
  averageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: 'ethereum',
  coingeckoNativeTokenId: 'ethereum',
  dexToCompare: 'uniswapv3',
  kyberDAO: {
    staking: '0xeadb96F1623176144EBa2B24e35325220972b3bD',
    dao: '0x7Ec8FcC26bE7e9E85B57E73083E5Fe0550d8A7fE',
    rewardsDistributor: '0x5ec0dcf4f6f55f28550c70b854082993fdc0d3b2',
    daoStatsApi: KYBER_DAO_STATS_API,
    KNCAddress: '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202',
    KNCLAddress: '0xdd974D5C2e2928deA5F71b9825b8b646686BD200',
  },
  geckoTermialId: 'eth',
}

export default ethereumInfo
