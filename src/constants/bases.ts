import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

// help init default values for `BASES_TO_CHECK_TRADES_AGAINST`, `SUGGESTED_BASES` below by ...WETH_ONLY
const WETH_ONLY: ChainTokenList = {
  [ChainId.MAINNET]: [WETH[ChainId.MAINNET]],
  [ChainId.GÖRLI]: [WETH[ChainId.GÖRLI]],
  [ChainId.MATIC]: [WETH[ChainId.MATIC]],
  [ChainId.MUMBAI]: [WETH[ChainId.MUMBAI]],
  [ChainId.BSCTESTNET]: [WETH[ChainId.BSCTESTNET]],
  [ChainId.BSCMAINNET]: [WETH[ChainId.BSCMAINNET]],
  [ChainId.AVAXTESTNET]: [WETH[ChainId.AVAXTESTNET]],
  [ChainId.AVAXMAINNET]: [WETH[ChainId.AVAXMAINNET]],
  [ChainId.FANTOM]: [WETH[ChainId.FANTOM]],
  [ChainId.CRONOS]: [WETH[ChainId.CRONOS]],
  [ChainId.BTTC]: [WETH[ChainId.BTTC]],
  [ChainId.ARBITRUM]: [WETH[ChainId.ARBITRUM]],
  [ChainId.OPTIMISM]: [WETH[ChainId.OPTIMISM]],
  [ChainId.ZKSYNC]: [WETH[ChainId.ZKSYNC]],
  [ChainId.LINEA]: [WETH[ChainId.LINEA]],
  [ChainId.ZKEVM]: [WETH[ChainId.ZKEVM]],
  [ChainId.BASE]: [WETH[ChainId.BASE]],
  [ChainId.SCROLL]: [WETH[ChainId.SCROLL]],
  [ChainId.BLAST]: [WETH[ChainId.BLAST]],
  [ChainId.MANTLE]: [WETH[ChainId.MANTLE]],
  [ChainId.XLAYER]: [WETH[ChainId.XLAYER]],
}

// used to construct intermediary pairs for trading
// => Only used for elastic swap
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [
    WETH[ChainId.MAINNET],
    new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'DAI'),
    new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
    new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD'),
  ],
  [ChainId.MATIC]: [
    WETH[ChainId.MATIC],
    new Token(ChainId.MATIC, '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 18, 'DAI', 'DAI'),
    new Token(ChainId.MATIC, '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 6, 'USDC', 'USD Coin'),
    new Token(ChainId.MATIC, '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6, 'USDT', 'Tether USD'),
    new Token(ChainId.MATIC, '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 18, 'WETH', 'Ether'),
  ],
  [ChainId.BSCMAINNET]: [
    WETH[ChainId.BSCMAINNET],
    new Token(ChainId.BSCMAINNET, '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 18, 'DAI', 'DAI'),
    new Token(ChainId.BSCMAINNET, '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18, 'USDC', 'USDC'),
    new Token(ChainId.BSCMAINNET, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT', 'Tether USD'),
    new Token(ChainId.BSCMAINNET, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD'),
  ],
  [ChainId.AVAXMAINNET]: [
    WETH[ChainId.AVAXMAINNET],
    new Token(ChainId.AVAXMAINNET, '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', 18, 'DAI', 'DAI'),
    new Token(ChainId.AVAXMAINNET, '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', 6, 'USDC.e', 'USDC.e'),
    new Token(ChainId.AVAXMAINNET, '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', 6, 'USDT.e', 'Tether USD'),
  ],
  [ChainId.FANTOM]: [
    WETH[ChainId.FANTOM],
    new Token(ChainId.FANTOM, '0x91a40C733c97a6e1BF876EaF9ed8c08102eB491f', 18, 'DAI', 'DAI'),
    new Token(ChainId.FANTOM, '0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf', 6, 'USDC', 'USD Coin'),
    new Token(ChainId.FANTOM, '0xcc1b99dDAc1a33c201a742A1851662E87BC7f22C', 6, 'fUSDT', 'Tether USD'),
  ],
  [ChainId.OPTIMISM]: [
    WETH[ChainId.OPTIMISM],
    new Token(ChainId.OPTIMISM, '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', 6, 'USDC', 'USD Coin'),
    new Token(ChainId.OPTIMISM, '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', 6, 'USDT', 'Tether USD'),
  ],
}
