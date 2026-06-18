import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { forwardRef, memo, useImperativeHandle } from 'react'

import { ButtonLight, ButtonPrimary, ButtonWarning } from 'components/Button'
import DateTimePicker from 'components/DateTimePicker'
import { NetworkSelector } from 'components/NetworkSelector'
import LimitOrderExpirySection from 'components/swapv2/LimitOrder/Form/LimitOrderExpirySection'
import LimitOrderRateSection, {
  useGetDeltaRateLimitOrder,
} from 'components/swapv2/LimitOrder/Form/LimitOrderRateSection'
import LimitOrderTokenSection from 'components/swapv2/LimitOrder/Form/LimitOrderTokenSection'
import ConfirmOrderModal from 'components/swapv2/LimitOrder/Modals/ConfirmOrderModal'
import ProcessingOrderModal from 'components/swapv2/LimitOrder/Modals/ProcessingOrderModal'
import TradePrice from 'components/swapv2/LimitOrder/TradePrice'
import useLimitOrderExecution from 'components/swapv2/LimitOrder/hooks/useLimitOrderExecution'
import useLimitOrderFormState from 'components/swapv2/LimitOrder/hooks/useLimitOrderFormState'
import { EditOrderInfo, LimitOrder, RateInfo } from 'components/swapv2/LimitOrder/type'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { useWalletModalToggle } from 'state/application/hooks'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { cn } from 'utils/cn'

export const Label = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-xs font-medium text-subText', className)} {...rest}>
    {children}
  </div>
)

type BaseProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  note?: string
  flowState: TransactionFlowState
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
  zIndexToolTip?: number
}

type CreateLimitOrderFormProps = BaseProps & {
  mode?: 'create'
  defaultInputAmount?: string
  defaultOutputAmount?: string
  defaultActiveMakingAmount?: string
  defaultExpire?: Date
  defaultRate?: RateInfo
  orderInfo?: never
  editOrderInfo?: never
  useUrlParams?: boolean
}

type EditLimitOrderFormProps = BaseProps & {
  mode: 'edit'
  defaultInputAmount: string
  defaultOutputAmount: string
  defaultActiveMakingAmount: string
  defaultExpire: Date
  defaultRate: RateInfo
  orderInfo: LimitOrder
  editOrderInfo: EditOrderInfo
  useUrlParams?: never
}

type Props = CreateLimitOrderFormProps | EditLimitOrderFormProps

