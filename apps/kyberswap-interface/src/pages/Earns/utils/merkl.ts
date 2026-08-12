import { ParsedPosition } from 'pages/Earns/types'

/**
 * Split a Merkl breakdown `reason` into the pool and position identifiers it ends with,
 * e.g. `UNISWAP_V4_<poolId>_<tokenId>` or `<poolAddress>_<tokenId>`.
 *
 * The identifiers are read from the END of the string because the campaign-type prefix may
 * itself contain underscores — indexing from the start reads `UNISWAP_V4_<poolId>_<tokenId>`
 * as pool `v4` and position id `<poolId>`, which matches nothing.
 *
 * `tokenId` is empty when the reason carries no position id (pool-wide campaigns).
 */
export const parseMerklReason = (reason: string): { poolAddress: string; tokenId: string } => {
  const parts = reason.toLowerCase().split('_')
  const last = parts[parts.length - 1] || ''
  const endsWithTokenId = /^\d+$/.test(last)

  return {
    tokenId: endsWithTokenId ? last : '',
    poolAddress: (endsWithTokenId ? parts[parts.length - 2] : last) || '',
  }
}

/**
 * A Merkl reward is attributed to a position only when BOTH the pool and the position id line up.
 * Position ids are not unique across chains, and the reward's own chain cannot disambiguate them:
 * Merkl computes a campaign on one chain while distributing it on another, so a position's rewards
 * routinely arrive under a different chain than the position lives on.
 */
export const isMerklReasonForPosition = (reason: string, position: ParsedPosition): boolean => {
  const { poolAddress, tokenId } = parseMerklReason(reason)
  if (!tokenId || !poolAddress) return false

  return tokenId === position.tokenId?.toLowerCase() && poolAddress === position.pool.address?.toLowerCase()
}
