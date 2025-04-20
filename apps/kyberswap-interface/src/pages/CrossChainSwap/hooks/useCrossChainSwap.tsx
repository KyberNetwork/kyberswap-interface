import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CrossChainSwapAdapterRegistry, Quote } from '../registry'
import { CrossChainSwapFactory } from '../factory'
import { useSearchParams } from 'react-router-dom'
import { useCurrencyV2 } from 'hooks/Tokens'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'viem'
import { useWalletClient } from 'wagmi'
import useDebounce from 'hooks/useDebounce'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isEvmChain, isNonEvmChain } from 'utils'
import { Chain, Currency, NonEvmChain } from '../adapters'
import { NearToken, useNearTokens } from 'state/crossChainSwap'

export const registry = new CrossChainSwapAdapterRegistry()
CrossChainSwapFactory.getAllAdapters().forEach(adapter => {
  registry.registerAdapter(adapter)
})

const RegistryContext = createContext<
  | {
      amount: string
      setAmount: (amount: string) => void
      registry: CrossChainSwapAdapterRegistry
      fromChainId: Chain
      toChainId: Chain | undefined
      currencyIn: Currency | undefined
      currencyOut: Currency | undefined
      loading: boolean
      quotes: Quote[]
      selectedQuote: Quote | null
      setSelectedQuote: (quote: Quote | null) => void
      nearTokens: NearToken[]
    }
  | undefined
>(undefined)

export const CrossChainSwapRegistryProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tokenIn = searchParams.get('tokenIn')
  const tokenOut = searchParams.get('tokenOut')
  const [amount, setAmount] = useState('1')
  const amountDebounce = useDebounce(amount, 500)

  const { nearTokens } = useNearTokens()

  const { chainId } = useActiveWeb3React()

  const isFromEvm = isEvmChain(Number(from))
  const fromChainId = isFromEvm ? Number(from) : isNonEvmChain(from as NonEvmChain) ? (from as NonEvmChain) : chainId

  const isToEvm = isEvmChain(Number(to))
  const toChainId = isToEvm
    ? (Number(to) as ChainId)
    : isNonEvmChain(to as NonEvmChain)
    ? (to as NonEvmChain)
    : undefined

  const currencyInEvm = useCurrencyV2(
    isFromEvm ? tokenIn || undefined : undefined,
    isFromEvm ? (fromChainId as ChainId) : undefined,
  )

  const currencyIn = useMemo(() => {
    return isFromEvm ? currencyInEvm : nearTokens.find(token => token.assetId === tokenIn)
  }, [currencyInEvm, isFromEvm, tokenIn, nearTokens])

  const currencyOutEvm = useCurrencyV2(
    isToEvm ? tokenOut || undefined : undefined,
    isToEvm ? (toChainId as ChainId) : undefined,
  )

  const currencyOut = useMemo(() => {
    return isToEvm ? currencyOutEvm : nearTokens.find(token => token.assetId === tokenOut)
  }, [currencyOutEvm, isToEvm, tokenOut, nearTokens])

  const inputAmount = useMemo(
    () =>
      currencyIn
        ? parseUnits(
            amountDebounce || '0',
            isFromEvm ? (currencyIn as any).wrapped.decimals : currencyIn.decimals,
          ).toString()
        : undefined,
    [currencyIn, amountDebounce, isFromEvm],
  )

  const [loading, setLoading] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const walletClient = useWalletClient()
  const [slippage] = useUserSlippageTolerance()

  useEffect(() => {
    if (!fromChainId || !toChainId || !currencyIn || !currencyOut || !inputAmount || inputAmount === '0') {
      setQuotes([])
      setSelectedQuote(null)
      return
    }
    const isFromNear = fromChainId === 'near'
    const isToNear = toChainId === 'near'

    ;(async () => {
      setLoading(true)
      const q = await registry
        .getQuotes({
          fromChain: fromChainId,
          toChain: toChainId,
          fromToken: currencyIn,
          toToken: currencyOut,
          amount: inputAmount,
          slippage,
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
  }, [fromChainId, toChainId, currencyIn, currencyOut, inputAmount, walletClient?.data, slippage])

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
        quotes,
        loading,
        amount,
        setAmount,
        nearTokens,
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
