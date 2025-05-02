import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
import { BitcoinToken, Chain, Currency, NonEvmChain } from '../adapters'
import { NearToken, useNearTokens } from 'state/crossChainSwap'
import { useNEARWallet } from 'components/Web3Provider/NearProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { TOKEN_API_URL } from 'constants/env'

export const registry = new CrossChainSwapAdapterRegistry()
CrossChainSwapFactory.getAllAdapters().forEach(adapter => {
  registry.registerAdapter(adapter)
})

const RegistryContext = createContext<
  | {
      showPreview: boolean
      setShowPreview: (show: boolean) => void
      disable: boolean
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
      setSelectedAdapter: (quote: string | null) => void
      amountInWei: string | undefined
      nearTokens: NearToken[]
      getQuote: () => Promise<void>
    }
  | undefined
>(undefined)

export const CrossChainSwapRegistryProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tokenIn = searchParams.get('tokenIn')
  const tokenOut = searchParams.get('tokenOut')
  const [amount, setAmount] = useState('1')
  const amountDebounce = useDebounce(amount, 500)
  const { nearTokens } = useNearTokens()

  const { chainId } = useActiveWeb3React()

  useEffect(() => {
    if (!from) {
      searchParams.set('from', chainId?.toString() || '')
      setSearchParams(searchParams)
    }
  }, [from, chainId, searchParams, setSearchParams])

  const isFromNear = from === 'near'
  const isFromBitcoin = from === 'bitcoin'
  const isFromEvm = isEvmChain(Number(from))
  const fromChainId = isFromEvm ? Number(from) : isNonEvmChain(from as NonEvmChain) ? (from as NonEvmChain) : chainId

  const isToNear = to === 'near'
  const isToBitcoin = to === 'bitcoin'
  const isToEvm = isEvmChain(Number(to))
  const toChainId = isToEvm
    ? (Number(to) as ChainId)
    : isNonEvmChain(to as NonEvmChain)
    ? (to as NonEvmChain)
    : undefined

  const currencyInEvm = useCurrencyV2(
    useMemo(() => (isFromEvm ? tokenIn || undefined : undefined), [isFromEvm, tokenIn]),
    useMemo(() => (isFromEvm ? (fromChainId as ChainId) : undefined), [fromChainId, isFromEvm]),
  )

  const currencyIn = useMemo(() => {
    if (isFromEvm) return currencyInEvm
    if (isFromBitcoin) return BitcoinToken
    if (isFromNear) return nearTokens.find(token => token.assetId === tokenIn)
    throw new Error('Network is not supported')
  }, [currencyInEvm, isFromBitcoin, isFromNear, isFromEvm, tokenIn, nearTokens])

  const currencyOutEvm = useCurrencyV2(
    useMemo(() => (isToEvm ? tokenOut || undefined : undefined), [tokenOut, isToEvm]),
    useMemo(() => (isToEvm ? (toChainId as ChainId) : undefined), [toChainId, isToEvm]),
  )

  const currencyOut = useMemo(() => {
    if (!toChainId) return
    if (isToEvm) return currencyOutEvm
    if (isToBitcoin) return BitcoinToken
    if (isToNear) return nearTokens.find(token => token.assetId === tokenOut)
    throw new Error('Network is not supported')
  }, [currencyOutEvm, isToEvm, tokenOut, isToNear, isToBitcoin, nearTokens, toChainId])

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

  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null)
  const walletClient = useWalletClient()
  const [slippage] = useUserSlippageTolerance()

  const selectedQuote = useMemo(() => {
    return quotes.find(q => q.adapter.getName() === selectedAdapter) || quotes[0] || null
  }, [quotes, selectedAdapter])

  const { walletState } = useNEARWallet()
  const nearAccountId = walletState?.accountId

  const [showPreview, setShowPreview] = useState(false)
  const disable = !fromChainId || !toChainId || !currencyIn || !currencyOut || !inputAmount || inputAmount === '0'

  const getQuote = useCallback(async () => {
    if (showPreview) return
    if (disable) {
      setQuotes([])
      setSelectedAdapter(null)
      return
    }

    const body: Record<string, string[]> = {}
    if ((currencyIn as any)?.wrapped?.address) {
      body[fromChainId] = [(currencyIn as any)?.wrapped?.address]
    }
    if ((currencyOut as any)?.wrapped?.address) {
      body[toChainId] = [(currencyOut as any)?.wrapped?.address]
    }

    const r: {
      data: {
        [chainId: string]: {
          [address: string]: { PriceBuy: number; PriceSell: number }
        }
      }
    } = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(r => r.json())

    const tokenInUsd = r?.data?.[fromChainId]?.[(currencyIn as any).wrapped.address]?.PriceBuy || 0
    const tokenOutUsd = r?.data?.[toChainId as any]?.[(currencyOut as any).wrapped.address]?.PriceBuy || 0

    const isToNear = toChainId === 'near'

    setLoading(true)
    const q = await registry
      .getQuotes({
        tokenInUsd: tokenInUsd,
        tokenOutUsd: tokenOutUsd,
        fromChain: fromChainId,
        toChain: toChainId,
        fromToken: currencyIn,
        toToken: currencyOut,
        amount: inputAmount,
        slippage,
        walletClient: walletClient?.data,
        sender: isFromNear ? nearAccountId || undefined : walletClient?.data?.account.address || ZERO_ADDRESS,
        recipient: isToNear ? nearAccountId || undefined : walletClient?.data?.account.address || ZERO_ADDRESS,
        nearTokens,
      })
      .catch(e => {
        console.log(e)
        return []
      })
    setQuotes(q)
    setLoading(false)
  }, [
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    inputAmount,
    walletClient?.data,
    disable,
    slippage,
    nearTokens,
    isFromNear,
    nearAccountId,
    showPreview,
  ])

  return (
    <RegistryContext.Provider
      value={{
        showPreview,
        setShowPreview,
        disable,
        getQuote,
        selectedQuote,
        setSelectedAdapter,
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
        amountInWei: inputAmount,
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
