import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { ComponentProps, MouseEvent, ReactNode, useEffect, useState } from 'react'
import { Repeat } from 'react-feather'

import { ButtonPrimary, ButtonWarning } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { formatAmountOrder, removeTrailingZero } from 'components/LimitOrder/helpers'
import { WORSE_PRICE_DIFF_THRESHOLD } from 'components/LimitOrder/hooks/useWarningCreateOrder'
import { LimitOrderCreateContext, RateInfo } from 'components/LimitOrder/types'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import { CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const formatRateValue = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '--'
  const numberValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numberValue)) return '--'
  return removeTrailingZero(numberValue.toPrecision(6))
}

const DetailRow = ({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) => (
  <HStack
    className={cn('min-h-6 w-full items-center justify-between gap-3 max-sm:flex-col max-sm:items-start', className)}
  >
    <div className="shrink-0 text-sm font-normal leading-5 text-subText">{label}</div>
    <HStack className="min-w-0 flex-1 justify-end text-right text-sm font-medium leading-5 text-text max-sm:justify-start max-sm:text-left">
      {children}
    </HStack>
  </HStack>
)

const TokenAmountValue = ({ currency, amount }: { currency?: Currency; amount: string }) => (
  <HStack className="min-w-0 items-center justify-end gap-2">
    {currency && <CurrencyLogo currency={currency} style={{ width: 20, height: 20 }} />}
    <span className="truncate">
      {formatAmountOrder(amount)} {currency?.symbol}
    </span>
  </HStack>
)

const ActionButton = ({
  buttonType = 'primary',
  className,
  ...props
}: ComponentProps<typeof ButtonPrimary> & { buttonType?: 'primary' | 'warning' }) => {
  const Button = buttonType === 'warning' ? ButtonWarning : ButtonPrimary
  return <Button className={cn('h-12 text-base font-medium', className)} {...props} />
}

const RateValue = ({
  currencyIn,
  currencyOut,
  rateInfo,
}: {
  currencyIn?: Currency
  currencyOut?: Currency
  rateInfo: RateInfo
}) => {
  const [showInverted, setShowInverted] = useState(false)
  const baseCurrency = showInverted ? currencyIn : currencyOut
  const quoteCurrency = showInverted ? currencyOut : currencyIn
  const rate = showInverted ? rateInfo.rate : rateInfo.invertRate
  const referenceRate = showInverted ? rateInfo.invertRate : rateInfo.rate

  if (!baseCurrency || !quoteCurrency) return null

  return (
    <HStack
      as="button"
      type="button"
      className="min-w-0 items-center justify-end gap-2 text-right transition hover:brightness-90 max-sm:justify-start"
      onClick={() => setShowInverted(value => !value)}
    >
      <span className="truncate">
        1 {baseCurrency.symbol} = {formatRateValue(rate)} {quoteCurrency.symbol}
      </span>
      <span className="shrink-0 text-subText">~{formatRateValue(referenceRate)}</span>
      <Repeat size={16} className="shrink-0 text-subText" />
    </HStack>
  )
}

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
      className="min-w-0 items-center justify-end gap-2 text-right transition hover:brightness-90 max-sm:justify-start"
      onClick={() => setShowInverted(value => !value)}
    >
      <span className="truncate">
        1 {baseCurrency.symbol} = {formatRateValue(rate)} {quoteCurrency.symbol}
      </span>
      <span className="shrink-0 text-subText">
        ~{usdValue ? formatDisplayNumber(usdValue, { style: 'currency', significantDigits: 4 }) : '--'}
      </span>
      <Repeat size={16} className="shrink-0 text-subText" />
    </HStack>
  )
}

type Props = {
  order: LimitOrderCreateContext
  review: {
    isOpen: boolean
    onDismiss: () => void
    onSubmit: () => void
  }
  warningMessage: ReactNode[]
}

const ConfirmOrderModal = ({ order, review, warningMessage }: Props) => {
  const { currencyIn, currencyOut, inputAmount, outputAmount, expiredAt, rateInfo, tradeInfo, deltaRate } = order
  const { isOpen, onDismiss, onSubmit } = review
  const [confirmed, setConfirmed] = useState(false)
  const shouldShowConfirmFlow = Number(deltaRate.rawPercent) < WORSE_PRICE_DIFF_THRESHOLD
  const shouldDisablePlaceOrder = shouldShowConfirmFlow && !confirmed

  const handleSubmit = () => {
    if (shouldDisablePlaceOrder) return
    onSubmit()
  }

  const handleWarningClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof HTMLElement && target.closest('a')) {
      onDismiss()
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
    <Modal maxWidth={480} isOpen={isOpen} onDismiss={onDismiss} borderRadius={14}>
      <Stack className="w-full gap-6 p-5">
        <HStack className="items-center justify-between gap-4">
          <span className="text-xl font-medium leading-tight text-text">
            <Trans>Review your order</Trans>
          </span>
          <CloseIcon size={22} onClick={onDismiss} className="shrink-0 text-text" />
        </HStack>

        <Stack className="gap-5">
          <Stack className="gap-3">
            <DetailRow label={<Trans>I want to pay</Trans>}>
              {inputAmount && <TokenAmountValue currency={currencyIn} amount={inputAmount} />}
            </DetailRow>
            <DetailRow label={<Trans>and receive</Trans>}>
              {outputAmount && <TokenAmountValue currency={currencyOut} amount={outputAmount} />}
            </DetailRow>
            <DetailRow label={<Trans>when</Trans>}>
              <RateValue rateInfo={rateInfo} currencyIn={currencyIn} currencyOut={currencyOut} />
            </DetailRow>
            <DetailRow label={<Trans>before the order expires on</Trans>}>
              <span>{dayjs(expiredAt).format('DD/MM/YYYY HH:mm')}</span>
            </DetailRow>
          </Stack>

          <Stack className="gap-3 rounded-2xl border border-subText/20 px-4 py-3">
            <DetailRow label={<Trans>Market Price</Trans>}>
              <MarketRateValue marketPrice={tradeInfo} currencyIn={currencyIn} currencyOut={currencyOut} />
            </DetailRow>
          </Stack>

          {warningMessage?.length > 0 && (
            <Stack
              className="gap-1 text-xs italic leading-4 text-subText [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
              onClick={handleWarningClick}
            >
              {warningMessage.map((message, index) => (
                <div key={index}>{message}</div>
              ))}
            </Stack>
          )}

          <HStack className="gap-3 max-sm:flex-col">
            {shouldShowConfirmFlow && (
              <ActionButton
                buttonType={confirmed ? 'primary' : 'warning'}
                disabled={confirmed}
                onClick={() => setConfirmed(true)}
              >
                <Trans>Confirm Price</Trans>
              </ActionButton>
            )}
            <ActionButton id="place-order-button" disabled={shouldDisablePlaceOrder} onClick={handleSubmit}>
              <Trans>Place Order</Trans>
            </ActionButton>
          </HStack>
        </Stack>
      </Stack>
    </Modal>
  )
}

export default ConfirmOrderModal
