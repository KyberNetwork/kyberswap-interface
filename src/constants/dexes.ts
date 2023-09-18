// To combine kyberswap & kyberswap-static into one option on UI
// They are both kyberswap classic, one is dynamic fee, other is static fee
export const KYBERSWAP_KS_DEXES_TO_UI_DEXES: { [key: string]: string | undefined } = {
  'kyberswap-elastic': 'kyberswap-elastic',
  kyberswap: 'kyberswapv1', // kyberswap classic old contract
  'kyberswap-static': 'kyberswapv1', // kyberswap classic new contract -> with static fee
  'kyberswap-limit-order': 'kyberswap-limit-order',
  'kyberswap-limit-order-v2': 'kyberswap-limit-order-v2',
}

export const KYBERSWAP_UI_DEXES: {
  [key: string]: {
    name: string
    id: string
    logoURL: string
  }
} = {
  'kyberswap-elastic': {
    name: 'KyberSwap Elastic',
    id: 'kyberswap-elastic',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
  kyberswapv1: {
    name: 'KyberSwap Classic',
    id: 'kyberswapv1',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
  'kyberswap-limit-order': {
    name: 'KyberSwap Limit Order',
    id: 'kyberswap-limit-order',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
  'kyberswap-limit-order-v2': {
    name: 'KyberSwap Limit Order V2',
    id: 'kyberswap-limit-order-v2',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
}
