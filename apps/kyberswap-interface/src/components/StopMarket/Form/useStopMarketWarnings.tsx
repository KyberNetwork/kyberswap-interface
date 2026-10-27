import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { OrderKind, ShowOrdersState } from 'components/LimitOrder/types'
import { useStopMarketReservedBalance } from 'components/StopMarket/hooks/useStopMarketReservedBalance'
import {
  useIsStopMarketEligibleToken,
  useStopMarketSupportedTokens,
} from 'components/StopMarket/hooks/useStopMarketSupportedTokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { tryParseAmount } from 'state/swap/hooks'

export type StopMarketWarning = {
  type: 'info' | 'warn'
  message: ReactNode
  /** Only meaningful on a review warning: it disables the confirm button in the modal. */
  blocking?: boolean
}

const REVIEW_ORDERS_STATE: ShowOrdersState = { showOrders: OrderKind.STOP }

/**
 * The stop market order list sits on this page, so its link narrows the list to the token and opens the open
 * stop market orders, whichever kind the list shows.
 */
const ReservedBalanceNotice = ({ symbol }: { symbol?: string }) => (
  <Trans>
    Your {symbol} balance is fully used by your open stop market orders. Cancel or reduce an order to free up balance.{' '}
    <Link to={`?${new URLSearchParams({ search: symbol ?? '' })}`} state={REVIEW_ORDERS_STATE}>
      Review orders
    </Link>
  </Trans>
)

type Props = {
  chainId: ChainId
  currencyIn?: Currency
  currencyOut?: Currency
  /** The sell amount as typed, so the balance check sees the order about to be placed. */
  inputAmount?: string
  /** The pair's oracle gave no usable price, so the trigger cannot be placed against the market. */
  marketPriceUnavailable?: boolean
  /** Raw amount of the open order being edited, whose claim on the balance the edit gives up. */
  releasedAmount?: string
}

/**
 * Blocking rules and soft warnings for the creation form, in the shape the form's warning stack and
 * CTA already expect.
 */
export const useStopMarketWarnings = ({
  chainId,
  currencyIn,
  currencyOut,
  inputAmount,
  marketPriceUnavailable,
  releasedAmount,
}: Props) => {
  const { hasEligibleTokens, isLoading: loadingSupportedTokens } = useStopMarketSupportedTokens(chainId)
  const { isEligible, isLoading: loadingEligibility } = useIsStopMarketEligibleToken(currencyIn)
  // The trigger prices tokenIn *in* tokenOut, so the oracle needs a feed for both sides.
  const { isEligible: isReceiveEligible, isLoading: loadingReceiveEligibility } =
    useIsStopMarketEligibleToken(currencyOut)

  const parsedInputAmount = useMemo(() => tryParseAmount(inputAmount, currencyIn), [inputAmount, currencyIn])
  const hasReservedBalanceShortfall = useStopMarketReservedBalance({
    chainId,
    currencyIn,
    parsedInputAmount,
    releasedAmount,
  })

  return useMemo(() => {
    /**
     * Two destinations, because they answer different questions.
     *
     * `formWarnings` explain why the CTA is blocked — the chain cannot take a stop market order at all, the
     * pair has no price to place it against, or the balance is already claimed by open stop market orders —
     * so the review modal never opens on them.
     * `reviewWarnings` belong to the review step, right before signing; one marked `blocking` also
     * disables the confirm button there.
     */
    const formWarnings: StopMarketWarning[] = []
    const reviewWarnings: StopMarketWarning[] = []
    // A token that cannot be monitored is a fact about one field, so it is reported in that field's
    // own box rather than in a notice at the bottom of the form.
    let sellTokenWarning: ReactNode
    let receiveTokenWarning: ReactNode
    // The token with no feed, which names the blocked CTA and points the user at the supported list.
    let unavailableToken: Currency | undefined
    let shouldDisableAction = false

    if (!loadingSupportedTokens && !hasEligibleTokens) {
      formWarnings.push({
        type: 'warn',
        message: <Trans>Stop market orders are not available on {NETWORKS_INFO[chainId].name} yet.</Trans>,
      })
      shouldDisableAction = true
    } else if (currencyIn && !loadingEligibility && !isEligible) {
      sellTokenWarning = (
        <Trans>Stop market orders are not available for {currencyIn.symbol} — no oracle price feed.</Trans>
      )
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
      const priceWarning: StopMarketWarning = {
        type: 'warn',
        blocking: true,
        message: (
          <Trans>
            The oracle price for this pair is unavailable right now, so the trigger cannot be compared with the market.
            Please try again shortly.
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
    if (hasReservedBalanceShortfall && currencyIn) {
      formWarnings.push({ type: 'warn', message: <ReservedBalanceNotice symbol={currencyIn.wrapped.symbol} /> })
      shouldDisableAction = true
    }

    return {
      formWarnings,
      reviewWarnings,
      sellTokenWarning,
      receiveTokenWarning,
      unavailableToken,
      shouldDisableAction,
      hasIneligibleToken: !!currencyIn && !loadingEligibility && !isEligible && hasEligibleTokens,
    }
  }, [
    chainId,
    currencyIn,
    currencyOut,
    marketPriceUnavailable,
    hasReservedBalanceShortfall,
    hasEligibleTokens,
    isEligible,
    isReceiveEligible,
    loadingSupportedTokens,
    loadingEligibility,
    loadingReceiveEligibility,
  ])
}
