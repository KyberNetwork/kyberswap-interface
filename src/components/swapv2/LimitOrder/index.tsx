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
import Tooltip, { MouseoverTooltip } from 'components/Tooltip'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, EIP712Domain } from 'constants/index'
import { nativeOnChain } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { NotificationType, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { BaseAggregation } from 'state/swap/types'
import { useCurrencyBalance, useCurrencyBalances } from 'state/wallet/hooks'
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
  const [invertRate, setInvertRate] = useState(false)
  const [expire, setExpire] = useState(EXPIRED_OPTIONS[0].value)

  const notify = useNotify()

  const onSetRate = (rate: string) => {
    setExpectRate(rate)
    setOuputAmount(String((Number(inputAmount) * Number(rate)) ** (invertRate ? -1 : 1)))
  }

  const onSetOutput = (output: string) => {
    setExpectRate(String((Number(output) / Number(inputAmount)) ** (invertRate ? -1 : 1)))
    setOuputAmount(output)
  }
  // todo check balance
  const onSetInput = useCallback(
    (input: string) => {
      setOuputAmount(String(Number(input) * Number(expectRate) ** (invertRate ? -1 : 1)))
      setInputAmount(input)
    },
    [expectRate, invertRate],
  )

  const onInvertRate = (invertRate: boolean) => {
    setInvertRate(invertRate)
    setExpectRate((Number(outputAmount) / Number(inputAmount)) ** (invertRate ? -1 : 1) + '')
  }

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
    maxAmountInput && onSetInput(maxAmountInput?.toExact())
  }, [maxAmountInput, onSetInput])

  const handleHalfInput = useCallback(() => {
    onSetInput(maxAmountInput?.divide(2).toExact() || '')
  }, [maxAmountInput, onSetInput])

  const { loading: loadingTrade, tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)

  const setPriceRateMarket = async () => {
    if (!loadingTrade && currencyIn && tradeInfo) {
      const isInvert = !tradeInfo?.price.baseCurrency.equals(currencyIn)
      onSetRate((isInvert ? tradeInfo?.price?.invert().toSignificant(6) : tradeInfo?.price?.toSignificant(6)) ?? '')
    }
  }
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
    // todo
    setCurrencyIn(chainId ? nativeOnChain(chainId) : undefined)
    setCurrencyOut(chainId ? DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] : undefined)
  }, [chainId])

  const balance = useCurrencyBalance(account ?? undefined, currencyIn ?? undefined)
  // todo zindex tooltip error
  const inputError = useMemo(() => {
    if (!inputAmount) return
    if (balance && tryParseAmount(inputAmount, currencyIn)?.greaterThan(balance)) {
      return t`Insufficient ${currencyIn?.symbol} balance`
    }
    return
  }, [currencyIn, balance, inputAmount])

  const showApproveFlow =
    !inputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const disableBtnApproved = approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!inputError
  const disableBtnReview = !outputAmount || !expectRate || !!inputError || approval !== ApprovalState.APPROVED

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
        pendingText: t`Getting hash data.`,
      }))

      const payload = {
        chainId: chainId.toString(),
        salt: tryParseAmount(Math.random().toString(), currencyIn)?.quotient?.toString(),
        makerAsset: currencyIn?.wrapped.address,
        takerAsset: currencyOut?.wrapped.address,
        maker: account,
        makingAmount: tryParseAmount(inputAmount, currencyIn)?.quotient?.toString(),
        takingAmount: tryParseAmount(outputAmount, currencyOut)?.quotient?.toString(),
        expiredAt: Date.now() + expire,
      }

      const { hash } = await hashOrder(payload)
      setSwapState(state => ({
        ...state,
        pendingText: t`Sign limit order: ${inputAmount} ${currencyIn.symbol} to ${outputAmount} ${currencyOut.symbol}`,
      }))
      const data = JSON.stringify({
        types: { EIP712Domain, Permit: [{ name: 'hash', type: 'string' }] },
        domain: {
          name: 'Kyberswap Limit Order',
          version: '1',
          chainId,
          verifyingContract: '',
        },
        primaryType: 'Permit',
        message: { hash: hash },
      })
      // const signature = await library.getSigner().signMessage(hash)
      const signature = await library.send('eth_sign', [account, hash])
      // const signature = await library.send('eth_signTypedData_v4', [account, data])
      // const signature = await library.send('eth_signTypedData_v3', [account, data])
      // const signer = new ethers.Wallet(
      //   '2fe9c6d33e34b94648dea1a7ef34cab0a01116314b160e706be00cc146b94e1f',
      //   library.provider as any,
      // )
      // const signature = await new web3(NETWORKS_INFO[chainId].rpcUrl).eth.personal.sign(hash, account, '12345678')
      // todo xóa bridge gì kia
      // todo check kĩ UI vs xong flow error nữa
      setSwapState(state => ({ ...state, pendingText: t`Placing order` }))
      const resp = await submitOrder({
        ...payload,
        signature,
      })
      console.log(resp)
      onReset()
      setSwapState(state => ({ ...state, attemptingTxn: false, showConfirm: false }))
      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Order Placed`,
          summary: t`You have successfully placed an order to pay 10 ${currencyIn.symbol} and receive 0.006486 ${
            currencyOut.symbol
          } when 1 ${currencyIn.symbol} is equal to ${Number(expectRate) ** (invertRate ? -1 : 1)} ${
            currencyOut.symbol
          }`,
        },
        10000,
      )
    } catch (error) {
      console.error(error)
      const msg = error.code === 4001 ? t`User denied message signature` : ''
      setSwapState(state => ({
        ...state,
        attemptingTxn: false,
        swapErrorMessage: msg || 'Error occur. Please try again.',
      })) // todo, and review bridge
    }
  }
  // todo type and swap
  return (
    <>
      <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
        <RowBetween style={{ gap: '12px' }}>
          <CurrencyInputPanel
            hideBalance
            value={inputAmount}
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
            onCurrencySelect={handleOutputSelect}
            showMaxButton={false}
            positionMax="top"
            currency={currencyOut}
            showCommonBases
            maxCurrencySymbolLength={6}
            otherCurrency={currencyIn}
          />
        </RowBetween>

        <Flex flexDirection={'column'}>
          <Label>
            <Trans>You Pay</Trans>
          </Label>
          <Tooltip text={inputError} show={!!inputError} placement="top">
            <CurrencyInputPanel
              error={!!inputError}
              value={inputAmount}
              showMaxButton
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
              estimatedUsd={
                tradeInfo?.amountInUsd ? `${formattedNum(tradeInfo.amountInUsd.toString(), true)}` : undefined
              }
            />
          </Tooltip>
        </Flex>

        <Flex justifyContent={'space-between'} alignItems="center" style={{ gap: '1rem' }}>
          <Flex flexDirection={'column'} flex={1} style={{ gap: '0.75rem' }}>
            <Flex justifyContent={'space-between'} alignItems="flex-end">
              <Label style={{ marginBottom: 0, display: 'flex' }}>
                <Trans>
                  {currencyIn?.symbol} Price &nbsp; <Text color={theme.apr}>(+đang tìm cách lấy %)</Text>
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
                onUserInput={onSetRate}
              />
              {currencyIn && currencyOut && (
                <Flex style={{ gap: 6, cursor: 'pointer' }} onClick={() => onInvertRate(!invertRate)}>
                  <Text fontSize={14} color={theme.subText}>
                    {invertRate
                      ? `${currencyOut?.symbol}/${currencyIn?.symbol}`
                      : `${currencyIn?.symbol}/${currencyOut?.symbol}`}
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
            onUserInput={onSetOutput}
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
          <ButtonError onClick={showPreview} disabled={disableBtnReview}>
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
