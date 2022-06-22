import { ChainId } from '@kyberswap/ks-sdk-core'
import { createClient, NetworkInfo } from 'constants/networks'

import CRONOS from '../assets/networks/cronos-network.png'
import CronosLogo from '../assets/svg/cronos-token-logo.svg'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []

const cronosInfo: NetworkInfo = {
  chainId: ChainId.CRONOS,
  route: 'cronos',
  name: 'Cronos',
  icon: CRONOS,
  classicClient: createClient(
    'https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-cronos',
  ),
  elasticClient: createClient(
    'https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-cronos',
  ),
  blockClient: createClient('https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/cronos-blocks'),
  etherscanUrl: 'https://cronos.org/explorer',
  etherscanName: 'Cronos explorer',
  tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/cronos.tokenlist.json',
  bridgeURL: 'https://cronos.crypto.org/docs/bridge/cdcapp.html',
  nativeToken: {
    symbol: 'CRO',
    name: 'CRO (Wrapped)',
    address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
    logo: CronosLogo,
    decimal: 18,
  },
  rpcUrl: 'https://evm-cronos.crypto.org',
  routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/cronos/route/encode`,
  classic: {
    zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
    router: '0xEaE47c5D99f7B31165a7f0c5f7E0D6afA25CFd55',
    routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
    aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
    factory: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
    migrate: EMPTY,
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
  avgrageBlockTimeInSeconds: 6,
  coingeckoNetworkId: 'cronos',
  coingeckoNativeTokenId: 'crypto-com-chain',
}

export default cronosInfo
