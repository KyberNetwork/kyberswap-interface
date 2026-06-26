import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import CurrencyLogo from 'components/CurrencyLogo'
import WalletIcon from 'components/Icons/Wallet'
import ProcessingOrderModal from 'components/LimitOrder/ProcessingOrder/ProcessingOrderModal'
import { DEFAULT_PROCESSING_ORDER, useProcessingOrder } from 'components/LimitOrder/ProcessingOrder/useProcessingOrder'
import RateComparison, { MARKET_DIFF_WARNING_THRESHOLD } from 'components/LimitOrder/TakeOrder/RateComparison'
import TakeOrderActionButtons from 'components/LimitOrder/TakeOrder/TakeOrderActionButtons'
import { useTakeLimitOrder } from 'components/LimitOrder/TakeOrder/useTakeLimitOrder'
import { useTakeOrderValidation } from 'components/LimitOrder/TakeOrder/useTakeOrderValidation'
import {
  formatExact,
  formatInvertedRate,
  formatRate,
  getOrderPriceAfterFee,
  getPercentFillAmount,
  getSwapCurrencyId,
  normalizeActionAmount,
} from 'components/LimitOrder/TakeOrder/utils'
import {
  LimitOrderFromTokenPairFormatted,
  LimitOrderStatus,
  LimitOrderTab,
  LimitOrderTakeContext,
} from 'components/LimitOrder/types'
import Modal from 'components/Modal'
import NumericalInput from 'components/NumericalInput'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useLimitState } from 'state/limit/hooks'
import { PriceType, useTokenPrices } from 'state/tokenPrices/hooks'
import { CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const QUICK_FILL_PERCENTS = [25, 50, 75, 100]

const DetailRow = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <HStack className="min-h-6 items-center justify-between gap-3 text-sm max-sm:flex-col max-sm:items-start">
    <span className="text-subText">{label}</span>
    <div className="text-right font-medium text-text max-sm:text-left">{children}</div>
  </HStack>
)

type TokenBadgeProps = {
  amount?: CurrencyAmount<Currency>
  currency?: Currency
  symbol?: string
}

const TokenBadge = ({ amount, currency, symbol }: TokenBadgeProps) => {
  const badgeCurrency = currency || amount?.currency
  return (
    <HStack className="items-center gap-2 rounded-full bg-white-08 px-2.5 py-1.5 font-medium text-subText">
      {badgeCurrency && <CurrencyLogo currency={badgeCurrency} style={{ width: 20, height: 20, boxShadow: 'none' }} />}
      <span>{symbol}</span>
    </HStack>
  )
}

const PairLogos = ({ payCurrency, receiveCurrency }: { payCurrency: Currency; receiveCurrency: Currency }) => (
  <span className="relative h-6 w-9 shrink-0">
    <span className="absolute left-0 top-0">
      <CurrencyLogo currency={payCurrency} style={{ width: 24, height: 24, boxShadow: 'none' }} />
    </span>
    <span className="absolute right-0 top-0">
      <CurrencyLogo currency={receiveCurrency} style={{ width: 24, height: 24, boxShadow: 'none' }} />
    </span>
  </span>
)

type Props = {
  isOpen: boolean
  order: LimitOrderFromTokenPairFormatted
  onDismiss?: () => void
}

