export interface RewardInfo {
  totalUsdValue: number
  totalLmUsdValue: number
  totalEgUsdValue: number
  claimableUsdValue: number
  claimedUsdValue: number
  inProgressUsdValue: number
  pendingUsdValue: number
  vestingUsdValue: number
  waitingUsdValue: number
  nfts: Array<NftRewardInfo>
  chains: Array<ChainRewardInfo>
  tokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  lmTokens: Array<TokenRewardInfo>
}

export interface ChainRewardInfo {
  chainId: number
  chainName: string
  chainLogo: string
  claimableUsdValue: number
  tokens: Array<TokenRewardInfo>
}

export interface NftRewardInfo {
  nftId: string
  chainId: number
  totalUsdValue: number
  totalLmUsdValue: number
  totalEgUsdValue: number
  claimedUsdValue: number
  inProgressUsdValue: number
  pendingUsdValue: number
  vestingUsdValue: number
  waitingUsdValue: number
  claimableUsdValue: number
  unclaimedUsdValue: number

  tokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  lmTokens: Array<TokenRewardInfo>
}

export interface TokenRewardInfo {
  symbol: string
  logo: string
  address: string
  chainId: number

  totalAmount: number
  claimableAmount: number
  unclaimedAmount: number
  pendingAmount: number
  vestingAmount: number
  waitingAmount: number
  claimableUsdValue: number
}
