import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { memo, useState } from 'react'

import { ButtonLight, ButtonPrimary, ButtonWarning } from 'components/Button'
import DateTimePicker from 'components/DateTimePicker'
import { NetworkSelector } from 'components/NetworkSelector'
import { Stack } from 'components/Stack'
import LimitOrderExpirySection from 'components/swapv2/LimitOrder/Form/LimitOrderExpirySection'
import LimitOrderRateSection, {
  useGetDeltaRateLimitOrder,
} from 'components/swapv2/LimitOrder/Form/LimitOrderRateSection'
import LimitOrderTokenSection from 'components/swapv2/LimitOrder/Form/LimitOrderTokenSection'
import TradePrice from 'components/swapv2/LimitOrder/Form/TradePrice'
import ConfirmOrderModal from 'components/swapv2/LimitOrder/Modals/ConfirmOrderModal'
import ProcessingOrderModal from 'components/swapv2/LimitOrder/Modals/ProcessingOrderModal'
import { useCreateLimitOrder } from 'components/swapv2/LimitOrder/hooks/useCreateLimitOrder'
import { useLimitOrderExecution } from 'components/swapv2/LimitOrder/hooks/useLimitOrderExecution'
import { useLimitOrderFormState } from 'components/swapv2/LimitOrder/hooks/useLimitOrderFormState'
import { useProcessingOrder } from 'components/swapv2/LimitOrder/hooks/useProcessingOrder'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import usePageLocation from 'hooks/usePageLocation'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { useWalletModalToggle } from 'state/application/hooks'
import { useLimitState } from 'state/limit/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'

type LimitOrderFormProps = {
  currencyIn?: Currency
  currencyOut?: Currency
}

const useLimitOrderCurrencies = ({ currencyIn, currencyOut }: LimitOrderFormProps) => {
  const limitState = useLimitState()
  return {
    currencyIn: currencyIn || limitState.currencyIn,
    currencyOut: currencyOut || limitState.currencyOut,
  }
}

