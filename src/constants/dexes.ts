// To combine all kyber options 1 option on UI
export const KYBERSWAP_KS_DEXES_TO_UI_DEXES: { [key: string]: string | undefined } = {
  kyberswap: 'kyberswapv1', // kyberswap classic old contract
  'kyberswap-static': 'kyberswapv1', // kyberswap classic new contract -> with static fee
  'kyberswap-elastic': 'kyberswap-elastic',
  'kyberswap-limit-order': 'kyberswap-limit-order',
  'kyberswap-limit-order-v2': 'kyberswap-limit-order-v2',
  'kyber-pmm': 'kyber-pmm',
}

// only put dex need to be custom, otherwise get from admin
export const KYBERSWAP_UI_DEXES_CUSTOM: {
  [key: string]: {
    name: string
    id: string
  }
} = {
  kyberswapv1: {
    name: 'KyberSwap Classic',
    id: 'kyberswapv1',
  },
}