export type LimitOrderFormHandle = {
  hasChangedOrderInfo: () => boolean
}
const LimitOrderForm = forwardRef<LimitOrderFormHandle, Props>(function LimitOrderForm(
  {
    currencyIn,
    currencyOut,
    mode = 'create',
    defaultInputAmount = '',
    defaultOutputAmount = '',
    defaultActiveMakingAmount = '',
    defaultExpire,
    defaultRate = { rate: '', invertRate: '', invert: false },
    note = '',
    orderInfo,
    flowState,
    setFlowState,
    zIndexToolTip = Z_INDEXS.TOOL_TIP_ERROR_INPUT_SWAP_FORM,
    editOrderInfo,
    useUrlParams,
  },
  ref,
) {
  const { changeNetwork } = useChangeNetwork()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const isEdit = mode === 'edit'
  const {
    chainId,
    walletChainId,
    networkInfo,
    searchParams,
    inputAmount,
    outputAmount,
    rateInfo,
    displayRate,
    expire,
    showDatePicker,
    customDateExpire,
    rotate,
    expanded,
    loadingTrade,
    tradeInfo,
    expiredAt,
    displayTime,
    setExpanded,
    onSetInput,
    onSetOutput,
    onChangeRate,
    onInvertRate,
    handleInputSelect,
    switchToWeth,
    handleOutputSelect,
    handleRotateClick,
    toggleDatePicker,
    onChangeExpire,
    onResetForm,
    setPriceRateMarket,
  } = useLimitOrderFormState({
    currencyIn,
    currencyOut,
    defaultInputAmount,
    defaultOutputAmount,
    defaultExpire,
    defaultRate,
    isEdit,
    useUrlParams,
  })
  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: tradeInfo, rateInfo })
  const {
    checkingAllowance,
    estimateUSD,
    handleMaxInput,
    hasChangedOrderInfo,
    hasInputError,
    hidePreview,
    hideProcessingOrder,
    inputError,
    insufficientBalance,
    insufficientBalanceText,
    isNotFillAllInput,
    onSubmitCreateOrderWithTracking,
    outPutError,
    processingOrder,
    retryProcessingOrder,
    showPreview,
    startProcessingOrder,
    trackingPriceSetOnBlur,
    trackingTouchInput,
    trackingTouchSelectToken,
    warningMessage,
  } = useLimitOrderExecution({
    currencyIn,
    currencyOut,
    defaultActiveMakingAmount,
    defaultInputAmount,
    defaultRate,
    defaultExpire,
    orderInfo,
    setFlowState,
    isEdit,
    chainId,
    networkName: networkInfo.name,
    searchParams,
    inputAmount,
    outputAmount,
    displayRate,
    expiredAt,
    displayTime,
    rateInfo,
    tradeInfo,
    deltaRate,
    onSetInput,
    onResetForm,
    switchToWeth,
  })

  useImperativeHandle(ref, () => ({
    hasChangedOrderInfo,
  }))

  const styleTooltip = { maxWidth: '250px', zIndex: zIndexToolTip }
  const disableReviewButton = isNotFillAllInput || !!hasInputError || insufficientBalance
  const reviewButtonContent = (
    <span className="font-medium">
      {insufficientBalance && insufficientBalanceText ? insufficientBalanceText : <Trans>Review Order</Trans>}
    </span>
  )
  const actionButton =
    chainId !== walletChainId ? (
      <ButtonLight onClick={() => changeNetwork(chainId)}>
        <Trans>Switch to {NETWORKS_INFO[chainId].name}</Trans>
      </ButtonLight>
    ) : !account ? (
      <ButtonLight onClick={toggleWalletModal}>
        <Trans>Connect</Trans>
      </ButtonLight>
    ) : isEdit ? (
      checkingAllowance ? (
        <ButtonPrimary disabled>{reviewButtonContent}</ButtonPrimary>
      ) : (
        editOrderInfo?.renderCancelButtons?.() || null
      )
    ) : warningMessage.length > 0 && !disableReviewButton ? (
      <ButtonWarning onClick={showPreview}>{reviewButtonContent}</ButtonWarning>
    ) : (
      <ButtonPrimary id="review-order-button" onClick={showPreview} disabled={disableReviewButton}>
        {reviewButtonContent}
      </ButtonPrimary>
    )

  const renderConfirmModal = (showConfirmContent = false) => (
    <ConfirmOrderModal
      onDismiss={hidePreview}
      onSubmit={isEdit ? onSubmitCreateOrderWithTracking : startProcessingOrder}
      flowState={flowState}
      currencyIn={currencyIn}
      currencyOut={currencyOut}
      inputAmount={inputAmount}
      outputAmount={outputAmount}
      expiredAt={expiredAt}
      rateInfo={rateInfo}
      note={note}
      editOrderInfo={editOrderInfo}
      warningMessage={warningMessage}
      marketPrice={tradeInfo}
      showConfirmContent={showConfirmContent}
      percentDiff={Number(deltaRate.rawPercent)}
    />
  )

  if (isEdit && flowState.showConfirm)
    return (
      <>
        {renderConfirmModal(true)}
        {actionButton}
      </>
    )
  return (
    <>
      <div className="flex flex-col gap-4">
        {useUrlParams ? <NetworkSelector chainId={chainId} /> : null}
        <LimitOrderTokenSection
          chainId={chainId}
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          inputAmount={inputAmount}
          outputAmount={outputAmount}
          inputError={inputError}
          outPutError={outPutError}
          estimateUsdIn={estimateUSD.input}
          estimateUsdOut={estimateUSD.output}
          showApproveFlow={false}
          isEdit={isEdit}
          rotate={rotate}
          styleTooltip={styleTooltip}
          onSetInput={onSetInput}
          onSetOutput={onSetOutput}
          handleMaxInput={handleMaxInput}
          handleInputSelect={handleInputSelect}
          handleOutputSelect={handleOutputSelect}
          handleRotateClick={handleRotateClick}
          trackingTouchInput={trackingTouchInput}
          trackingTouchSelectToken={trackingTouchSelectToken}
        />

        <LimitOrderRateSection
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          displayRate={displayRate}
          rateInfo={rateInfo}
          tradeInfo={tradeInfo}
          onChangeRate={onChangeRate}
          onInvertRate={onInvertRate}
          setPriceRateMarket={setPriceRateMarket}
          trackingTouchInput={trackingTouchInput}
          trackingPriceSetOnBlur={trackingPriceSetOnBlur}
        />

        <LimitOrderExpirySection
          expire={expire}
          expanded={expanded}
          customDateExpire={customDateExpire}
          displayTime={displayTime}
          setExpanded={setExpanded}
          toggleDatePicker={toggleDatePicker}
          onChangeExpire={onChangeExpire}
        />

        {currencyIn && currencyOut ? (
          <TradePrice
            price={tradeInfo}
            className="text-sm font-normal text-subText"
            label={t`Market Price is`}
            loading={loadingTrade}
            symbolIn={currencyIn.symbol}
            symbolOut={currencyOut.symbol}
          />
        ) : null}

        {warningMessage.map((mess, i) => (
          <ErrorWarningPanel type="warn" key={i} title={mess} />
        ))}

        {actionButton}
      </div>

      {renderConfirmModal()}

      <DateTimePicker
        defaultDate={customDateExpire}
        expire={expire}
        isOpen={showDatePicker}
        onDismiss={toggleDatePicker}
        onSetDate={onChangeExpire}
      />

      <ProcessingOrderModal
        chainId={chainId}
        currencyIn={currencyIn}
        state={processingOrder}
        onDismiss={hideProcessingOrder}
        onRetry={retryProcessingOrder}
      />
    </>
  )
})

export default memo(LimitOrderForm)
