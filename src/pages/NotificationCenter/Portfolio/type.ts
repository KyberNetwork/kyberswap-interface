export type PortfolioWallet = { id: number; walletAddress: string; nickName: string }

export type PortfolioSetting = {
  isHideDust: boolean
  dustThreshold: number
}

export type Portfolio = {
  name: string
  id: number
  identityId: string
  isHideDust: boolean
  dustThreshold: number
  isPublic: boolean
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

type TransactionToken = {
  token: {
    address: string
    symbol: string
    name: string
    decimals: number
    logo: string
    tag: string
  }
  otherAddress: string
  otherName: string
  tokenType: string
  amount: string
  valueInUsd: number
  currentPrice: number
  historicalValueInUsd: number
  historicalPrice: number
}
export type TransactionHistory = {
  chain: {
    chainName: string
    chainId: number
    chainLogo: string
  }
  walletAddress: string
  txHash: string
  blockTime: number
  blockNumber: number
  from: string
  to: string
  value: string
  gas: number
  gasUsed: number
  gasPrice: string
  nativeTokenPrice: number
  historicalNativeTokenPrice: number
  inputData: string
  status: string
  tokenTransfers: TransactionToken[]
  contractInteraction: {
    contractName: string
    methodName: string
  }
  tag: string
}

export type TransactionHistoryResponse = {
  data: TransactionHistory[]
  timestamp: number
}
