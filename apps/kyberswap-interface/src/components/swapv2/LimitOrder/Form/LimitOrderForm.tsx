import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { forwardRef, memo, useImperativeHandle } from 'react'

import { ButtonLight } from 'components/Button'
import DateTimePicker from 'components/DateTimePicker'
import { NetworkSelector } from 'components/NetworkSelector'
import ActionButtonLimitOrder from 'components/swapv2/LimitOrder/Form/ActionButtonLimitOrder'
import { useGetDeltaRateLimitOrder } from 'components/swapv2/LimitOrder/Form/DeltaRate'
import LimitOrderExpirySection from 'components/swapv2/LimitOrder/Form/LimitOrderExpirySection'
import LimitOrderRateSection from 'components/swapv2/LimitOrder/Form/LimitOrderRateSection'
import LimitOrderTokenSection from 'components/swapv2/LimitOrder/Form/LimitOrderTokenSection'
import useLimitOrderExecution from 'components/swapv2/LimitOrder/Form/hooks/useLimitOrderExecution'
import useLimitOrderFormState from 'components/swapv2/LimitOrder/Form/hooks/useLimitOrderFormState'
import ConfirmOrderModal from 'components/swapv2/LimitOrder/Modals/ConfirmOrderModal'
import TradePrice from 'components/swapv2/LimitOrder/TradePrice'
import { EditOrderInfo, LimitOrder, RateInfo } from 'components/swapv2/LimitOrder/type'
import { Z_INDEXS } from 'constants/styles'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
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
    approval,
    approvalSubmitted,
    approveCallback,
    checkingAllowance,
    enoughAllowance,
    estimateUSD,
    handleMaxInput,
    hasChangedOrderInfo,
    hasInputError,
    hidePreview,
    inputError,
    isNotFillAllInput,
    isWrappingEth,
    onSubmitCreateOrderWithTracking,
    onWrapToken,
    outPutError,
    showApproveFlow,
    showPreview,
    showWrap,
    trackingPriceSetOnBlur,
    trackingTouchInput,
    trackingTouchSelectToken,
    warningMessage,
    wrapInputError,
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
  const actionButton =
    chainId !== walletChainId ? (
      <ButtonLight onClick={() => changeNetwork(chainId)}>
        <Trans>Switch to {NETWORKS_INFO[chainId].name}</Trans>
      </ButtonLight>
    ) : (
      <ActionButtonLimitOrder
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        approval={approval}
        showWrap={showWrap}
        isWrappingEth={isWrappingEth}
        isNotFillAllInput={isNotFillAllInput}
        approvalSubmitted={approvalSubmitted}
        hasInputError={hasInputError}
        enoughAllowance={enoughAllowance}
        checkingAllowance={checkingAllowance}
        wrapInputError={wrapInputError}
        approveCallback={approveCallback}
        onWrapToken={onWrapToken}
        showPreview={showPreview}
        showApproveFlow={showApproveFlow}
        showWarning={warningMessage.length > 0}
        editOrderInfo={editOrderInfo}
      />
    )

  const renderConfirmModal = (showConfirmContent = false) => (
    <ConfirmOrderModal
      onDismiss={hidePreview}
      onSubmit={onSubmitCreateOrderWithTracking}
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
          showApproveFlow={showApproveFlow}
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
    </>
  )
})

export default memo(LimitOrderForm)
