import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { adaptSolanaWallet } from '@reservoir0x/relay-solana-wallet-adapter'
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
import { NearToken, useNearTokens, useSolanaTokens } from 'state/crossChainSwap'
import { BTC_DEFAULT_RECEIVER, ZERO_ADDRESS } from 'constants/index'
import { TOKEN_API_URL } from 'constants/env'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { isCanonicalPair } from '../utils'
import { NativeCurrencies } from 'constants/tokens'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

export const registry = new CrossChainSwapAdapterRegistry()
CrossChainSwapFactory.getAllAdapters().forEach(adapter => {
  registry.registerAdapter(adapter)
})

// Helper function to create a timeout promise
const createTimeoutPromise = (ms: number) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms)
  })
}

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
      allLoading: boolean
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
        } | null
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
    setLoading(true)
  }, [amount])

  useEffect(() => {
    let hasUpdate = false
    let newFrom = from
    if (!from) {
      searchParams.set('from', chainId?.toString() || '')
      newFrom = chainId?.toString() || ''
      hasUpdate = true
    }

    let newTo = to
    if (!to) {
      const lastChainId = localStorage.getItem('crossChainSwapLastChainOut')
      if (lastChainId && lastChainId !== newFrom) {
        searchParams.set('to', lastChainId)
        newTo = lastChainId
        hasUpdate = true
      }
    }

    if (!tokenIn) {
      if (from === 'near') {
        searchParams.set('tokenIn', 'near')
        hasUpdate = true
      }
      if (isEvmChain(from ? +from : chainId)) {
        searchParams.set('tokenIn', NativeCurrencies[(from ? +from : chainId) as ChainId]?.symbol?.toLowerCase() || '')
        hasUpdate = true
      }
    }

    if (!tokenOut) {
      if (from === 'near') {
        searchParams.set('tokenOut', 'near')
        hasUpdate = true
      }
      if (newTo && isEvmChain(+newTo)) {
        searchParams.set('tokenOut', NativeCurrencies[+newTo as ChainId]?.symbol?.toLowerCase() || '')
        hasUpdate = true
      }
    }

    if (hasUpdate) {
      setSearchParams(searchParams)
    }
  }, [from, to, tokenIn, chainId, searchParams, setSearchParams, tokenOut])

  const isFromSolana = from === 'solana'
  const isFromNear = from === 'near'
  const isFromBitcoin = from === 'bitcoin'
  const isFromEvm = isEvmChain(Number(from))
  const fromChainId = isFromEvm ? Number(from) : isNonEvmChain(from as NonEvmChain) ? (from as NonEvmChain) : chainId

  const isToNear = to === 'near'
  const isToSolana = to === 'solana'
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

  const { publicKey: solanaAddress } = useWallet()
  const { connection } = useConnection()

  const recipient = useMemo(() => {
    if (isToNear) return nearRecipient
    if (isToBitcoin) return btcRecipient
    if (isToEvm) return evmRecipient
    if (isToSolana) return solanaAddress?.toString() || ''
    return ''
  }, [isToNear, isToBitcoin, isToEvm, nearRecipient, btcRecipient, evmRecipient, isToSolana, solanaAddress])

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

  const { solanaTokens } = useSolanaTokens()

  const currencyIn = useMemo(() => {
    if (!from) return
    if (isFromEvm) return currencyInEvm
    if (isFromBitcoin) return BitcoinToken
    if (isFromNear) return nearTokens.find(token => token.assetId === tokenIn)
    if (isFromSolana) return solanaTokens.find(token => token.id === tokenIn)
    throw new Error('Network is not supported')
  }, [currencyInEvm, from, isFromBitcoin, isFromNear, isFromEvm, tokenIn, nearTokens, isFromSolana, solanaTokens])

  const currencyOutEvm = useCurrencyV2(
    useMemo(() => (isToEvm ? tokenOut || undefined : undefined), [tokenOut, isToEvm]),
    useMemo(() => (isToEvm ? (toChainId as ChainId) : undefined), [toChainId, isToEvm]),
  )

  const currencyOut = useMemo(() => {
    if (!toChainId) return
    if (isToEvm) return currencyOutEvm
    if (isToBitcoin) return BitcoinToken
    if (isToNear) return nearTokens.find(token => token.assetId === tokenOut)
    if (isToSolana) return solanaTokens.find(token => token.id === tokenOut)
    throw new Error('Network is not supported')
  }, [currencyOutEvm, isToEvm, tokenOut, isToNear, isToBitcoin, nearTokens, solanaTokens, toChainId, isToSolana])

  useEffect(() => {
    localStorage.setItem('crossChainSwapLastChainOut', toChainId?.toString() || '')
  }, [toChainId])

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
  const [allLoading, setAllLoading] = useState(false)

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
      const unableToCalcPi = !selectedQuote?.quote?.priceImpact
      const priceImpaceInfo = !selectedQuote
        ? null
        : {
            isHigh: selectedQuote.quote.priceImpact > highPriceImpactThreshold,
            isVeryHigh: unableToCalcPi || selectedQuote.quote.priceImpact >= veryHighPriceImpactThreshold,
            message: unableToCalcPi
              ? 'Unable to calculate price impact'
              : selectedQuote.quote.priceImpact >= veryHighPriceImpactThreshold
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
      priceImpaceInfo: !selectedQuote
        ? null
        : {
            isHigh: selectedQuote.quote.priceImpact > 3,
            isVeryHigh: selectedQuote.quote.priceImpact >= 10,
            message:
              selectedQuote.quote.priceImpact >= 10
                ? veryHighPiMsg
                : selectedQuote.quote.priceImpact > 3
                ? highPiMsg
                : '',
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
      abortControllerRef.current.abort()
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
    if (isFromBitcoin || isToBitcoin) {
      feeBps = 25
    } else if (isFromEvm && isToEvm) {
      if (
        isCanonicalPair(
          (currencyIn as any).chainId,
          (currencyIn as any).wrapped.address,
          (currencyOut as any).chainId,
          (currencyOut as any).wrapped.address,
        )
      ) {
        feeBps = 5
      } else {
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
        if (
          (token0Cat === 'stablePair' && token1Cat === 'stablePair') ||
          ((currencyIn as any)?.wrapped?.isStable && (currencyOut as any)?.wrapped?.isStable)
        ) {
          setCategory('stablePair')
          feeBps = 5
        } else if (token0Cat === 'commonPair' && token1Cat === 'commonPair') {
          setCategory('commonPair')
          feeBps = 10
        } else if (token0Cat === 'highVolatilityPair' || token1Cat === 'highVolatilityPair') {
          setCategory('highVolatilityPair')
          feeBps = 25
        } else {
          setCategory('exoticPair')
          feeBps = 15
        }
      }
    } else if (isFromNear || isToNear) {
      feeBps = 20
    }

    setLoading(true)
    setAllLoading(true)

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

          // Race between the adapter quote and timeout
          const quote = await Promise.race([adapter.getQuote(params), createTimeoutPromise(9_000)])

          // Check for cancellation after getting quote
          if (signal.aborted) throw new Error('Cancelled')

          quotes.push({ adapter, quote })
          const sortedQuotes = [...quotes].sort((a, b) => (a.quote.outputAmount < b.quote.outputAmount ? 1 : -1))
          setQuotes(sortedQuotes)
          setLoading(false)
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

    const adaptedWallet = adaptSolanaWallet(
      solanaAddress?.toString() || '1nc1nerator11111111111111111111111111111111',
      792703809, //chain id that Relay uses to identify solana
      connection,
      connection.sendTransaction as any,
    )

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
      walletClient: fromChainId === 'solana' ? adaptedWallet : walletClient?.data,
      sender: isFromSolana
        ? solanaAddress?.toString() || '1nc1nerator11111111111111111111111111111111'
        : isFromBitcoin
        ? btcAddress || BTC_DEFAULT_RECEIVER
        : isFromNear
        ? signedAccountId || ZERO_ADDRESS
        : walletClient?.data?.account.address || ZERO_ADDRESS,
      recipient: isToSolana
        ? recipient || solanaAddress?.toString() || '1nc1nerator11111111111111111111111111111111'
        : isToBitcoin
        ? recipient || BTC_DEFAULT_RECEIVER
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
    setAllLoading(false)
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
    solanaAddress,
    isFromSolana,
    isToSolana,
    connection,
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
        allLoading,
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
