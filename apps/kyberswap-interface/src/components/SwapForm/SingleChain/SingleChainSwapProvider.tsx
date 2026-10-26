import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ReactNode, createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseGetRouteResponse } from 'services/route/utils'

import useBuildRoute from 'components/SwapForm/hooks/useBuildRoute'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import { useSwapReviewSession } from 'components/SwapForm/hooks/useSwapReviewSession'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { SAFE_APP_CLIENT_ID, isInSafeApp } from 'utils/safeApp'

type SingleChainSwapConfig = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined
  isDegenMode: boolean
  slippage: number
  transactionTimeout: number
  permit?: string
  customChainId?: ChainId
  chainSelectionMode?: 'wallet' | 'form'
}

const useSingleChainSwap = ({
  currencyIn,
  currencyOut,
  isDegenMode,
  slippage,
  transactionTimeout,
  permit,
  customChainId,
  chainSelectionMode,
}: SingleChainSwapConfig) => {
  const [searchParams] = useSearchParams()
  const { chainId: walletChainId, account, walletKey } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const chainError =
    !MAINNET_NETWORKS.includes(chainId) || chainId === ChainId.BLAST ? t`Swap not supported on this chain` : undefined

  const { typedValue, onUserInput } = useSwapInputAmount(chainSelectionMode !== 'form')
  const [recipient, setRecipient] = useState<string | null>(null)
  const reviewIdentity = JSON.stringify([
    chainId,
    walletChainId,
    account,
    walletKey,
    currencyIn?.chainId,
    currencyIn?.wrapped.address,
    currencyIn?.isNative,
    currencyOut?.chainId,
    currencyOut?.wrapped.address,
    currencyOut?.isNative,
    typedValue,
    recipient,
    isDegenMode,
  ])
  const { review, openReview, rebuildReview, confirmReview, dismissReview } = useSwapReviewSession(reviewIdentity)
  const isProcessingSwap = review.phase !== 'closed'

  const parsedAmount = useParsedAmount(currencyIn, typedValue)
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
  } = useGetRoute({
    enabled: !chainError && !isWrapOrUnwrap,
    autoRefresh: true,
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
  // Detect if a browser extension tampered with the fee params in the API request
  const isFeeTampered = useMemo(() => {
    const responseExtraFee = getRouteRawResponse?.data?.routeSummary?.extraFee
    if (!responseExtraFee) return false

    const intended = intendedFeeConfig
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

  const previousSlippage = useRef(slippage)
  useLayoutEffect(() => {
    const changed = previousSlippage.current !== slippage
    previousSlippage.current = slippage

    if (changed) void rebuildReview(buildRoute)
  }, [slippage, rebuildReview, buildRoute])

  return {
    chainId,
    chainError,
    typedValue,
    onUserInput,
    recipient,
    onRecipientChange: setRecipient,
    parsedAmount,
    wrapType,
    wrapInputError,
    onWrap,
    isWrapOrUnwrap,
    refresh,
    routeLoading,
    isGettingRoute,
    routeSummary,
    isFeeTampered,
    buildRoute,
    review,
    openReview,
    confirmReview,
    dismissReview,
  }
}

const SingleChainSwapContext = createContext<
  (SingleChainSwapConfig & ReturnType<typeof useSingleChainSwap>) | undefined
>(undefined)

type ProviderProps = SingleChainSwapConfig & { children: ReactNode }

/** Coordinates the quote and its review pause at the common ancestor of the form and route panel. */
export const SingleChainSwapProvider = ({ children, ...config }: ProviderProps) => {
  const swap = useSingleChainSwap(config)
  return <SingleChainSwapContext.Provider value={{ ...config, ...swap }}>{children}</SingleChainSwapContext.Provider>
}

export const useSingleChainSwapContext = () => {
  const swap = useContext(SingleChainSwapContext)
  if (!swap) throw new Error('useSingleChainSwapContext must be used within SingleChainSwapProvider')
  return swap
}
