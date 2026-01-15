import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { adaptSolanaWallet } from '@reservoir0x/relay-solana-wallet-adapter'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseUnits } from 'viem'
import { useWalletClient } from 'wagmi'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { CROSSCHAIN_AGGREGATOR_API, TOKEN_API_URL } from 'constants/env'
import {
  BTC_DEFAULT_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER_SOLANA,
  SOLANA_NATIVE,
  ZERO_ADDRESS,
} from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import useDebounce from 'hooks/useDebounce'
import { NearToken, useNearTokens, useSolanaTokens } from 'state/crossChainSwap'
import { useAppSelector } from 'state/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isEvmChain, isNonEvmChain } from 'utils'

import {
  BitcoinToken,
  Chain,
  Currency,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NearQuoteParams,
  NonEvmChain,
  NormalizedQuote,
  QuoteParams,
  SwapProvider,
} from '../adapters'
import { CrossChainSwapFactory } from '../factory'
import { CrossChainSwapAdapterRegistry, Quote } from '../registry'
import { NEAR_STABLE_COINS, SOLANA_STABLE_COINS, isCanonicalPair } from '../utils'

// SSE Event types from the server
const SSE_EVENT = {
  INIT: 'init',
  QUOTE: 'quote',
  PROVIDER_ERROR: 'provider_error',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const

// Timeout constants
const SOFT_TIMEOUT_MS = 4000 // 4 seconds - enable swap button if at least 1 quote exists

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

// Helper to calculate net output amount after protocol fees
const getNetOutputAmount = (quote: NormalizedQuote): bigint => {
  const { outputAmount, protocolFee, quoteParams } = quote
  const { tokenOutUsd, toToken } = quoteParams

  // Convert protocol fee from USD to token amount
  if (protocolFee && tokenOutUsd && tokenOutUsd > 0) {
    const decimals = toToken?.decimals || 18
    const protocolFeeInTokens = protocolFee / tokenOutUsd

    // Use parseUnits to safely convert decimal to BigInt without precision loss
    try {
      const protocolFeeInSmallestUnit = parseUnits(protocolFeeInTokens.toFixed(decimals), decimals)
      return outputAmount - protocolFeeInSmallestUnit
    } catch (e) {
      console.error('Error converting protocol fee:', e)
      return outputAmount
    }
  }
  return outputAmount
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
      sender: string
      receiver: string
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
  const excluded = useAppSelector(state => state.crossChainSwap.excludedSources)
  const excludedSources = useMemo(() => {
    return excluded || []
  }, [excluded])

  const [evmRecipient, setEvmRecipient] = useState('')
  const [nearRecipient, setNearRecipient] = useState('')
  const [btcRecipient, setBtcRecipient] = useState('')
  const [solanaReceiver, setSolanaReceiver] = useState('')

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
      const defaultFrom = !account ? NonEvmChain.Bitcoin : chainId?.toString() || ''
      searchParams.set('from', defaultFrom)
      newFrom = defaultFrom
      hasUpdate = true
    }

    let newTo = to
    if (!to) {
      const lastChainId = localStorage.getItem('crossChainSwapLastChainOut')
      if (lastChainId && lastChainId !== newFrom) {
        searchParams.set('to', lastChainId)
        newTo = lastChainId
        hasUpdate = true
      } else {
        const defaultTo = !account || newFrom === NonEvmChain.Bitcoin ? ChainId.MAINNET.toString() : NonEvmChain.Bitcoin
        searchParams.set('to', defaultTo)
        newTo = defaultTo
        hasUpdate = true
      }
    }

    if (!tokenIn) {
      if (from === NonEvmChain.Near) {
        searchParams.set('tokenIn', 'near')
        hasUpdate = true
      }
      if (from === NonEvmChain.Solana) {
        searchParams.set('tokenIn', SOLANA_NATIVE)
        hasUpdate = true
      }
      if (isEvmChain(from ? +from : chainId)) {
        searchParams.set('tokenIn', NativeCurrencies[(from ? +from : chainId) as ChainId]?.symbol?.toLowerCase() || '')
        hasUpdate = true
      }
    }

    if (!tokenOut) {
      if (to === NonEvmChain.Near) {
        searchParams.set('tokenOut', 'near')
        hasUpdate = true
      }
      if (to === NonEvmChain.Solana) {
        searchParams.set('tokenOut', SOLANA_NATIVE)
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
  }, [from, to, tokenIn, chainId, searchParams, setSearchParams, tokenOut, account])

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
    if (isToSolana) return solanaReceiver
    return ''
  }, [isToNear, isToBitcoin, isToEvm, nearRecipient, btcRecipient, evmRecipient, solanaReceiver, isToSolana])

  useEffect(() => {
    if (solanaAddress?.toString()) {
      setSolanaReceiver(solanaAddress.toString())
    }
  }, [solanaAddress])

  const setRecipient = useCallback(
    (value: string) => {
      if (isToNear) setNearRecipient(value)
      if (isToBitcoin) setBtcRecipient(value)
      if (isToEvm) setEvmRecipient(value)
      if (isToSolana) {
        setSolanaReceiver(value)
        return
      }
    },
    [isToNear, isToBitcoin, isToEvm, isToSolana],
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

  const { solanaTokens: solanaTokensIn } = useSolanaTokens(isFromSolana ? tokenIn || '' : '', !isFromSolana)
  const { solanaTokens: solanaTokensOut } = useSolanaTokens(isToSolana ? tokenOut || '' : '', !isToSolana)

  const currencyIn = useMemo(() => {
    if (!from) return
    if (isFromEvm) return currencyInEvm
    if (isFromBitcoin) return BitcoinToken
    if (isFromNear) return nearTokens.find(token => token.assetId === tokenIn)
    if (isFromSolana) return solanaTokensIn.find(token => token.id === tokenIn)
    throw new Error('Network is not supported')
  }, [currencyInEvm, from, isFromBitcoin, isFromNear, isFromEvm, tokenIn, nearTokens, isFromSolana, solanaTokensIn])

  const currencyOutEvm = useCurrencyV2(
    useMemo(() => (isToEvm ? tokenOut || undefined : undefined), [tokenOut, isToEvm]),
    useMemo(() => (isToEvm ? (toChainId as ChainId) : undefined), [toChainId, isToEvm]),
  )

  const currencyOut = useMemo(() => {
    if (!toChainId) return
    if (isToEvm) return currencyOutEvm
    if (isToBitcoin) return BitcoinToken
    if (isToNear) return nearTokens.find(token => token.assetId === tokenOut)
    if (isToSolana) return solanaTokensOut.find(token => token.id === tokenOut)
    throw new Error('Network is not supported')
  }, [currencyOutEvm, isToEvm, tokenOut, isToNear, isToBitcoin, nearTokens, solanaTokensOut, toChainId, isToSolana])

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
    const highSlippageMsg = t`Your slippage is set higher than usual, which may cause unexpected losses`
    const lowSlippageMsg = t`Your slippage is set lower than usual, which may cause transaction failure.`
    const veryHighPiMsg = t`The price impact is high — double check the output before proceeding.`
    const highPiMsg = t`The price impact might be high — double check the output before proceeding.`
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

  const sender = isFromSolana
    ? solanaAddress?.toString() || CROSS_CHAIN_FEE_RECEIVER_SOLANA
    : isFromBitcoin
    ? btcAddress || BTC_DEFAULT_RECEIVER
    : isFromNear
    ? signedAccountId || ZERO_ADDRESS
    : walletClient?.data?.account.address || CROSS_CHAIN_FEE_RECEIVER

  const receiver = isToSolana
    ? recipient || solanaAddress?.toString() || CROSS_CHAIN_FEE_RECEIVER_SOLANA
    : isToBitcoin
    ? recipient || BTC_DEFAULT_RECEIVER
    : isToNear
    ? recipient || signedAccountId || ZERO_ADDRESS
    : recipient || walletClient?.data?.account.address || CROSS_CHAIN_FEE_RECEIVER

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
        setCategory('stablePair')
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
        // Determine swap pair category based on token categories matrix:
        // Priority: High-volatility > Exotic > Stable (both) > Common (stable/correlated/common combinations)
        if (token0Cat === 'highVolatilityPair' || token1Cat === 'highVolatilityPair') {
          setCategory('highVolatilityPair')
          feeBps = 25
        } else if (token0Cat === 'exoticPair' || token1Cat === 'exoticPair') {
          setCategory('exoticPair')
          feeBps = 15
        } else if (
          (token0Cat === 'stablePair' && token1Cat === 'stablePair') ||
          ((currencyIn as any)?.wrapped?.isStable && (currencyOut as any)?.wrapped?.isStable)
        ) {
          setCategory('stablePair')
          feeBps = 5
        } else {
          // All other combinations of stable/correlated/common tokens result in Common Pair
          setCategory('commonPair')
          feeBps = 10
        }
      }
    } else if (isFromNear || isToNear || isFromSolana || isToSolana) {
      const isTokenInStable = isFromEvm
        ? (currencyIn as any)?.wrapped?.isStable
        : isFromSolana
        ? SOLANA_STABLE_COINS.includes((currencyIn as any).id)
        : isFromNear
        ? NEAR_STABLE_COINS.includes((currencyIn as any).assetId)
        : false
      const isTokenOutStable = isToEvm
        ? (currencyOut as any)?.wrapped?.isStable
        : isToSolana
        ? SOLANA_STABLE_COINS.includes((currencyOut as any).id)
        : isToNear
        ? NEAR_STABLE_COINS.includes((currencyOut as any).assetId)
        : false

      if (!isFromEvm && !isToEvm) {
        feeBps = 25
      } else if (isTokenInStable && isTokenOutStable) feeBps = 10
      else feeBps = 20
    }

    setLoading(true)
    setAllLoading(true)

    const getQuotesWithCancellation = async (params: QuoteParams | NearQuoteParams) => {
      const quotes: Quote[] = []

      // Check if this is a same-chain EVM swap
      const isSameChainEvmSwap =
        params.fromChain === params.toChain &&
        isEvmChain(params.fromChain) &&
        !NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain) &&
        !NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)

      // For same-chain EVM swaps, use KyberSwap adapter directly (old logic)
      if (isSameChainEvmSwap) {
        const kyberswapAdapter = registry.getAdapter('KyberSwap')

        // Check if KyberSwap is excluded or doesn't support the category (unless all sources are excluded)
        const isKyberSwapExcluded =
          excludedSources.includes('KyberSwap') && excludedSources.length < registry.getAllAdapters().length

        const isKyberSwapSupported = kyberswapAdapter?.canSupport(category, currencyIn, currencyOut) ?? true

        if (kyberswapAdapter && !isKyberSwapExcluded && isKyberSwapSupported) {
          try {
            console.log('Using KyberSwap adapter for same-chain swap')
            if (signal.aborted) throw new Error('Cancelled')

            const quote = await Promise.race([kyberswapAdapter.getQuote(params), createTimeoutPromise(9_000)])

            if (signal.aborted) throw new Error('Cancelled')

            quotes.push({ adapter: kyberswapAdapter, quote })
            setQuotes(quotes)
            setLoading(false)

            return
          } catch (err) {
            if ((err as Error).message === 'Cancelled' || signal.aborted) {
              throw new Error('Cancelled')
            }
            console.error(`Failed to get quote from KyberSwap:`, err)
            throw new Error('No valid quotes found for the requested swap')
          }
        }

        if (isKyberSwapExcluded) {
          throw new Error('KyberSwap is excluded. Please enable it for same-chain swaps.')
        }

        if (!isKyberSwapSupported) {
          throw new Error('KyberSwap does not support this token pair category.')
        }

        throw new Error('KyberSwap adapter not available')
      }

      // For cross-chain swaps, try the streaming API first, fallback to client-side adapters
      // The streaming API handles provider selection on the backend

      // Construct the API URL with parameters
      const fromToken = (params.fromToken as any).isNative
        ? ZERO_ADDRESS
        : (params.fromToken as any).wrapped?.address ||
          (params.fromToken as any).address ||
          (params.fromToken as any).id ||
          (params.fromToken as any).assetId
      const toToken = (params.toToken as any).isNative
        ? ZERO_ADDRESS
        : (params.toToken as any).wrapped?.address ||
          (params.toToken as any).address ||
          (params.toToken as any).id ||
          (params.toToken as any).assetId
      const fromTokenDecimals = params.fromToken.decimals
      const toTokenDecimals = params.toToken.decimals

      const queryParams = new URLSearchParams({
        fromChain: params.fromChain.toString(),
        fromToken,
        fromTokenDecimals: fromTokenDecimals.toString(),
        fromAddress: params.sender,
        fromAmount: params.amount,
        toChain: params.toChain.toString(),
        toToken,
        toTokenDecimals: toTokenDecimals.toString(),
        toAddress: params.recipient,
        fee: params.feeBps.toString(),
        integrator: 'kyberswap',
        stream: 'true',
        slippage: params.slippage.toString(),
        fromTokenUsd: (params as any).tokenInUsd?.toString() || '0',
        toTokenUsd: (params as any).tokenOutUsd?.toString() || '0',
      })

      // Add includedSources and excludedSources parameters
      const allAdapters = registry.getAllAdapters()

      // Filter adapters based on both excludedSources and canSupport check
      const supportedAdapters = allAdapters.filter(adapter => adapter.canSupport(category, currencyIn, currencyOut))
      const includedSourceNames = supportedAdapters
        .filter(adapter => !excludedSources.includes(adapter.getName()))
        .map(adapter => adapter.getName())

      const excludedSourceNames = allAdapters
        .filter(
          adapter =>
            excludedSources.includes(adapter.getName()) || !adapter.canSupport(category, currencyIn, currencyOut),
        )
        .map(adapter => adapter.getName())

      // Only add parameters if there are filters to apply
      if (includedSourceNames.length > 0 && includedSourceNames.length < allAdapters.length) {
        queryParams.append('includedSources', includedSourceNames.join(','))
      }

      if (excludedSourceNames.length > 0) {
        queryParams.append('excludedSources', excludedSourceNames.join(','))
      }

      const apiUrl = `${CROSSCHAIN_AGGREGATOR_API}/api/v1/quotes?${queryParams.toString()}`

      // Declare soft timeout timer outside try-catch for cleanup access
      let softTimeoutTimer: NodeJS.Timeout | null = null

      // Try streaming API first
      let streamingApiSucceeded = false

      try {
        // Check for cancellation before starting
        if (signal.aborted) throw new Error('Cancelled')

        // Set up soft timeout to enable swap button after SOFT_TIMEOUT_MS if we have at least 1 quote
        softTimeoutTimer = setTimeout(() => {
          if (quotes.length > 0) {
            console.log(
              `[Soft Timeout] ${SOFT_TIMEOUT_MS}ms reached with ${quotes.length} quote(s). Enabling swap button while continuing to collect quotes.`,
            )
            setLoading(false)
          } else {
            console.log(`[Soft Timeout] ${SOFT_TIMEOUT_MS}ms reached but no quotes available yet.`)
          }
        }, SOFT_TIMEOUT_MS)

        // Fetch with streaming
        const response = await fetch(apiUrl, { signal })

        if (!response.ok) {
          console.error('Streaming API error response status:', response.status)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body reader available')
        }

        let buffer = ''
        let currentEvent = '' // Track the current event type

        // Read the stream
        while (true) {
          // Check for cancellation
          if (signal.aborted) {
            reader.cancel()
            throw new Error('Cancelled')
          }

          const { done, value } = await reader.read()

          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE messages
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            // Skip empty lines
            if (!line) {
              continue
            }

            // Parse event type
            if (line.startsWith('event:')) {
              currentEvent = line.startsWith('event: ') ? line.slice(7).trim() : line.slice(6).trim()
              continue
            }

            if (line.startsWith('data:')) {
              try {
                // Handle both "data:{json}" and "data: {json}" formats
                const jsonStr = line.startsWith('data: ') ? line.slice(6) : line.slice(5)
                const data = JSON.parse(jsonStr)

                // Handle different event types
                if (currentEvent === SSE_EVENT.INIT) {
                  console.log('SSE connection initialized. Request ID:', data.requestID)
                  continue
                }

                if (currentEvent === SSE_EVENT.COMPLETE) {
                  console.log(`All quotes received from streaming API. Total quotes: ${quotes.length}`)
                  continue
                }

                if (currentEvent === SSE_EVENT.PROVIDER_ERROR) {
                  console.error('Provider error from streaming API:', data)
                  continue
                }

                if (currentEvent === SSE_EVENT.ERROR) {
                  console.error('Error from streaming API:', data)
                  continue
                }

                // Only process quote events
                if (currentEvent !== SSE_EVENT.QUOTE) {
                  console.log('Skipping non-quote event:', currentEvent)
                  continue
                }

                // Find the corresponding adapter
                const adapter = registry.getAdapter(data.provider)

                // Skip if this source is excluded (unless all sources are excluded)
                if (
                  adapter &&
                  excludedSources.includes(adapter.getName()) &&
                  excludedSources.length < registry.getAllAdapters().length
                ) {
                  console.log('Skipping excluded source:', adapter.getName())
                  continue
                }

                // Skip if this source doesn't support the current category
                if (adapter && !adapter.canSupport(category, currencyIn, currencyOut)) {
                  console.log('Skipping unsupported category for source:', adapter.getName(), 'category:', category)
                  continue
                }

                if (adapter) {
                  console.log(`Received quote from ${adapter.getName()} with output amount: ${data.outputAmount}`)

                  const normalizedQuote = {
                    quoteParams: {
                      ...data.quoteParams,
                      fromChain: params.fromChain,
                      toChain: params.toChain,
                      fromToken: params.fromToken,
                      toToken: params.toToken,
                      publicKey: params.publicKey,
                      walletClient: params.walletClient,
                    },
                    outputAmount: BigInt(data.outputAmount),
                    formattedOutputAmount: data.formattedOutputAmount,
                    inputUsd: data.inputUsd,
                    outputUsd: data.outputUsd,
                    rate: data.rate,
                    timeEstimate: data.timeEstimate,
                    priceImpact: data.priceImpact,
                    gasFeeUsd: data.gasFeeUsd,
                    contractAddress: data.contractAddress,
                    rawQuote: data.rawQuote,
                    protocolFee: data.protocolFee,
                    protocolFeeString: data.protocolFeeString,
                    platformFeePercent: data.platformFeePercent,
                  }

                  quotes.push({ adapter, quote: normalizedQuote })

                  const sortedQuotes = [...quotes].sort((a, b) => {
                    const netA = getNetOutputAmount(a.quote)
                    const netB = getNetOutputAmount(b.quote)
                    return netA < netB ? 1 : -1
                  })
                  setQuotes(sortedQuotes)
                } else {
                  console.warn(`Adapter not found in registry: ${data.provider}`)
                  console.log(
                    'Available adapters:',
                    registry.getAllAdapters().map(a => a.getName()),
                  )
                }
              } catch (err) {
                console.error('Failed to parse SSE data:', err)
                console.error('Problematic line:', line)
                console.error('Line length:', line.length)
              }
            }
          }
        }

        // Clear soft timeout timer when stream completes
        if (softTimeoutTimer) clearTimeout(softTimeoutTimer)

        if (quotes.length === 0) {
          throw new Error('No valid quotes found for the requested swap')
        }

        streamingApiSucceeded = true
      } catch (err) {
        // Clear soft timeout timer on error
        if (softTimeoutTimer) clearTimeout(softTimeoutTimer)

        if ((err as Error).message === 'Cancelled' || signal.aborted) {
          throw new Error('Cancelled')
        }

        console.error('Failed to get quotes from streaming API:', err)
        // Don't throw - we'll try the fallback
      }

      // Fallback to client-side adapter getQuote if streaming API failed
      if (!streamingApiSucceeded) {
        console.log('Falling back to client-side adapter getQuote...')

        // Use a fresh array for fallback quotes to avoid mixing with any partial streaming results
        const fallbackQuotes: Quote[] = []

        let clientAdapters = registry.getAllAdapters().filter(a => !excludedSources.includes(a.getName()))

        if (clientAdapters.length === 0) {
          // If user unchecked all, use all adapters
          clientAdapters = registry.getAllAdapters()
        }

        // Filter adapters for cross-chain swaps (exclude KyberSwap which is for same-chain)
        const adapters = clientAdapters.filter(
          adapter =>
            adapter.getName() !== 'KyberSwap' &&
            adapter.getSupportedChains().includes(params.fromChain) &&
            adapter.getSupportedChains().includes(params.toChain),
        ) as SwapProvider[]

        // Map each adapter to a promise that can be cancelled
        const quotePromises = adapters.map(async adapter => {
          try {
            // Check for cancellation before starting
            if (signal.aborted) throw new Error('Cancelled')

            // Skip adapter if it does not support the category
            if (!adapter.canSupport(category, currencyIn, currencyOut)) {
              // reason will be logged in adapter.canSupport for specific adapter
              return
            }

            // Race between the adapter quote and timeout
            const quote = await Promise.race([adapter.getQuote(params), createTimeoutPromise(9_000)])

            // Check for cancellation after getting quote
            if (signal.aborted) throw new Error('Cancelled')

            fallbackQuotes.push({ adapter, quote })
            const sortedQuotes = [...fallbackQuotes].sort((a, b) => {
              const netA = getNetOutputAmount(a.quote)
              const netB = getNetOutputAmount(b.quote)
              return netA < netB ? 1 : -1
            })
            // Replace quotes with sorted fallback quotes (smooth transition)
            setQuotes(sortedQuotes)
            setLoading(false)
          } catch (err) {
            if ((err as Error).message === 'Cancelled' || signal.aborted) {
              throw new Error('Cancelled')
            }
            console.error(`Failed to get quote from ${adapter.getName()}:`, err)
          }
        })

        await Promise.all(quotePromises)

        if (fallbackQuotes.length === 0) {
          throw new Error('No valid quotes found for the requested swap')
        }

        // Sort by net output amount (after protocol fees)
        fallbackQuotes.sort((a, b) => {
          const netA = getNetOutputAmount(a.quote)
          const netB = getNetOutputAmount(b.quote)
          return netA < netB ? 1 : -1
        })
      }
    }

    const adaptedWallet = adaptSolanaWallet(
      solanaAddress?.toString() || CROSS_CHAIN_FEE_RECEIVER_SOLANA,
      792703809, //chain id that Relay uses to identify solana
      connection,
      connection.sendTransaction as any,
    )

    try {
      await getQuotesWithCancellation({
        feeBps,
        tokenInUsd: tokenInUsd,
        tokenOutUsd: tokenOutUsd,
        fromChain: fromChainId,
        toChain: toChainId,
        fromToken: currencyIn,
        toToken: currencyOut,
        amount: inputAmount,
        slippage,
        walletClient: (fromChainId === 'solana' ? adaptedWallet : walletClient?.data) as any,
        sender,
        recipient: receiver,
        nearTokens,
        publicKey: btcPublicKey || '',
      })
    } catch (e) {
      console.error('Error getting quotes:', e)
      if ((e as Error).message !== 'Cancelled') {
        setQuotes([])
      }
    } finally {
      setLoading(false)
      setAllLoading(false)
    }
  }, [
    sender,
    receiver,
    isFromEvm,
    isToEvm,
    btcPublicKey,
    isFromBitcoin,
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
    showPreview,
    solanaAddress,
    isFromSolana,
    isToSolana,
    connection,
    excludedSources,
    category,
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
        sender,
        receiver,
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
