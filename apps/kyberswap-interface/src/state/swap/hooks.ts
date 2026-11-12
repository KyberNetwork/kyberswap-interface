import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCheckPairQuery } from 'services/tokenCatalog'

import { APP_PATHS, ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { isSupportedChainId } from 'constants/networks'
import { DEFAULT_OUTPUT_TOKENS, NativeCurrencies, STABLE_TOKENS } from 'constants/tokens'
import { PAIR_CATEGORY } from 'constants/trade'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useAllTokens, useAllTokensWithLoading, useCurrencyLookup, useStableCoins } from 'hooks/useTokens'
import { useAppSelector } from 'state/hooks'
import { AppDispatch, AppState } from 'state/index'
import { Field, resetSelectCurrency, setRecipient, setTrade, typeInput } from 'state/swap/actions'
import { SwapState } from 'state/swap/reducer'
import { useDegenModeManager } from 'state/user/hooks'
import { isAddress } from 'utils/address'
import { Aggregator } from 'utils/aggregator'
import { parseFraction } from 'utils/numbers'
import { getSwapIntentFromPath, getTradeProductPath, isSwapLikePath, resolveSwapIntentPair } from 'utils/routes'
import { getChainIdFromSlug } from 'utils/string'
import { getEmbeddedSwapPair, getSwapChains } from 'utils/swapFlow'

interface ParsedUrlQuery {
  [key: string]: string | string[]
}

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onPairSelection: (currencyIn: Currency, currencyOut: Currency) => void
  onSwitchTokens: () => void
  onSwitchTokensV2: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
  onResetSelectCurrency: (field: Field) => void
  onChangeTrade: (trade: Aggregator | undefined) => void
} {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()

  const navigate = useNavigate()
  const { fromCurrency, toCurrency } = useCurrencyFromUrl()

  const allTokens = useAllTokens()

  // How the pair route names a currency: by symbol when it is native or whitelisted, else by address.
  const getUrlCurrencyId = useCallback(
    (currency: Currency) =>
      allTokens[currency?.wrapped.address || '']?.isWhitelisted || currency.isNative
        ? currency.symbol?.toLowerCase() || ''
        : currency.address.toLowerCase(),
    [allTokens],
  )

  const navigateToPair = useCallback(
    (from: string, to: string) => {
      // Preserve existing search params
      const currentSearchParams = new URLSearchParams(window.location.search)
      const searchString = currentSearchParams.toString()

      const newPath = `${getTradeProductPath(window.location.pathname)}/${
        NETWORKS_INFO[chainId].route
      }/${encodeURIComponent(from)}-to-${encodeURIComponent(to)}`

      navigate(searchString ? `${newPath}?${searchString}` : newPath)
    },
    [chainId, navigate],
  )

  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      let f = fromCurrency,
        to = toCurrency

      if (field === Field.INPUT) {
        const newFrom = getUrlCurrencyId(currency)
        f = newFrom
        if (
          newFrom === toCurrency ||
          currency.symbol?.toLowerCase() === toCurrency ||
          (!currency.isNative && currency.address.toLowerCase() === toCurrency)
        ) {
          to = fromCurrency
        }
      } else {
        const newTo = getUrlCurrencyId(currency)
        to = newTo
        if (
          newTo === f ||
          currency.symbol?.toLowerCase() === fromCurrency ||
          (!currency.isNative && currency.address.toLowerCase() === fromCurrency)
        ) {
          f = toCurrency
        }
      }

      navigateToPair(f, to)
    },
    [fromCurrency, toCurrency, getUrlCurrencyId, navigateToPair],
  )

  /**
   * Sets both sides in one navigation. Each single-side setter builds its route from the pair as the
   * URL held it when the handler was made, so two in a row would have the second undo the first.
   */
  const onPairSelection = useCallback(
    (currencyIn: Currency, currencyOut: Currency) =>
      navigateToPair(getUrlCurrencyId(currencyIn), getUrlCurrencyId(currencyOut)),
    [getUrlCurrencyId, navigateToPair],
  )

  const [isDegenMode] = useDegenModeManager()

  useEffect(() => {
    if (isDegenMode) dispatch(setRecipient({ recipient: null }))
  }, [isDegenMode, dispatch])

  const onResetSelectCurrency = useCallback(
    (field: Field) => {
      dispatch(
        resetSelectCurrency({
          field,
        }),
      )
    },
    [dispatch],
  )

  const onSwitchTokens = useCallback(() => {
    navigate(
      `${getTradeProductPath(window.location.pathname)}/${
        NETWORKS_INFO[chainId].route
      }/${toCurrency}-to-${fromCurrency}`,
    )
  }, [fromCurrency, toCurrency, navigate, chainId])

  const onSwitchTokensV2 = useCallback(() => {
    navigate(
      `${getTradeProductPath(window.location.pathname)}/${
        NETWORKS_INFO[chainId].route
      }/${toCurrency}-to-${fromCurrency}`,
    )
  }, [fromCurrency, toCurrency, navigate, chainId])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch],
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch],
  )

  const onChangeTrade = useCallback(
    (trade: Aggregator | undefined) => {
      dispatch(setTrade({ trade }))
    },
    [dispatch],
  )

  return {
    onSwitchTokens,
    onSwitchTokensV2,
    onCurrencySelection,
    onPairSelection,
    onUserInput,
    onChangeRecipient,
    onResetSelectCurrency, // deselect token in select input: (use cases: remove "imported token")
    onChangeTrade,
  }
}

