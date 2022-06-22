import { ChainId } from '@kyberswap/ks-sdk-core'
import { createClient, NetworkInfo } from 'constants/networks'

import VELAS from '../assets/networks/velas-network.png'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []

const velasInfo: NetworkInfo = {
  chainId: ChainId.VELAS,
  route: 'velas',
  name: 'Velas',
  icon: VELAS,
  classicClient: createClient(
    'https://velas-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-velas',
  ),
  elasticClient: createClient(
    'https://velas-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-velas',
  ),
  blockClient: createClient('https://velas-graph.kyberengineering.io/subgraphs/name/kybernetwork/velas-blocks'),
  etherscanUrl: 'https://evmexplorer.velas.com',
  etherscanName: 'Velas EVM Explorer',
  tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/velas.tokenlist.json',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'VLX',
    name: 'VLX (Wrapped)',
    address: '0xc579D1f3CF86749E05CD06f7ADe17856c2CE3126',
    logo: VELAS,
    decimal: 18,
  },
  rpcUrl: 'https://evmexplorer.velas.com/rpc',
  routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/velas/route/encode`,
  classic: {
    zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
    router: '0xEaE47c5D99f7B31165a7f0c5f7E0D6afA25CFd55',
    routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
    aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
    factory: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
    migrate: 'https://bridge.velaspad.io',
    claimReward: EMPTY,
    fairlaunch: EMPTY_ARRAY,
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
  avgrageBlockTimeInSeconds: 0.4,
  coingeckoNetworkId: 'velas',
  coingeckoNativeTokenId: 'velas',
}

export default velasInfo
