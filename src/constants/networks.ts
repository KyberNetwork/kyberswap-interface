import { ChainId } from '@kyberswap/ks-sdk-core'
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'

import Mainnet from '../assets/networks/mainnet-network.svg'
import Polygon from '../assets/networks/polygon-network.png'
import BSC from '../assets/networks/bsc-network.png'
import AVAX from '../assets/networks/avax-network.png'
import FTM from '../assets/networks/fantom-network.png'
import CRONOS from '../assets/networks/cronos-network.png'
import AURORA from '../assets/networks/aurora-network.svg'
import ARBITRUM from '../assets/networks/arbitrum-network.svg'
import VELAS from '../assets/networks/velas-network.png'
import OASIS from '../assets/networks/oasis-network.svg'
import BTT from '../assets/networks/bttc.png'
import OPTIMISM from '../assets/networks/optimism-network.svg'

// todo: merge above logos with below logo

import EthereumLogo from '../assets/images/ethereum-logo.png'
import MaticLogo from '../assets/networks/polygon-network.png'
import BnbLogo from '../assets/images/bnb-logo.png'
import AvaxLogo from '../assets/networks/avax-network.png'
import FtmLogo from '../assets/networks/fantom-network.png'
import CronosLogo from '../assets/svg/cronos-token-logo.svg'
import bttLogo from 'assets/networks/bttc.png'
import velasLogo from 'assets/networks/velas-network.png'
import oasisLogo from 'assets/networks/oasis-network.svg'

export const createClient = (url: string): ApolloClient<NormalizedCacheObject> =>
  new ApolloClient({
    uri: url,
    cache: new InMemoryCache(),
  })

const EMPTY = ''
const EMPTY_ARRAY: any[] = []

export const SUPPORTED_NETWORKS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.ARBITRUM,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.OASIS,
  ChainId.BTTC,
  ChainId.OPTIMISM,

  ...(process.env.REACT_APP_MAINNET_ENV === 'staging'
    ? [ChainId.ROPSTEN, ChainId.MUMBAI, ChainId.BSCTESTNET, ChainId.AVAXTESTNET, ChainId.FANTOM, ChainId.CRONOSTESTNET]
    : []),
]

export type SupportedNetwork = typeof SUPPORTED_NETWORKS[number]

export const TRUESIGHT_NETWORK_TO_CHAINID: { [p: string]: ChainId } = {
  eth: ChainId.MAINNET,
  bsc: ChainId.BSCMAINNET,
  avax: ChainId.AVAXMAINNET,
  polygon: ChainId.MATIC,
  fantom: ChainId.FANTOM,
  cronos: ChainId.CRONOS,
}

export type NetworkInfo = {
  readonly chainId: ChainId
  readonly route: string
  readonly name: string
  readonly icon: string
  readonly classicClient: ApolloClient<NormalizedCacheObject>
  readonly elasticClient: ApolloClient<NormalizedCacheObject>
  readonly blockClient: ApolloClient<NormalizedCacheObject>
  readonly etherscanUrl: string
  readonly etherscanName: string
  readonly tokenListUrl: string
  readonly bridgeURL: string
  readonly nativeToken: {
    readonly symbol: string
    readonly name: string
    readonly address: string
    readonly logo: string
    readonly decimal: number
  }
  readonly rpcUrl: string
  readonly routerUri: string
  readonly classic: {
    readonly zap: string
    readonly router: string
    readonly routerV2: string
    readonly aggregationExecutor: string
    readonly factory: string
    readonly migrate: string
    readonly claimReward: string
    readonly fairlaunch: string[]
    readonly fairlaunchV2: string[]
  }
  readonly elastic: {
    readonly coreFactory: string
    readonly nonfungiblePositionManager: string
    readonly tickReader: string
    readonly initCodeHash: string
    readonly quoter: string
    readonly routers: string
  }
  // token: {
  //   DAI: Token
  //   USDC: Token
  //   USDT: Token
  // }
  readonly avgrageBlockTimeInSeconds: number
  readonly coingeckoNetworkId: string //https://api.coingecko.com/api/v3/asset_platforms
  readonly coingeckoNativeTokenId: string //https://api.coingecko.com/api/v3/coins/list
}

