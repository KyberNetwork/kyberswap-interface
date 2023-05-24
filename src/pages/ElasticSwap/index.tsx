import { Currency, TradeType } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { ETHER_ADDRESS } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'

import { TradeState, useElasticBestTrade, useSwapCallback } from './hooks'

const Wrapper = styled.div`
  background: ${({ theme }) => theme.background};
  max-width: 392px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
`
export default function ElasticSwap() {
  const { networkInfo, chainId } = useActiveWeb3React()
  const [searchParams, setSearchParams] = useSearchParams()

  const inputAddress = (searchParams.get('inputCurrency') || '').toLowerCase()
  const outputAddress = (searchParams.get('outputCurrency') || '').toLowerCase()

  const inputCurrency = useToken(inputAddress)
  const outputCurrency = useToken(outputAddress)

  const [typedValue, setTypedValue] = useState('')
  const [isExactIn, setIsExactIn] = useState(true)

  const parsedAmount =
    outputCurrency && inputCurrency && typedValue
      ? tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)
      : undefined

  const trade = useElasticBestTrade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    parsedAmount,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined,
  )

  console.log(trade)
  const { callback } = useSwapCallback(trade.trade)

  const [approvalState, approvalCallback] = useApproveCallback(
    trade.trade?.inputAmount,
    (networkInfo as EVMNetworkInfo).elastic.routers,
  )

  const loading = trade.state === TradeState.LOADING || approvalState === ApprovalState.PENDING

  const currencies = useMemo(() => {
    return [
      inputCurrency?.isNative ? NativeCurrencies[chainId] : inputCurrency?.wrapped,
      outputCurrency?.isNative ? NativeCurrencies[chainId] : outputCurrency?.wrapped,
    ]
  }, [inputCurrency, outputCurrency, chainId])

  const balances = useCurrencyBalances(currencies)

  let error = ''
  if (balances?.[0] && trade.trade?.inputAmount && balances[0].lessThan(trade.trade.inputAmount)) {
    error = 'Insufficient balance'
  } else if (!inputCurrency || !outputCurrency) {
    error = 'Select Token'
  } else if (!typedValue) {
    error = 'Input amount'
  } else {
    error = ''
  }

  const handleClick = () => {
    if (loading || error) return
    if (approvalState === ApprovalState.NOT_APPROVED) {
      approvalCallback()
    } else {
      callback?.()
    }
  }

  return (
    <Wrapper>
      <Text fontSize={20} fontWeight="500">
        ElasticSwap
      </Text>
      <CurrencyInputPanel
        positionMax="top"
        id="elastic-swap-input-currency"
        value={isExactIn ? typedValue : trade.trade?.inputAmount?.toExact() || ''}
        onMax={() => {
          //
        }}
        onHalf={() => {
          //
        }}
        onUserInput={(value: string) => {
          setIsExactIn(true)
          setTypedValue(value)
        }}
        onCurrencySelect={(currency: Currency) => {
          const address = (currency.isNative ? ETHER_ADDRESS : currency.address).toLowerCase()
          if (address === outputAddress) searchParams.set('outputCurrency', inputAddress)
          searchParams.set('inputCurrency', address)
          setSearchParams(searchParams)
        }}
        currency={inputCurrency}
        otherCurrency={outputCurrency}
        showCommonBases
      />

      <CurrencyInputPanel
        positionMax="top"
        id="elastic-swap-output-currency"
        value={isExactIn ? trade.trade?.outputAmount?.toExact() || '' : typedValue}
        onMax={() => {
          //
        }}
        onHalf={() => {
          //
        }}
        onUserInput={(value: string) => {
          setIsExactIn(false)
          setTypedValue(value)
        }}
        onCurrencySelect={(currency: Currency) => {
          const address = (currency.isNative ? ETHER_ADDRESS : currency.address).toLowerCase()
          if (address === inputAddress) searchParams.set('inputCurrency', outputAddress)
          searchParams.set('outputCurrency', address)
          setSearchParams(searchParams)
        }}
        currency={outputCurrency}
        otherCurrency={inputCurrency}
        showCommonBases
      />

      <ButtonPrimary disabled={loading || !!error} onClick={handleClick}>
        {loading ? 'Loading...' : error || (approvalState === ApprovalState.NOT_APPROVED ? 'Approve' : 'Swap')}
      </ButtonPrimary>
    </Wrapper>
  )
}
