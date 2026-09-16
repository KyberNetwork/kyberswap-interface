// USDC is Arc's native asset and its ERC-20 interface at 0x3600… reads the same balance, so it is
// absent here: the widget offers USDC through NATIVE_TOKEN[5042] alone.
const arcTokens = [
  {
    chainId: 5042,
    address: '0xbef5f6d51cb62b58e6a8f77868681825c6fe21c1',
    symbol: 'EURC',
    name: 'EURC',
    decimals: 6,
    logoURI: 'https://storage.googleapis.com/ks-setting-1d682dca/3cb13e14-b165-4305-a272-d4fa03ca58051789468881141.png',
    isWhitelisted: true,
    isStable: false,
    isStandardERC20: false,
  },
  {
    chainId: 5042,
    address: '0x171a4217b86a807a64eb94757db6849fb4bdbaa0',
    symbol: 'cirBTC',
    name: 'Circle Wrapped Bitcoin',
    decimals: 8,
    logoURI: 'https://storage.googleapis.com/ks-setting-1d682dca/0ec4d0f8-8eee-4c73-a496-9582ee163b4f1789469942218.png',
    isWhitelisted: true,
    isStable: false,
    isStandardERC20: false,
  },
  {
    chainId: 5042,
    address: '0x128cc466b61f542da60c70e3aa11c10e19b84edb',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoURI: 'https://storage.googleapis.com/ks-setting-1d682dca/110bf608-a129-45da-b43e-005959936f781789469865285.png',
    isWhitelisted: true,
    isStable: false,
    isStandardERC20: false,
  },
]

export default arcTokens
