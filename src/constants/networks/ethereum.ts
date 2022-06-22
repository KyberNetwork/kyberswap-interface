import { ChainId } from '@kyberswap/ks-sdk-core'
import { createClient, NetworkInfo } from 'constants/networks'

import Mainnet from '../assets/networks/mainnet-network.svg'
import EthereumLogo from '../assets/images/ethereum-logo.png'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []

const ethereumInfo: NetworkInfo = {
  chainId: ChainId.MAINNET,
  route: 'ethereum',
  name: 'Ethereum',
  icon: Mainnet,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/dynamic-amm/dynamic-amm'),
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-mainnet'),
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-ethereum'),
  etherscanUrl: 'https://etherscan.io',
  etherscanName: 'Etherscan',
  tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/ethereum.tokenlist.json',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'ETH (Wrapped)',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    logo: EthereumLogo,
    decimal: 18,
  },
  rpcUrl: 'https://ethereum.kyber.network/v1/mainnet/geth?appId=prod-dmm-interface',
  routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/ethereum/route/encode`,
  classic: {
    zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
    router: '0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6',
    routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
    aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
    factory: '0x833e4083B7ae46CeA85695c4f7ed25CDAd8886dE',
    migrate: '0x6A65e062cE8290007301296F3C6AE446Af7BDEeC',
    claimReward: EMPTY,
    fairlaunch: [
      '0xc0601973451d9369252Aee01397c0270CD2Ecd60',
      '0x0FEEa33C4dE6f37A0Fc550028FddA2401B2Ee5Ce',
      '0xc93239B33239A901143e15473e4A852a0D92c53b',
      '0x31De05f28568e3d3D612BFA6A78B356676367470',
    ],
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
  },
  avgrageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: 'ethereum',
  coingeckoNativeTokenId: 'ethereum',
}

export default ethereumInfo