const LimitOrderForm = ({ currencyIn: currencyInProp, currencyOut: currencyOutProp }: LimitOrderFormProps) => {
  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()
  const { account } = useActiveWeb3React()
  const { isEmbeddedSwap } = usePageLocation()

  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const { currencyIn, currencyOut } = useLimitOrderCurrencies({
    currencyIn: currencyInProp,
    currencyOut: currencyOutProp,
  })

  const form = useLimitOrderFormState({
    currencyIn,
    currencyOut,
    useUrlParams: isEmbeddedSwap,
  })

  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: form.tradeInfo, rateInfo: form.rateInfo })

  const order = {
    currencyIn,
    currencyOut,
    chainId: form.chainId,
    networkName: form.networkInfo.name,
    inputAmount: form.inputAmount,
    outputAmount: form.outputAmount,
    displayRate: form.displayRate,
    expiredAt: form.expiredAt,
    displayTime: form.displayTime,
    rateInfo: form.rateInfo,
    tradeInfo: form.tradeInfo,
    deltaRate,
  }

  const execution = useLimitOrderExecution({
    order,
    setFlowState,
    onSetInput: form.onSetInput,
    onResetForm: form.onResetForm,
    switchToWeth: form.switchToWeth,
  })

  const { balance, estimateUSD, preview, processing: executionProcessing, tracking, validation } = execution

  const createOrder = useCreateLimitOrder({
    order,
    setFlowState,
    searchParams: form.searchParams,
    estimateUSD,
    onError: execution.handleError,
    onSuccess: execution.resetForm,
  })

  const processing = useProcessingOrder({
    ...executionProcessing,
    onCreateOrder: createOrder.submitCreateOrderWithTracking,
    onError: execution.handleError,
    setFlowState,
  })

  const disableReviewButton = validation.isNotFillAllInput || !!validation.hasInputError || balance.insufficientBalance
  const reviewButtonContent = (
    <span className="font-medium">
      {balance.insufficientBalance && balance.insufficientBalanceText ? (
        balance.insufficientBalanceText
      ) : (
        <Trans>Review Order</Trans>
      )}
    </span>
  )

  return (
    <>
      <Stack className="gap-4">
        {isEmbeddedSwap ? <NetworkSelector chainId={form.chainId} /> : null}
        <Stack className="gap-3">
          <LimitOrderTokenSection
            chainId={form.chainId}
            tokens={{
              currencyIn,
              currencyOut,
              inputAmount: form.inputAmount,
              outputAmount: form.outputAmount,
            }}
            errors={{
              input: validation.inputError,
              output: validation.outPutError,
            }}
            estimateUsd={estimateUSD}
            events={{
              onInputAmountChange: form.onSetInput,
              onOutputAmountChange: form.onSetOutput,
              onMaxInput: balance.handleMaxInput,
              onInputTokenSelect: form.handleInputSelect,
              onOutputTokenSelect: form.handleOutputSelect,
              onRotate: form.handleRotateClick,
              onInputFocus: tracking.trackingTouchInput,
              onTokenSelectorOpen: tracking.trackingTouchSelectToken,
            }}
          />

          <LimitOrderRateSection
            tokens={{ currencyIn, currencyOut }}
            rate={{
              displayRate: form.displayRate,
              rateInfo: form.rateInfo,
              tradeInfo: form.tradeInfo,
            }}
            events={{
              onRateChange: form.onChangeRate,
              onSetMarketRate: form.setPriceRateMarket,
              onRateInputFocus: tracking.trackingTouchInput,
              onRateInputBlur: tracking.trackingPriceSetOnBlur,
            }}
          />

          <LimitOrderExpirySection
            expiry={{
              expire: form.expire,
              expanded: form.expanded,
              customDateExpire: form.customDateExpire,
              displayTime: form.displayTime,
            }}
            events={{
              onToggleExpanded: () => form.setExpanded(expanded => !expanded),
              onOpenDatePicker: form.toggleDatePicker,
              onExpireChange: form.onChangeExpire,
            }}
          />

          {currencyIn && currencyOut ? (
            <TradePrice
              price={form.tradeInfo}
              className="text-sm font-normal text-subText"
              label={t`Market Price is`}
              loading={form.loadingTrade}
              symbolIn={currencyIn.symbol}
              symbolOut={currencyOut.symbol}
            />
          ) : null}
        </Stack>

        {validation.warningMessage.length > 0 && (
          <Stack className="gap-3">
            {validation.warningMessage.map((mess, i) => (
              <ErrorWarningPanel type="warn" key={i} title={mess} />
            ))}
          </Stack>
        )}

        {form.chainId !== form.walletChainId ? (
          <ButtonLight onClick={() => changeNetwork(form.chainId)}>
            <Trans>Switch to {NETWORKS_INFO[form.chainId].name}</Trans>
          </ButtonLight>
        ) : !account ? (
          <ButtonLight onClick={toggleWalletModal}>
            <Trans>Connect</Trans>
          </ButtonLight>
        ) : validation.warningMessage.length > 0 && !disableReviewButton ? (
          <ButtonWarning onClick={preview.showPreview}>{reviewButtonContent}</ButtonWarning>
        ) : (
          <ButtonPrimary id="review-order-button" onClick={preview.showPreview} disabled={disableReviewButton}>
            {reviewButtonContent}
          </ButtonPrimary>
        )}
      </Stack>

      <ConfirmOrderModal
        onDismiss={preview.hidePreview}
        onSubmit={processing.startProcessingOrder}
        flowState={flowState}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={form.inputAmount}
        outputAmount={form.outputAmount}
        expiredAt={form.expiredAt}
        rateInfo={form.rateInfo}
        warningMessage={validation.warningMessage}
        marketPrice={form.tradeInfo}
        percentDiff={Number(deltaRate.rawPercent)}
      />

      <DateTimePicker
        defaultDate={form.customDateExpire}
        expire={form.expire}
        isOpen={form.showDatePicker}
        onDismiss={form.toggleDatePicker}
        onSetDate={form.onChangeExpire}
      />

      <ProcessingOrderModal
        chainId={form.chainId}
        currencyIn={currencyIn}
        state={processing.processingOrder}
        onDismiss={processing.hideProcessingOrder}
        onRetryStep={processing.retryProcessingStep}
        onRunStep={processing.runProcessingStep}
      />
    </>
  )
}

export default memo(LimitOrderForm)
