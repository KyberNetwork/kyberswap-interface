const BIG_AMOUNT = '11579208923731619542357098500868790785326998466564056'
const ROUTER_ADDRESS = '0x6131b5fae19ea4f9d964eac0408e4408b66337b5'
const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const FROM_WALLET_ADDRESS = '0x0193a8a52d77e27bdd4f12e0cdd52d8ff1d97d68'
const MAX_UINT = '10000000000000000000000000000000000000000000000000000000000000000000'
// const MAX_UINT = '10000000000000000000000000000000000000000000000000000000000000000000'

const Networks = {
  ETHEREUM: { id: 1, name: 'ethereum', chain: 'mainnet' },
  BSC: { id: 56, name: 'bsc', chain: 'bsc_mainnet' },
  POLYGON: { id: 137, name: 'polygon', chain: 'polygon_mainnet' },
  AVALANCHE: { id: 43114, name: 'avalanche', chain: 'avalanche_mainnet' },
  FANTOM: { id: 250, name: 'fantom', chain: 'fantom_mainnet' },
  ARBITRUM: { id: 42161, name: 'arbitrum', chain: 'arbitrum_mainnet' },
  OPTIMISM: { id: 10, name: 'optimism', chain: 'optimism_mainnet' },
  POLYGON_ZKEVM: {
    id: 110,
    name: 'polygon-zkevm',
    chain: 'polygon_zkevm_mainnet',
  },
  SCROOL: {
    id: '534352',
    name: 'scroll',
    chain: 'scroll_mainet',
  },
}

const BASE_URL = {
  production: 'https://router-api.kyberengineering.io',
  staging: 'https://router-api.stg.kyberengineering.io',
  dev: 'https://router-api.dev.kyberengineering.io',
}
const LIMIT_ORDER_URL = {
  production: 'https://limit-order.kyberswap.com',
  staging: 'https://limit-order.stg.kyberengineering.io',
  dev: 'https://limit-order.dev.kyberengineering.io',
}
const ContractAddresses = {
  production: {
    ethereum: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    arbitrum: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    avalanche: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    polygon: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    bsc: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    optimism: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    fantom: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    polygon_zkevm: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
  },
  staging: {
    ethereum: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    arbitrum: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    avalanche: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    polygon: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    bsc: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    optimism: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
    fantom: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
      executor: '0xCaa00aaF6FBC769D627D825B4fAEDC3aaD880597',
    },
  },
  develop: {},
}

const NativeTokens = {
  ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  optimism: '0x4200000000000000000000000000000000000006',
  polygon: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  avalanche: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
  Fantom: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
  Cronos: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
  BitTorrent: '0x8D193c6efa90BCFf940A98785d1Ce9D093d3DC8A',
  VelasEVM: '0xc579D1f3CF86749E05CD06f7ADe17856c2CE3126',
  Aurora: '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB',
  Oasis: '0x21C718C22D52d0F3a789b752D4c2fD5908a8A733',
  arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
}

