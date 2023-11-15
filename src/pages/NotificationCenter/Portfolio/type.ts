import { ChainId } from '@kyberswap/ks-sdk-core'

export type PortfolioWallet = { id: number; walletAddress: string; nickName: string }

export type PortfolioSetting = {
  isHideDust: boolean
  dustThreshold: number
}

export type Portfolio = {
  name: string
  id: string
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
type Token = {
  address: string
  symbol: string
  name: string
  decimals: number
  logo: string
  tag: string
  nftTokenId?: number
}

type TransactionToken = {
  token: Token
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
  tokenApproval?: {
    amount: string
    spenderAddress: string
    token: Token
  }
  tag: string
}

export type TransactionHistoryResponse = {
  data: TransactionHistory[]
  timestamp: number
}

export enum PortfolioTab {
  TOKEN = 'Tokens',
  LIQUIDITY = 'Liquidity',
  NFT = 'NFTs',
  TRANSACTIONS = 'Transactions',
  ALLOWANCES = 'Allowances',
}

export type PortfolioWalletPayload = {
  walletAddress: string
  nickName: string
  walletId?: number
  portfolioId?: string
}

type NFTCollectionDetail = {
  address: string
  name: string
  slug: string
  marketplace: string
  description: string
  updateAt: string
  banner: string
  thumbnail: string
  floorPrice: null
  externalLink: string
  twitter: string
  instagram: string
  isVerified: false
  discordUrl: string
  chainId: number
}
export type NFTDetail = {
  chainID: ChainId
  chainLogo: string
  collectibleAddress: string
  collectibleName: string
  currentPrice: null
  externalData: { name: ''; description: ''; image: ''; animation: ''; attributes: null }
  favorite: false
  lastSalePrice: null
  ownerAddress: string
  paymentToken: string
  tokenBalance: string
  tokenID: string
  tokenUrl: string
}
export type NFTBalance = {
  wallet: string
  collectibleName: string
  collectibleAddress: string
  collectibleSymbol: string
  collectibleLogo: string
  collectionDetail: NFTCollectionDetail
  nftType: null
  items: NFTDetail[]
  totalNFT: number
  chainID: ChainId
}

export type NftCollectionResponse = {
  data: NFTBalance[]
  totalData: number
  timestamp: number
}
