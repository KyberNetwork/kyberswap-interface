import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import { TRIGGER_CLOSE_TO_MARKET_PERCENT } from 'components/StopOrder/constants'
import { useStopOrderReservedBalance } from 'components/StopOrder/hooks/useStopOrderReservedBalance'
import {
  useIsStopOrderEligibleToken,
  useStopOrderSupportedTokens,
} from 'components/StopOrder/hooks/useStopOrderSupportedTokens'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { tryParseAmount } from 'state/swap/hooks'

export type StopOrderWarning = {
  type: 'info' | 'warn'
  message: ReactNode
  /** Only meaningful on a review warning: it disables the confirm button in the modal. */
  blocking?: boolean
}

type ReservedBalanceNoticeProps = {
  symbol?: string
  stopOrdersTo?: string
  limitOrdersTo?: string
}

/**
 * Names whichever open orders hold the claim: the stop order list is on this page, so that link only
 * narrows it to the token, while limit orders live on their own page.
 */
const ReservedBalanceNotice = ({ symbol, stopOrdersTo, limitOrdersTo }: ReservedBalanceNoticeProps) => {
  if (stopOrdersTo && limitOrdersTo) {
    return (
      <Trans>
        Your {symbol} balance is fully used by your open orders. Cancel or reduce an order to free up balance. Review
        your <Link to={stopOrdersTo}>stop orders</Link> and <Link to={limitOrdersTo}>limit orders</Link>.
      </Trans>
    )
  }
  if (limitOrdersTo) {
    return (
      <Trans>
        Your {symbol} balance is fully used by your open limit orders. Cancel or reduce an order to free up balance.{' '}
        <Link to={limitOrdersTo}>Review orders</Link>
      </Trans>
    )
  }
  return (
    <Trans>
      Your {symbol} balance is fully used by your open stop orders. Cancel or reduce an order to free up balance.{' '}
      <Link to={stopOrdersTo ?? ''}>Review orders</Link>
    </Trans>
  )
}

type Props = {
  chainId: ChainId
  currencyIn?: Currency
  currencyOut?: Currency
  /** The sell amount as typed, so the balance check sees the order about to be placed. */
  inputAmount?: string
  triggerPercent?: number
  /** Judged at the trigger input's precision, so a trigger set to market counts as at market. */
  triggerAtOrAboveMarket?: boolean
  /** The pair's oracle gave no usable price, so the trigger cannot be checked against the market. */
  marketPriceUnavailable?: boolean
}

/**
 * Blocking rules and soft warnings for the creation form, in the shape the form's warning stack and
 * CTA already expect.
 */
