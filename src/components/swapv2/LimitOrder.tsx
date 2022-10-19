import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import axios from 'axios'
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
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { BaseAggregation } from 'state/swap/types'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import TradePrice from './TradePrice'

const EXPIRED_OPTIONS = [
  { label: '5 Minutes', value: 5 * 60 },
  { label: '10 Minutes', value: 10 * 60 },
  { label: '1 Hour', value: 1 * 3600 },
  { label: '3 Days', value: 3 * 86400 },
  { label: '7 Days', value: 7 * 86400 },
  { label: '30 Days', value: 30 * 86400 },
  { label: 'Custom', value: 'custom' },
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

const submitOrder = () => {
  axios.post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/orders`, {
    // chainId: string, // required
    // salt: string, // required+numeric+uint256 (client gen random)
    // makerAsset: string, // required
    // takerAsset: string, // required
    // maker: string, // required
    // receiver: string, // required
    // makingAmount: string, // required+numeric+uint256
    // takingAmount: string, // required+numeric+uint256
    // signature: string, // required+hex string
    // expiredAt: number, // required
  })
}
export default memo(function LimitOrderForm() {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const [currencyIn, setCurrencyIn] = useState<Currency>()
  const [currencyOut, setCurrencyOut] = useState<Currency>()

  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOuputAmount] = useState('')
  const [priceRate, setPriceRate] = useState('')

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
      setPriceRate((isInvert ? tradeInfo?.price?.invert().toSignificant(6) : tradeInfo?.price?.toSignificant(6)) ?? '')
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

  const formatInputBridgeValue = tryParseAmount(inputAmount, currencyIn)
  //https://docs.ethers.io/v5/api/signer/#Signer
  const [approval, approveCallback] = useApproveCallback(formatInputBridgeValue, tradeInfo?.routerAddress)

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const inputError = {}

  const showApproveFlow =
    !inputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const disableBtnApproved = approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!inputError

  const showPreview = () => {
    // setSwapState(state => ({ ...state, showConfirm: true, swapErrorMessage: '' }))
  }

  return (
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
          estimatedUsd={tradeInfo?.amountInUsd ? `${formattedNum(tradeInfo.amountInUsd.toString(), true)}` : undefined}
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
              value={priceRate}
              onUserInput={setPriceRate}
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
          <TradePrice price={tradeInfo?.price} />
        </Flex>

        <ArrowRotate rotate={rotate} onClick={handleRotateClick} />
      </Flex>

      {/* <RefreshButton isConfirming={showConfirm} trade={trade} onRefresh={onRefresh} />
      <TradePrice price={trade?.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} /> */}

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
        style={{ width: '100%', height: 48 }}
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
  )
})
