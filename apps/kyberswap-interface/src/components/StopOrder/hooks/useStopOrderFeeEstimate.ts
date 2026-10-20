import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useGetStopOrderFeeEstimateQuery } from 'services/stopOrder'

import { DEFAULT_MAX_FEES_PERCENTAGE, DEFAULT_MAX_GAS_PERCENTAGE } from 'components/StopOrder/constants'
import { StopOrderCorePayload } from 'components/StopOrder/types'
import { buildStopOrderPayload, getStopOrderServiceErrorMessage } from 'components/StopOrder/utils'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'

/** How long the terms have to sit still before their fee is asked for. */
const FEE_ESTIMATE_DEBOUNCE_MS = 500

type Params = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount: string
  triggerPrice: string
  /** Basis points. */
  slippage: number
  /** Milliseconds. */
  expiredAt: number
}

/**
 * The fee the service would charge on the terms as they stand, for the cards and the review to show.
 * Only settled terms are asked about, so typing does not send a request per keystroke. Signing
 * estimates again on its own: this figure is for reading, not for the signed cap.
 */
export const useStopOrderFeeEstimate = ({
  currencyIn,
  currencyOut,
  inputAmount,
  triggerPrice,
  slippage,
  expiredAt,
}: Params) => {
  const { account, chainId } = useActiveWeb3React()

  const payload = useMemo<StopOrderCorePayload | undefined>(() => {
    if (!account || !currencyIn || !currencyOut) return undefined
    if (!(Number(inputAmount) > 0) || !(Number(triggerPrice) > 0)) return undefined
    return buildStopOrderPayload({
      chainId,
      account,
      currencyIn,
      currencyOut,
      inputAmount,
      triggerPrice,
      slippage,
      expiredAt,
      maxFeesPercentage: DEFAULT_MAX_FEES_PERCENTAGE,
      maxGasPercentage: DEFAULT_MAX_GAS_PERCENTAGE,
    })
  }, [account, chainId, currencyIn, currencyOut, inputAmount, triggerPrice, slippage, expiredAt])

  const settledPayload = useDebounce(payload, FEE_ESTIMATE_DEBOUNCE_MS)
  const { currentData, isFetching, error, refetch } = useGetStopOrderFeeEstimateQuery(
    settledPayload as StopOrderCorePayload,
    { skip: !settledPayload },
  )

  // Waiting covers the debounce too, so the figure never stands for terms the user has since changed.
  const isLoading = !!payload && (payload !== settledPayload || isFetching)
  // The service's own reason where it gives one, such as an order too small to carry its fee.
  const errorMessage =
    payload && !isLoading && error
      ? getStopOrderServiceErrorMessage(error) ?? t`The fee could not be estimated. Please try again.`
      : undefined
  return {
    fee: payload && !isLoading ? currentData : undefined,
    isLoading,
    errorMessage,
    refetch,
  }
}
