import { ChainId } from '@kyberswap/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import ethereumIcon from 'assets/networks/ethereum.svg'
import { EnvKeys } from 'constants/env'
import { NetworkInfo } from 'constants/networks/type'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const görliInfo: NetworkInfo = {
  chainId: ChainId.GÖRLI,
  route: 'goerli',
  ksSettingRoute: 'ethereum',
  priceRoute: 'ethereum',
  aggregatorRoute: EMPTY,
  name: 'Görli',
  icon: ethereumIcon,
  iconSelected: NOT_SUPPORT,

  etherscanUrl: 'https://goerli.etherscan.io',
  etherscanName: 'Goerli Explorer',
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'gETH',
    name: 'GörliETH',
    logo: EthereumLogo,
    decimal: 18,
  },
  defaultRpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  multicall: '0xD9bfE9979e9CA4b2fe84bA5d4Cf963bBcB376974',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-classic-goerli',
    static: {
      zap: EMPTY,
      router: '0x4F4994415B72FE87E01345f522D0A62A584D19b4',
      factory: '0xE612668FbE2CfDb71A4b6cD422d611E63585D33A',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: NOT_SUPPORT,
    claimReward: NOT_SUPPORT,
    fairlaunch: EMPTY_ARRAY,
    fairlaunchV2: EMPTY_ARRAY,
    fairlaunchV3: ['0xd47AbBEAE91043e4FC195b9416D4f0A24Bb52718'],
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/viet-nv/kyberswap-elastic-goerli',
    startBlock: 14932476,
    coreFactory: '0x1a91f5ADc7cB5763d35A26e98A18520CB9b67e70',
    nonfungiblePositionManager: '0x8B76f8e008570686aD5933e5669045c5B01DB7bE',
    tickReader: '0x24F40B8a021d5442B97459A336D1363E4D0f1388',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x032c677619f72c670e4DA64126B48d906dfa952F',
    routers: '0x45a5B8Cf524EC574b40e80274F0F3856A679C5c4',
    farms: [],
    farmv2Quoter: '0x1e9C12303855433052A31815Dc28C146aF3e9C1F',
    farmV2S: ['0xdd463A7a71122D0248f3Fa1eF975202bAEe74B46'],
  },
  limitOrder: [EnvKeys.DEV],
  averageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: 'ethereum',
  coingeckoNativeTokenId: 'ethereum',
  dexToCompare: NOT_SUPPORT,
  kyberDAO: {
    staking: '0x9bc1214E28005e9c3f5E99Ff01C23D42796702CF',
    dao: '0x583c0A1a49CdC99f4709337fa5500844316366dc',
    rewardsDistributor: '0x62D82BC6aa44a4340F29E629b43859b7e0C1E915',
    daoStatsApi: 'https://kyberswap-dao-stats.dev.kyberengineering.io',
    KNCAddress: '0xd19e5119Efc73FeA1e70f9fbbc105DaB89D914e4',
    KNCLAddress: '0x03010458f00F1B9fEb6Ad5d67A065971126fBBc1',
  },
  geckoTermialId: NOT_SUPPORT,
}

export default görliInfo