export const useStopOrderWarnings = ({
  chainId,
  currencyIn,
  currencyOut,
  inputAmount,
  triggerPercent,
  triggerAtOrAboveMarket,
  marketPriceUnavailable,
}: Props) => {
  const { hasEligibleTokens, isLoading: loadingSupportedTokens } = useStopOrderSupportedTokens(chainId)
  const { isEligible, isLoading: loadingEligibility } = useIsStopOrderEligibleToken(currencyIn)
  // The trigger prices tokenIn *in* tokenOut, so the oracle needs a feed for both sides.
  const { isEligible: isReceiveEligible, isLoading: loadingReceiveEligibility } =
    useIsStopOrderEligibleToken(currencyOut)

  const parsedInputAmount = useMemo(() => tryParseAmount(inputAmount, currencyIn), [inputAmount, currencyIn])
  const reservedBalance = useStopOrderReservedBalance({ chainId, currencyIn, parsedInputAmount })

  return useMemo(() => {
    /**
     * Two destinations, because they answer different questions.
     *
     * `formWarnings` explain why the CTA is blocked — the chain cannot take a stop order at all, or the
     * trigger is on the wrong side of the market — so the review modal never opens on them.
     * `reviewWarnings` belong to the review step, right before signing; one marked `blocking` also
     * disables the confirm button there.
     */
    const formWarnings: StopOrderWarning[] = []
    const reviewWarnings: StopOrderWarning[] = []
    // A token that cannot be monitored is a fact about one field, so it is reported in that field's
    // own box rather than in a notice at the bottom of the form.
    let sellTokenWarning: ReactNode
    let receiveTokenWarning: ReactNode
    // The token with no feed, which names the blocked CTA and points the user at the supported list.
    let unavailableToken: Currency | undefined
    let shouldDisableAction = false
    let shouldWarningAction = false

    if (!loadingSupportedTokens && !hasEligibleTokens) {
      formWarnings.push({
        type: 'warn',
        message: <Trans>Stop orders are not available on {NETWORKS_INFO[chainId].name} yet.</Trans>,
      })
      shouldDisableAction = true
    } else if (currencyIn && !loadingEligibility && !isEligible) {
      sellTokenWarning = <Trans>Stop orders are not available for {currencyIn.symbol} — no oracle price feed.</Trans>
      unavailableToken = currencyIn
      shouldDisableAction = true
    } else if (currencyOut && !loadingReceiveEligibility && !isReceiveEligible) {
      receiveTokenWarning = (
        <Trans>Cannot receive {currencyOut.symbol} — no oracle price feed for the receive token.</Trans>
      )
      unavailableToken = currencyOut
      shouldDisableAction = true
    } else if (currencyIn && currencyOut && currencyIn.wrapped.equals(currencyOut.wrapped)) {
      // A native coin and its wrapped token are one asset, so the order would sell a token for itself.
      // The selectors never offer the pair; this catches one that arrives through the URL or is carried
      // over from Swap, where wrapping is a legitimate trade.
      receiveTokenWarning = (
        <Trans>
          Cannot receive {currencyOut.symbol} when selling {currencyIn.symbol} — they are the same asset.
        </Trans>
      )
      shouldDisableAction = true
    } else if (marketPriceUnavailable) {
      // Last in the chain: a token with no feed at all already explains itself in its own field. The
      // review repeats it because the price keeps polling while the modal is open.
      const priceWarning: StopOrderWarning = {
        type: 'warn',
        blocking: true,
        message: (
          <Trans>
            The oracle price for this pair is unavailable right now, so the trigger cannot be checked against the
            market. Please try again shortly.
          </Trans>
        ),
      }
      formWarnings.push(priceWarning)
      reviewWarnings.push(priceWarning)
      shouldDisableAction = true
    }

    /**
     * The order would be funded by taking from what earlier orders still expect to find. Blocked rather
     * than warned: the orders would not all be able to fire, and which one loses is decided by timing.
     */
    if (reservedBalance.hasShortfall && currencyIn) {
      const symbol = currencyIn.wrapped.symbol
      formWarnings.push({
        type: 'warn',
        message: (
          <ReservedBalanceNotice
            symbol={symbol}
            stopOrdersTo={
              reservedBalance.reservedByStopOrders ? `?${new URLSearchParams({ search: symbol ?? '' })}` : undefined
            }
            limitOrdersTo={
              reservedBalance.reservedByLimitOrders
                ? `${APP_PATHS.LIMIT}/${NETWORKS_INFO[chainId].route}?${new URLSearchParams({
                    tab: LimitOrderTab.MY_ORDER,
                    orderTab: LimitOrderStatus.ACTIVE,
                    search: symbol ?? '',
                  })}`
                : undefined
            }
          />
        ),
      })
      shouldDisableAction = true
    }

    /**
     * A trigger at or above the market both makes this a sell-above order and would fire at once. The
     * review repeats the block: the oracle price keeps polling while it is open, so a trigger that was
     * below the market when the form let it through can cross it before the order is signed.
     */
    if (triggerAtOrAboveMarket) {
      const triggerWarning: StopOrderWarning = {
        type: 'warn',
        blocking: true,
        message: (
          <Trans>
            Trigger price must be below the current oracle price. To sell above the current price, use Limit Order
            instead.
          </Trans>
        ),
      }
      formWarnings.push(triggerWarning)
      reviewWarnings.push(triggerWarning)
      shouldDisableAction = true
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
      unavailableToken,
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
    marketPriceUnavailable,
    reservedBalance,
    hasEligibleTokens,
    isEligible,
    isReceiveEligible,
    loadingSupportedTokens,
    loadingEligibility,
    loadingReceiveEligibility,
  ])
}
