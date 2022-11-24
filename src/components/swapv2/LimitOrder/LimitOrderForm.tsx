import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ArrowRotate from 'components/ArrowRotate'
import { ButtonApprove, ButtonError, ButtonLight } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import NumericalInput from 'components/NumericalInput'
import ProgressSteps from 'components/ProgressSteps'
import { RowBetween } from 'components/Row'
import Select from 'components/Select'
import Tooltip from 'components/Tooltip'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import { Z_INDEXS } from 'constants/styles'
import { useTokenAllowance } from 'data/Allowances'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { NotificationType, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useLimitActionHandlers } from 'state/limit/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance, useCurrencyBalances } from 'state/wallet/hooks'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types'
import { formatNumberWithPrecisionRange } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import TradePrice from '../TradePrice'
import ConfirmOrderModal from './ConfirmOrderModal'
import DeltaRate from './DeltaRate'
import ExpirePicker from './ExpirePicker'
import { DEFAULT_EXPIRED, EXPIRED_OPTIONS, LIMIT_ORDER_CONTRACT } from './const'
import {
  calcInvert,
  calcOutput,
  calcPercentFilledOrder,
  calcRate,
  formatUsdPrice,
  getTotalActiveMakingAmount,
  hashOrder,
  submitOrder,
} from './helpers'
import { LimitOrder, LimitOrderActions, LimitOrderStatus, RateInfo } from './type'
import useBaseTradeInfo from './useBaseTradeInfo'

export const Label = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  margin-bottom: 0.5rem;
`
const Set2Market = styled(Label)`
  border-radius: 24px;
  background: ${({ theme }) => theme.tabActive};
  padding: 4px 8px;
  cursor: pointer;
  margin-bottom: 0;
  user-select: none;
