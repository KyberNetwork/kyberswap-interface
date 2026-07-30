/**
 * Stand-in for the backend authorization endpoint that returns aggregator swap
 * calldata plus a `KS_SIGNER` signature for an unaligned (manual) follower sell.
 *
 * The real service will POST { chainId, copyAccount, positionId, sellRatioBps,
 * slippageBps } and receive the encoded route + co-signature. Until it exists,
 * this returns deterministic mock data so the manual-close / stop-copy flows are
 * exercisable. Swap in an RTK mutation (modelled on `services/smartExit.ts`) when
 * the endpoint lands.
 */

export type UnalignedSellAuthorizationParams = {
  chainId: number
  copyAccount: string
  positionId: string
  /** Portion of the position to sell, in basis points (10000 = 100%). */
  sellRatioBps: number
  /** User-selected slippage, in basis points. */
  slippageBps: number
}

export type UnalignedSellAuthorization = {
  swapper: string
  encodedAmountIn: string
  swapperData: string
  minQuoteTokenReceived: string
  deadline: number
  signature: string
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const fetchUnalignedSellAuthorization = async (
  _params: UnalignedSellAuthorizationParams,
): Promise<UnalignedSellAuthorization> => {
  await wait(600)

  return {
    swapper: '0x0000000000000000000000000000000000000000',
    encodedAmountIn: '0',
    swapperData: '0x',
    minQuoteTokenReceived: '0',
    // 10-minute validity window from the caller's clock.
    deadline: Math.floor(Date.now() / 1000) + 600,
    // 65-byte ECDSA-shaped placeholder (valid hex so ABI encoding never throws).
    signature: `0x${'ab'.repeat(65)}`,
  }
}
