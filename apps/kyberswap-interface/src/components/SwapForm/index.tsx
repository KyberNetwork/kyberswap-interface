import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseGetRouteResponse } from 'services/route/utils'
import { useGetHoneypotInfoQuery } from 'services/tokenCatalog'

import AddressInputPanel from 'components/AddressInputPanel'
import { NotificationType } from 'components/Announcement/type'
import FeeControlGroup from 'components/FeeControlGroup'
import WarningIcon from 'components/Icons/WarningIcon'
import { NetworkSelector } from 'components/NetworkSelector'
import ERC8056Info, { useERC8056SwapInfo } from 'components/SwapForm/ERC8056Info'
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
import { SAFE_APP_CLIENT_ID } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { getERC8056RawTypedValue, useERC8056DisplayTypedValue } from 'hooks/useERC8056Token'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { useNotify } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { DetailedRouteSummary } from 'types/route'
import { cn } from 'utils/cn'
import { isInSafeApp } from 'utils/common'

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
}

const SwapForm: React.FC<SwapFormProps> = props => {
  const notify = useNotify()
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
  } = props

  const { chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
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

  const handleChangeCurrencyIn = useCallback(
    (c: Currency) => {
      trackingHandler(TRACKING_EVENT_TYPE.TOKEN_SELECTED, {
        token_symbol: c.symbol,
        token_address: c.isNative ? 'NATIVE' : c.wrapped?.address,
        token_position: 'input',
        paired_token: currencyOut?.symbol,
        chain: networkInfo.name,
      })
      onChangeCurrencyIn(c)
    },
    [onChangeCurrencyIn, trackingHandler, currencyOut?.symbol, networkInfo.name],
  )

  const handleChangeCurrencyOut = useCallback(
    (c: Currency) => {
      trackingHandler(TRACKING_EVENT_TYPE.TOKEN_SELECTED, {
        token_symbol: c.symbol,
        token_address: c.isNative ? 'NATIVE' : c.wrapped?.address,
        token_position: 'output',
        paired_token: currencyIn?.symbol,
        chain: networkInfo.name,
      })
      onChangeCurrencyOut(c)
    },
    [onChangeCurrencyOut, trackingHandler, currencyIn?.symbol, networkInfo.name],
  )

  // Amount Entered tracking (debounced)
  const debouncedTypedValue = useDebounce(typedValue, 1000)
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

  const prefillInputAmount = searchParams.get('input')
  const handledPrefillInputRef = useRef<string | null>(null)

  useEffect(() => {
    const inputAmount = prefillInputAmount?.trim()
    if (!inputAmount) {
      handledPrefillInputRef.current = null
      return
    }
    if (handledPrefillInputRef.current === inputAmount) return
    handledPrefillInputRef.current = inputAmount

    const isValidRegex = /^\d*\.?\d*$/.test(inputAmount)
    if (isValidRegex && Number.isFinite(Number(inputAmount)) && !Number.isNaN(Number(inputAmount))) {
      updateInputAmount(Field.INPUT, inputAmount)
    } else {
      notify({
        title: 'Invalid input amount in. Please enter another amount',
        type: NotificationType.WARNING,
      })
    }
  }, [prefillInputAmount, updateInputAmount, notify])

  const parsedAmount = useParsedAmount(currencyIn, typedValue)
  const erc8056Info = useERC8056SwapInfo({ chainId, currencyIn, currencyOut, balanceIn, balanceOut })
  const displayTypedValue = useERC8056DisplayTypedValue(erc8056Info.inputInfo, typedValue)
  const handleUserInput = useCallback(
    (value: string) => {
      updateInputAmount(Field.INPUT, getERC8056RawTypedValue(erc8056Info.inputInfo, value))
    },
    [erc8056Info.inputInfo, updateInputAmount],
  )

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
    intendedFeeConfig,
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

  useEffect(() => {
    setRouteSummary(routeSummary)
  }, [routeSummary, setRouteSummary])

  const { data: honeypotData } = useGetHoneypotInfoQuery(
    { chainId, address: currencyOut?.wrapped.address.toLowerCase() ?? '' },
    { skip: !currencyOut?.wrapped.address },
  )
  const honeypot = honeypotData?.data ?? null

  return (
    <SwapFormContextProvider
      slippage={slippage}
      routeSummary={routeSummary}
      typedValue={typedValue}
      displayTypedValue={displayTypedValue}
      recipient={recipient}
      isAdvancedMode={isDegenMode}
    >
      <div className={cn('flex-col gap-4', hidden ? 'hidden' : 'flex')}>
        <div id={TutorialIds.SWAP_FORM_CONTENT} className="relative z-[1] bg-background">
          <div className="flex flex-col gap-3">
            {omniView ? <NetworkSelector chainId={chainId} /> : null}

            <div className="flex flex-col gap-2">
              <InputCurrencyPanel
                wrapType={wrapType}
                typedValue={displayTypedValue}
                setTypedValue={onUserInput}
                onUserInput={handleUserInput}
                currencyIn={currencyIn}
                currencyOut={currencyOut}
                balanceIn={balanceIn}
                balanceText={erc8056Info.input.balanceText}
                highlightToken={erc8056Info.input.isScaled}
                onChangeCurrencyIn={handleChangeCurrencyIn}
                customChainId={customChainId}
              />

              <ReverseTokenSelectionButton
                className="z-20 -my-4 mx-auto"
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.TOKEN_PAIR_REVERSED, {
                    from_token: currencyIn?.symbol,
                    to_token: currencyOut?.symbol,
                    new_from_token: currencyOut?.symbol,
                    new_to_token: currencyIn?.symbol,
                    chain: networkInfo.name,
                  })
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
                balanceText={erc8056Info.output.balanceText}
                highlightToken={erc8056Info.output.isScaled}
                onChangeCurrencyOut={handleChangeCurrencyOut}
                customChainId={customChainId}
                routeLoading={routeLoading}
              />
            </div>

            <ERC8056Info tokens={erc8056Info.tokens} />

            {isDegenMode && !isWrapOrUnwrap && (
              <AddressInputPanel id="recipient" value={recipient} onChange={setRecipient} />
            )}
            <SlippageSettingGroup isWrapOrUnwrap={isWrapOrUnwrap} />
            {!isWrapOrUnwrap && <FeeControlGroup />}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <MultichainKNCNote currencyIn={currencyIn} currencyOut={currencyOut} />

          {!isWrapOrUnwrap && (
            <TradeSummary
              routeSummary={routeSummary}
              routeLoading={routeLoading}
              slippage={slippage}
              disableRefresh={!parsedAmount || parsedAmount.equalTo(0) || isProcessingSwap}
              refreshCallback={getRoute}
              isFeeTampered={isFeeTampered}
            />
          )}

          {honeypot?.isFOT || honeypot?.isHoneypot ? (
            <div className="flex gap-2 rounded-2xl bg-warning-30 px-3 py-2.5">
              <WarningIcon className="text-warning" size={20} />
              <span className="flex-1 text-sm">
                {honeypot.isHoneypot ? (
                  <Trans>
                    Our simulation detects that {currencyOut?.symbol} token can not be sold immediately or has an
                    extremely high sell fee after being bought, please check further before buying!
                  </Trans>
                ) : (
                  <Trans>
                    Our simulation detects that {currencyOut?.symbol} has {honeypot.tax * 100}% fee on transfer, please
                    check further before buying.
                  </Trans>
                )}
              </span>
            </div>
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
        </div>
      </div>
    </SwapFormContextProvider>
  )
}

export default SwapForm
