import { ChainId } from '@kyberswap/ks-sdk-core'

import polygonIcon from 'assets/networks/polygon.svg'
import { NetworkInfo } from 'constants/networks/type'

const NOT_SUPPORT = null

const maticInfo: NetworkInfo = {
  chainId: ChainId.MATIC,
  route: 'polygon',
  ksSettingRoute: 'polygon',
  priceRoute: 'polygon',
  aggregatorRoute: 'polygon',
  name: 'Polygon PoS',
  icon: polygonIcon,
  iconSelected: NOT_SUPPORT,

  defaultBlockSubgraph: 'https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-polygon',
  etherscanUrl: 'https://polygonscan.com',
  etherscanName: 'Polygonscan',
  bridgeURL: 'https://wallet.polygon.technology/',
  nativeToken: {
    symbol: 'POL',
    name: 'Polygon',
    logo: 'https://storage.googleapis.com/ks-setting-1d682dca/10d6d017-945d-470d-87eb-6a6f89ce8b7e.png',
    decimal: 18,
  },
  defaultRpcUrl: 'https://polygon.kyberengineering.io',
  multicall: '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4',
  classic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-polygon',
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x546C79662E028B661dFB4767664d0273184E4dD1',
      factory: '0x5F1fe642060B5B9658C15721Ea22E982643c095c',
    },
    claimReward: '0x89929Bc485cE72D2Af7b7283B40b921e9F4f80b3',
    fairlaunch: [
      '0xc39bD0fAE646Cb026C73943C5B50E703de2a6532',
      '0xc940acee228893c14274eF1bB64e631308E96e1A',
      '0x7EB05d3115984547a50Ff0e2d247fB6948E1c252',
      '0xc0601973451d9369252Aee01397c0270CD2Ecd60',
      '0x829c27fd3013b944cbE76E92c3D6c45767c0C789',
      '0x3aDd3034Fcf921F20c74c6149FB44921709595B1',
    ],
    fairlaunchV2: ['0xFFD22921947D75342BFE1f8efAcEE4B8B3b5183F', '0x0bAF410dcfCf168f659f46bF1e28D29f68a25E77'],
  },
  elastic: {
    defaultSubgraph: 'https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-matic',
    startBlock: 42880805,
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
      '0x3D6AfE2fB73fFEd2E3dD00c501A174554e147a43',
      '0xf2BcDf38baA52F6b0C1Db5B025DfFf01Ae1d6dBd',
    ],
    zap: {
      router: '0x30C5322E4e08AD500c348007f92f120ab4E2b79e',
      validator: '0xf0096e5B4AAfeEA1DF557264091569ba125c1172',
      executor: '0x8ac7895130e3be8654fff544ae20bf2a93ef19d1',
      helper: '0x214061F0e250A27a49f609d9caf2987a7bC8fA6B',
    },
    'farmV2.1S': [],
  },
  limitOrder: '*',
  averageBlockTimeInSeconds: 2.6,
  coingeckoNetworkId: 'polygon-pos',
  coingeckoNativeTokenId: 'matic-network',
  dexToCompare: 'quickswap',
  geckoTermialId: 'polygon_pos',
}

export default maticInfo
