import { EARN_DEXES, isSupportedExchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { getTokenId } from 'pages/Earns/utils'
import { updateUnfinalizedPosition } from 'pages/Earns/utils/unfinalizedPosition'
import type { UnfinalizedPositionSnapshot } from 'state/transactions/type'

/**
 * Turns the snapshot captured when a zap was submitted into a cached placeholder position, resolving the
 * minted NFT id from the mined receipt. Lives apart from the cache module so reading the cache does not
 * pull in the wallet stack.
 *
 * Returns false when the position cannot be addressed — an NFT id that no receipt could yield — in which
 * case the position simply waits for the indexer instead of showing a row that leads nowhere.
 */
export const writeUnfinalizedPositionFromSnapshot = async ({
  txHash,
  snapshot,
  owner,
}: {
  txHash: string
  snapshot: UnfinalizedPositionSnapshot
  owner?: string
}): Promise<boolean> => {
  const { chainId, dex, dexLogo, positionId, pool, token0, token1, value, createdAt } = snapshot
  if (!isSupportedExchange(dex)) return false

  const isUniv2 = EARN_DEXES[dex].isForkFrom === CoreProtocol.UniswapV2
  const tokenId = isUniv2 ? undefined : positionId || (await getTokenId(chainId, txHash, dex, { waitForMined: true }))

  return updateUnfinalizedPosition(
    {
      chainId,
      dexId: dex,
      dexLogo,
      poolAddress: pool.address,
      poolFee: pool.fee,
      tokenId,
      txHash,
      value,
      createdAt,
      // A zap into a position that already exists leaves the indexed row in place and only makes its value
      // stale, so it gets the updating badge rather than a placeholder row of its own.
      isValueUpdating: !!positionId,
      token0,
      token1,
    },
    owner,
  )
}