// try to parse a user entered amount for a given token
export function tryParseAmount<T extends Currency>(
  value?: string,
  currency?: T,
  scaleDecimals = true,
): CurrencyAmount<T> | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseFraction(value)
      .multiply(scaleDecimals ? 10 ** currency.decimals : 1)
      .toFixed(0)

    if (typedValueParsed === '0') return undefined
    const result = CurrencyAmount.fromRawAmount(currency, typedValueParsed)
    return result
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "%s"`, value, error)
  }
  // necessary for all paths to return a value
  return undefined
}

function parseCurrencyFromURLParameter(urlParam: any, chainId: ChainId): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(chainId, urlParam)
    if (valid) return valid
    return NativeCurrencies[chainId].symbol as string
  }
  return NativeCurrencies[chainId].symbol ?? ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any, chainId: ChainId): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(chainId, recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToSwapState(
  parsedQs: ParsedUrlQuery,
  chainId: ChainId,
  isMatchPath: boolean,
): SwapState & {
  [Field.INPUT]: {
    currencyId: string
  }
  [Field.OUTPUT]: {
    currencyId: string
  }
} {
  let inputCurrency = parseCurrencyFromURLParameter(isMatchPath ? parsedQs.inputCurrency : null, chainId)
  let outputCurrency = parseCurrencyFromURLParameter(isMatchPath ? parsedQs.outputCurrency : null, chainId)
  if (inputCurrency === outputCurrency) {
    if (typeof parsedQs.outputCurrency === 'string') {
      inputCurrency = ''
    } else {
      outputCurrency = ''
    }
  }

  const recipient = validatedRecipient(parsedQs.recipient, chainId)
  const typedValue = (parsedQs.amountIn ?? '') as string
  return {
    [Field.INPUT]: {
      currencyId: inputCurrency,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency,
    },
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    recipient,
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
    isSelectTokenManually: false,
    typedValue,
  }
}

export const useCurrencyFromUrl = () => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const { pathname } = useLocation()
  const { currency: currencyParam, token: tokenParam, network } = useParams()
  const [params] = useSearchParams()
  const embedded = pathname.startsWith(APP_PATHS.PARTNER_SWAP) || pathname.startsWith(APP_PATHS.USER_SWAP)
  const embeddedChain = Number(params.get('chainId'))
  const chainId =
    getChainIdFromSlug(network) ??
    (embedded ? (isSupportedChainId(embeddedChain) ? embeddedChain : ChainId.MAINNET) : walletChainId)
  const isSwapPage =
    isSwapLikePath(pathname) ||
    pathname === APP_PATHS.CROSS_CHAIN ||
    pathname === APP_PATHS.KYBER_CROSS ||
    pathname.startsWith(APP_PATHS.PARTNER_SWAP) ||
    pathname.startsWith(APP_PATHS.USER_SWAP)
  const { fromChain, toChain } = getSwapChains(isSwapPage ? params : new URLSearchParams(), chainId)

  const pathPair = useMemo(() => {
    const swapIntent = getSwapIntentFromPath(pathname)
    const nativeToken = NativeCurrencies[chainId]
    const stableCounterSymbol = STABLE_TOKENS[chainId]?.symbol
    const wrappedNative = WETH[chainId]

    if (swapIntent && tokenParam && nativeToken.symbol && stableCounterSymbol) {
      return resolveSwapIntentPair({
        intent: swapIntent,
        subjectToken: tokenParam,
        nativeToken: nativeToken.symbol,
        stableCounterToken: stableCounterSymbol,
        nativeTokenAliases: [ETHER_ADDRESS, ZERO_ADDRESS],
        wrappedNativeAliases: [wrappedNative?.address, wrappedNative?.symbol].filter((alias): alias is string =>
          Boolean(alias),
        ),
      })
    }

    const matches = currencyParam?.split('-to-')
    const fromCurrency = matches?.[0]?.toLowerCase() || ''
    let toCurrency = matches?.[1]?.toLowerCase() || ''
    const nativeSymbol = NativeCurrencies[chainId].symbol?.toLowerCase() || 'eth'
    const defaultOutput = DEFAULT_OUTPUT_TOKENS[chainId]?.symbol?.toLowerCase() || ''

    if (!fromCurrency && !toCurrency)
      return {
        fromCurrency: nativeSymbol,
        toCurrency: defaultOutput,
      }

    if (fromCurrency === toCurrency) {
      toCurrency = ''
    }

    return {
      fromCurrency: fromCurrency || (toCurrency === nativeSymbol ? defaultOutput : nativeSymbol),
      toCurrency: toCurrency || defaultOutput,
    }
  }, [chainId, currencyParam, pathname, tokenParam])

  if (embedded) {
    const pair = getEmbeddedSwapPair(params)
    return {
      fromCurrency: pair.tokenIn,
      toCurrency: pair.tokenOut,
      inputChain: pair.fromChain,
      outputChain: pair.toChain,
    }
  }

  return {
    fromCurrency: isSwapPage
      ? params.get('tokenIn') ??
        (params.has('from')
          ? typeof fromChain === 'number'
            ? NativeCurrencies[fromChain].symbol || ''
            : ''
          : pathPair.fromCurrency)
      : pathPair.fromCurrency,
    toCurrency: isSwapPage
      ? params.get('tokenOut') ??
        (params.has('to')
          ? typeof toChain === 'number'
            ? NativeCurrencies[toChain].symbol || ''
            : ''
          : pathPair.toCurrency)
      : pathPair.toCurrency,
    inputChain: fromChain,
    outputChain: toChain,
  }
}

/** Resolves one URL token on its selected chain, including symbol lookup and configured defaults.
 * Missing EVM metadata can be loading; non-EVM IDs are left to the cross-chain resolver. */
const useCurrencyById = (currencyId: string, selectedChain: ReturnType<typeof getSwapChains>['fromChain']) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = typeof selectedChain === 'number' ? selectedChain : walletChainId
  const { tokens: allTokens, isLoading: isListLoading } = useAllTokensWithLoading(false, chainId)
  const defaultOutputToken = DEFAULT_OUTPUT_TOKENS[chainId]
  const stableCounterToken = STABLE_TOKENS[chainId]
  const normalizedCurrencyId = currencyId.toLowerCase()

  const token = useMemo(() => {
    return Object.values(allTokens).find(
      item =>
        item?.symbol?.toLowerCase() === normalizedCurrencyId || item.address.toLowerCase() === normalizedCurrencyId,
    )
  }, [allTokens, normalizedCurrencyId])

  const { currency, isLoading: isCurrencyLoading } = useCurrencyLookup(token?.address ?? currencyId, chainId, token)
  const mappedToken = [defaultOutputToken, stableCounterToken].find(item => {
    return (
      item &&
      (item.symbol?.toLowerCase() === normalizedCurrencyId || item.address.toLowerCase() === normalizedCurrencyId)
    )
  })

  if (typeof selectedChain !== 'number') return { currency: undefined, isLoading: false }
  const requestedId = token?.address.toLowerCase() || normalizedCurrencyId
  const matchesNative =
    currency?.equals(NativeCurrencies[chainId]) &&
    [NativeCurrencies[chainId].symbol?.toLowerCase(), 'eth', ETHER_ADDRESS.toLowerCase()].includes(requestedId)
  const resolvedCurrency =
    currency?.chainId === selectedChain && (currency.wrapped.address.toLowerCase() === requestedId || matchesNative)
      ? currency
      : mappedToken
  return {
    currency: resolvedCurrency,
    isLoading:
      !!currencyId && !resolvedCurrency && (isCurrencyLoading || (!isAddress(chainId, currencyId) && isListLoading)),
  }
}

export const useInputCurrency = () => {
  const { fromCurrency, inputChain } = useCurrencyFromUrl()
  return useCurrencyById(fromCurrency, inputChain).currency
}

/**
 * Whether two currency ids from the URL name the same thing. The ids are compared as written when
 * the pair is read, which only catches an exact repeat — but one currency answers to several ids:
 * its address, its symbol, and, where the native asset is an ERC-20 token, the native sentinel too.
 * A pair like `0xEeee…-to-usdc` therefore passes that check and resolves to one token on both sides.
 */
const isSamePair = (input: Currency | null | undefined, output: Currency | null | undefined) =>
  !!input && !!output && input.equals(output)

/** Reads the URL pair once and resolves both sides with loading status.
 * A resolved same-token pair intentionally clears output rather than selecting a default again. */
export const useSwapCurrencyResolution = () => {
  const pair = useCurrencyFromUrl()
  const { fromCurrency, toCurrency, inputChain, outputChain } = pair
  const input = useCurrencyById(fromCurrency, inputChain)
  const output = useCurrencyById(toCurrency, outputChain)
  const samePair = isSamePair(input.currency, output.currency)
  return {
    ...pair,
    currencyIn: input.currency,
    currencyOut: samePair ? undefined : output.currency,
    isInputCurrencyLoading: input.isLoading,
    isOutputCurrencyLoading: !samePair && output.isLoading,
  }
}

export const useOutputCurrency = () => useSwapCurrencyResolution().currencyOut

export type PairTokens = { tokenIn: string; tokenOut: string }

export const usePairCategory = (customChainId?: ChainId, pair?: PairTokens): PAIR_CATEGORY => {
  const { chainId } = useActiveWeb3React()
  const inputCurrency = useInputCurrency()
  const outputCurrency = useOutputCurrency()
  const inputAddress = pair ? pair.tokenIn : inputCurrency?.wrapped.address
  const outputAddress = pair ? pair.tokenOut : outputCurrency?.wrapped.address

  const { data } = useCheckPairQuery(
    {
      chainId: customChainId || inputCurrency?.chainId || chainId,
      tokenIn: inputAddress || '',
      tokenOut: outputAddress || '',
    },
    {
      skip: !inputAddress || !outputAddress || inputCurrency?.chainId !== outputCurrency?.chainId,
    },
  )

  return data?.data.category || PAIR_CATEGORY.EXOTIC
}
export const useDefaultSlippageByPair = (customChainId?: ChainId, pair?: PairTokens) => {
  const cat = usePairCategory(customChainId, pair)

  switch (cat) {
    case PAIR_CATEGORY.STABLE:
      return 1
    case PAIR_CATEGORY.CORRELATED:
      return 5
    // case PAIR_CATEGORY.EXOTIC:
    // return 100
    case PAIR_CATEGORY.HIGH_VOLATILITY:
      return 150
    default:
      return 50
  }
}

export const useCheckStablePairSwap = () => {
  const { chainId } = useActiveWeb3React()
  const inputCurrency = useInputCurrency()
  const outputCurrency = useOutputCurrency()
  const { isStableCoin } = useStableCoins(inputCurrency?.chainId || chainId)

  const isStablePairSwap =
    inputCurrency?.chainId === outputCurrency?.chainId &&
    isStableCoin(inputCurrency?.wrapped.address) &&
    isStableCoin(outputCurrency?.wrapped.address)

  return isStablePairSwap
}

export const useSwitchPairToLimitOrder = () => {
  const navigate = useNavigate()

  const inputCurrency = useInputCurrency()
  const inputCurrencyId = inputCurrency?.wrapped.address
  const outputCurrencyId = useOutputCurrency()?.wrapped.address

  const { networkInfo } = useActiveWeb3React()

  const route = NETWORKS_INFO[inputCurrency?.chainId || networkInfo.chainId]?.route || networkInfo.route
  return useCallback(
    () => navigate(`${APP_PATHS.LIMIT}/${route}/${inputCurrencyId}-to-${outputCurrencyId}`),
    [route, inputCurrencyId, outputCurrencyId, navigate],
  )
}

export const usePermitData: (
  address?: string,
) => { rawSignature?: string; deadline?: number; value?: string; errorCount?: number } | null = address => {
  const { chainId, account } = useActiveWeb3React()
  const permitData = useAppSelector(state => state.swap.permitData)

  return address && account && permitData ? permitData[account]?.[chainId]?.[address] : null
}
