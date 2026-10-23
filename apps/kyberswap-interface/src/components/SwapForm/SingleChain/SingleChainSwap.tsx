import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseGetRouteResponse } from 'services/route/utils'

import AddressInputPanel from 'components/AddressInputPanel'
import FeeControlGroup from 'components/FeeControlGroup'
import { HoneypotWarning, useHoneypotWarning } from 'components/HoneypotWarning'
import { NetworkSelector } from 'components/NetworkSelector'
import { Stack } from 'components/Stack'
import ERC8056Info, { useERC8056SwapInfo } from 'components/SwapForm/CurrencyInput/ERC8056Info'
import InputCurrencyPanel from 'components/SwapForm/CurrencyInput/InputCurrencyPanel'
import OutputCurrencyPanel from 'components/SwapForm/CurrencyInput/OutputCurrencyPanel'
import MEVProtection from 'components/SwapForm/Settings/MEVProtection'
import SingleChainQuoteDetails from 'components/SwapForm/SingleChain/SingleChainQuoteDetails'
import SwapActionButton from 'components/SwapForm/SwapActionButton'
import { SwapFormContextProvider } from 'components/SwapForm/SwapFormContext'
import { SwapFormLayout } from 'components/SwapForm/SwapFormLayout'
import MultichainKNCNote from 'components/SwapForm/Warnings/MultichainKNCNote'
import PriceImpactNote from 'components/SwapForm/Warnings/PriceImpactNote'
import useBuildRoute from 'components/SwapForm/hooks/useBuildRoute'
import useGetInputError from 'components/SwapForm/hooks/useGetInputError'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import useSwapQuote from 'components/SwapForm/hooks/useSwapQuote'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { getERC8056DisplayAmount, useERC8056TypedInput } from 'hooks/useERC8056Token'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import type { NonEvmChain, NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { DetailedRouteSummary } from 'types/route'
import { SAFE_APP_CLIENT_ID, isInSafeApp } from 'utils/safeApp'

/** Single-chain quote/execution flow. Receives resolved currencies and metadata-loading flags from its caller;
 * route loading and transaction processing remain independent of token resolution. */
export type SingleChainSwapProps = {
  hidden: boolean

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  isInputCurrencyLoading?: boolean
  isOutputCurrencyLoading?: boolean

  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  onRouteChange: (route: DetailedRouteSummary | undefined) => void
  onRouteLoadingChange?: (loading: boolean) => void

  isDegenMode: boolean
  slippage: number
  transactionTimeout: number
  permit?: string

  onChangeCurrencyIn: (c: Currency) => void
  onChangeCurrencyOut: (c: Currency) => void
  onSelectNonEvmCurrencyIn?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  onSelectNonEvmCurrencyOut?: (chain: NonEvmChain, currency: NonEvmCurrency) => void
  chainSelectionMode?: 'wallet' | 'form'
  customChainId?: ChainId
  omniView?: boolean
}

const SingleChainSwap = (props: SingleChainSwapProps) => {
  const {
    hidden,
    currencyIn,
    currencyOut,
    isInputCurrencyLoading,
    isOutputCurrencyLoading,
    balanceIn,
    balanceOut,
    onRouteChange,
    onRouteLoadingChange,
    isDegenMode,
    slippage,
    transactionTimeout,
    permit,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    onSelectNonEvmCurrencyIn,
    onSelectNonEvmCurrencyOut,
    customChainId,
    chainSelectionMode,
    omniView,
  } = props

  const [searchParams] = useSearchParams()
  const { chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const chainId = customChainId || walletChainId
  const chainError =
    !MAINNET_NETWORKS.includes(chainId) || chainId === ChainId.BLAST ? t`Swap not supported on this chain` : undefined

  const [isProcessingSwap, setProcessingSwap] = useState(false)
  const { typedValue, onUserInput } = useSwapInputAmount(chainSelectionMode !== 'form')
  const [recipient, setRecipient] = useState<string | null>(null)
  const debouncedTypedValue = useDebounce(typedValue, 1000)

  const parsedAmount = useParsedAmount(currencyIn, typedValue)
  const erc8056Info = useERC8056SwapInfo({ chainId, currencyIn, currencyOut, balanceIn, balanceOut })
  const { displayTypedValue, onDisplayInput, onRawValue } = useERC8056TypedInput(
    erc8056Info.inputInfo,
    typedValue,
    onUserInput,
  )

  const {
    wrapType,
    inputError: wrapInputError,
    execute: onWrap,
  } = useWrapCallback(currencyIn, currencyOut, typedValue, false, customChainId)
  const isWrapOrUnwrap = wrapType !== WrapType.NOT_APPLICABLE

  const {
    refresh,
    result,
    isLoading: routeLoading,
    intendedFeeConfig,
  } = useSwapQuote({
    enabled: !chainError,
    isWrapOrUnwrap,
    currencyIn,
    currencyOut: currencyOut,
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
  const displayAmountOut = useMemo(
    () => getERC8056DisplayAmount(erc8056Info.outputInfo, routeSummary?.parsedAmountOut),
    [erc8056Info.outputInfo, routeSummary?.parsedAmountOut],
  )

  // Detect if a browser extension tampered with the fee params in the API request
  const isFeeTampered = useMemo(() => {
    const responseExtraFee = getRouteRawResponse?.data?.routeSummary?.extraFee
    if (!responseExtraFee) return false

    const intended = intendedFeeConfig.current
    const responseFeeReceiver = responseExtraFee.feeReceiver?.toLowerCase() || ''
    const intendedFeeReceiver = intended.feeReceiver?.toLowerCase() || ''

    // If API returned a feeReceiver that UI never intended to send
    if (responseFeeReceiver && responseFeeReceiver !== intendedFeeReceiver) return true
    // If API returned a feeAmount that UI never intended to send
    if (responseExtraFee.feeAmount && responseExtraFee.feeAmount !== intended.feeAmount) return true

    return false
  }, [getRouteRawResponse?.data?.routeSummary?.extraFee, intendedFeeConfig])

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

  const { message: honeypotWarning } = useHoneypotWarning({
    chainId: currencyOut?.chainId ?? chainId,
    tokenAddress: currencyOut?.wrapped.address,
    tokenSymbol: currencyOut?.symbol,
  })

  const handleChangeCurrencyIn = useCallback(
    (c: Currency) => {
      trackingHandler(TRACKING_EVENT_TYPE.TOKEN_SELECTED, {
        token_symbol: c.symbol,
        token_address: c.isNative ? 'NATIVE' : c.wrapped?.address,
        token_position: 'input',
        paired_token: currencyOut?.symbol,
        chain: NETWORKS_INFO[c.chainId].name,
      })
      onChangeCurrencyIn(c)
    },
    [onChangeCurrencyIn, trackingHandler, currencyOut?.symbol],
  )

  const handleChangeCurrencyOut = useCallback(
    (c: Currency) => {
      trackingHandler(TRACKING_EVENT_TYPE.TOKEN_SELECTED, {
        token_symbol: c.symbol,
        token_address: c.isNative ? 'NATIVE' : c.wrapped?.address,
        token_position: 'output',
        paired_token: currencyIn?.symbol,
        chain: NETWORKS_INFO[c.chainId].name,
      })
      onChangeCurrencyOut(c)
    },
    [onChangeCurrencyOut, trackingHandler, currencyIn?.symbol],
  )

  // Amount Entered tracking (debounced)
  useEffect(() => {
    if (debouncedTypedValue && Number(debouncedTypedValue) > 0 && currencyIn) {
      trackingHandler(TRACKING_EVENT_TYPE.AMOUNT_ENTERED, {
        token_symbol: currencyIn.symbol,
        token_address: currencyIn.isNative ? 'NATIVE' : currencyIn.wrapped?.address,
        amount: debouncedTypedValue,
        token_position: 'input',
        paired_token: currencyOut?.symbol,
        chain: networkInfo.name,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTypedValue])

  useEffect(() => {
    onRouteLoadingChange?.(Boolean(routeLoading || isInputCurrencyLoading || isOutputCurrencyLoading))
  }, [routeLoading, isInputCurrencyLoading, isOutputCurrencyLoading, onRouteLoadingChange])

  useEffect(() => () => onRouteLoadingChange?.(false), [onRouteLoadingChange])

  useEffect(() => {
    onRouteChange(routeSummary)
    return () => onRouteChange(undefined)
  }, [routeSummary, onRouteChange])

  return (
    <SwapFormContextProvider
      slippage={slippage}
      routeSummary={routeSummary}
      typedValue={typedValue}
      displayTypedValue={displayTypedValue}
      inputERC8056Info={erc8056Info.inputInfo}
      outputERC8056Info={erc8056Info.outputInfo}
      recipient={recipient}
      isAdvancedMode={isDegenMode}
    >
      <SwapFormLayout
        hidden={hidden}
        networkSelector={omniView ? <NetworkSelector chainId={chainId} /> : undefined}
        inputPanel={
          <InputCurrencyPanel
            currencyLoading={isInputCurrencyLoading}
            amountInUsd={routeSummary?.amountInUsd}
            wrapType={wrapType}
            typedValue={displayTypedValue}
            setTypedValue={onRawValue}
            onUserInput={onDisplayInput}
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            balanceIn={balanceIn}
            balanceText={erc8056Info.input.balanceText}
            highlightToken={erc8056Info.input.isScaled}
            onChangeCurrencyIn={handleChangeCurrencyIn}
            onSelectNonEvmCurrency={onSelectNonEvmCurrencyIn}
            customChainId={currencyIn?.chainId ?? customChainId}
            chainSelectionMode={chainSelectionMode}
          />
        }
        outputPanel={
          <OutputCurrencyPanel
            currencyLoading={isOutputCurrencyLoading}
            wrapType={wrapType}
            parsedAmountIn={parsedAmount}
            parsedAmountOut={displayAmountOut}
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            amountOutUsd={routeSummary?.amountOutUsd}
            balanceText={erc8056Info.output.balanceText}
            highlightToken={erc8056Info.output.isScaled}
            onChangeCurrencyOut={handleChangeCurrencyOut}
            onSelectNonEvmCurrency={onSelectNonEvmCurrencyOut}
            customChainId={currencyOut?.chainId ?? customChainId}
            chainSelectionMode={chainSelectionMode}
            routeLoading={routeLoading}
          />
        }
        tokenInfo={<ERC8056Info tokens={erc8056Info.tokens} />}
        recipient={
          isDegenMode && !isWrapOrUnwrap ? (
            <AddressInputPanel id="recipient" value={recipient} onChange={setRecipient} />
          ) : undefined
        }
        onReverse={() => {
          trackingHandler(TRACKING_EVENT_TYPE.TOKEN_PAIR_REVERSED, {
            from_token: currencyIn?.symbol,
            to_token: currencyOut?.symbol,
            new_from_token: currencyOut?.symbol,
            new_to_token: currencyIn?.symbol,
            chain: networkInfo.name,
          })
          currencyIn && onChangeCurrencyOut(currencyIn)
          routeSummary && onRawValue(routeSummary.parsedAmountOut.toExact())
        }}
        details={
          <Stack className="gap-2">
            <MultichainKNCNote currencyIn={currencyIn} currencyOut={currencyOut} />

            {!isWrapOrUnwrap && (
              <SingleChainQuoteDetails
                loading={routeLoading}
                routeSummary={routeSummary}
                slippage={slippage}
                refresh={refresh}
                isFeeTampered={isFeeTampered}
              />
            )}

            {!isWrapOrUnwrap && <FeeControlGroup />}
            <MEVProtection className="w-fit self-end" />
            <HoneypotWarning message={honeypotWarning} />

            <PriceImpactNote priceImpact={routeSummary?.priceImpact} isDegenMode={isDegenMode} showLimitOrderLink />
          </Stack>
        }
        action={
          <SwapActionButton
            chainError={chainError}
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
        }
      />
    </SwapFormContextProvider>
  )
}

export default SingleChainSwap
