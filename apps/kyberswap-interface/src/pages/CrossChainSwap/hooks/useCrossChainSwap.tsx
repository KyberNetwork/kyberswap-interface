import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
import { BitcoinToken, Chain, Currency, NearQuoteParams, NonEvmChain, QuoteParams, SwapProvider } from '../adapters'
import { NearToken, useNearTokens } from 'state/crossChainSwap'
import { ZERO_ADDRESS } from 'constants/index'
import { TOKEN_API_URL } from 'constants/env'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'

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
      recipient: string
      setRecipient: (value: string) => void
      warning: {
        slippageInfo: {
          default: number
          presets: number[]
          isHigh: boolean
          isLow: boolean
          message: string
        }
        priceImpaceInfo: {
          isHigh: boolean
          isVeryHigh: boolean
          message: string
        }
      } | null
    }
  | undefined
>(undefined)

export const CrossChainSwapRegistryProvider = ({ children }: { children: React.ReactNode }) => {
  const [evmRecipient, setEvmRecipient] = useState('')
  const [nearRecipient, setNearRecipient] = useState('')
  const [btcRecipient, setBtcRecipient] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tokenIn = searchParams.get('tokenIn')
  const tokenOut = searchParams.get('tokenOut')
  const [amount, setAmount] = useState('1')
  const amountDebounce = useDebounce(amount, 500)
  const { nearTokens } = useNearTokens()

  const { chainId, account } = useActiveWeb3React()

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

  useEffect(() => {
    if (account) {
      setEvmRecipient(account)
    }
  }, [account])

  const { signedAccountId } = useWalletSelector()

  useEffect(() => {
    if (signedAccountId) {
      setNearRecipient(signedAccountId)
    }
  }, [signedAccountId])

  const { walletInfo } = useBitcoinWallet()
  const btcAddress = walletInfo?.address
  const btcPublicKey = walletInfo?.publicKey

  useEffect(() => {
    if (btcAddress) {
      setBtcRecipient(btcAddress)
    }
  }, [btcAddress])

  const recipient = useMemo(() => {
    if (isToNear) return nearRecipient
    if (isToBitcoin) return btcRecipient
    if (isToEvm) return evmRecipient
    return ''
  }, [isToNear, isToBitcoin, isToEvm, nearRecipient, btcRecipient, evmRecipient])

  const setRecipient = useCallback(
    (value: string) => {
      if (isToNear) setNearRecipient(value)
      if (isToBitcoin) setBtcRecipient(value)
      if (isToEvm) setEvmRecipient(value)
    },
    [isToNear, isToBitcoin, isToEvm],
  )

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
    if (!from) return
    if (isFromEvm) return currencyInEvm
    if (isFromBitcoin) return BitcoinToken
    if (isFromNear) return nearTokens.find(token => token.assetId === tokenIn)
    throw new Error('Network is not supported')
  }, [currencyInEvm, from, isFromBitcoin, isFromNear, isFromEvm, tokenIn, nearTokens])

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

  // reset selected adapter when from or to chain changes
  useEffect(() => {
    setSelectedAdapter(null)
  }, [currencyIn, currencyOut, fromChainId, toChainId])

  const [category, setCategory] = useState<'stablePair' | 'commonPair' | 'highVolatilityPair' | 'exoticPair'>(
    'commonPair',
  )
  const warning = useMemo(() => {
    if (!selectedQuote) return null
    const highSlippageMsg = 'Your slippage is set higher than usual, which may cause unexpected losses'
    const lowSlippageMsg = 'Your slippage is set lower than usual, which may cause transaction failure.'
    const veryHighPiMsg = 'The price impact is high — double check the output before proceeding.'
    const highPiMsg = 'The price impact might be high — double check the output before proceeding.'
    if (isFromEvm && isToEvm) {
      const slippageHighThreshold = category === 'stablePair' ? 100 : 200
      const slippageLowThreshold = category === 'stablePair' ? 5 : 30
      const slippageInfo = {
        default: category === 'stablePair' ? 10 : 50,
        presets: category === 'stablePair' ? [5, 10, 30, 100] : [10, 50, 100, 200],
        isHigh: slippage >= slippageHighThreshold,
        isLow: slippage < slippageLowThreshold,
        message:
          slippage >= slippageHighThreshold ? highSlippageMsg : slippage < slippageLowThreshold ? lowSlippageMsg : '',
      }

      const highPriceImpactThreshold = category === 'stablePair' ? 1 : 2
      const veryHighPriceImpactThreshold = category === 'stablePair' ? 3 : 5
      const priceImpaceInfo = {
        isHigh: selectedQuote.quote.priceImpact > highPriceImpactThreshold,
        isVeryHigh: selectedQuote.quote.priceImpact >= veryHighPriceImpactThreshold,
        message:
          selectedQuote.quote.priceImpact >= veryHighPriceImpactThreshold
            ? veryHighPiMsg
            : selectedQuote.quote.priceImpact > highPriceImpactThreshold
            ? highPiMsg
            : '',
      }
      return { slippageInfo, priceImpaceInfo }
    }

    return {
      slippageInfo: {
        default: 50,
        presets: [50, 100, 200, 300],
        isHigh: slippage >= 300,
        isLow: slippage < 30,
        message: slippage >= 300 ? highSlippageMsg : slippage < 30 ? lowSlippageMsg : '',
      },
      priceImpaceInfo: {
        isHigh: selectedQuote.quote.priceImpact > 3,
        isVeryHigh: selectedQuote.quote.priceImpact >= 10,
        message:
          selectedQuote.quote.priceImpact >= 10 ? veryHighPiMsg : selectedQuote.quote.priceImpact > 3 ? highPiMsg : '',
      },
    }
  }, [selectedQuote, category, isFromEvm, isToEvm, slippage])

  const [showPreview, setShowPreview] = useState(false)
  const disable = !fromChainId || !toChainId || !currencyIn || !currencyOut || !inputAmount || inputAmount === '0'

  const abortControllerRef = useRef(new AbortController())

  const getQuote = useCallback(async () => {
    if (showPreview) return
    if (disable) {
      setQuotes([])
      setSelectedAdapter(null)
      return
    }
    abortControllerRef.current.abort()
    // Create a new controller for this request
    abortControllerRef.current = new AbortController()

    const { signal } = abortControllerRef.current

    const body: Record<string, string[]> = {}
    if ((currencyIn as any)?.wrapped?.address) {
      if (!body[fromChainId]) body[fromChainId] = []
      body[fromChainId].push((currencyIn as any)?.wrapped?.address)
    }
    if ((currencyOut as any)?.wrapped?.address) {
      if (!body[toChainId]) body[toChainId] = []
      body[toChainId].push((currencyOut as any)?.wrapped?.address)
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
      signal,
    }).then(r => r.json())
    // Check if this request has been aborted
    if (signal.aborted) return

    const tokenInUsd = r?.data?.[fromChainId]?.[(currencyIn as any).wrapped.address]?.PriceBuy || 0
    const tokenOutUsd = r?.data?.[toChainId as any]?.[(currencyOut as any).wrapped.address]?.PriceBuy || 0
    const isToNear = toChainId === 'near'

    let feeBps = 25
    if ((isFromBitcoin && isToEvm) || (isFromEvm && isToBitcoin)) {
      feeBps = 25
    } else if (isFromEvm && isToEvm) {
      const [token0Cat, token1Cat] = await Promise.all([
        await fetch(
          `${TOKEN_API_URL}/v1/public/category/token?tokens=${(
            currencyIn as any
          ).wrapped.address.toLowerCase()}&chainId=${fromChainId}`,
        )
          .then(res => res.json())
          .then(res => {
            const cat = res?.data?.find(
              (item: any) => item.token.toLowerCase() === (currencyIn as any).wrapped.address.toLowerCase(),
            )
            return cat?.category || 'exoticPair'
          }),

        await fetch(
          `${TOKEN_API_URL}/v1/public/category/token?tokens=${(
            currencyOut as any
          ).wrapped.address.toLowerCase()}&chainId=${toChainId}`,
        )
          .then(res => res.json())
          .then(res => {
            const cat = res?.data?.find(
              (item: any) => item.token.toLowerCase() === (currencyOut as any).wrapped.address.toLowerCase(),
            )
            return cat?.category || 'exoticPair'
          }),
      ])
      if (token0Cat === 'stablePair' && token1Cat === 'stablePair') {
        setCategory('stablePair')
        feeBps = 5
      } else if (token0Cat === 'commonPair' && token1Cat === 'commonPair') {
        setCategory('commonPair')
        feeBps = 10
      } else if (token0Cat === 'highVolatilityPair' && token1Cat === 'highVolatilityPair') {
        setCategory('highVolatilityPair')
        feeBps = 25
      } else {
        setCategory('exoticPair')
        feeBps = 15
      }
    } else if (isFromNear || isToNear) {
      feeBps = 20
    }

    setLoading(true)

    const getQuotesWithCancellation = async (params: QuoteParams | NearQuoteParams) => {
      // Create a modified version of getQuotes that can be cancelled
      const quotes: Quote[] = []
      const adapters =
        params.fromChain === params.toChain && isEvmChain(params.fromChain)
          ? registry.getAdapter('KyberSwap')
            ? ([registry.getAdapter('KyberSwap')] as SwapProvider[])
            : ([] as SwapProvider[])
          : registry
              .getAllAdapters()
              .filter(
                adapter =>
                  adapter.getName() !== 'KyberSwap' &&
                  adapter.getSupportedChains().includes(params.fromChain) &&
                  adapter.getSupportedChains().includes(params.toChain),
              )

      // Map each adapter to a promise that can be cancelled
      const quotePromises = adapters.map(async adapter => {
        try {
          // Check for cancellation before starting
          if (signal.aborted) throw new Error('Cancelled')

          const quote = await adapter.getQuote(params)

          // Check for cancellation after getting quote
          if (signal.aborted) throw new Error('Cancelled')

          quotes.push({ adapter, quote })
        } catch (err) {
          if (err.message === 'Cancelled' || signal.aborted) {
            throw new Error('Cancelled')
          }
          console.error(`Failed to get quote from ${adapter.getName()}:`, err)
        }
      })

      await Promise.all(quotePromises)

      if (quotes.length === 0) {
        throw new Error('No valid quotes found for the requested swap')
      }

      quotes.sort((a, b) => (a.quote.outputAmount < b.quote.outputAmount ? 1 : -1))
      return quotes
    }

    const q = await getQuotesWithCancellation({
      feeBps,
      tokenInUsd: tokenInUsd,
      tokenOutUsd: tokenOutUsd,
      fromChain: fromChainId,
      toChain: toChainId,
      fromToken: currencyIn,
      toToken: currencyOut,
      amount: inputAmount,
      slippage,
      walletClient: walletClient?.data,
      sender: isFromBitcoin
        ? btcAddress || 'bc1qmzgkj3hznt8heh4vp33v2cr2mvsyhc3lmfzz9p'
        : isFromNear
        ? signedAccountId || ZERO_ADDRESS
        : walletClient?.data?.account.address || ZERO_ADDRESS,
      recipient: isToBitcoin
        ? recipient || 'bc1qmzgkj3hznt8heh4vp33v2cr2mvsyhc3lmfzz9p' // TODO: default address???
        : isToNear
        ? recipient || signedAccountId || ZERO_ADDRESS
        : recipient || walletClient?.data?.account.address || ZERO_ADDRESS,
      nearTokens,
      publicKey: btcPublicKey || '',
    }).catch(e => {
      console.log(e)
      return []
    })
    setQuotes(q)
    setLoading(false)
  }, [
    recipient,
    isFromEvm,
    isToEvm,
    btcPublicKey,
    isFromBitcoin,
    btcAddress,
    isToBitcoin,
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
    signedAccountId,
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
        recipient,
        setRecipient,
        warning,
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
