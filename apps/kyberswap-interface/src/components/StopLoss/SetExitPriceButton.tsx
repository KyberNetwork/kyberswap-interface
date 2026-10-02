import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'

import { ButtonOutlined } from 'components/Button'
import { useIsStopLossEligibleToken } from 'components/StopLoss/hooks/useStopLossSupportedTokens'
import { useStopLossTracking } from 'components/StopLoss/hooks/useStopLossTracking'
import { APP_PATHS } from 'constants/index'
import { isSupportStopLoss } from 'constants/networks'
import { NativeCurrencies, STABLE_TOKENS } from 'constants/tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useLimitActionHandlers } from 'state/limit/hooks'
import { currencyId } from 'utils/currencyId'

type Props = {
  /** The token the user now holds and might want to protect. */
  currency?: Currency
  amount?: CurrencyAmount<Currency>
  source: 'post_swap' | 'portfolio'
  className?: string
  onNavigate?: () => void
}

/**
 * Sends the user to a stop-loss pre-filled with what they hold. The amount rides along through the
 * shared swap state rather than the URL, which only carries the pair.
 */
const SetExitPriceButton = ({ currency, amount, source, className, onNavigate }: Props) => {
  const navigate = useNavigate()
  const { setInputValue } = useLimitActionHandlers()
  const { trackExitPriceEntryClicked } = useStopLossTracking()
  const { isEligible } = useIsStopLossEligibleToken(currency)

  const chainId = currency?.chainId
  if (!currency || !chainId || !isSupportStopLoss(chainId) || !isEligible) return null

  // Sell into the chain's stable, unless that is the token being protected.
  const stable = STABLE_TOKENS[chainId]
  const counter =
    stable && !currency.wrapped.equals(stable) ? stable : (NativeCurrencies[chainId] as Currency | undefined)
  if (!counter) return null

  const onClick = () => {
    trackExitPriceEntryClicked({ currency, source })
    if (amount) setInputValue(amount.toExact())
    navigate(
      `${APP_PATHS.STOP_LOSS}/${NETWORKS_INFO[chainId].route}/${currencyId(currency, chainId)}-to-${currencyId(
        counter,
        chainId,
      )}`,
    )
    onNavigate?.()
  }

  return (
    <ButtonOutlined onClick={onClick} className={className} data-testid="stop-loss-set-exit-price-button">
      <Trans>Set exit price</Trans>
    </ButtonOutlined>
  )
}

export default SetExitPriceButton
