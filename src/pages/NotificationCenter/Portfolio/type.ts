export type PortfolioWallet = { id: string; walletAddress: string; nickName: string }

export type Portfolio = {
  name: string
  id: string
  identityId: string
  isHideDust: boolean
  dustThreshold: number
  isPublic: boolean
  wallets: PortfolioWallet[]
}
