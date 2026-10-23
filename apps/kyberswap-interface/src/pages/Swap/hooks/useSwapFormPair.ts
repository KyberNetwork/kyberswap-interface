import { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { type Chain, type Currency, NonEvmChain, type NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { Field } from 'state/swap/actions'
import { useSwapCurrencyResolution } from 'state/swap/hooks'
import { currencyId } from 'utils/currencyId'
import { SwapPair, getDefaultSwapTokenId, getTradeLocation, isCrossChainPair } from 'utils/swapFlow'

const getSelectedTokenId = (currency: Currency) => {
  if ('isNative' in currency) return currencyId(currency, currency.chainId)
  if ('assetId' in currency) return currency.assetId
  if ('id' in currency) return currency.id
  return currency.symbol
}

/**
 * Owns pair selection/reversal and commits both sides in one navigation.
 * Selected metadata bridges the interval before URL lookup catches up, but is used only while ID/chain still match.
 * URL resolution owns loading; available selected metadata suppresses its loading placeholder.
 */
export const useSwapFormPair = () => {
  const navigate = useNavigate()
  const {
    fromCurrency,
    toCurrency,
    inputChain,
    outputChain,
    currencyIn: resolvedInput,
    currencyOut: resolvedOutput,
    isInputCurrencyLoading,
    isOutputCurrencyLoading,
  } = useSwapCurrencyResolution()
  const isCrossChain = isCrossChainPair(inputChain, outputChain)
  const [params] = useSearchParams()
  const [selected, setSelected] = useState<{ currencyIn?: EvmCurrency; currencyOut?: EvmCurrency }>({})
  const matches = (currency: EvmCurrency | undefined, id: string, chain: Chain) =>
    currency?.chainId === chain &&
    [currencyId(currency, currency.chainId).toLowerCase(), currency.symbol?.toLowerCase()].includes(id.toLowerCase())
  const currencyIn = matches(selected.currencyIn, fromCurrency, inputChain) ? selected.currencyIn : resolvedInput
  const selectedOutput = matches(selected.currencyOut, toCurrency, outputChain) ? selected.currencyOut : resolvedOutput
  const currencyOut = currencyIn && selectedOutput?.equals(currencyIn) ? undefined : selectedOutput

  // Resolve path-backed EVM tokens before writing query parameters; preserve non-EVM IDs verbatim.
  const inputId =
    inputChain === NonEvmChain.Bitcoin
      ? 'BTC'
      : currencyIn
      ? currencyId(currencyIn, currencyIn.chainId)
      : fromCurrency || getDefaultSwapTokenId(inputChain)
  const outputId =
    outputChain === NonEvmChain.Bitcoin
      ? 'BTC'
      : currencyOut
      ? currencyId(currencyOut, currencyOut.chainId)
      : toCurrency || getDefaultSwapTokenId(outputChain)
  const commitPair = (pair: SwapPair, currencies: typeof selected) => {
    setSelected(currencies)
    // Keep the legacy symbol/address convention on single-chain paths; cross-chain uses raw token IDs.
    const pathId = (currency: EvmCurrency | undefined, fallback: string) =>
      currency && (currency.isNative || (currency instanceof WrappedTokenInfo && currency.isWhitelisted))
        ? currency.symbol || fallback
        : fallback
    navigate(
      getTradeLocation(
        'swap',
        isCrossChainPair(pair.fromChain, pair.toChain)
          ? pair
          : {
              ...pair,
              tokenIn: pathId(currencies.currencyIn, pair.tokenIn),
              tokenOut: pathId(currencies.currencyOut, pair.tokenOut),
            },
        params,
      ),
    )
  }

  const select = (field: Field, currency: Currency, chain: Chain) => {
    const id = getSelectedTokenId(currency)
    const oppositeChain = field === Field.INPUT ? outputChain : inputChain
    const oppositeId = field === Field.INPUT ? outputId : inputId
    const sameToken =
      chain === oppositeChain &&
      (typeof chain === 'number' ? id.toLowerCase() === oppositeId.toLowerCase() : id === oppositeId)
    const evmCurrency = 'isNative' in currency ? currency : undefined
    if (field === Field.INPUT) {
      commitPair(
        {
          fromChain: chain,
          tokenIn: id,
          toChain: sameToken ? inputChain : outputChain,
          tokenOut: sameToken ? inputId : outputId,
        },
        { currencyIn: evmCurrency, currencyOut: sameToken ? currencyIn : currencyOut },
      )
    } else {
      commitPair(
        {
          fromChain: sameToken ? outputChain : inputChain,
          tokenIn: sameToken ? outputId : inputId,
          toChain: chain,
          tokenOut: id,
        },
        { currencyIn: sameToken ? currencyOut : currencyIn, currencyOut: evmCurrency },
      )
    }
  }

  const selectCurrency = (field: Field, currency: EvmCurrency) => select(field, currency, currency.chainId)
  const selectNonEvmCurrency = (field: Field, chain: NonEvmChain, currency: NonEvmCurrency) =>
    select(field, currency, chain)
  const reversePair = () => {
    commitPair(
      { fromChain: outputChain, tokenIn: outputId, toChain: inputChain, tokenOut: inputId },
      { currencyIn: currencyOut, currencyOut: currencyIn },
    )
  }

  return {
    isInputCurrencyLoading: !currencyIn && isInputCurrencyLoading,
    isOutputCurrencyLoading: !selectedOutput && isOutputCurrencyLoading,
    currencyIn,
    currencyOut,
    inputId,
    outputId,
    selectCurrency,
    selectNonEvmCurrency,
    reversePair,
    isCrossChain,
    inputChain,
    outputChain,
  }
}
