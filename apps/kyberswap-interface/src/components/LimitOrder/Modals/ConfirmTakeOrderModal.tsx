import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Repeat } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import ProcessingOrderModal from 'components/LimitOrder/Modals/ProcessingOrderModal'
import { removeTrailingZero } from 'components/LimitOrder/helpers'
import { DEFAULT_TAKE_ORDER_PROCESSING, useTakeLimitOrder } from 'components/LimitOrder/hooks/useTakeLimitOrder'
import { LimitOrderTab, LimitOrderTakeContext } from 'components/LimitOrder/types'
import Modal from 'components/Modal'
import NumericalInput from 'components/NumericalInput'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { CloseIcon } from 'theme/components'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const formatExact = (amount: CurrencyAmount<Currency> | undefined, significantDigits = 6) =>
  amount ? formatDisplayNumber(amount.toExact(), { significantDigits }) : '--'

const formatRate = (context: LimitOrderTakeContext | undefined) => {
  if (!context) return '--'
  const receiveAmount = CurrencyAmount.fromRawAmount(context.receiveCurrency, context.order.makingAmount)
  const payAmount = CurrencyAmount.fromRawAmount(context.payCurrency, context.order.takingAmount)
  const rate = receiveAmount.divide(payAmount).multiply(payAmount.decimalScale).toSignificant(8)
  return `1 ${context.payCurrency.symbol} = ${removeTrailingZero(rate)} ${context.receiveCurrency.symbol}`
}

const DetailRow = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <HStack className="min-h-6 items-center justify-between gap-3 text-sm">
    <span className="text-subText">{label}</span>
    <span className="min-w-0 text-right font-medium text-text">{children}</span>
  </HStack>
)

const TokenBadge = ({ amount, symbol }: { amount?: CurrencyAmount<Currency>; symbol?: string }) => (
  <HStack className="items-center gap-2 rounded-lg bg-white-04 px-3 py-2">
    {amount?.currency && <CurrencyLogo currency={amount.currency} style={{ width: 18, height: 18 }} />}
    <span className="font-medium text-text">{symbol}</span>
  </HStack>
)

