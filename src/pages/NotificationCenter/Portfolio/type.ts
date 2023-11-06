export type PortfolioWallet = { id: string; walletAddress: string; nickName: string }

export type Portfolio = {
  name: string
  id: number
  identityId: string
  isHideDust: boolean
  dustThreshold: number
  isPublic: boolean
  wallets: PortfolioWallet[]
}

export type PortfolioWalletBalance = {
  chainId: number
  tokenAddress: string
  amount: string
  decimals: number
  amountUsd: string
  priceUsd: string
  symbol: string
  logoUrl: string
  walletAddress: string // custom
}

export type PortfolioWalletBalanceResponse = {
  totalBalanceUsd: number
  lastUpdatedAt: number
  balances: PortfolioWalletBalanceMap
}

export type PortfolioWalletBalanceMap = {
  [wallet: string]: PortfolioWalletBalance[]
}

export type TokenAllowAnce = {
  amount: string
  chainId: number
  decimals: number
  hasPrice: boolean
  is_checked: boolean
  lastUpdateTimestamp: string
  lastUpdateTxHash: string
  logo: string
  name: string
  ownerAddress: string
  spenderAddress: string
  spenderName: string
  symbol: string
  tag: string
  tokenAddress: string
}

export type TokenAllowAnceResponse = {
  approvals: TokenAllowAnce[]
}
