import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import { KS_SETTING_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const lineaTestnetInfo: EVMNetworkInfo = {
  chainId: ChainId.LINEA_TESTNET,
  route: 'linea-goerli',
  ksSettingRoute: 'linea-goerli',
  priceRoute: 'linea-goerli',
  poolFarmRoute: 'linea-goerli',
  aggregatorRoute: 'linea-goerli',
  name: 'Linea Testnet',
  icon: 'https://linea.build/apple-touch-icon.png',
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  defaultBlockSubgraph: 'https://thegraph.goerli.zkevm.consensys.net/subgraphs/name/kybernetwork/linea-blocks',
  etherscanUrl: 'https://explorer.goerli.linea.build/',
  etherscanName: 'Linea Explorer',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.LINEA_TESTNET}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'LineaETH',
    logo: EthereumLogo,
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://rpc.goerli.linea.build',
  multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
  classic: {
    defaultSubgraph: 'https://thegraph.goerli.zkevm.consensys.net/subgraphs/name/kybernetwork/kyberswap-exchange-linea',
    static: {
      zap: '0x12731092dD6215872C5850b3782A07b6e3E15c9C',
      router: '0x179A3d2e958D185F47D1Db046b796C5242d68981',
      factory: '0x7d1EDa469a4b6BFe4DB07fABC75da65F2b90DE6E',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    defaultSubgraph: 'https://thegraph.goerli.zkevm.consensys.net/subgraphs/name/kybernetwork/kyberswap-elastic-linea',
    startBlock: 847294,
    coreFactory: '0x40b7Ae13F825DE3D422032E8EC66F81d42fAD2ac',
    nonfungiblePositionManager: '0x50C11d49a6c4e95e49A6D96FbCE8ee208921Bb47',
    tickReader: '0x32fa66849b9EDC8F144D8764EbF045eF0f508Bb8',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0xd47AbBEAE91043e4FC195b9416D4f0A24Bb52718',
    routers: '0x3565e6927239619fDFbd6405C4f0d9C2de58137B',
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