const ConfirmTakeOrderModal = ({
  context,
  isOpen,
  onDismiss,
}: {
  context: LimitOrderTakeContext | undefined
  isOpen: boolean
  onDismiss?: () => void
}) => {
  const navigate = useNavigate()
  const [fillAmount, setFillAmount] = useState('')
  const [processingState, setProcessingState] = useState(DEFAULT_TAKE_ORDER_PROCESSING)
  const takeOrder = useTakeLimitOrder({
    context,
    fillAmount,
    processing: processingState,
    setProcessing: setProcessingState,
  })
  const { estimateTxGas } = takeOrder
  const [showInvertedRate, setShowInvertedRate] = useState(false)
  const {
    maxPayAmount,
    parsedPayAmount,
    receiveAmount,
    receiveAmountAfterFee,
    feeBps,
    exceedsAvailableAmount,
    insufficientBalance,
    canSubmit,
  } = takeOrder.amount

  const [estimatedGasUsd, setEstimatedGasUsd] = useState<string>('')
  const isConfirmOpen = isOpen && !takeOrder.processing.state.show

  useEffect(() => {
    if (!context || !isOpen) return
    setFillAmount(maxPayAmount?.toExact() || '')
  }, [context, isOpen, maxPayAmount])

  const handleDismiss = () => {
    onDismiss?.()
  }

  const handleSubmit = () => {
    takeOrder.processing.start()
  }

  const handleProcessingDismiss = () => {
    takeOrder.processing.dismiss()
    onDismiss?.()
  }

  const handleViewOrder = () => {
    if (!context) return

    const route = NETWORKS_INFO[context.order.chainId]?.route
    if (!route) return

    const search = new URLSearchParams({ tab: LimitOrderTab.MY_ORDER }).toString()

    navigate(`${APP_PATHS.LIMIT}/${route}?${search}`)
  }

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

  const rate = (() => {
    if (!context) return '--'
    if (!showInvertedRate) return formatRate(context)

    const payAmount = CurrencyAmount.fromRawAmount(context.payCurrency, context.order.takingAmount)
    const receiveAmount = CurrencyAmount.fromRawAmount(context.receiveCurrency, context.order.makingAmount)
    const invertedRate = payAmount.divide(receiveAmount).multiply(receiveAmount.decimalScale).toSignificant(8)
    return `1 ${context.receiveCurrency.symbol} = ${removeTrailingZero(invertedRate)} ${context.payCurrency.symbol}`
  })()

  const submitText = insufficientBalance
    ? t`Insufficient Balance`
    : exceedsAvailableAmount
    ? t`Exceeds available amount`
    : t`Fill this order`

  return (
    <>
      <Modal isOpen={isConfirmOpen} onDismiss={handleDismiss} maxWidth={460} borderRadius={14}>
        <Stack className="w-full gap-4 p-5">
          <HStack className="items-center justify-between gap-4">
            <span className="text-xl font-medium text-text">
              <Trans>Fill Order</Trans>
            </span>
            <CloseIcon onClick={handleDismiss} />
          </HStack>

          <Stack className="gap-4">
            <HStack className="items-center gap-2 text-base font-medium text-text">
              <span className="relative h-6 w-9 shrink-0">
                {context?.payCurrency && (
                  <span className="absolute left-0 top-0">
                    <CurrencyLogo currency={context.payCurrency} style={{ width: 24, height: 24 }} />
                  </span>
                )}
                {context?.receiveCurrency && (
                  <span className="absolute right-0 top-0">
                    <CurrencyLogo currency={context.receiveCurrency} style={{ width: 24, height: 24 }} />
                  </span>
                )}
              </span>
              <span>
                {context?.payCurrency.symbol}/{context?.receiveCurrency.symbol}
              </span>
            </HStack>

            <Stack className="gap-1 rounded-xl border border-darkBorder px-4 py-3">
              <HStack className="items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-subText">
                  <Trans>Order Rate</Trans>
                </span>
                <span className="text-base font-medium text-text">{formatRate(context)}</span>
              </HStack>
              <HStack className="justify-end text-sm text-subText">
                <Trans>Available</Trans> {formatExact(maxPayAmount)} {context?.payCurrency.symbol}
              </HStack>
            </Stack>

            <Stack className="gap-2">
              <HStack className="items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-subText">
                  <Trans>Fill Amount</Trans>
                </span>
                <button
                  type="button"
                  className="rounded-full bg-white-04 px-2 py-1 text-[10px] font-medium uppercase text-subText transition hover:text-text"
                  onClick={() => setFillAmount(maxPayAmount?.toExact() || '')}
                >
                  <Trans>Max</Trans>
                </button>
              </HStack>
              <HStack className="h-16 items-center gap-3 rounded-xl bg-white-04 px-4">
                <NumericalInput
                  value={fillAmount}
                  onUserInput={setFillAmount}
                  placeholder="0"
                  className={cn('bg-transparent text-2xl', insufficientBalance && 'text-red')}
                />
                <TokenBadge amount={parsedPayAmount || maxPayAmount} symbol={context?.payCurrency.symbol} />
              </HStack>
            </Stack>

            <Stack className="gap-2 rounded-xl border border-darkBorder px-4 py-3">
              <DetailRow label={<Trans>Rate</Trans>}>
                <HStack
                  as="button"
                  type="button"
                  className="items-center justify-end gap-1 text-right"
                  onClick={() => setShowInvertedRate(value => !value)}
                >
                  <span>{rate}</span>
                  <Repeat size={14} className="text-subText" />
                </HStack>
              </DetailRow>
              <DetailRow label={<Trans>Taker Fee</Trans>}>{feeBps ? `${feeBps / 100}%` : '0%'}</DetailRow>
              <DetailRow label={<Trans>You Receive</Trans>}>
                <span className="text-primary">
                  {formatExact(receiveAmountAfterFee || receiveAmount)} {context?.receiveCurrency.symbol}
                </span>
              </DetailRow>
            </Stack>

            <HStack className="items-center justify-between gap-3 text-sm text-subText">
              <span>
                <Trans>Est. gas fee</Trans>
              </span>
              <span>
                {estimatedGasUsd
                  ? `~${formatDisplayNumber(estimatedGasUsd, { style: 'currency', significantDigits: 4 })}`
                  : '--'}
              </span>
            </HStack>

            <HStack className="gap-3 max-sm:flex-col">
              <ButtonOutlined onClick={handleDismiss} className="!h-10 flex-1 !p-0">
                <Trans>Cancel</Trans>
              </ButtonOutlined>
              <ButtonPrimary onClick={handleSubmit} disabled={!canSubmit} className="!h-10 flex-1 !p-0">
                {submitText}
              </ButtonPrimary>
            </HStack>
          </Stack>
        </Stack>
      </Modal>
      <ProcessingOrderModal
        chainId={context?.order.chainId}
        processing={{
          ...takeOrder.processing,
          dismiss: handleProcessingDismiss,
        }}
        onViewOrder={handleViewOrder}
      />
    </>
  )
}

export default ConfirmTakeOrderModal
