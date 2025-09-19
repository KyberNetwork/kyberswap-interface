import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import { parseGetRouteResponse } from 'services/route/utils'
import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import AddressInputPanel from 'components/AddressInputPanel'
import FeeControlGroup from 'components/FeeControlGroup'
import WarningIcon from 'components/Icons/WarningIcon'
import { NetworkSelector } from 'components/NetworkSelector'
import InputCurrencyPanel from 'components/SwapForm/InputCurrencyPanel'
import MultichainKNCNote from 'components/SwapForm/MultichainKNCNote'
import OutputCurrencyPanel from 'components/SwapForm/OutputCurrencyPanel'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import SwapActionButton from 'components/SwapForm/SwapActionButton'
import { SwapFormContextProvider } from 'components/SwapForm/SwapFormContext'
import TradeSummary from 'components/SwapForm/TradeSummary'
import useBuildRoute from 'components/SwapForm/hooks/useBuildRoute'
import useGetInputError from 'components/SwapForm/hooks/useGetInputError'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { Wrapper } from 'components/swapv2/styleds'
import { TOKEN_API_URL } from 'constants/env'
import { SAFE_APP_CLIENT_ID } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { DetailedRouteSummary } from 'types/route'
import { isInSafeApp } from 'utils'

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

  const {
    fetcher: getRoute,
    result,
    isLoading: routeLoading,
  } = useGetRoute({
    currencyIn,
    currencyOut,
    parsedAmount,
    isProcessingSwap,
    customChain: chainId,
    clientId: isInSafeApp ? SAFE_APP_CLIENT_ID : searchParams.get('clientId') || undefined,
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
    currencyIn,
    currencyOut,
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

  const theme = useTheme()

  const [honeypot, setHoneypot] = useState<{ isHoneypot: boolean; isFOT: boolean; tax: number } | null>(null)

  useEffect(() => {
    if (!currencyOut) return
    fetch(
      `${TOKEN_API_URL}/v1/public/tokens/honeypot-fot-info?address=${currencyOut.wrapped.address.toLowerCase()}&chainId=${chainId}`,
    )
      .then(res => res.json())
      .then(res => {
        setHoneypot(res.data)
      })
  }, [currencyOut, chainId])

  return (
    <SwapFormContextProvider
      slippage={slippage}
      routeSummary={routeSummary}
      typedValue={typedValue}
      recipient={recipient}
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
                routeLoading={routeLoading}
              />
            </Flex>

            {isDegenMode && !isWrapOrUnwrap && (
              <AddressInputPanel id="recipient" value={recipient} onChange={setRecipient} />
            )}
            <SlippageSettingGroup onOpenGasToken={onOpenGasToken} isWrapOrUnwrap={isWrapOrUnwrap} />
            <FeeControlGroup />
          </Flex>
        </Wrapper>
        <Flex flexDirection="column" style={{ gap: '1.25rem' }}>
          <MultichainKNCNote currencyIn={currencyIn} currencyOut={currencyOut} />

          {!isWrapOrUnwrap && (
            <TradeSummary
              routeSummary={routeSummary}
              routeLoading={routeLoading}
              slippage={slippage}
              disableRefresh={!parsedAmount || parsedAmount.equalTo(0) || isProcessingSwap}
              refreshCallback={getRoute}
            />
          )}

          {honeypot?.isFOT || honeypot?.isHoneypot ? (
            <Flex
              sx={{
                borderRadius: '1rem',
                background: rgba(theme.warning, 0.3),
                padding: '10px 12px',
                gap: '8px',
              }}
            >
              <WarningIcon color={theme.warning} size={20} />
              <Text fontSize={14} flex={1}>
                {honeypot.isHoneypot
                  ? `Our simulation detects that ${currencyOut?.symbol} token can not be sold immediately or has an extremely high sell fee after being bought, please check further before buying!`
                  : `Our simulation detects that ${currencyOut?.symbol} has ${
                      honeypot.tax * 100
                    }% fee on transfer, please check further before buying.`}
              </Text>
            </Flex>
          ) : null}

          <PriceImpactNote priceImpact={routeSummary?.priceImpact} isDegenMode={isDegenMode} showLimitOrderLink />

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
