import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Info, Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ArrowRotate from 'components/ArrowRotate'
import { ButtonConfirmed, ButtonError, ButtonLight } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import NumericalInput from 'components/NumericalInput'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import Select from 'components/Select'
import { MouseoverTooltip } from 'components/Tooltip'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, EIP712Domain } from 'constants/index'
import { nativeOnChain } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { BaseAggregation } from 'state/swap/types'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import TradePrice from '../TradePrice'
import ConfirmOrderModal from './ConfirmOrderModal'
import { hashOrder, submitOrder } from './helpers'
import { LimitOrderSwapState } from './type'

const EXPIRED_OPTIONS = [
  { label: '5 Minutes', value: 5 * 60 * 1000 },
  { label: '10 Minutes', value: 10 * 60 * 1000 },
  { label: '1 Hour', value: 1 * 3600 * 1000 },
  { label: '3 Days', value: 3 * 86400 * 1000 },
  { label: '7 Days', value: 7 * 86400 * 1000 },
  { label: '30 Days', value: 30 * 86400 * 1000 },
  { label: 'Custom', value: 0 },
]

const Label = styled.div`
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
`
function useBaseTradeInfo(currencyIn: Currency | undefined, currencyOut: Currency | undefined) {
  const { account, chainId } = useActiveWeb3React()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BaseAggregation>()

  useEffect(() => {
    // todo check call api
    if (!currencyIn || !currencyOut || !chainId || !account) return
    Aggregator.baseTradeExactIn(currencyIn, currencyOut, chainId, account)
      .then(resp => {
        setData(resp)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [currencyIn, currencyOut, chainId, account])

  return { loading, tradeInfo: data }
}

export default memo(function LimitOrderForm() {
  const { account, chainId, library } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const [currencyIn, setCurrencyIn] = useState<Currency | undefined>(chainId ? nativeOnChain(chainId) : undefined)
  const [currencyOut, setCurrencyOut] = useState<Currency | undefined>(
    chainId ? DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] : undefined,
  )

  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOuputAmount] = useState('')
  const [expectRate, setExpectRate] = useState('')
  const [expire, setExpire] = useState(EXPIRED_OPTIONS[0].value)

  // modal and loading
  const [swapState, setSwapState] = useState<LimitOrderSwapState>({
    showConfirm: false,
    attemptingTxn: false,
    swapErrorMessage: '',
    txHash: undefined,
    pendingText: '',
  })

  const balances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const maxAmountInput = maxAmountSpend(balances[0])
  const handleMaxInput = useCallback(() => {
    maxAmountInput && setInputAmount(maxAmountInput?.toExact())
  }, [maxAmountInput])

  const handleHalfInput = useCallback(() => {
    setInputAmount(maxAmountInput?.divide(2).toExact() || '')
  }, [maxAmountInput])

  const { loading: loadingTrade, tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)

  const setPriceRateMarket = async () => {
    if (!loadingTrade && currencyIn) {
      const isInvert = !tradeInfo?.price.baseCurrency.equals(currencyIn)
      setExpectRate((isInvert ? tradeInfo?.price?.invert().toSignificant(6) : tradeInfo?.price?.toSignificant(6)) ?? '')
    }
  }
  console.log(tradeInfo)
  const switchCurrency = () => {
    setCurrencyIn(currencyOut)
    setCurrencyOut(currencyIn)
  }

  const handleInputSelect = (currency: Currency) => {
    if (currencyOut && currency?.equals(currencyOut)) return switchCurrency()
    setCurrencyIn(currency)
  }
  const handleOutputSelect = (currency: Currency) => {
    if (currencyIn && currency?.equals(currencyIn)) return switchCurrency()
    setCurrencyOut(currency)
  }

  const [rotate, setRotate] = useState(false)
  const handleRotateClick = () => {
    setRotate(prev => !prev)
    switchCurrency()
  }

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)
  const qs = useParsedQueryString()
  console.log(qs)

  const formatInputBridgeValue = tryParseAmount(inputAmount, currencyIn)

  const [approval, approveCallback] = useApproveCallback(
    formatInputBridgeValue,
    tradeInfo?.routerAddress || '0xd1Bfd4C0087461e2575fbc1A793C54D60FAf4131', // todo remove knc for test
  )
  // todo đổi chain reset
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  useEffect(() => {
    setCurrencyIn(chainId ? nativeOnChain(chainId) : undefined)
    setCurrencyOut(chainId ? DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] : undefined)
  }, [chainId])

  useEffect(() => {
    setInputAmount('1')
  }, [currencyIn])

  const inputError = undefined

  const showApproveFlow =
    !inputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const disableBtnApproved = approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!inputError

  const showPreview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !expectRate) return
    setSwapState(state => ({ ...state, showConfirm: true, swapErrorMessage: '' }))
  }

  const hidePreview = useCallback(() => {
    setSwapState(state => ({ ...state, showConfirm: false }))
  }, [])

  const onReset = () => {
    //
  }

  const onSubmitOrder = async () => {
    try {
      if (!library || !currencyIn || !currencyOut || !chainId || !account) return
      setSwapState(state => ({
        ...state,
        attemptingTxn: true,
        pendingText: t`Sign limit order: ${inputAmount} ${currencyIn.symbol} to ${outputAmount} ${currencyOut.symbol}`,
      }))
      const makingAmount = tryParseAmount(inputAmount, currencyIn)?.quotient?.toString()
      const takingAmount = tryParseAmount(outputAmount, currencyOut)?.quotient?.toString()
      const expiredAt = Date.now() + expire

      const payload = {
        chainId: chainId.toString(),
        salt: tryParseAmount(Math.random().toString(), currencyIn)?.quotient?.toString(),
        makerAsset: currencyIn?.wrapped.address,
        takerAsset: currencyOut?.wrapped.address,
        maker: account,
        makingAmount,
        takingAmount,
        expiredAt,
      }

      const { hash } = await hashOrder(payload)

      const data = JSON.stringify({
        types: { EIP712Domain, Permit: [{ name: 'hash', type: 'uint256' }] },
        domain: {
          name: 'Kyberswap Limit Order',
          version: '1',
          chainId,
          verifyingContract: '',
        },
        primaryType: 'Permit',
        message: { hash },
      })
      const signature = await library.send('eth_signTypedData_v4', [account, data])
      setSwapState(state => ({ ...state, pendingText: t`Placing order` }))
      const resp = await submitOrder({
        ...payload,
        signature,
      })
      console.log(resp)
      onReset()
      setSwapState(state => ({ ...state, attemptingTxn: false }))
    } catch (error) {
      console.error(error)
      setSwapState(state => ({ ...state, attemptingTxn: false, swapErrorMessage: error?.message || error })) // todo, and review bridge
    }
  }

  return (
    <>
      <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
        <RowBetween style={{ gap: '12px' }}>
          <CurrencyInputPanel
            hideBalance
            value={inputAmount}
            onUserInput={setInputAmount}
            hideInput={true}
            showMaxButton={false}
            onCurrencySelect={handleInputSelect}
            currency={currencyIn}
            showCommonBases
            id="create-limit-order-input-tokena"
            maxCurrencySymbolLength={6}
            otherCurrency={currencyOut}
          />
          <ArrowRotate isVertical rotate={rotate} onClick={handleRotateClick} />

          <CurrencyInputPanel
            hideBalance
            value={outputAmount}
            hideInput={true}
            id="create-limit-order-input-tokenb"
            onUserInput={setOuputAmount}
            onCurrencySelect={handleOutputSelect}
            showMaxButton={false}
            positionMax="top"
            currency={currencyOut}
            showCommonBases
            maxCurrencySymbolLength={6}
            otherCurrency={currencyIn}
          />
        </RowBetween>

        <div>
          <Label>
            <Trans>You Pay</Trans>
          </Label>
          <CurrencyInputPanel
            value={inputAmount}
            showMaxButton
            positionMax="top"
            currency={currencyIn}
            onUserInput={setInputAmount}
            onMax={handleMaxInput}
            onHalf={handleHalfInput}
            onCurrencySelect={handleInputSelect}
            otherCurrency={currencyOut}
            id="swap-currency-input"
            showCommonBases={true}
            disableCurrencySelect
            estimatedUsd={
              tradeInfo?.amountInUsd ? `${formattedNum(tradeInfo.amountInUsd.toString(), true)}` : undefined
            }
          />
        </div>

        <Flex justifyContent={'space-between'} alignItems="center" style={{ gap: '1rem' }}>
          <Flex flexDirection={'column'} flex={1} style={{ gap: '0.75rem' }}>
            <Flex justifyContent={'space-between'} alignItems="flex-end">
              <Label style={{ marginBottom: 0, display: 'flex' }}>
                <Trans>
                  {currencyIn?.symbol} Price &nbsp; <Text color={theme.apr}>(+xxx %)</Text>
                </Trans>
              </Label>
              <Set2Market onClick={setPriceRateMarket}>
                <Trans>Set to Market</Trans>
              </Set2Market>
            </Flex>
            <Flex alignItems={'center'} style={{ background: theme.buttonBlack, borderRadius: 12, paddingRight: 12 }}>
              <NumericalInput
                style={{ borderRadius: 12, padding: '10px 12px', fontSize: 14, height: 48 }}
                value={expectRate}
                onUserInput={setExpectRate}
              />
              {currencyIn && currencyOut && (
                <Flex style={{ gap: 6 }}>
                  <Text fontSize={14} color={theme.subText}>
                    {currencyIn?.symbol}/{currencyOut?.symbol}
                  </Text>
                  <div>
                    <Repeat color={theme.subText} size={12} />
                  </div>
                </Flex>
              )}
            </Flex>
            {/* <RefreshButton isConfirming={showConfirm} trade={trade} onRefresh={onRefresh} />
             */}
            <TradePrice price={tradeInfo?.price} style={{ width: 'fit-content' }} />
          </Flex>
        </Flex>

        <div>
          <Label>
            <Trans>You Receive</Trans>
          </Label>
          <CurrencyInputPanel
            value={outputAmount}
            showMaxButton={false}
            disableCurrencySelect
            currency={currencyOut}
            onUserInput={setOuputAmount}
            onCurrencySelect={handleOutputSelect}
            otherCurrency={currencyOut}
            id="swap-currency-output"
            showCommonBases={true}
            estimatedUsd={
              tradeInfo?.amountOutUsd ? `${formattedNum(tradeInfo.amountOutUsd.toString(), true)}` : undefined
            }
          />
        </div>

        <Select
          onChange={value => setExpire(value)}
          style={{ width: '100%', height: 48 }}
          menuStyle={{ right: 12, left: 'unset' }}
          options={EXPIRED_OPTIONS}
          activeRender={item => (
            <Flex justifyContent={'space-between'}>
              <Text>{t`Expires In`}</Text>
              <Text color={theme.text} fontSize={14}>
                {item?.label}
              </Text>
            </Flex>
          )}
        />

        {!account ? (
          <ButtonLight onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonLight>
        ) : (
          showApproveFlow && (
            <>
              <RowBetween>
                <ButtonConfirmed
                  onClick={approveCallback}
                  disabled={disableBtnApproved}
                  width="48%"
                  altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                  confirmed={approval === ApprovalState.APPROVED}
                >
                  {approval === ApprovalState.PENDING ? (
                    <AutoRow gap="6px" justify="center">
                      <Trans>Approving</Trans> <Loader stroke="white" />
                    </AutoRow>
                  ) : (
                    <Flex alignContent={'center'}>
                      <MouseoverTooltip
                        width="300px"
                        text={t`You would need to first allow Multichain smart contract to use your ${currencyIn?.symbol}. This has to be done only once for each token.`}
                      >
                        <Info size={18} />
                      </MouseoverTooltip>
                      <Text marginLeft={'5px'}>{t`Approve ${currencyIn?.symbol}`}</Text>
                    </Flex>
                  )}
                </ButtonConfirmed>
                <ButtonError
                  width="48%"
                  id="swap-button"
                  disabled={approval !== ApprovalState.APPROVED}
                  onClick={showPreview}
                >
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
          <ButtonError onClick={showPreview} disabled={!!inputError || approval !== ApprovalState.APPROVED}>
            <Text fontWeight={500}>{t`Review Order`}</Text>
          </ButtonError>
        )}
      </Flex>
      <ConfirmOrderModal
        swapState={swapState}
        onDismiss={hidePreview}
        onSubmit={onSubmitOrder}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={inputAmount}
        outputAmount={outputAmount}
        expire={expire}
        expectRate={expectRate}
        marketPrice={tradeInfo?.price}
      />
    </>
  )
})