const NETWORKS_INFO_CONFIG: { [chain in ChainId]: NetworkInfo } = {
  [ChainId.MAINNET]: {
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
  },
  [ChainId.ROPSTEN]: {
    chainId: ChainId.ROPSTEN,
    route: 'ropsten',
    name: 'Ropsten',
    icon: Mainnet,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/nguyenhuudungz/dmm-exchange-ropsten'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/promm-ropsten'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/edwardevans094/ropsten-blocks'),
    etherscanUrl: 'https://ropsten.etherscan.io',
    etherscanName: 'Ropsten Explorer',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/ropsten.tokenlist.json',
    bridgeURL: EMPTY,
    nativeToken: {
      symbol: 'ETH',
      name: 'ETH (Wrapped)',
      address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      logo: EthereumLogo,
      decimal: 18,
    },
    rpcUrl: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    routerUri: EMPTY,
    classic: {
      zap: '0xc33D1124c43cE3d020d1153fa0593eB9Ebc75Fb0',
      router: '0x96E8B9E051c81661C36a18dF64ba45F86AC80Aae',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x0639542a5cd99bd5f4e85f58cb1f61d8fbe32de9',
      migrate: '0x247B641bB4eAff621987E2B5c3D0247489556E75',
      claimReward: '0xB2eA6DaAD5334907311c63a27EdFb02535048f50',
      fairlaunch: ['0x0FEEa33C4dE6f37A0Fc550028FddA2401B2Ee5Ce', '0xfEf235b06AFe69589e6C7622F4C071BcCed5bb13'],
      fairlaunchV2: [
        '0x26Eb52A419C5492134BB9007795CdACBa20143DE',
        '0xbc191D7757Be78FbE0997Ba59304A35cdE844dD8',
        '0xBDe20F598AEe01732Be0011E2D2210e10de4e49d',
      ],
    },
    elastic: {
      coreFactory: '0x7D877Cde00D6575bd45E15Af64BA193e32A09743',
      nonfungiblePositionManager: '0x593040768dAF97CEB9d2dBD627B00a209A5FE986',
      tickReader: '0x9A32cd0d2Fc6C60bFE51B0f0Ab27bAd82ca8F3FD',
      initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
      quoter: '0x7BA7cC55D3Ef5226b421bb3fD689251855B4cd21',
      routers: '0x1A46dCaC1d91F1731574BEfAEDaC4E0392726e35',
    },
    avgrageBlockTimeInSeconds: 13.13,
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: EMPTY,
  },
  [ChainId.RINKEBY]: {
    chainId: ChainId.RINKEBY,
    route: 'rinkeby',
    name: 'Rinkeby',
    icon: Mainnet,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/nguyenhuudungz/dmm-exchange-ropsten'), //todo: not exits yet
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/promm-rinkeby'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/billjhlee/rinkeby-blocks'),
    etherscanUrl: 'https://rinkeby.etherscan.io',
    etherscanName: 'Rinkeby Explorer',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/rinkeby.tokenlist.json',
    bridgeURL: EMPTY,
    nativeToken: {
      symbol: 'ETH',
      name: 'ETH (Wrapped)',
      address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      logo: EthereumLogo,
      decimal: 18,
    },
    rpcUrl: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    routerUri: 'https://aggregator-api.dev.kyberengineering.io/rinkeby/route/encode',
    classic: {
      zap: EMPTY,
      router: '0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: EMPTY,
      migrate: EMPTY,
      claimReward: EMPTY,
      fairlaunch: EMPTY_ARRAY,
      fairlaunchV2: EMPTY_ARRAY,
    },
    elastic: {
      coreFactory: '0xBC1A68889EB9DE88838259B16d30C3639304A546',
      nonfungiblePositionManager: '0x50067B85491Fd7f3E3a5e707a9161F1f4f68372e',
      tickReader: '0x8F30cd9943C289B3BcFAB000998b6719F1cFf63a',
      initCodeHash: '0x9af381b43515b80cfc9d1c3abe15a1ebd48392d5df2bcce1eb4940eea548c789',
      quoter: '0x5BcbB0bb7236d9fb3DB4C996B05f0e6162Ba5B64',
      routers: '0x335cB9b399e3c33c4a0d1bE7407675C888f66e86',
    },
    avgrageBlockTimeInSeconds: 13.13,
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: EMPTY,
  },
  [ChainId.GÖRLI]: {
    chainId: ChainId.GÖRLI,
    route: 'goerli',
    name: 'Görli',
    icon: Mainnet,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/nguyenhuudungz/dmm-exchange-ropsten'), //todo: not exits yet
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/promm-rinkeby'), //todo: not exits yet
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/edwardevans094/ropsten-blocks'), //todo: not exits yet
    etherscanUrl: 'https://goerli.etherscan.io',
    etherscanName: 'Goerli Explorer',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/ropsten.tokenlist.json',
    bridgeURL: EMPTY,
    nativeToken: {
      symbol: 'ETH',
      name: 'ETH (Wrapped)',
      address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      logo: EthereumLogo,
      decimal: 18,
    },
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    routerUri: EMPTY,
    classic: {
      zap: EMPTY,
      router: '0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: EMPTY,
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
    avgrageBlockTimeInSeconds: 13.13,
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: EMPTY,
  },
  [ChainId.KOVAN]: {
    chainId: ChainId.KOVAN,
    route: 'kovan',
    name: 'Kovan',
    icon: Mainnet,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/nguyenhuudungz/dmm-exchange-ropsten'), //todo: not exits yet
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/promm-rinkeby'), //todo: not exits yet
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/edwardevans094/ropsten-blocks'), //todo: not exits yet
    etherscanUrl: 'https://kovan.etherscan.io',
    etherscanName: 'Kovan Explorer',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/ropsten.tokenlist.json',
    bridgeURL: EMPTY,
    nativeToken: {
      symbol: 'ETH',
      name: 'ETH (Wrapped)',
      address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      logo: EthereumLogo,
      decimal: 18,
    },
    rpcUrl: 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    routerUri: EMPTY,
    classic: {
      zap: EMPTY,
      router: '0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: EMPTY,
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
    avgrageBlockTimeInSeconds: 13.13,
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: EMPTY,
  },
  [ChainId.MATIC]: {
    chainId: ChainId.MATIC,
    route: 'polygon',
    name: 'Polygon',
    icon: Polygon,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-polygon'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-matic'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-polygon'),
    etherscanUrl: 'https://polygonscan.com',
    etherscanName: 'Polygonscan',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/matic.tokenlist.json',
    bridgeURL: 'https://wallet.matic.network/bridge',
    nativeToken: {
      symbol: 'MATIC',
      name: 'MATIC (Wrapped)',
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      logo: MaticLogo,
      decimal: 18,
    },
    rpcUrl: 'https://polygon.dmm.exchange/v1/mainnet/geth?appId=prod-dmm',
    routerUri: EMPTY,
    classic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x546C79662E028B661dFB4767664d0273184E4dD1',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x5F1fe642060B5B9658C15721Ea22E982643c095c',
      migrate: EMPTY,
      claimReward: '0x89929Bc485cE72D2Af7b7283B40b921e9F4f80b3',
      fairlaunch: [
        '0xc39bD0fAE646Cb026C73943C5B50E703de2a6532',
        '0xc940acee228893c14274eF1bB64e631308E96e1A',
        '0x7EB05d3115984547a50Ff0e2d247fB6948E1c252',
        '0xc0601973451d9369252Aee01397c0270CD2Ecd60',
        '0x829c27fd3013b944cbE76E92c3D6c45767c0C789',
        '0x3aDd3034Fcf921F20c74c6149FB44921709595B1',
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
    avgrageBlockTimeInSeconds: 2.6,
    coingeckoNetworkId: 'polygon-pos',
    coingeckoNativeTokenId: 'matic-network',
  },
  [ChainId.MUMBAI]: {
    chainId: ChainId.MUMBAI,
    route: 'mumbai',
    name: 'Mumbai',
    icon: Polygon,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/piavgh/dmm-exchange-mumbai'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-matic'), //todo: not exits yet
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/piavgh/mumbai-blocks'),
    etherscanUrl: 'https://mumbai.polygonscan.com/',
    etherscanName: 'Polygonscan',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/mumbai.tokenlist.json',
    bridgeURL: 'https://wallet.matic.network/bridge',
    nativeToken: {
      symbol: 'MATIC',
      name: 'MATIC (Wrapped)',
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      logo: MaticLogo,
      decimal: 18,
    },
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    routerUri: EMPTY,
    classic: {
      zap: EMPTY,
      router: '0xD536e64EAe5FBc62E277167e758AfEA570279956',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x7900309d0b1c8D3d665Ae40e712E8ba4FC4F5453',
      migrate: EMPTY,
      claimReward: EMPTY,
      fairlaunch: ['0x882233B197F9e50b1d41F510fD803a510470d7a6'],
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
    avgrageBlockTimeInSeconds: 2.6,
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: EMPTY,
  },
  [ChainId.BSCMAINNET]: {
    chainId: ChainId.BSCMAINNET,
    route: 'bnb',
    name: 'BNB Chain',
    icon: BSC,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/dynamic-amm/dmm-exchange-bsc'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-bsc'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-bsc'),
    etherscanUrl: 'https://bscscan.com',
    etherscanName: 'BscScan',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/bsc.mainnet.tokenlist.json',
    bridgeURL: 'https://www.binance.org/en/bridge',
    nativeToken: {
      symbol: 'BNB',
      name: 'BNB (Wrapped)',
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      logo: BnbLogo,
      decimal: 18,
    },
    rpcUrl: 'https://bscrpc.com',
    routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/bsc/route/encode`,
    classic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x78df70615ffc8066cc0887917f2Cd72092C86409',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x878dFE971d44e9122048308301F540910Bbd934c',
      migrate: EMPTY,
      claimReward: EMPTY,
      fairlaunch: [
        '0x597e3FeDBC02579232799Ecd4B7edeC4827B0435',
        '0x3D88bDa6ed7dA31E15E86A41CA015Ea50771448E',
        '0x829c27fd3013b944cbE76E92c3D6c45767c0C789',
        '0xc49b3b43565b76E5ba7A98613263E7bFdEf1140c',
        '0xcCAc8DFb75120140A5469282a13E9A60B1751276',
        '0x31De05f28568e3d3D612BFA6A78B356676367470',
      ],
      fairlaunchV2: ['0x3474b537da4358A08f916b1587dccdD9585376A4'],
    },
    elastic: {
      coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
      nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
      tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
      initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
      quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
      routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    },
    avgrageBlockTimeInSeconds: 3,
    coingeckoNetworkId: 'binance-smart-chain',
    coingeckoNativeTokenId: 'binancecoin',
  },
  [ChainId.BSCTESTNET]: {
    chainId: ChainId.BSCTESTNET,
    route: 'bnb-testnet',
    name: 'BNB Testnet',
    icon: BSC,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/dynamic-amm-bsc-staging'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/promm-bsc-testnet'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/ethereum-blocks-bsctestnet'),
    etherscanUrl: 'https://testnet.bscscan.com',
    etherscanName: 'BscScan',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/bsc.testnet.tokenlist.json',
    bridgeURL: 'https://www.binance.org/en/bridge',
    nativeToken: {
      symbol: 'BNB',
      name: 'BNB (Wrapped)',
      address: '0xae13d989dac2f0debff460ac112a837c89baa7cd',
      logo: BnbLogo,
      decimal: 18,
    },
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    routerUri: EMPTY,
    classic: {
      zap: '0x0ff512d940F390Cd76D95304fC4493170e0B42DE',
      router: '0x19395624C030A11f58e820C3AeFb1f5960d9742a',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x7900309d0b1c8D3d665Ae40e712E8ba4FC4F5453',
      migrate: EMPTY,
      claimReward: EMPTY,
      fairlaunch: [
        '0xf0fb5bD9EB287A902Bd45b57AE4CF5F9DcEBe550',
        '0xC4ad1e43c755F3437b890eeCE2E55cA7b14D1F15',
        '0x7B731e53B16694cF5dEb87d4C84bA2b4F4EcB4eB',
        '0x35D1b10fA26cd0FbC52Fd22dd58E2d9d22FC631F',
      ],
      fairlaunchV2: EMPTY_ARRAY,
    },
    elastic: {
      coreFactory: '0x2D2B8D5093d0288Da2473459545FE7a2f057bd7D',
      nonfungiblePositionManager: '0xe0a4C2a9343A79A1F5b1505C036d033C8A178F90',
      tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
      initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
      quoter: '0xF4117D3c57BFe20fB2600eaE4028FB12bF99Ac10',
      routers: '0x785b8893342dfEf9B5D565f67be971b859d34a15',
    },
    avgrageBlockTimeInSeconds: 3,
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: EMPTY,
  },
  [ChainId.AVAXMAINNET]: {
    chainId: ChainId.AVAXMAINNET,
    route: 'avalanche',
    name: 'Avalanche',
    icon: AVAX,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-avalanche'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-avalanche'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/avalache-blocks'),
    etherscanUrl: 'https://snowtrace.io',
    etherscanName: 'Snowtrace',
    tokenListUrl:
      'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/avax.mainnet.tokenlist.json',
    bridgeURL: 'https://bridge.avax.network',
    nativeToken: {
      symbol: 'AVAX',
      name: 'AVAX (Wrapped)',
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      logo: AvaxLogo,
      decimal: 18,
    },
    rpcUrl: 'https://avalanche.dmm.exchange/v1/mainnet/geth?appId=prod-dmm',
    routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/avalanche/route/encode`,
    classic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x8Efa5A9AD6D594Cf76830267077B78cE0Bc5A5F8',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x10908C875D865C66f271F5d3949848971c9595C9',
      migrate: EMPTY,
      claimReward: '0x610A05127d51dd42031A39c25aF951a8e77cDDf7',
      fairlaunch: [
        '0xD169410524Ab1c3C51F56a856a2157B88d4D4FF5',
        '0x3133C5C35947dBcA7A76Ee05f106a7c63BFD5C3F',
        '0x98910F7f13496fcDE2ade93648F05b4854Fc99D9',
        '0x854Cf246b09c7366AEe5abce92fA167bfE7f3E75',
      ],
      fairlaunchV2: [
        '0x8e9Bd30D15420bAe4B7EC0aC014B7ECeE864373C',
        '0x845d1d0d9b344fba8a205461b9e94aefe258b918',
        '0xa107e6466Be74361840059a11e390200371a7538',
        '0x89929Bc485cE72D2Af7b7283B40b921e9F4f80b3',
      ],
    },
    elastic: {
      coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
      nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
      tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
      initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
      quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
      routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    },
    avgrageBlockTimeInSeconds: 1.85,
    coingeckoNetworkId: 'avalanche',
    coingeckoNativeTokenId: 'avalanche-2',
  },
  [ChainId.AVAXTESTNET]: {
    chainId: ChainId.AVAXTESTNET,
    route: 'avalanche-testnet',
    name: 'Avalanche Testnet',
    icon: AVAX,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/dmm-exchange-fuij'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-avalanche'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/ducquangkstn/ethereum-block-fuji'),
    etherscanUrl: 'https://testnet.snowtrace.io',
    etherscanName: 'Snowtrace',
    tokenListUrl:
      'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/avax.testnet.tokenlist.json',
    bridgeURL: 'https://bridge.avax.network',
    nativeToken: {
      symbol: 'AVAX',
      name: 'AVAX (Wrapped)',
      address: EMPTY,
      logo: AvaxLogo,
      decimal: 18,
    },
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    routerUri: EMPTY,
    classic: {
      zap: EMPTY,
      router: '0x19395624C030A11f58e820C3AeFb1f5960d9742a',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x7900309d0b1c8D3d665Ae40e712E8ba4FC4F5453',
      migrate: EMPTY,
      claimReward: EMPTY,
      fairlaunch: ['0xC3E2aED41ECdFB1ad41ED20D45377Da98D5489dD'],
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
    avgrageBlockTimeInSeconds: 1.85,
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: EMPTY,
  },
  [ChainId.FANTOM]: {
    chainId: ChainId.FANTOM,
    route: 'fantom',
    name: 'Fantom',
    icon: FTM,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/dynamic-amm/dmm-exchange-ftm'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-fantom'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/fantom-blocks'),
    etherscanUrl: 'https://ftmscan.com',
    etherscanName: 'Ftmscan',
    tokenListUrl:
      'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/fantom.mainnet.tokenlist.json',
    bridgeURL: 'https://multichain.xyz',
    nativeToken: {
      symbol: 'FTM',
      name: 'FTM (Wrapped)',
      address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
      logo: FtmLogo,
      decimal: 18,
    },
    rpcUrl: 'https://rpc.ftm.tools',
    routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/fantom/route/encode`,
    classic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x5d5A5a0a465129848c2549669e12cDC2f8DE039A',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x78df70615ffc8066cc0887917f2Cd72092C86409',
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
    avgrageBlockTimeInSeconds: 1,
    coingeckoNetworkId: 'fantom',
    coingeckoNativeTokenId: 'fantom',
  },
  [ChainId.CRONOS]: {
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
  },
  [ChainId.CRONOSTESTNET]: {
    chainId: ChainId.CRONOSTESTNET,
    route: 'cronos-testnet',
    name: 'Cronos Testnet',
    icon: CRONOS,
    classicClient: createClient(
      'https://testnet-cronos-subgraph.knstats.com/subgraphs/name/dynamic-amm/dmm-exchange-cronos-testnet',
    ),

    elasticClient: createClient(
      'https://cronos-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-cronos',
    ), //todo: not exits yet
    blockClient: createClient(
      'https://testnet-cronos-subgraph.knstats.com/subgraphs/name/dynamic-amm/ethereum-blocks-cronos-testnet',
    ),
    etherscanUrl: 'https://cronos.org/explorer/testnet3',
    etherscanName: 'Cronos explorer',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/cronos.tokenlist.json',
    bridgeURL: 'https://cronos.crypto.org/docs/bridge/cdcapp.html',
    nativeToken: {
      symbol: 'CRO',
      name: 'CRO (Wrapped)',
      address: '0x1A46dCaC1d91F1731574BEfAEDaC4E0392726e35',
      logo: CronosLogo,
      decimal: 18,
    },
    rpcUrl: 'https://cronos-testnet-3.crypto.org:8545',
    routerUri: EMPTY,
    classic: {
      zap: EMPTY,
      router: '0x548E585B17908D0387d16F9BFf46c4EDe7ca7746',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x9fE747AEA6173DD2c72e9D9BF4E2bCbbC0f8aD9e',
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
    avgrageBlockTimeInSeconds: 5.6,
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: EMPTY,
  },
  [ChainId.ARBITRUM]: {
    chainId: ChainId.ARBITRUM,
    route: 'arbitrum',
    name: 'Arbitrum',
    icon: ARBITRUM,
    classicClient: createClient(
      'https://arbitrum-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-arbitrum',
    ),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-arbitrum-one'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/arbitrum-blocks'),
    etherscanUrl: 'https://arbiscan.io',
    etherscanName: 'Arbiscan',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/arbitrum.tokenlist.json',
    bridgeURL: 'https://bridge.arbitrum.io',
    nativeToken: {
      symbol: 'ETH',
      name: 'ETH (Wrapped)',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      logo: EthereumLogo,
      decimal: 18,
    },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/arbitrum/route/encode`,
    classic: {
      zap: '0xf530a090EF6481cfB33F98c63532E7745abab58A',
      router: '0xC3E2aED41ECdFB1ad41ED20D45377Da98D5489dD',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x51E8D106C646cA58Caf32A47812e95887C071a62',
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
    avgrageBlockTimeInSeconds: 1, // TODO: check these info
    coingeckoNetworkId: 'arbitrum-one',
    coingeckoNativeTokenId: 'ethereum',
  },
  [ChainId.ARBITRUM_TESTNET]: {
    chainId: ChainId.ARBITRUM_TESTNET,
    route: 'arbitrum-testnet',
    name: 'Arbitrum Testnet',
    icon: ARBITRUM,
    classicClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-arbitrum-rinkeby'),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-arbitrum-one'),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/viet-nv/arbitrum-rinkeby-blocks'),
    etherscanUrl: 'https://testnet.arbiscan.io',
    etherscanName: 'Arbiscan',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/arbitrum.tokenlist.json',
    bridgeURL: 'https://bridge.arbitrum.io',
    nativeToken: {
      symbol: 'ETH',
      name: 'ETH (Wrapped)',
      address: '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681',
      logo: EthereumLogo,
      decimal: 18,
    },
    rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
    routerUri: EMPTY,
    classic: {
      zap: '0xfa33723F6fA00a35F69F8aCd72A5BE9AF3c8Bd25',
      router: '0x78Ad9A49327D73C6E3B9881eCD653232cF3E480C',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x9D4ffbf49cc21372c2115Ae4C155a1e5c0aACf36',
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
    avgrageBlockTimeInSeconds: 1, // TODO: check these info
    coingeckoNetworkId: EMPTY,
    coingeckoNativeTokenId: 'ethereum',
  },
  [ChainId.BTTC]: {
    chainId: ChainId.BTTC,
    route: 'bittorrent',
    name: 'BitTorrent',
    icon: BTT,
    classicClient: createClient(
      'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-bttc',
    ),
    elasticClient: createClient(
      'https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-bttc',
    ),
    blockClient: createClient('https://bttc-graph.kyberengineering.io/subgraphs/name/kybernetwork/bttc-blocks'),
    etherscanUrl: 'https://bttcscan.com',
    etherscanName: 'Bttcscan',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/bttc.tokenlist.json',
    bridgeURL: 'https://wallet.bt.io/bridge',
    nativeToken: {
      symbol: 'BTT',
      name: 'BTT (Wrapped)',
      address: '0x8D193c6efa90BCFf940A98785d1Ce9D093d3DC8A',
      logo: bttLogo,
      decimal: 18,
    },
    rpcUrl: 'https://rpc.bt.io',
    routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/bttc/route/encode`,
    classic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0xEaE47c5D99f7B31165a7f0c5f7E0D6afA25CFd55',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
      migrate: EMPTY,
      claimReward: '0x1a91f5ADc7cB5763d35A26e98A18520CB9b67e70',
      fairlaunch: EMPTY_ARRAY,
      fairlaunchV2: [
        '0x8e9Bd30D15420bAe4B7EC0aC014B7ECeE864373C',
        '0xa107e6466Be74361840059a11e390200371a7538',
        '0x89929Bc485cE72D2Af7b7283B40b921e9F4f80b3',
      ],
    },
    elastic: {
      coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
      nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
      tickReader: '0xe3AC3fd66EB31cAf4EE0831b262D837c479FFCe5',
      initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
      quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
      routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
    },
    avgrageBlockTimeInSeconds: 2, // TODO: check these info
    coingeckoNetworkId: 'tron',
    coingeckoNativeTokenId: 'bittorrent',
  },
  [ChainId.VELAS]: {
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
      logo: velasLogo,
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
  },
  [ChainId.AURORA]: {
    chainId: ChainId.AURORA,
    route: 'aurora',
    name: 'Aurora',
    icon: AURORA,
    classicClient: createClient(
      'https://aurora-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-aurora',
    ),
    elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-aurora'),
    blockClient: createClient('https://aurora-graph.kyberengineering.io/subgraphs/name/kybernetwork/aurora-blocks'),
    etherscanUrl: 'https://aurorascan.dev',
    etherscanName: 'Aurora Explorer',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/aurora.tokenlist.json',
    bridgeURL: 'https://rainbowbridge.app',
    nativeToken: {
      symbol: 'ETH',
      name: 'ETH (Wrapped)',
      address: '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB',
      logo: EthereumLogo,
      decimal: 18,
    },
    rpcUrl: 'https://mainnet.aurora.dev/GvfzNcGULXzWqaVahC8WPTdqEuSmwNCu3Nu3rtcVv9MD',
    routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/aurora/route/encode`,
    classic: {
      zap: '0xd1f345593cb69fa546852b2DEb90f373F8AdC903',
      router: '0x0622973c3A8893838A3bc0c5309a8c6897148795',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x39a8809fbbf22ccaeac450eaf559c076843eb910',
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
    avgrageBlockTimeInSeconds: 1,
    coingeckoNetworkId: 'aurora',
    coingeckoNativeTokenId: 'ethereum',
  },
  [ChainId.OASIS]: {
    chainId: ChainId.OASIS,
    route: 'oasis',
    name: 'Oasis',
    icon: OASIS,
    classicClient: createClient(
      'https://oasis-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-exchange-oasis',
    ),
    elasticClient: createClient(
      'https://oasis-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-oasis',
    ),
    blockClient: createClient('https://oasis-graph.kyberengineering.io/subgraphs/name/kybernetwork/oasis-blocks'),
    etherscanUrl: 'https://explorer.emerald.oasis.dev',
    etherscanName: 'Oasis Emerald Explorer',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/oasis.tokenlist.json',
    bridgeURL: 'https://oasisprotocol.org/b-ridges',
    nativeToken: {
      symbol: 'ROSE',
      name: 'ROSE (Wrapped)',
      address: '0x21C718C22D52d0F3a789b752D4c2fD5908a8A733',
      logo: oasisLogo,
      decimal: 18,
    },
    rpcUrl: 'https://emerald.oasis.dev',
    routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/oasis/route/encode`,
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
    avgrageBlockTimeInSeconds: 10,
    coingeckoNetworkId: 'oasis',
    coingeckoNativeTokenId: 'oasis-network',
  },
  [ChainId.OPTIMISM]: {
    //todo namgold: fill this
    chainId: ChainId.OPTIMISM,
    route: 'optimism',
    name: 'Optimism',
    icon: OPTIMISM,
    classicClient: createClient(
      'https://optimism-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-optimism',
    ),
    elasticClient: createClient(
      'https://optimism-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-optimism',
    ),
    blockClient: createClient('https://api.thegraph.com/subgraphs/name/ianlapham/uni-testing-subgraph'),
    etherscanUrl: 'https://optimistic.etherscan.io',
    etherscanName: 'Optimistic Ethereum Explorer',
    tokenListUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/tokenLists/optimism.tokenlist.json',
    bridgeURL: 'https://app.optimism.io/bridge',
    nativeToken: {
      symbol: 'ETH',
      name: 'ETH (Wrapped)',
      address: '0x4200000000000000000000000000000000000006',
      logo: EthereumLogo,
      decimal: 18,
    },
    rpcUrl: 'https://mainnet.optimism.io',
    routerUri: `${process.env.REACT_APP_AGGREGATOR_API}/optimism/route/encode`,
    classic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6',
      routerV2: '0x00555513Acf282B42882420E5e5bA87b44D8fA6E',
      aggregationExecutor: '0x41684b361557E9282E0373CA51260D9331e518C9',
      factory: '0x833e4083B7ae46CeA85695c4f7ed25CDAd8886dE',
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
    avgrageBlockTimeInSeconds: 13.13,
    coingeckoNetworkId: 'optimistic-ethereum',
    coingeckoNativeTokenId: 'optimism',
  },
}

//this Proxy help fallback undefined ChainId by Ethereum info
export const NETWORKS_INFO = new Proxy(NETWORKS_INFO_CONFIG, {
  get(target, p) {
    const prop = (p as any) as ChainId
    if (p && target[prop]) return target[prop]
    return target[ChainId.MAINNET]
  },
})

export const ALL_SUPPORT_NETWORKS_ID = Object.values(ChainId).filter(i => typeof i !== 'string') as ChainId[]
export const SHOW_NETWORKS = [
  ChainId.MAINNET,
  ChainId.MATIC,
  ChainId.BSCMAINNET,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.CRONOS,
  ChainId.ARBITRUM,
  ChainId.BTTC,
  ChainId.VELAS,
  ChainId.AURORA,
  ChainId.OASIS,
  ChainId.OPTIMISM,
]