const TakeOrderConfirmModal = ({ isOpen, order, onDismiss }: Props) => {
  const navigate = useNavigate()
  const { currencyIn: makerCurrency, currencyOut: takerCurrency } = useLimitState()

  const [fillAmount, setFillAmount] = useState('')
  const [showInvertedRate, setShowInvertedRate] = useState(false)
  const [estimatedGasUsd, setEstimatedGasUsd] = useState('')
  const [processingState, setProcessingState] = useState(DEFAULT_PROCESSING_ORDER)

  const context = useMemo<LimitOrderTakeContext>(() => {
    const rawOrder = order.rawOrder
    const getOrderCurrencySymbol = (asset: string, fallback?: string) => {
      const assetAddress = asset.toLowerCase()
      if (makerCurrency && assetAddress === makerCurrency.wrapped.address.toLowerCase())
        return makerCurrency.wrapped.symbol
      if (takerCurrency && assetAddress === takerCurrency.wrapped.address.toLowerCase())
        return takerCurrency.wrapped.symbol
      return fallback
    }

    const paySymbol = getOrderCurrencySymbol(rawOrder.takerAsset, rawOrder.takerAssetSymbol)
    const receiveSymbol = getOrderCurrencySymbol(rawOrder.makerAsset, rawOrder.makerAssetSymbol)
    const payCurrency = new Token(rawOrder.chainId, rawOrder.takerAsset, rawOrder.takerAssetDecimals, paySymbol)
    const receiveCurrency = new Token(rawOrder.chainId, rawOrder.makerAsset, rawOrder.makerAssetDecimals, receiveSymbol)

    return { order: rawOrder, payCurrency, receiveCurrency }
  }, [makerCurrency, order, takerCurrency])

  const takeOrder = useTakeLimitOrder({
    context,
    fillAmount,
  })
  const processing = useProcessingOrder({
    processingOrder: processingState,
    setProcessingOrder: setProcessingState,
    ...takeOrder.processing,
  })
  const isConfirmOpen = isOpen && !processing.state.show

  const { estimateTxGas } = takeOrder
  const {
    maxBalancePayAmount,
    maxPayAmount,
    defaultPayAmount,
    parsedPayAmount,
    requiredPayAmount,
    receiveAmount,
    receiveAmountAfterFee,
    feeBps,
    balance,
    wrapAmount,
    insufficientBalance,
    canSubmit,
  } = takeOrder.amount

  const walletBalance = balance?.currency.equals(context.payCurrency) ? balance : undefined
  const payTokenAddress = context.payCurrency.wrapped.address
  const tokenPrices = useTokenPrices([payTokenAddress], context.order.chainId, PriceType.Average)

  const orderRate = useMemo(
    () => (showInvertedRate ? formatInvertedRate(context) : formatRate(context)),
    [context, showInvertedRate],
  )
  const orderAvailableAmount = useMemo(
    () => CurrencyAmount.fromRawAmount(context.receiveCurrency, context.order.availableMakingAmount),
    [context],
  )
  const orderPriceAfterFee = useMemo(() => getOrderPriceAfterFee(context, feeBps), [context, feeBps])

  const fillAmountUsd = parsedPayAmount ? Number(parsedPayAmount.toExact()) * tokenPrices[payTokenAddress] : 0
  const receiveAmountForComparison = receiveAmountAfterFee || receiveAmount
  const shouldWarnMarketDiff = order.marketDiffPercent > MARKET_DIFF_WARNING_THRESHOLD

  const { fillAmountMessage, primaryActionMessage } = useTakeOrderValidation({
    fillAmount,
    insufficientBalance,
    maxPayAmount,
    payCurrency: context.payCurrency,
    parsedPayAmount,
    wrapAmount,
    onFillAmountChange: setFillAmount,
  })

  useEffect(() => {
    setFillAmount(normalizeActionAmount(defaultPayAmount?.toExact() || ''))
  }, [defaultPayAmount])

  useEffect(() => {
    const controller = new AbortController()
    const fetchGas = async () => {
      try {
        if (!isConfirmOpen || !canSubmit) {
          setEstimatedGasUsd('')
          return
        }
        const gas = await estimateTxGas()
        if (controller.signal.aborted) return
        setEstimatedGasUsd(gas?.gasInUsd ? gas.gasInUsd.toString() : '')
      } catch {
        if (!controller.signal.aborted) setEstimatedGasUsd('')
      }
    }
    fetchGas()
    return () => controller.abort()
  }, [canSubmit, estimateTxGas, isConfirmOpen])

  const handleSubmit = () => {
    if (!canSubmit) return
    processing.start()
  }

  const handleUseSwapInstead = () => {
    const route = NETWORKS_INFO[context.order.chainId]?.route
    const inputCurrency = getSwapCurrencyId(context.payCurrency)
    const outputCurrency = getSwapCurrencyId(context.receiveCurrency)
    if (!route || !inputCurrency || !outputCurrency) return

    const search = new URLSearchParams()
    const input = requiredPayAmount?.toExact() || parsedPayAmount?.toExact()
    if (input) search.set('input', input)

    navigate(
      `${APP_PATHS.SWAP}/${route}/${encodeURIComponent(inputCurrency)}-to-${encodeURIComponent(outputCurrency)}${
        search.toString() ? `?${search.toString()}` : ''
      }`,
    )
  }

  const handleProcessingDismiss = () => {
    processing.dismiss()
    onDismiss?.()
  }

  const handleViewOrder = () => {
    const route = NETWORKS_INFO[context.order.chainId]?.route
    if (!route) return

    const search = new URLSearchParams({
      tab: LimitOrderTab.MY_ORDER,
      orderTab: LimitOrderStatus.CLOSED,
    }).toString()

    navigate(`${APP_PATHS.LIMIT}/${route}?${search}`)
  }

  return (
    <>
      <Modal isOpen={isConfirmOpen} onDismiss={onDismiss} maxWidth={480} borderRadius={16}>
        <Stack className="w-full gap-5 p-5 max-sm:p-4">
          <HStack className="items-center justify-between gap-4">
            <span className="text-xl font-medium leading-tight text-text">
              <Trans>Fill Order</Trans>
            </span>
            <CloseIcon onClick={onDismiss} />
          </HStack>

          <Stack className="gap-4">
            <HStack className="items-center gap-2 text-base font-medium text-text">
              <PairLogos payCurrency={context.payCurrency} receiveCurrency={context.receiveCurrency} />
              <span className="text-xl leading-none">
                {context.payCurrency.symbol}/{context.receiveCurrency.symbol}
              </span>
            </HStack>

            <Stack className="gap-2 rounded-xl border border-white-08 bg-buttonGray px-4 py-3">
              <HStack className="items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase text-subText">
                  <Trans>Order Rate</Trans>
                </span>
                <HStack
                  as="button"
                  type="button"
                  className="items-center justify-end gap-2 text-right text-lg font-medium leading-6 text-text transition hover:brightness-75"
                  onClick={() => setShowInvertedRate(value => !value)}
                >
                  <span>{orderRate}</span>
                  <Repeat size={14} className="shrink-0 text-subText" />
                </HStack>
              </HStack>
              <HStack className="items-center justify-end gap-1">
                <span className="text-xs text-subText">
                  <Trans>Available</Trans>
                </span>
                <button
                  type="button"
                  className="rounded-xl border border-white-08 bg-white-04 px-2 py-1 text-xs font-medium text-subText transition hover:border-border hover:bg-white-08"
                  onClick={() => setFillAmount(normalizeActionAmount(maxPayAmount?.toExact() || ''))}
                >
                  {formatExact(orderAvailableAmount)} {context.receiveCurrency.symbol}
                </button>
              </HStack>
            </Stack>

            <Stack className="gap-2">
              <span className="text-sm font-medium uppercase text-subText">
                <Trans>Fill Amount</Trans>
              </span>

              <Stack className="relative gap-3 rounded-xl border border-transparent bg-buttonGray px-4 py-3">
                <HStack className="items-center justify-between gap-3">
                  <HStack className="flex-wrap gap-1">
                    {QUICK_FILL_PERCENTS.map(percent => {
                      const percentAmount = getPercentFillAmount(maxBalancePayAmount, percent)
                      return (
                        <button
                          key={percent}
                          type="button"
                          className="rounded-full border border-white-08 bg-buttonGray px-2 py-1 text-xs text-subText transition hover:border-border hover:bg-buttonBlack-40"
                          onClick={() => setFillAmount(normalizeActionAmount(percentAmount))}
                        >
                          {percent}%
                        </button>
                      )
                    })}
                  </HStack>
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs text-subText hover:brightness-125"
                    onClick={() => setFillAmount(normalizeActionAmount(maxBalancePayAmount?.toExact() || ''))}
                  >
                    <WalletIcon size={14} className="shrink-0" />
                    <span className="font-medium">{formatExact(walletBalance)}</span>
                  </button>
                </HStack>

                <HStack className="items-end gap-2">
                  <NumericalInput
                    value={fillAmount}
                    onUserInput={setFillAmount}
                    placeholder="0.0"
                    className="min-w-0 flex-1 bg-transparent text-[28px] leading-none placeholder:text-subText"
                  />
                  {!!fillAmountUsd && (
                    <span className="shrink-0 px-0 py-2 text-xs text-subText">
                      ~{formatDisplayNumber(fillAmountUsd, { significantDigits: 6, style: 'currency' })}
                    </span>
                  )}
                  <TokenBadge
                    amount={parsedPayAmount || maxPayAmount}
                    currency={context.payCurrency}
                    symbol={context.payCurrency.symbol}
                  />
                </HStack>
              </Stack>
              <span className="min-h-4 text-xs font-medium italic text-subText">{fillAmountMessage}</span>
            </Stack>

            <Stack className="gap-2 rounded-xl bg-buttonGray px-4 py-3">
              <DetailRow label={<Trans>Protocol Fee</Trans>}>{feeBps ? `${feeBps / 100}%` : '0%'}</DetailRow>
              <DetailRow label={<Trans>You Receive</Trans>}>
                <span className={cn(shouldWarnMarketDiff ? 'text-red' : 'text-primary')}>
                  {formatExact(receiveAmountAfterFee || receiveAmount)} {context.receiveCurrency.symbol}
                </span>
              </DetailRow>
              <DetailRow label={<Trans>Gas Fee</Trans>}>
                {estimatedGasUsd
                  ? `~${formatDisplayNumber(estimatedGasUsd, { style: 'currency', significantDigits: 4 })}`
                  : '--'}
              </DetailRow>
            </Stack>

            <RateComparison
              marketDiffPercent={order.marketDiffPercent}
              inputCurrency={context.payCurrency}
              outputCurrency={context.receiveCurrency}
              inputAmount={requiredPayAmount || parsedPayAmount}
              outputAmount={receiveAmountForComparison}
              fallbackOrderPrice={orderPriceAfterFee}
            />

            <TakeOrderActionButtons
              canSubmit={canSubmit}
              primaryActionMessage={primaryActionMessage}
              requiresWrap={!!wrapAmount}
              shouldWarnMarketDiff={shouldWarnMarketDiff}
              onSubmit={handleSubmit}
              onUseSwapInstead={handleUseSwapInstead}
            />
          </Stack>
        </Stack>
      </Modal>
      <ProcessingOrderModal
        chainId={context.order.chainId}
        currencyIn={context.payCurrency}
        processing={{
          ...processing,
          dismiss: handleProcessingDismiss,
        }}
        onViewOrder={handleViewOrder}
      />
    </>
  )
}

export default TakeOrderConfirmModal
