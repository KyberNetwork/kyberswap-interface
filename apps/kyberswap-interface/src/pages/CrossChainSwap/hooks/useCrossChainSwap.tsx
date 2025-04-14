import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CrossChainSwapAdapterRegistry, Quote } from '../registry'
import { CrossChainSwapFactory } from '../factory'
import { useSearchParams } from 'react-router-dom'
import { useCurrencyV2 } from 'hooks/Tokens'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'viem'
import { useWalletClient } from 'wagmi'

const registry = new CrossChainSwapAdapterRegistry()
CrossChainSwapFactory.getAllAdapters().forEach(adapter => {
  registry.registerAdapter(adapter)
})

const RegistryContext = createContext<
  | {
      registry: CrossChainSwapAdapterRegistry
      fromChainId: ChainId
      toChainId: ChainId | undefined
      currencyIn: Currency | undefined
      currencyOut: Currency | undefined
      inputAmount: CurrencyAmount<Currency> | undefined
      loading: boolean
      quotes: Quote[]
      selectedQuote: Quote | null
      setSelectedQuote: (quote: Quote | null) => void
    }
  | undefined
>(undefined)

export const CrossChainSwapRegistryProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tokenIn = searchParams.get('tokenIn')
  const tokenOut = searchParams.get('tokenOut')
  const amount = searchParams.get('amount')

  const { chainId } = useActiveWeb3React()

  const fromChainId = MAINNET_NETWORKS.includes(Number(from)) ? Number(from) : chainId
  const toChainId = MAINNET_NETWORKS.includes(Number(to)) ? Number(to) : undefined

  const currencyIn = useCurrencyV2(tokenIn || undefined, fromChainId)
  const currencyOut = useCurrencyV2(tokenOut || undefined, toChainId)

  const inputAmount = useMemo(
    () =>
      currencyIn &&
      amount &&
      CurrencyAmount.fromRawAmount(currencyIn, parseUnits(amount || '0', currencyIn.wrapped.decimals).toString()),
    [currencyIn, amount],
  )

  const [loading, setLoading] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const walletClient = useWalletClient()

  useEffect(() => {
    if (!fromChainId || !toChainId || !currencyIn || !currencyOut || !inputAmount) {
      setQuotes([])
      setSelectedQuote(null)
      return
    }
    ;(async () => {
      setLoading(true)
      const q = await registry
        .getQuotes({
          fromChain: fromChainId,
          toChain: toChainId,
          fromToken: currencyIn.wrapped,
          toToken: currencyOut.wrapped,
          amount: inputAmount.quotient.toString(),
          walletClient: walletClient?.data,
        })
        .catch(e => {
          console.log(e)
          return []
        })
      setQuotes(q)
      setSelectedQuote(q[0] || null)
      setLoading(false)
    })()
  }, [fromChainId, toChainId, currencyIn, currencyOut, inputAmount, walletClient?.data])

  return (
    <RegistryContext.Provider
      value={{
        selectedQuote,
        setSelectedQuote,
        registry,
        fromChainId,
        toChainId,
        currencyIn: currencyIn || undefined,
        currencyOut: currencyOut || undefined,
        inputAmount: inputAmount || undefined,
        quotes,
        loading,
      }}
    >
      {children}
    </RegistryContext.Provider>
  )
}

export const useCrossChainSwap = () => {
  const ctx = useContext(RegistryContext)
  if (!ctx) throw new Error('useSwapRegistry must be used within a RegistryProvider')
  return ctx
}
