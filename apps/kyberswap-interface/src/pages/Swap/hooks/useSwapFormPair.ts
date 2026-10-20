import { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useActiveWeb3React } from 'hooks'
import { type Chain, type Currency, NonEvmChain, type NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency } from 'state/swap/hooks'
import { currencyId } from 'utils/currencyId'
import { getDefaultSwapTokenId, getSwapChains } from 'utils/swapFlow'

const getSelectedTokenId = (currency: Currency) => {
  if ('isNative' in currency) return currencyId(currency, currency.chainId)
  if ('assetId' in currency) return currency.assetId
  if ('id' in currency) return currency.id
  return currency.symbol
}

/** Owns pair selection and reversal for both unified swap flows. */
export const useSwapFormPair = () => {
  const { chainId } = useActiveWeb3React()
  const resolvedInput = useInputCurrency()
  const resolvedOutput = useOutputCurrency()
  const [params, setParams] = useSearchParams()
  const { fromChain: inputChain, toChain: outputChain, isCrossChain } = getSwapChains(params, chainId)
  const [selected, setSelected] = useState<{ currencyIn?: EvmCurrency; currencyOut?: EvmCurrency }>({})
  const matches = (currency: EvmCurrency | undefined, id: string | null, chain: Chain) =>
    currency?.chainId === chain && currencyId(currency, currency.chainId).toLowerCase() === id?.toLowerCase()
  const currencyIn = matches(selected.currencyIn, params.get('tokenIn'), inputChain)
    ? selected.currencyIn
    : resolvedInput
  const selectedOutput = matches(selected.currencyOut, params.get('tokenOut'), outputChain)
    ? selected.currencyOut
    : resolvedOutput
  const currencyOut = currencyIn && selectedOutput?.equals(currencyIn) ? undefined : selectedOutput

  // Resolve path-backed EVM tokens before writing query parameters; preserve non-EVM IDs verbatim.
  const inputId =
    inputChain === NonEvmChain.Bitcoin
      ? 'BTC'
      : currencyIn
      ? currencyId(currencyIn, currencyIn.chainId)
      : params.get('tokenIn') || getDefaultSwapTokenId(inputChain)
  const outputId =
    outputChain === NonEvmChain.Bitcoin
      ? 'BTC'
      : currencyOut
      ? currencyId(currencyOut, currencyOut.chainId)
      : params.get('tokenOut') || getDefaultSwapTokenId(outputChain)
  const commitPair = (from: Chain, tokenIn: string, to: Chain, tokenOut: string) => {
    const next = new URLSearchParams(params)
    next.set('from', String(from))
    next.set('to', String(to))
    next.set('tokenIn', tokenIn)
    next.set('tokenOut', tokenOut)
    setParams(next)
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
      setSelected({ currencyIn: evmCurrency, currencyOut: sameToken ? currencyIn : currencyOut })
      commitPair(chain, id, sameToken ? inputChain : outputChain, sameToken ? inputId : outputId)
    } else {
      setSelected({ currencyIn: sameToken ? currencyOut : currencyIn, currencyOut: evmCurrency })
      commitPair(sameToken ? outputChain : inputChain, sameToken ? outputId : inputId, chain, id)
    }
  }

  const selectCurrency = (field: Field, currency: EvmCurrency) => select(field, currency, currency.chainId)
  const selectNonEvmCurrency = (field: Field, chain: NonEvmChain, currency: NonEvmCurrency) =>
    select(field, currency, chain)
  const reversePair = () => {
    setSelected({ currencyIn: currencyOut, currencyOut: currencyIn })
    commitPair(outputChain, outputId, inputChain, inputId)
  }

  return {
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
