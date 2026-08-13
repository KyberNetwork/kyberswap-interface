import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'

import { TRIGGER_CLOSE_TO_MARKET_PERCENT } from 'components/StopLoss/constants'
import {
  useIsStopLossEligibleToken,
  useStopLossSupportedTokens,
} from 'components/StopLoss/hooks/useStopLossSupportedTokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'

export type StopLossWarning = {
  type: 'info' | 'warn'
  message: ReactNode
  /** Only meaningful on a review warning: it disables the confirm button in the modal. */
  blocking?: boolean
}

type Props = {
  chainId: ChainId
  currencyIn?: Currency
  currencyOut?: Currency
  triggerPercent?: number
  /** Judged at the trigger input's precision, so a trigger set to market counts as at market. */
  triggerAtOrAboveMarket?: boolean
}

/**
 * Blocking rules and soft warnings for the creation form, in the shape the form's warning stack and
 * CTA already expect.
 */
export const useStopLossWarnings = ({
  chainId,
  currencyIn,
  currencyOut,
  triggerPercent,
  triggerAtOrAboveMarket,
}: Props) => {
  const { hasEligibleTokens, isLoading: loadingSupportedTokens } = useStopLossSupportedTokens(chainId)
  const { isEligible, isLoading: loadingEligibility } = useIsStopLossEligibleToken(currencyIn)
  // The trigger prices tokenIn *in* tokenOut, so the oracle needs a feed for both sides.
  const { isEligible: isReceiveEligible, isLoading: loadingReceiveEligibility } =
    useIsStopLossEligibleToken(currencyOut)

  return useMemo(() => {
    /**
     * Two destinations, because they answer different questions.
     *
     * `formWarnings` say the pair or chain cannot take a stop-loss at all — nothing the user types
     * fixes them, and they block the CTA, so the review modal that would otherwise carry them can
     * never be opened. `reviewWarnings` belong to the review step, right before signing; one marked
     * `blocking` also disables the confirm button there.
     */
    const formWarnings: StopLossWarning[] = []
    const reviewWarnings: StopLossWarning[] = []
    // A token that cannot be monitored is a fact about one field, so it is reported in that field's
    // own box rather than in a notice at the bottom of the form.
    let sellTokenWarning: ReactNode
    let receiveTokenWarning: ReactNode
    let shouldDisableAction = false
    let shouldWarningAction = false

    if (!loadingSupportedTokens && !hasEligibleTokens) {
      formWarnings.push({
        type: 'warn',
        message: <Trans>Stop-loss is not available on {NETWORKS_INFO[chainId].name} yet.</Trans>,
      })
      shouldDisableAction = true
    } else if (currencyIn && !loadingEligibility && !isEligible) {
      sellTokenWarning = <Trans>Stop-loss is not available for {currencyIn.symbol} — no oracle price feed.</Trans>
      shouldDisableAction = true
    } else if (currencyOut && !loadingReceiveEligibility && !isReceiveEligible) {
      receiveTokenWarning = (
        <Trans>Cannot receive {currencyOut.symbol} — no oracle price feed for the receive token.</Trans>
      )
      shouldDisableAction = true
    }

    /**
     * A trigger at or above the market both makes this a sell-above order and would fire at once.
     * The form stays usable so the user can open the review and read why; the block sits there.
     */
    if (triggerAtOrAboveMarket) {
      reviewWarnings.push({
        type: 'warn',
        blocking: true,
        message: (
          <Trans>
            Trigger price must be below the current oracle price. To sell above the current price, use Limit Order
            instead.
          </Trans>
        ),
      })
    } else if (triggerPercent !== undefined && Math.abs(triggerPercent) < TRIGGER_CLOSE_TO_MARKET_PERCENT) {
      reviewWarnings.push({
        type: 'warn',
        message: (
          <Trans>
            Your trigger is close to the current price. This order may trigger quickly, including from normal price
            fluctuations.
          </Trans>
        ),
      })
      shouldWarningAction = true
    }

    return {
      formWarnings,
      reviewWarnings,
      sellTokenWarning,
      receiveTokenWarning,
      shouldDisableAction,
      shouldWarningAction,
      hasIneligibleToken: !!currencyIn && !loadingEligibility && !isEligible && hasEligibleTokens,
    }
  }, [
    chainId,
    currencyIn,
    currencyOut,
    triggerPercent,
    triggerAtOrAboveMarket,
    hasEligibleTokens,
    isEligible,
    isReceiveEligible,
    loadingSupportedTokens,
    loadingEligibility,
    loadingReceiveEligibility,
  ])
}