`
type Props = {
  refreshListOrder: () => void
  action?: LimitOrderActions
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultInputAmount?: string
  defaultOutputAmount?: string
  defaultExpire?: Date
  setIsSelectCurrencyManual?: (val: boolean) => void
  note?: string
  onCancelOrder?: () => Promise<any>
  step?: LimitOrderActions
  orderInfo?: LimitOrder
  flowState: TransactionFlowState
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
  zIndexToolTip?: number
  onDismissModalEdit?: () => void
  defaultRate?: RateInfo
}

const LimitOrderForm = function LimitOrderForm({
  refreshListOrder,
  onCancelOrder,
  action = LimitOrderActions.CREATE,
  currencyIn,
  currencyOut,
  defaultInputAmount = '',
  defaultOutputAmount = '',
  defaultExpire,
  defaultRate = { rate: '', invertRate: '', invert: false },
  setIsSelectCurrencyManual,
  note = '',
  step = LimitOrderActions.CREATE,
  orderInfo,
  flowState,
  setFlowState,
  zIndexToolTip = Z_INDEXS.TOOL_TIP_ERROR_INPUT_SWAP_FORM,
  onDismissModalEdit,
}: Props) {
  const isEdit = action === LimitOrderActions.EDIT // else create

  const { account, chainId } = useActiveWeb3React()

  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const notify = useNotify()

  const { setCurrencyIn, setCurrencyOut, switchCurrency } = useLimitActionHandlers()

  const [inputAmount, setInputAmount] = useState(defaultInputAmount)
  const [outputAmount, setOuputAmount] = useState(defaultOutputAmount)
  const [activeOrderMakingAmount, setActiveOrderMakingAmount] = useState('')

  const [rateInfo, setRateInfo] = useState<RateInfo>(defaultRate)
  const displayRate = rateInfo.invert ? rateInfo.invertRate : rateInfo.rate

  const [expire, setExpire] = useState(DEFAULT_EXPIRED)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDateExpire, setCustomDateExpire] = useState<Date | undefined>(defaultExpire)

  const [approvalSubmitted, setApprovalSubmitted] = useState(false)

  const { loading: loadingTrade, tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)

  const onSetRate = (rate: string, invertRate: string) => {
    if (!currencyIn || !currencyOut) return
    const newRate = { ...rateInfo, rate, invertRate }
    if (!rate && !invertRate) {
      setRateInfo(newRate)
      return
    }

    if (rate) {
      if (inputAmount) {
        const output = calcOutput(inputAmount, rate, currencyIn.decimals)
        setOuputAmount(output)
      }
      if (!invertRate) {
        newRate.invertRate = calcInvert(rate)
      }
      setRateInfo(newRate)
      return
    }
    if (invertRate) {
      newRate.rate = calcInvert(invertRate)
      if (inputAmount) {
        const output = calcOutput(inputAmount, newRate.rate, currencyIn.decimals)
        setOuputAmount(output)
      }
      setRateInfo(newRate)
      return
    }
  }

  const onSetOutput = (output: string) => {
    if (inputAmount && parseFloat(inputAmount) !== 0 && currencyOut && output) {
      const rate = calcRate(inputAmount, output, currencyOut?.decimals)
      setRateInfo({
        ...rateInfo,
        rate,
        invertRate: calcInvert(rate),
      })
    }
    setOuputAmount(output)
  }

  const setPriceRateMarket = () => {
    try {
      if (!loadingTrade && currencyIn && tradeInfo) {
        onSetRate(tradeInfo?.price?.toSignificant(6) ?? '', tradeInfo?.price?.invert().toSignificant(6) ?? '')
      }
    } catch (error) {}
  }

  const onChangeRate = (val: string) => {
    if (currencyOut) {
      onSetRate(rateInfo.invert ? '' : val, rateInfo.invert ? val : '')
    }
  }

  const onSetInput = useCallback(
    (input: string) => {
      setInputAmount(input)
      if (!input) {
        setOuputAmount('')
        setRateInfo({ ...rateInfo, rate: '', invertRate: '' })
        return
      }
      if (rateInfo.rate && currencyIn && input) {
        setOuputAmount(calcOutput(input, rateInfo.rate, currencyIn.decimals))
      }
    },
    [rateInfo, currencyIn],
  )

  const onInvertRate = (invert: boolean) => {
    setRateInfo({ ...rateInfo, invert })
  }

  const balances = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const maxAmountInput = maxAmountSpend(balances[0])
  const handleMaxInput = useCallback(() => {
    maxAmountInput && onSetInput(maxAmountInput?.toExact())
  }, [maxAmountInput, onSetInput])

  const handleHalfInput = useCallback(() => {
    onSetInput(balances[0]?.divide(2).toExact() || '')
  }, [balances, onSetInput])

  const handleInputSelect = (currency: Currency) => {
    if (currencyOut && currency?.equals(currencyOut)) return
    setCurrencyIn(currency)
    setIsSelectCurrencyManual?.(true)
  }
  const handleOutputSelect = (currency: Currency) => {
    if (currencyIn && currency?.equals(currencyIn)) return
    setCurrencyOut(currency)
    setIsSelectCurrencyManual?.(true)
  }

  const [rotate, setRotate] = useState(false)
  const handleRotateClick = () => {
    setRotate(prev => !prev)
    switchCurrency()
    setIsSelectCurrencyManual?.(true)
  }

  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const currentAllowance = useTokenAllowance(
    currencyIn as Token,
    account ?? undefined,
    LIMIT_ORDER_CONTRACT,
  ) as CurrencyAmount<Currency>

  const parsedAtiveOrderMakingAmount = useMemo(() => {
    try {
      if (currencyIn && activeOrderMakingAmount) {
        return TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(activeOrderMakingAmount))
      }
    } catch (error) {}
    return undefined
  }, [currencyIn, activeOrderMakingAmount])

  const enoughAllowance =
    currencyIn?.isNative ||
    (parsedAtiveOrderMakingAmount &&
      parseInputAmount &&
      currentAllowance?.subtract(parsedAtiveOrderMakingAmount).greaterThan(parseInputAmount))

  const [approval, approveCallback] = useApproveCallback(parseInputAmount, LIMIT_ORDER_CONTRACT, !enoughAllowance)

  const balance = useCurrencyBalance(currencyIn ?? undefined)
  const inputError = useMemo(() => {
    if (!inputAmount) return
    if (parseFloat(inputAmount) === 0 && (parseFloat(outputAmount) === 0 || parseFloat(displayRate) === 0)) {
      return t`Invalid input amount`
    }
    if (balance && parseInputAmount?.greaterThan(balance)) {
      return t`Insufficient ${currencyIn?.symbol} balance`
    }

    const remainBalance = parsedAtiveOrderMakingAmount ? balance?.subtract(parsedAtiveOrderMakingAmount) : undefined
    if (parseInputAmount && remainBalance?.lessThan(parseInputAmount)) {
      const formatNum = formatNumberWithPrecisionRange(parseFloat(remainBalance.toFixed(3)), 0, 10)
      return t`You don't have sufficient ${currencyIn?.symbol} balance. After your active orders, you have ${
        Number(formatNum) !== 0 ? '~' : ''
      }${formatNum} ${currencyIn?.symbol} left.`
    }

    if (!parseInputAmount) {
      return t`Your input amount is invalid.`
    }
    return
  }, [currencyIn, balance, inputAmount, outputAmount, displayRate, parsedAtiveOrderMakingAmount, parseInputAmount])

  const outPutError = useMemo(() => {
    return // todo consider calc tính ra số chữ số thập phân dài quá decimal.
    if (outputAmount && !tryParseAmount(outputAmount, currencyOut)) {
      return t`Your output amount is invalid.`
    }
    return
  }, [outputAmount, currencyOut])

  const hasInputError = inputError || outPutError

  const hasInvalidInput = [outputAmount, inputAmount, currencyIn, currencyOut, displayRate].some(e => !e)

  const showApproveFlow =
    !hasInvalidInput &&
    !hasInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      !enoughAllowance ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const disableBtnApproved =
    (approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!hasInputError) && enoughAllowance
  const disableBtnReview = hasInvalidInput || !!hasInputError || approval !== ApprovalState.APPROVED

  const expiredAt = customDateExpire?.getTime() || Date.now() + expire * 1000

  const showPreview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return
    setFlowState({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true })
  }

  const hidePreview = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
  }, [setFlowState])

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker)
  }

  const onChangeExpire = (val: Date | number) => {
    if (typeof val === 'number') {
      setExpire(val)
      setCustomDateExpire(undefined)
    } else {
      setCustomDateExpire(val)
    }
  }

  const getActiveMakingAmount = useCallback(
    async (currencyIn: Currency) => {
      try {
        if (!currencyIn?.wrapped.address || !account) return
        const { activeMakingAmount } = await getTotalActiveMakingAmount(
          chainId + '',
          currencyIn?.wrapped.address,
          account,
        )
        setActiveOrderMakingAmount(activeMakingAmount)
      } catch (error) {
        console.log(error)
      }
    },
    [account, chainId],
  )

  const onResetForm = () => {
    setInputAmount(defaultInputAmount)
    setOuputAmount(defaultOutputAmount)
    setRateInfo(defaultRate)
    setExpire(DEFAULT_EXPIRED)
    setCustomDateExpire(undefined)
    currencyIn && getActiveMakingAmount(currencyIn)
  }

  const handleError = (error: any) => {
    const errorCode: string = error?.response?.data?.code || error.code || ''
    const mapErrorMessageByErrCode: { [code: string]: string } = {
      4001: t`User denied message signature`,
      4002: t`You don't have sufficient fund for this transaction.`,
      4004: t`Invalid signature`,
    }
    const msg = mapErrorMessageByErrCode[errorCode]
    console.error(error)
    setFlowState(state => ({
      ...state,
      attemptingTxn: false,
      errorMessage: msg || 'Error occur. Please try again.',
    }))
  }
  const { library } = useWeb3React()
  const requestCreateOrder = async () => {
    if (!library || !currencyIn || !currencyOut || !chainId || !account) return Promise.reject('wrong input')
    setFlowState(state => ({
      ...state,
      attemptingTxn: true,
      showConfirm: true,
      pendingText: t`Getting hash data.`,
    }))

    const parseInputAmount = tryParseAmount(inputAmount, currencyIn)
    const payload = {
      chainId: chainId.toString(),
      makerAsset: currencyIn?.wrapped.address,
      takerAsset: currencyOut?.wrapped.address,
      maker: account,
      makingAmount: parseInputAmount?.quotient?.toString(),
      takingAmount: tryParseAmount(outputAmount, currencyOut)?.quotient?.toString(),
      expiredAt: (expiredAt / 1000) | 0,
    }

    const { hash: orderHash } = await hashOrder(payload)
    setFlowState(state => ({
      ...state,
      pendingText: t`Sign limit order: ${inputAmount} ${currencyIn.symbol} to ${outputAmount} ${currencyOut.symbol}`,
    }))
    //
    const signature = await library.getSigner().signMessage(ethers.utils.arrayify(orderHash))

    setFlowState(state => ({ ...state, pendingText: t`Placing order` }))
    await submitOrder({ ...payload, orderHash, signature })
    setFlowState(state => ({ ...state, showConfirm: false }))
    notify(
      {
        type: NotificationType.SUCCESS,
        title: isEdit ? t`Order Edited` : t`Order Placed`,
        summary: (
          <Text color={theme.text} lineHeight="18px">
            <Trans>
              You have successfully placed an order to pay &nbsp;
              <Text as="span" fontWeight={500}>
                {inputAmount} {currencyIn.symbol}
              </Text>{' '}
              &nbsp; and receive&nbsp;
              <Text as="span" fontWeight={500}>
                {outputAmount} {currencyOut.symbol}&nbsp;
              </Text>
              <Text as="span" color={theme.subText}>
                &nbsp; when 1 {currencyIn.symbol} is equal to {rateInfo.rate} {currencyOut.symbol}.
              </Text>
            </Trans>
            {isEdit &&
              (() => {
                const isPartialFilled = orderInfo?.status === LimitOrderStatus.PARTIALLY_FILLED
                const filledPercent =
                  orderInfo && isPartialFilled
                    ? calcPercentFilledOrder(orderInfo?.filledTakingAmount, orderInfo?.takingAmount)
                    : ''
                return (
                  <>
                    <br />
                    {isPartialFilled ? (
                      <Trans>Your previous order which was {filledPercent}% filled was automatically cancelled.</Trans>
                    ) : (
                      <Trans>Your previous order was automatically cancelled.</Trans>
                    )}
                  </>
                )
              })()}
          </Text>
        ),
      },
      10000,
    )
    onResetForm()
    setTimeout(() => refreshListOrder?.(), 1000)
    return
  }

  const onSubmitCreateOrder = async () => {
    try {
      await requestCreateOrder()
    } catch (error) {
      handleError(error)
    }
  }

  const onSubmitEditOrder = async () => {
    try {
      if (!onCancelOrder) return
      await onCancelOrder()
      await requestCreateOrder()
      onDismissModalEdit?.()
    } catch (error) {
      handleError(error)
    }
  }

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  useEffect(() => {
    if (currencyIn) getActiveMakingAmount(currencyIn)
  }, [currencyIn, getActiveMakingAmount])

  const styleTooltip = { maxWidth: '250px', zIndex: zIndexToolTip }
  return (
    <>
      <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
        {!isEdit && (
          <RowBetween style={{ gap: '12px' }}>
            <CurrencyInputPanel
              hideBalance
              value={inputAmount}
              hideInput={true}
              onCurrencySelect={handleInputSelect}
              currency={currencyIn}
              showCommonBases
              onMax={null}
              onHalf={null}
              id="create-limit-order-input-tokena"
              maxCurrencySymbolLength={6}
              otherCurrency={currencyOut}
              supportNative={false}
            />
            <ArrowRotate isVertical rotate={rotate} onClick={handleRotateClick} />

            <CurrencyInputPanel
              hideBalance
              value={outputAmount}
              hideInput={true}
              onHalf={null}
              onMax={null}
              id="create-limit-order-input-tokenb"
              onCurrencySelect={handleOutputSelect}
              positionMax="top"
              currency={currencyOut}
              showCommonBases
              maxCurrencySymbolLength={6}
              otherCurrency={currencyIn}
            />
          </RowBetween>
        )}

        <Flex flexDirection={'column'}>
          <Label>
            <Trans>You Pay</Trans>
          </Label>
          <Tooltip text={inputError} show={!!inputError} placement="top" style={styleTooltip} width="fit-content">
            <CurrencyInputPanel
              maxLength={16}
              error={!!inputError}
              value={inputAmount}
              positionMax="top"
              currency={currencyIn}
              onUserInput={onSetInput}
              onMax={handleMaxInput}
              onHalf={handleHalfInput}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencyOut}
              id="swap-currency-input"
              showCommonBases={true}
              disableCurrencySelect
              estimatedUsd={formatUsdPrice(inputAmount, tradeInfo?.amountInUsd)}
            />
          </Tooltip>
        </Flex>

        <Flex justifyContent={'space-between'} alignItems="center" style={{ gap: '1rem' }}>
          <Flex flexDirection={'column'} flex={1} style={{ gap: '0.75rem' }}>
            <Flex justifyContent={'space-between'} alignItems="flex-end">
              <DeltaRate symbol={currencyIn?.symbol ?? ''} marketPrice={tradeInfo?.price} rate={rateInfo.rate} />

              <Set2Market onClick={setPriceRateMarket}>
                <Trans>Set to Market</Trans>
              </Set2Market>
            </Flex>
            <Flex alignItems={'center'} style={{ background: theme.buttonBlack, borderRadius: 12, paddingRight: 12 }}>
              <NumericalInput
                maxLength={16}
                style={{ borderRadius: 12, padding: '10px 12px', fontSize: 14, height: 48 }}
                value={displayRate}
                onUserInput={onChangeRate}
              />
              {currencyIn && currencyOut && (
                <Flex
                  style={{ gap: 6, cursor: 'pointer' }}
                  onClick={() => displayRate && onInvertRate(!rateInfo.invert)}
                >
                  <Text fontSize={14} color={theme.subText}>
                    {rateInfo.invert
                      ? `${currencyOut?.symbol}/${currencyIn?.symbol}`
                      : `${currencyIn?.symbol}/${currencyOut?.symbol}`}
                  </Text>
                  <div>
                    <Repeat color={theme.subText} size={12} />
                  </div>
                </Flex>
              )}
            </Flex>
            <TradePrice price={tradeInfo?.price} style={{ width: 'fit-content' }} />
          </Flex>
        </Flex>

        <Flex flexDirection={'column'}>
          <Label>
            <Trans>You Receive</Trans>
          </Label>
          <Tooltip text={outPutError} show={!!outPutError} placement="top" style={styleTooltip} width="fit-content">
            <CurrencyInputPanel
              maxLength={16}
              value={outputAmount}
              error={!!outPutError}
              disableCurrencySelect
              currency={currencyOut}
              onUserInput={onSetOutput}
              onCurrencySelect={handleOutputSelect}
              otherCurrency={currencyOut}
              id="swap-currency-output"
              showCommonBases={true}
              onMax={null}
              onHalf={null}
              estimatedUsd={formatUsdPrice(outputAmount, tradeInfo?.amountOutUsd)}
            />
          </Tooltip>
        </Flex>

        <Select
          forceMenuPlacementTop={isEdit}
          value={expire}
          onChange={onChangeExpire}
          style={{ width: '100%', height: 48 }}
          menuStyle={{ right: 12, left: 'unset' }}
          options={[...EXPIRED_OPTIONS, { label: 'Custom', onSelect: toggleDatePicker }]}
          activeRender={item => (
            <Flex justifyContent={'space-between'}>
              <Text>{t`Expires In`}</Text>
              <Text color={theme.text} fontSize={14}>
                {customDateExpire ? dayjs(customDateExpire).format('DD/MM/YYYY HH:mm') : item?.label}
              </Text>
            </Flex>
          )}
        />

        {chainId !== ChainId.ETHW && <TrendingSoonTokenBanner currencyIn={currencyIn} currencyOut={currencyOut} />}

        {!account ? (
          <ButtonLight onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonLight>
        ) : (
          showApproveFlow && (
            <>
              <RowBetween>
                <ButtonApprove
                  forceApprove={!enoughAllowance}
                  tokenSymbol={currencyIn?.symbol}
                  tooltipMsg={t`You need to first allow KyberSwaps smart contracts to use your ${currencyIn?.symbol}. This has to be done only once for each token.`}
                  onClick={approveCallback}
                  disabled={!!disableBtnApproved}
                  approval={approval}
                />
                <ButtonError width="48%" id="swap-button" disabled={disableBtnReview} onClick={showPreview}>
                  <Text fontSize={16} fontWeight={500}>
                    {t`Review Order`}
                  </Text>
                </ButtonError>
              </RowBetween>
              <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
            </>
          )
        )}
        {!showApproveFlow && account && (
          <ButtonError onClick={showPreview} disabled={disableBtnReview}>
            <Text fontWeight={500}>{t`Review Order`}</Text>
          </ButtonError>
        )}
      </Flex>
      <ConfirmOrderModal
        isEdit={isEdit}
        step={step}
        flowState={flowState}
        onDismiss={hidePreview}
        onSubmit={isEdit ? onSubmitEditOrder : onSubmitCreateOrder}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={inputAmount}
        outputAmount={outputAmount}
        expireAt={expiredAt}
        rateInfo={rateInfo}
        marketPrice={tradeInfo?.price}
        note={note}
        order={orderInfo}
      />
      <ExpirePicker
        defaultDate={customDateExpire}
        expire={expire}
        isOpen={showDatePicker}
        onDismiss={toggleDatePicker}
        onSetDate={onChangeExpire}
      />
    </>
  )
}

export default memo(LimitOrderForm)
