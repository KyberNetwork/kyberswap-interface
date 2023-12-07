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
  valueUsd: string
  priceUsd: string
  tokenSymbol: string
  tokenLogo: string
  percentage: string
  // wallet info section
  kyberScore?: number
  kyberScoreTag?: number
  kyberScoreCreatedAt?: number
  walletAddress: string
}

export type PortfolioChainBalance = {
  chainId: ChainId
  percentage: string
  valueUsd: string
}

export type PortfolioWalletBalanceResponse = {
  totalUsd: number
  lastUpdatedAt: number
  balances?: PortfolioWalletBalance[]
}

export type PortfolioChainBalanceResponse = {
  totalUsd: number
  lastUpdatedAt: number
  balances?: PortfolioChainBalance[]
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
  status: 'failed' | 'success'
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
  TOKEN = 'tokens',
  LIQUIDITY = 'liquidity',
  NFT = 'nft',
  TRANSACTIONS = 'transactions',
  ALLOWANCES = 'allowances',
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

export type NFTAttributes = { trait_type: string; value: string }
export type NFTDetail = {
  chainID: ChainId
  collectibleAddress: string
  collectibleName: string
  currentPrice: null
  externalData: {
    name: string
    description: string
    image: string
    animation: string
    attributes: NFTAttributes[] | null
  }
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

export type NFTTokenDetail = {
  wallet: string
  collectibleName: string
  collectibleAddress: string
  collectibleSymbol: string
  collectibleLogo: string
  collectionDetail: NFTCollectionDetail
  nftType: string
  item: NFTDetail
  totalNFT: number
  chainID: ChainId
}

export type NftCollectionResponse = {
  data: NFTBalance[]
  totalData: number
  timestamp: number
}

export type PortfolioSearchData = {
  id: string
  name: string
  totalUsd: string
}

export type LiquidityData = {
  chainName: string
  chainId: number
  chainLogo: string
  balance: {
    project: string
    projectLogo: string
    showWarning: boolean
    tokenId: string
    tokenType: string
    userAddress: string
    web3ProjectAddress: string
    underlying: Array<{
      token: Token
      balance: string
      quotes: {
        usd: {
          symbol: string
          price: number
          priceChange24hPercentage: number
          value: number
          timestamp: number
        }
      }
      assetType: string
    }>
    harvestedReward?: Array<{
      token: Token
      balance: string
      quotes: {
        usd: {
          value: number
        }
      }
    }>
    lpData: {
      lpPoolData: {
        token0: Token
        token1: Token
        fee?: number
        amp?: number
        poolAddress: string
      }
      lpUniV2Data?: {
        pnl: number
        currentToken0Amount: string
        currentToken1Amount: string
        totalToken0Amount: string
        totalToken1Amount: string
        currentToken0Usd: number
        currentToken1Usd: number
        totalToken0Usd: number
        totalToken1Usd: number
        totalFeeEarned0: string
        totalFeeEarned1: string
        feeToken0Usd: number
        feeToken1Usd: number
      }
      lpPositionData?: {
        tokenId: string
        currentToken0Amount: string
        currentToken1Amount: string
        totalToken0Amount: string
        totalToken1Amount: string
        currentToken0Value: number
        currentToken1Value: number
        totalToken0Value: number
        totalToken1Value: number
        impermanentLoss: number
        totalFeeEarned0: string
        totalFeeEarned1: string
        totalFeeEarned: number
        totalFarmingReward: number
        totalFeeEarned0Usd: number
        totalFeeEarned1Usd: number
        pnl: number
      }
    }
  }
}

export type LiquidityDataResponse = {
  data: Array<LiquidityData>
  stats: {
    openPositionCount: number
    closedPositionCount: number
    liquidity: number
    pnl: number
    unclaimedFees: number
    yesterdayEarning: number
    apr: number
    protocols: Array<string>
  }
}
