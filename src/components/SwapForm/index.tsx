import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex } from 'rebass'
import { parseGetRouteResponse } from 'services/route/utils'
import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import AddressInputPanel from 'components/AddressInputPanel'
import FeeControlGroup from 'components/FeeControlGroup'
import { NetworkSelector } from 'components/NetworkSelector'
import InputCurrencyPanel from 'components/SwapForm/InputCurrencyPanel'
import OutputCurrencyPanel from 'components/SwapForm/OutputCurrencyPanel'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import { SwapFormContextProvider } from 'components/SwapForm/SwapFormContext'
import useBuildRoute from 'components/SwapForm/hooks/useBuildRoute'
import useCheckStablePairSwap from 'components/SwapForm/hooks/useCheckStablePairSwap'
import useGetInputError from 'components/SwapForm/hooks/useGetInputError'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { Wrapper } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import useUpdateSlippageInStableCoinSwap from 'pages/SwapV3/useUpdateSlippageInStableCoinSwap'
import { Field } from 'state/swap/actions'
import { useCheckCorrelatedPair, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { DetailedRouteSummary } from 'types/route'

import MultichainKNCNote from './MultichainKNCNote'
import ReverseTokenSelectionButton from './ReverseTokenSelectionButton'
import SwapActionButton from './SwapActionButton'
import TradeSummary from './TradeSummary'

export const RoutingIconWrapper = styled(RoutingIcon)`
  height: 20px;
  width: 20px;
  margin-right: 10px;
  path {
    fill: ${({ theme }) => theme.text} !important;
  }
`

export type SwapFormProps = {
  hidden: boolean

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined

  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  routeSummary: DetailedRouteSummary | undefined
  setRouteSummary: React.Dispatch<React.SetStateAction<DetailedRouteSummary | undefined>>

  isDegenMode: boolean
  slippage: number
  transactionTimeout: number
  permit?: string

  onChangeCurrencyIn: (c: Currency) => void
  onChangeCurrencyOut: (c: Currency) => void
  customChainId?: ChainId
  omniView?: boolean
  onOpenGasToken?: () => void
}

const SwapForm: React.FC<SwapFormProps> = props => {
  const [searchParams] = useSearchParams()
  const {
    hidden,
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    setRouteSummary,
    isDegenMode,
    slippage,
    transactionTimeout,
    permit,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    customChainId,
    omniView,
    onOpenGasToken,
  } = props

  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const [isProcessingSwap, setProcessingSwap] = useState(false)
  const { typedValue } = useSwapState()
  const [recipient, setRecipient] = useState<string | null>(null)
  useUpdateSlippageInStableCoinSwap(chainId)

  const { onUserInput: updateInputAmount } = useSwapActionHandlers()
  const onUserInput = useCallback(
    (value: string) => {
      updateInputAmount(Field.INPUT, value)
    },
    [updateInputAmount],
  )

  const parsedAmount = useParsedAmount(currencyIn, typedValue)
  const {
    wrapType,
    inputError: wrapInputError,
    execute: onWrap,
  } = useWrapCallback(currencyIn, currencyOut, typedValue, false, customChainId)
  const isWrapOrUnwrap = wrapType !== WrapType.NOT_APPLICABLE

  const isStablePairSwap = useCheckStablePairSwap(currencyIn, currencyOut)
  const isCorrelatedPair = useCheckCorrelatedPair()

  const { fetcher: getRoute, result } = useGetRoute({
    currencyIn,
    currencyOut,
    parsedAmount,
    isProcessingSwap,
    customChain: chainId,
    clientId: searchParams.get('clientId') || undefined,
  })

  const { data: getRouteRawResponse, isFetching: isGettingRoute, error: getRouteError } = result
  const getRouteResponse = useMemo(() => {
    if (!getRouteRawResponse?.data || getRouteError || !currencyIn || !currencyOut) {
      return undefined
    }

    return parseGetRouteResponse(getRouteRawResponse.data, currencyIn, currencyOut)
  }, [currencyIn, currencyOut, getRouteError, getRouteRawResponse])

  const routeSummary = getRouteResponse?.routeSummary

  const buildRoute = useBuildRoute({
    recipient: isDegenMode && recipient ? recipient : '',
    routeSummary: getRouteRawResponse?.data?.routeSummary || undefined,
    slippage,
    transactionTimeout,
    permit,
  })

  const swapInputError = useGetInputError({
    currencyIn,
    currencyOut,
    typedValue,
    recipient,
    balanceIn,
    parsedAmountFromTypedValue: parsedAmount,
  })

  useEffect(() => {
    setRouteSummary(routeSummary)
  }, [routeSummary, setRouteSummary])

  return (
    <SwapFormContextProvider
      slippage={slippage}
      routeSummary={routeSummary}
      typedValue={typedValue}
      recipient={recipient}
      isStablePairSwap={isStablePairSwap}
      isCorrelatedPair={isCorrelatedPair}
      isAdvancedMode={isDegenMode}
    >
      <Box sx={{ flexDirection: 'column', gap: '16px', display: hidden ? 'none' : 'flex' }}>
        <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
          <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
            {omniView ? <NetworkSelector chainId={chainId} /> : null}

            <Flex flexDirection="column" sx={{ gap: '0.5rem' }}>
              <InputCurrencyPanel
                wrapType={wrapType}
                typedValue={typedValue}
                setTypedValue={onUserInput}
                currencyIn={currencyIn}
                currencyOut={currencyOut}
                balanceIn={balanceIn}
                onChangeCurrencyIn={onChangeCurrencyIn}
                customChainId={customChainId}
              />

              <ReverseTokenSelectionButton
                onClick={() => {
                  currencyIn && onChangeCurrencyOut(currencyIn)
                  routeSummary && onUserInput(routeSummary.parsedAmountOut.toExact())
                }}
              />

              <OutputCurrencyPanel
                wrapType={wrapType}
                parsedAmountIn={parsedAmount}
                parsedAmountOut={routeSummary?.parsedAmountOut}
                currencyIn={currencyIn}
                currencyOut={currencyOut}
                amountOutUsd={routeSummary?.amountOutUsd}
                onChangeCurrencyOut={onChangeCurrencyOut}
                customChainId={customChainId}
              />
            </Flex>

            {isDegenMode && !isWrapOrUnwrap && (
              <AddressInputPanel id="recipient" value={recipient} onChange={setRecipient} />
            )}
            <SlippageSettingGroup
              isWrapOrUnwrap={isWrapOrUnwrap}
              isStablePairSwap={isStablePairSwap}
              onOpenGasToken={onOpenGasToken}
              isCorrelatedPair={isCorrelatedPair}
            />
            <FeeControlGroup />
          </Flex>
        </Wrapper>
        <Flex flexDirection="column" style={{ gap: '1.25rem' }}>
          <PriceImpactNote priceImpact={routeSummary?.priceImpact} isDegenMode={isDegenMode} showLimitOrderLink />
          <MultichainKNCNote currencyIn={currencyIn} currencyOut={currencyOut} />

          {!isWrapOrUnwrap && (
            <TradeSummary
              routeSummary={routeSummary}
              slippage={slippage}
              disableRefresh={!parsedAmount || parsedAmount.equalTo(0) || isProcessingSwap}
              refreshCallback={getRoute}
            />
          )}

          <SwapActionButton
            isGettingRoute={isGettingRoute}
            parsedAmountFromTypedValue={parsedAmount}
            balanceIn={balanceIn}
            balanceOut={balanceOut}
            isDegenMode={isDegenMode}
            typedValue={typedValue}
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            wrapInputError={wrapInputError}
            wrapType={wrapType}
            routeSummary={routeSummary}
            isProcessingSwap={isProcessingSwap}
            setProcessingSwap={setProcessingSwap}
            onWrap={onWrap}
            buildRoute={buildRoute}
            swapInputError={swapInputError}
            customChainId={customChainId}
          />
        </Flex>
      </Box>
    </SwapFormContextProvider>
  )
}

export default SwapForm
