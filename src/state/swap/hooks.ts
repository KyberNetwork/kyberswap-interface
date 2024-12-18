import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { ParsedUrlQuery } from 'querystring'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { CORRELATED_COINS_ADDRESS, DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useCurrencyV2, useStableCoins } from 'hooks/Tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { useAppSelector } from 'state/hooks'
import { AppDispatch, AppState } from 'state/index'
import { Field, resetSelectCurrency, setRecipient, setTrade, typeInput } from 'state/swap/actions'
import { SwapState } from 'state/swap/reducer'
import { useDegenModeManager } from 'state/user/hooks'
import { isAddress, isAddressString } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { parseFraction } from 'utils/numbers'

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
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

  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      let f = fromCurrency,
        to = toCurrency

      const isWhitelisted = allTokens[currency?.wrapped.address || '']?.isWhitelisted

      if (field === Field.INPUT) {
        const newFrom =
          isWhitelisted || currency.isNative ? currency.symbol?.toLowerCase() || '' : currency.address.toLowerCase()
        f = newFrom
        if (newFrom === toCurrency || currency.symbol?.toLowerCase() === toCurrency) {
          to = fromCurrency
        }
      } else {
        const newTo =
          isWhitelisted || currency.isNative ? currency.symbol?.toLowerCase() || '' : currency.address.toLowerCase()
        to = newTo
        if (newTo === f || currency?.symbol?.toLowerCase() === fromCurrency) {
          f = toCurrency
        }
      }

      navigate(
        `/${window.location.pathname.startsWith('/limit') ? 'limit' : 'swap'}/${
          NETWORKS_INFO[chainId].route
        }/${encodeURIComponent(f)}-to-${encodeURIComponent(to)}`,
      )
    },
    [fromCurrency, chainId, toCurrency, navigate, allTokens],
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
      `/${window.location.pathname.startsWith('/limit') ? 'limit' : 'swap'}/${
        NETWORKS_INFO[chainId].route
      }/${toCurrency}-to-${fromCurrency}`,
    )
  }, [fromCurrency, toCurrency, navigate, chainId])

  const onSwitchTokensV2 = useCallback(() => {
    navigate(
      `/${window.location.pathname.startsWith('/limit') ? 'limit' : 'swap'}/${
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
  const { chainId } = useActiveWeb3React()
  const { currency: currencyParam } = useParams()

  return useMemo(() => {
    const matches = currencyParam?.split('-to-')
    const fromCurrency = matches?.[0]?.toLowerCase() || ''
    let toCurrency = matches?.[1]?.toLowerCase() || ''
    const nativeSymbol = NativeCurrencies[chainId].symbol?.toLowerCase() || 'eth'
    const defaultOutput = DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId]?.symbol?.toLowerCase() || ''

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
  }, [currencyParam, chainId])
}

export const useInputCurrency = () => {
  const { fromCurrency } = useCurrencyFromUrl()
  const allTokens = useAllTokens()

  const token = useMemo(() => {
    return Object.values(allTokens).find(
      item =>
        item?.symbol?.toLowerCase() === fromCurrency.toLowerCase() ||
        item.address.toLowerCase() === fromCurrency.toLowerCase(),
    )
  }, [allTokens, fromCurrency])

  const inputCurrency = useCurrencyV2(token ? token.address : fromCurrency)
  return inputCurrency || undefined
}
export const useOutputCurrency = () => {
  const { toCurrency } = useCurrencyFromUrl()
  const allTokens = useAllTokens()

  const token = useMemo(() => {
    return Object.values(allTokens).find(
      item =>
        item?.symbol?.toLowerCase() === toCurrency.toLowerCase() ||
        item.address.toLowerCase() === toCurrency.toLowerCase(),
    )
  }, [allTokens, toCurrency])

  const outputCurrency = useCurrencyV2(token ? token.address : toCurrency)

  return outputCurrency || undefined
}

export const useCheckStablePairSwap = () => {
  const { chainId } = useActiveWeb3React()
  const { isStableCoin } = useStableCoins(chainId)
  const inputCurrency = useInputCurrency()
  const outputCurrency = useOutputCurrency()

  const isStablePairSwap = isStableCoin(inputCurrency?.wrapped.address) && isStableCoin(outputCurrency?.wrapped.address)

  return isStablePairSwap
}

export const useCheckCorrelatedPair = (customIn?: string, customOut?: string) => {
  const { chainId } = useActiveWeb3React()

  const inputCurrency = useInputCurrency()
  const outputCurrency = useOutputCurrency()

  const inputCurrencyId = customIn || inputCurrency?.wrapped.address
  const outputCurrencyId = customOut || outputCurrency?.wrapped.address

  const inputAddress =
    NativeCurrencies[chainId].symbol === inputCurrencyId
      ? NativeCurrencies[chainId].wrapped.address
      : isAddressString(inputCurrencyId)

  const outputAddress =
    NativeCurrencies[chainId].symbol === outputCurrencyId
      ? NativeCurrencies[chainId].wrapped.address
      : isAddressString(outputCurrencyId)

  return CORRELATED_COINS_ADDRESS[chainId].some(pair => pair.includes(inputAddress) && pair.includes(outputAddress))
}

export const useSwitchPairToLimitOrder = () => {
  const navigate = useNavigate()

  const inputCurrencyId = useInputCurrency()?.wrapped.address
  const outputCurrencyId = useOutputCurrency()?.wrapped.address

  const { networkInfo } = useActiveWeb3React()

  return useCallback(
    () => navigate(`${APP_PATHS.LIMIT}/${networkInfo.route}/${inputCurrencyId}-to-${outputCurrencyId}`),
    [networkInfo, inputCurrencyId, outputCurrencyId, navigate],
  )
}

export const usePermitData: (
  address?: string,
) => { rawSignature?: string; deadline?: number; value?: string; errorCount?: number } | null = address => {
  const { chainId, account } = useActiveWeb3React()
  const permitData = useAppSelector(state => state.swap.permitData)

  return address && account && permitData ? permitData[account]?.[chainId]?.[address] : null
}
