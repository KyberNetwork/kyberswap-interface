export interface PositionDetails {
  nonce: bigint
  tokenId: bigint
  poolId: string
  operator: string
  tickLower: number
  tickUpper: number
  liquidity: bigint
  feeGrowthInsideLast: bigint
  stakedLiquidity?: bigint
  rTokenOwed: bigint
  token0: string
  token1: string
  fee: number
  endTime?: number
}
