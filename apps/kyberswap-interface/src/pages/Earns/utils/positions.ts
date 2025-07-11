import { NETWORKS_INFO } from 'constants/networks'
import { CoreProtocol } from 'pages/Earns/constants'
import { EarnPosition, ParsedPosition } from 'pages/Earns/types'
import { isForkFrom } from 'pages/Earns/utils'

export const parsePosition = (position: EarnPosition): ParsedPosition => {
  const feePending = position.feePending
  const token0PendingQuote = feePending[0]?.quotes.usd
  const token1PendingQuote = feePending[1]?.quotes.usd
  const nativeToken = NETWORKS_INFO[position.chainId as keyof typeof NETWORKS_INFO].nativeToken

  return {
    id: position.tokenId,
    dex: position.pool.project || '',
    dexImage: position.pool.projectLogo || '',
    chainId: position.chainId,
    chainName: position.chainName,
    chainLogo: position.chainLogo || '',
    poolAddress: position.pool.poolAddress || '',
    tokenAddress: position.tokenAddress,
    token0Address: position.pool.tokenAmounts[0]?.token.address || '',
    token1Address: position.pool.tokenAmounts[1]?.token.address || '',
    token0Logo: position.pool.tokenAmounts[0]?.token.logo || '',
    token1Logo: position.pool.tokenAmounts[1]?.token.logo || '',
    token0Symbol: position.pool.tokenAmounts[0]?.token.symbol || '',
    token1Symbol: position.pool.tokenAmounts[1]?.token.symbol || '',
    token0Decimals: position.pool.tokenAmounts[0]?.token.decimals,
    token1Decimals: position.pool.tokenAmounts[1]?.token.decimals,
    token0Price: position.currentAmounts[0]?.token.price,
    token1Price: position.currentAmounts[1]?.token.price,
    poolFee: position.pool.fees?.[0],
    status: position.status,
    totalValue: position.currentPositionValue,
    apr: position.apr || 0,
    token0TotalAmount: position
      ? position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price
      : 0,
    token1TotalAmount: position
      ? position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price
      : 0,
    minPrice: position.minPrice || 0,
    maxPrice: position.maxPrice || 0,
    pairRate: position.pool.price || 0,
    earning24h: position.earning24h,
    earning7d: position.earning7d,
    totalEarnedFee:
      position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0) +
      position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0),
    createdTime: position.createdTime,
    token0UnclaimedAmount: token0PendingQuote ? token0PendingQuote.value / token0PendingQuote.price : 0,
    token1UnclaimedAmount: token1PendingQuote ? token1PendingQuote.value / token1PendingQuote.price : 0,
    token0UnclaimedValue: token0PendingQuote?.value || 0,
    token1UnclaimedValue: token1PendingQuote?.value || 0,
    token0UnclaimedBalance: feePending[0]?.balance || '0',
    token1UnclaimedBalance: feePending[1]?.balance || '0',
    unclaimedFees: feePending.reduce((sum, fee) => sum + fee.quotes.usd.value, 0),
    isUniv2: isForkFrom(position.pool.project, CoreProtocol.UniswapV2),
    nativeToken,
  }
}
