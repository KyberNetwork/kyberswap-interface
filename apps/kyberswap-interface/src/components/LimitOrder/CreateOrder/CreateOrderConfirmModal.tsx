import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { MouseEvent, ReactNode, useEffect, useState } from 'react'
import { Repeat } from 'react-feather'

import { ButtonPrimary, ButtonWarning } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { WORSE_PRICE_DIFF_THRESHOLD } from 'components/LimitOrder/CreateOrder/useWarningCreateOrder'
import { OrderSummary } from 'components/LimitOrder/components'
import { formatAmountOrder, removeTrailingZero } from 'components/LimitOrder/helpers'
import { LimitOrderCreateContext } from 'components/LimitOrder/types'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import { CloseIcon } from 'theme/components'
import { formatDisplayNumber } from 'utils/numbers'

const formatRateValue = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '--'
  const numberValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numberValue)) return '--'
  return removeTrailingZero(numberValue.toPrecision(6))
}

const TokenAmountValue = ({ currency, amount }: { currency?: Currency; amount: string }) => (
  <HStack className="min-w-0 max-w-full items-center justify-end gap-2">
    {currency && <CurrencyLogo currency={currency} size="20px" />}
    <span className="truncate">
      {formatAmountOrder(amount)} {currency?.symbol}
    </span>
  </HStack>
)

const MarketRateValue = ({
  currencyIn,
  currencyOut,
  marketPrice,
}: {
  currencyIn?: Currency
  currencyOut?: Currency
  marketPrice?: BaseTradeInfo
}) => {
  const [showInverted, setShowInverted] = useState(false)
  const baseCurrency = showInverted ? currencyIn : currencyOut
  const quoteCurrency = showInverted ? currencyOut : currencyIn
  const rate = showInverted ? marketPrice?.marketRate : marketPrice?.invertRate
  const usdValue = showInverted ? marketPrice?.priceUsdIn : marketPrice?.priceUsdOut

  if (!baseCurrency || !quoteCurrency) return <span>--</span>

  return (
    <HStack
      as="button"
      type="button"
      className="min-w-0 max-w-full items-center justify-end gap-2 text-right transition hover:brightness-75 max-sm:justify-start"
      onClick={() => setShowInverted(value => !value)}
    >
      <span className="truncate">
        1 {baseCurrency.symbol} = {formatRateValue(rate)} {quoteCurrency.symbol}
      </span>
      <span className="shrink-0 text-subText">
        ~{usdValue ? formatDisplayNumber(usdValue, { style: 'currency', significantDigits: 4 }) : '--'}
      </span>
      <Repeat size={14} className="shrink-0 text-subText" />
    </HStack>
  )
}

type Props = {
  order: LimitOrderCreateContext
  isOpen: boolean
  onDismiss?: () => void
  onSubmit?: () => void
  warningMessage: ReactNode[]
}

const CreateOrderConfirmModal = ({ order, isOpen, onDismiss, onSubmit, warningMessage }: Props) => {
  const { currencyIn, currencyOut, inputAmount, outputAmount, expiredAt, rateInfo, tradeInfo, deltaRate } = order
  const [confirmed, setConfirmed] = useState(false)
  const shouldShowConfirmFlow = Number(deltaRate.rawPercent) < WORSE_PRICE_DIFF_THRESHOLD
  const shouldDisablePlaceOrder = shouldShowConfirmFlow && !confirmed

  const handleSubmit = () => {
    if (shouldDisablePlaceOrder) return
    onSubmit?.()
  }

  const handleWarningClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof HTMLElement && target.closest('a')) {
      onDismiss?.()
    }
  }

  useEffect(() => {
    if (isOpen) return

    // delay till the animation's done
    const resetTimer = setTimeout(() => {
      setConfirmed(false)
    }, 200)

    return () => {
      clearTimeout(resetTimer)
    }
  }, [isOpen])

  return (
    <Modal maxWidth={480} isOpen={isOpen} onDismiss={() => onDismiss?.()} borderRadius={14}>
      <Stack className="w-full gap-5 p-5 max-sm:p-4">
        <HStack className="items-center justify-between gap-4">
          <span className="text-xl font-medium leading-tight text-text">
            <Trans>Review your order</Trans>
          </span>
          <CloseIcon onClick={onDismiss} />
        </HStack>

        <Stack className="gap-4">
          <OrderSummary
            inputCurrency={inputAmount ? <TokenAmountValue currency={currencyIn} amount={inputAmount} /> : null}
            outputCurrency={outputAmount ? <TokenAmountValue currency={currencyOut} amount={outputAmount} /> : null}
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            rateInfo={rateInfo}
            expires={<span>{dayjs(expiredAt).format('DD/MM/YYYY HH:mm')}</span>}
            marketRate={<MarketRateValue marketPrice={tradeInfo} currencyIn={currencyIn} currencyOut={currencyOut} />}
          />

          {warningMessage?.length > 0 && (
            <Stack
              className="gap-2 rounded-xl border border-warning-30 bg-warning-20 px-3 py-2.5 text-xs leading-4 text-warning [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
              onClick={handleWarningClick}
            >
              {warningMessage.map((message, index) => (
                <div key={index}>{message}</div>
              ))}
            </Stack>
          )}

          <HStack className="gap-3 max-sm:flex-col">
            {shouldShowConfirmFlow && (
              <ButtonWarning className="flex-1" disabled={confirmed} onClick={() => setConfirmed(true)}>
                <Trans>Confirm Price</Trans>
              </ButtonWarning>
            )}
            <ButtonPrimary className="flex-1" disabled={shouldDisablePlaceOrder} onClick={handleSubmit}>
              <Trans>Place Order</Trans>
            </ButtonPrimary>
          </HStack>
        </Stack>
      </Stack>
    </Modal>
  )
}

export default CreateOrderConfirmModal
