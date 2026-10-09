import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetStopOrderOraclePriceQuery } from 'services/stopOrder'

import { isSupportStopOrder } from 'constants/networks'

const POLL_INTERVAL = 15_000

/**
 * The oracle carries far more precision than a double. Anything used as an amount must stay a string;
 * this is only for the ratio maths behind a percentage, where a double is already precise enough.
 */
export const oraclePriceToNumber = (price?: string) => {
  if (!price) return undefined
  const value = Number(price)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

/**
 * The cross-rate the trigger is actually evaluated against — quote per base, matching the units the
 * trigger is typed in. Deliberately not the app's USD-ratio price, which can disagree with the oracle.
 */
export const useStopOrderOraclePrice = (base?: Currency, quote?: Currency, chainId?: ChainId) => {
  const resolvedChainId = chainId ?? (base?.chainId as ChainId | undefined)
  const baseAddress = base?.wrapped.address
  const quoteAddress = quote?.wrapped.address

  const canQuery =
    !!resolvedChainId &&
    !!baseAddress &&
    !!quoteAddress &&
    baseAddress.toLowerCase() !== quoteAddress.toLowerCase() &&
    isSupportStopOrder(resolvedChainId)

  // `currentData`, not `data`: `data` keeps the previous pair's price while the new pair loads, and a
  // trigger seeded or measured against it would belong to the wrong market.
  const { currentData, isError } = useGetStopOrderOraclePriceQuery(
    { chainId: resolvedChainId as ChainId, base: baseAddress ?? '', quote: quoteAddress ?? '' },
    { skip: !canQuery, pollingInterval: POLL_INTERVAL },
  )

  return useMemo(
    () => ({
      /** Full-precision decimal string, safe to display or hand back to the service. */
      price: currentData?.price,
      /** Lossy convenience value for percentage maths only. */
      priceNumber: oraclePriceToNumber(currentData?.price),
      updatedAt: currentData?.updatedAt,
      source: currentData?.source,
      isLoading: canQuery && !currentData && !isError,
      /** True once the pair is known to have no configured feed. */
      hasNoFeed: canQuery && isError,
    }),
    [currentData, isError, canQuery],
  )
}
