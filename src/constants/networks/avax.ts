import { ChainId } from '@kyberswap/ks-sdk-core'

import avalancheIcon from 'assets/networks/avalanche.svg'
import { NetworkInfo } from 'constants/networks/type'

const NOT_SUPPORT = null

const avaxInfo: NetworkInfo = {
  chainId: ChainId.AVAXMAINNET,
  route: 'avalanche',
  ksSettingRoute: 'avalanche',
  priceRoute: 'avalanche',
  poolFarmRoute: 'avalanche',
  aggregatorRoute: 'avalanche',
  name: 'Avalanche',
  icon: avalancheIcon,
  iconSelected: NOT_SUPPORT,

  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/ducquangkstn/avalache-blocks',
  etherscanUrl: 'https://snowscan.xyz',
  etherscanName: 'Snowtrace',
  bridgeURL: 'https://core.app/bridge',
  nativeToken: {
    symbol: 'AVAX',
    name: 'AVAX',
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/e72081b5-cb5f-4fb6-b771-ac189bdfd7c81699420213175.png',
    decimal: 18,
    minForGas: 10 ** 16,
  },
  defaultRpcUrl: 'https://avalanche.kyberengineering.io',
  multicall: '0xF2FD8219609E28C61A998cc534681f95D2740f61',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-avalanche',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x8Efa5A9AD6D594Cf76830267077B78cE0Bc5A5F8',
      factory: '0x10908C875D865C66f271F5d3949848971c9595C9',
    },
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
      '0xc9B4001F0f858D2679CF6BBf4C1CE626B1390c0B',
      '0xF2D574807624bdAd750436AfA940563c5fa34726',
    ],
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-avalanche',
    startBlock: 30206201,
    coreFactory: '0xC7a590291e07B9fe9E64b86c58fD8fC764308C4A',
    nonfungiblePositionManager: '0xe222fBE074A436145b255442D919E4E3A6c6a480',
    tickReader: '0x8Fd8Cb948965d9305999D767A02bf79833EADbB3',
    initCodeHash: '0x00e263aaa3a2c06a89b53217a9e7aad7e15613490a72e0f95f303c4de2dc7045',
    quoter: '0x4d47fd5a29904Dae0Ef51b1c450C9750F15D7856',
    routers: '0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4',
    farms: ['0x7D5ba536ab244aAA1EA42aB88428847F25E3E676'],
    farmv2Quoter: '0x6AFeb9EDd6Cf44fA8E89b1eee28284e6dD7705C8',
    farmV2S: [
      '0xA70a1Ad0F91c52c79e177c5A18a7C9E1C4360e0e',
      '0x3d6afe2fb73ffed2e3dd00c501a174554e147a43',
      '0xf2BcDf38baA52F6b0C1Db5B025DfFf01Ae1d6dBd',
    ],
    zap: {
      router: '0x30C5322E4e08AD500c348007f92f120ab4E2b79e',
      validator: '0xf0096e5B4AAfeEA1DF557264091569ba125c1172',
      executor: '0x8ac7895130e3be8654fff544ae20bf2a93ef19d1',
      helper: '0x214061F0e250A27a49f609d9caf2987a7bC8fA6B',
    },
  },
  limitOrder: '*',
  averageBlockTimeInSeconds: 1.85,
  coingeckoNetworkId: 'avalanche',
  coingeckoNativeTokenId: 'avalanche-2',
  deBankSlug: 'avax',
  dexToCompare: 'traderjoe',
  geckoTermialId: 'avax',
}

export default avaxInfo