const StableTokens = {
  ethereum: [
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0x4Fabb145d64652a948d72533023f6E7A623C7C53', // BUSD
    '0x8D6CeBD76f18E1558D4DB88138e2DeFB3909fAD6', // MAI
    '0xB0B195aEFA3650A6908f15CdaC7D92F8a5791B0B', // BOB
    '0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3', // MIM
  ],
  polygon: [
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // usdc
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // usdt
    '0xa3Fa99A148fA48D14Ed51d610c367C61876997F1', // MAI
    '0xB0B195aEFA3650A6908f15CdaC7D92F8a5791B0B', // BOB
    '0x49a0400587A7F65072c87c4910449fDcC5c47242', // MIM
  ],
  bsc: [
    '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', // dai
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // usdc
    '0x55d398326f99059fF775485246999027B3197955', // usdt
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // busd
    '0x3F56e0c36d275367b8C502090EDF38289b3dEa0d', // MAI
    '0xfE19F0B51438fd612f6FD59C1dbB3eA319f433Ba', // MIM
    '0xB0B195aEFA3650A6908f15CdaC7D92F8a5791B0B', // BOB
  ],
  avalanche: [
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDt
    '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', // usdt.e
    '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', // usdc.e
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // usdc
    '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', // dai.e
    '0x3B55E45fD6bd7d4724F5c47E0d1bCaEdd059263e', // MAI
    '0x5c49b268c9841AFF1Cc3B0a418ff5c3442eE3F3b', // MAI
    '0x130966628846BFd36ff31a822705796e8cb8C18D', // MIM
    '0x111111111111ed1D73f860F57b2798b683f2d325', // YUSD
  ],
  Fantom: [
    '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', // dai
    '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', // usdc
    '0x049d68029688eAbF473097a2fC38ef61633A3C7A', // fusdt
    '0xfB98B335551a418cD0737375a2ea0ded62Ea213b', // MAI
    '0x82f0B8B456c1A451378467398982d4834b6829c1', // MIM
  ],
  cronos: [
    '0xF2001B145b43032AAF5Ee2884e456CCd805F677D', // dai
    '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', // usdc
    '0x66e428c3f67a68878562e79A0234c1F83c208770', // usdt
    '0xC74D59A548ecf7fc1754bb7810D716E9Ac3e3AE5', // busd
    '0x2Ae35c8E3D4bD57e8898FF7cd2bBff87166EF8cb', // MAI
  ],
  arbitrum: [
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // dai
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // usdc
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // usdt
    '0x3F56e0c36d275367b8C502090EDF38289b3dEa0d', // MAI
    '0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A', // MIM
  ],
  bttc: [
    '0x9B5F27f6ea9bBD753ce3793a07CbA3C74644330d', // usdt_b
    '0xdB28719F7f938507dBfe4f0eAe55668903D34a15', // usdt_t
    '0xE887512ab8BC60BcC9224e1c3b5Be68E26048B8B', // usdt_e
    '0x935faA2FCec6Ab81265B301a30467Bbc804b43d3', // usdc_t
    '0xCa424b845497f7204D9301bd13Ff87C0E2e86FCF', // usdc_b
    '0xAE17940943BA9440540940DB0F1877f101D39e8b', // usdc_e
    '0xe7dC549AE8DB61BDE71F22097BEcc8dB542cA100', // dai_e
    '0x17F235FD5974318E4E2a5e37919a209f7c37A6d1', // usdd_t
  ],
  velas: [
    '0xe2C120f188eBd5389F71Cf4d9C16d05b62A58993', // usdc
    '0x01445C31581c354b7338AC35693AB2001B50b9aE', // usdt
  ],
  aurora: [
    '0xe3520349F477A5F6EB06107066048508498A291b', // Dai
    '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802', // usdc
    '0x4988a896b1227218e4A686fdE5EabdcAbd91571f', // usdt
    '0xdFA46478F9e5EA86d57387849598dbFB2e964b02', // MAI
  ],
  oasis: [
    '0x80A16016cC4A2E6a2CACA8a4a498b1699fF0f844', // usdc
    '0xdC19A122e268128B5eE20366299fc7b5b199C8e3', // usdtet
    '0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C', // busd
    '0x6Cb9750a92643382e020eA9a170AbB83Df05F30B', // usdt
    '0x5a4Ba16C2AeB295822A95280A7c7149E87769E6A', // ceDAI
    '0x81ECac0D6Be0550A00FF064a4f9dd2400585FE9c', // ceUSDC
    '0x4Bf769b05E832FCdc9053fFFBC78Ca889aCb5E1E', // ceUSDT
  ],
  optimism: [
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Dai
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // usdt
    '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // usdc
    '0xdFA46478F9e5EA86d57387849598dbFB2e964b02', // MAI
    '0xB0B195aEFA3650A6908f15CdaC7D92F8a5791B0B', // BOB
  ],
  solana: [
    'EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o', // Dai
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // usdc
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // usdt
    '9mWRABuz2x6koTPCWiCPM49WUbcrNqGTHBV9T9k7y1o7', // MAI
    'HRQke5DKdDo3jV7wnomyiM8AA3EzkVnxMDdo2FQ5XUe1', // MIM
  ],
}

const LOContractAddresses = {
  production: {
    ethereum: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    bsc: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    polygon: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    avalanche: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    fantom: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    arbitrum: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    optimism: '0x227B0c196eA8db17A665EA6824D972A64202E936',
  },
  staging: {
    ethereum: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    bsc: '0x26279604204aa9D3B530bcd8514fc4276bf0962C',
    polygon: '0x3C2E9227A6d3779e5b469E425CAa7067b40Ff124',
    avalanche: '0x1877Ec0770901cc6886FDA7E7525a78c2Ed4e975',
    fantom: '0x15a7e4A0BD7B96ada9db1219fA62c521bDCd8F81',
    arbitrum: '0x9deCa89E0934a5E0F187a1865299a9a586550864',
    optimism: '0xAF800D3EB207BAFBadE540554DF8bDCe561166f8',
  },
  dev: {
    ethereum: '0x227B0c196eA8db17A665EA6824D972A64202E936',
    bsc: '0x26279604204aa9D3B530bcd8514fc4276bf0962C',
    polygon: '0x3C2E9227A6d3779e5b469E425CAa7067b40Ff124',
    avalanche: '0x1877Ec0770901cc6886FDA7E7525a78c2Ed4e975',
    fantom: '0x15a7e4A0BD7B96ada9db1219fA62c521bDCd8F81',
    arbitrum: '0x9deCa89E0934a5E0F187a1865299a9a586550864',
    optimism: '0xAF800D3EB207BAFBadE540554DF8bDCe561166f8',
  },
}

module.exports = {
  Networks,
  NativeTokens,
  StableTokens,
  LOContractAddresses,
  ContractAddresses,
  BASE_URL,
  LIMIT_ORDER_URL,
  NATIVE_TOKEN_ADDRESS,
  ROUTER_ADDRESS,
  FROM_WALLET_ADDRESS,
  BIG_AMOUNT,
  MAX_UINT,
}
