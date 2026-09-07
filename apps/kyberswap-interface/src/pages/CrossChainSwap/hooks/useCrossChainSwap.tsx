import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLazyCheckSameAssetQuery } from 'services/tokenCatalog'
import { parseUnits } from 'viem'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useGatedWalletClient } from 'hooks/useGatedWalletClient'
import { useCurrencyV2 } from 'hooks/useTokens'
import { BitcoinToken, Chain, Currency, NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { adaptRelaySolanaWallet } from 'pages/CrossChainSwap/adapters/RelayAdapter/relaySolanaWallet'
import { isEvmChain, isNonEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { type NearToken, useNearTokens } from 'pages/CrossChainSwap/hooks/useNearTokens'
import { useSolanaTokens } from 'pages/CrossChainSwap/hooks/useSolanaTokens'
import { getQuotes } from 'pages/CrossChainSwap/quote/adapterQuotes'
import { getPairInfo } from 'pages/CrossChainSwap/quote/getPairInfo'
import { PairCategory, isEvmCurrency } from 'pages/CrossChainSwap/quote/utils'
import { CrossChainSwapAdapterRegistry, Quote } from 'pages/CrossChainSwap/registry'
import {
  BTC_DEFAULT_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER_SOLANA,
  SOLANA_NATIVE,
} from 'pages/CrossChainSwap/utils'
import { useAppSelector } from 'state/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'

const getDefaultTokenForChain = (chain: string | null | undefined) => {
  if (chain === NonEvmChain.Near) return 'near'
  if (chain === NonEvmChain.Solana) return SOLANA_NATIVE
  if (chain && isEvmChain(+chain)) return NativeCurrencies[+chain as ChainId]?.symbol?.toLowerCase() || ''
  return ''
}

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
  const rawFrom = searchParams.get('from')
  const rawTo = searchParams.get('to')
  const rawTokenIn = searchParams.get('tokenIn')
  const rawTokenOut = searchParams.get('tokenOut')
  const [amount, setAmount] = useState('1')
  const amountDebounce = useDebounce(amount, 500)
  const { nearTokens } = useNearTokens()

  const { chainId, account } = useActiveWeb3React()
  const defaultFrom = !account ? NonEvmChain.Bitcoin : chainId?.toString() || ''
  const from = rawFrom || defaultFrom
  const defaultTo = useMemo(() => {
    const lastChainId = localStorage.getItem('crossChainSwapLastChainOut')
    if (lastChainId && lastChainId !== from) return lastChainId
    return !account || from === NonEvmChain.Bitcoin ? ChainId.MAINNET.toString() : NonEvmChain.Bitcoin
  }, [account, from])
  const to = rawTo || defaultTo
  const tokenIn = rawTokenIn || getDefaultTokenForChain(from)
  const tokenOut = rawTokenOut || getDefaultTokenForChain(to)

  useEffect(() => {
    setLoading(true)
  }, [amount])

  useEffect(() => {
    let hasUpdate = false
    if (!rawFrom) {
      searchParams.set('from', from)
      hasUpdate = true
    }

    if (!rawTo) {
      searchParams.set('to', to)
      hasUpdate = true
    }

    if (!rawTokenIn && tokenIn) {
      searchParams.set('tokenIn', tokenIn)
      hasUpdate = true
    }

    if (!rawTokenOut && tokenOut) {
      searchParams.set('tokenOut', tokenOut)
      hasUpdate = true
    }

    if (hasUpdate) {
      setSearchParams(searchParams)
    }
  }, [from, rawFrom, rawTo, rawTokenIn, rawTokenOut, searchParams, setSearchParams, to, tokenIn, tokenOut])

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
            isFromEvm && isEvmCurrency(currencyIn) ? currencyIn.wrapped.decimals : currencyIn.decimals,
          ).toString()
        : undefined,
    [currencyIn, amountDebounce, isFromEvm],
  )

  const [loading, setLoading] = useState(true)
  const [allLoading, setAllLoading] = useState(false)

  const [quotes, setQuotes] = useState<Quote[]>([])

  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null)
  const walletClient = useGatedWalletClient()
  const [slippage] = useUserSlippageTolerance()
  const [checkSameAsset] = useLazyCheckSameAssetQuery()

  const selectedQuote = useMemo(() => {
    return quotes.find(q => q.adapter.getName() === selectedAdapter) || quotes[0] || null
  }, [quotes, selectedAdapter])

  // reset selected adapter when from or to chain changes
  useEffect(() => {
    setSelectedAdapter(null)
  }, [currencyIn, currencyOut, fromChainId, toChainId])

  const [category, setCategory] = useState<PairCategory>('commonPair')
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
  const requestIdRef = useRef(0)

  // Quote ownership follows the active account. The gated client can resolve
  // later (or fail independently) and is only required when executing.
  const evmWalletAddress = account

  const resolveAddress = (chain: Chain | undefined, role: 'sender' | 'receiver') => {
    const recipientAddress = role === 'receiver' ? recipient : undefined

    switch (chain) {
      case NonEvmChain.Solana:
        return recipientAddress || solanaAddress?.toString() || CROSS_CHAIN_FEE_RECEIVER_SOLANA
      case NonEvmChain.Bitcoin:
        return recipientAddress || (role === 'sender' ? btcAddress : undefined) || BTC_DEFAULT_RECEIVER
      case NonEvmChain.Near:
        return recipientAddress || signedAccountId || ZERO_ADDRESS
      default:
        return recipientAddress || evmWalletAddress || CROSS_CHAIN_FEE_RECEIVER
    }
  }

  const sender = resolveAddress(fromChainId, 'sender')
  const receiver = resolveAddress(toChainId, 'receiver')

  const getQuote = useCallback(async () => {
    if (showPreview) return
    if (disable) {
      requestIdRef.current += 1
      abortControllerRef.current.abort()
      setQuotes([])
      setSelectedAdapter(null)
      setLoading(false)
      setAllLoading(false)
      return
    }

    // Keep placeholder quotes visible, but never allow that request snapshot
    // to become executable after the wallet state resolves.
    const requestIsReadOnly = (isFromEvm && !evmWalletAddress) || (isToEvm && !recipient && !evmWalletAddress)

    abortControllerRef.current.abort()
    const requestId = ++requestIdRef.current
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    const pairInfo = await getPairInfo({
      currencyIn,
      currencyOut,
      fromChainId,
      toChainId,
      checkSameAsset: params => checkSameAsset(params, true),
      signal,
    })
    if (!pairInfo || signal.aborted) return

    setCategory(pairInfo.category)
    setLoading(true)
    setAllLoading(true)

    const adaptedWallet = adaptRelaySolanaWallet(
      solanaAddress?.toString() || CROSS_CHAIN_FEE_RECEIVER_SOLANA,
      792703809, // chain id that Relay uses to identify Solana
      connection,
      async (transaction, options) => ({
        signature: await (connection.sendTransaction as any)(transaction, options),
      }),
    )

    try {
      await getQuotes({
        params: {
          feeBps: pairInfo.feeBps,
          tokenInUsd: pairInfo.tokenInUsd,
          tokenOutUsd: pairInfo.tokenOutUsd,
          fromChain: fromChainId,
          toChain: toChainId,
          fromToken: currencyIn,
          toToken: currencyOut,
          amount: inputAmount,
          slippage,
          walletClient: fromChainId === NonEvmChain.Solana ? adaptedWallet : walletClient?.data,
          sender,
          recipient: receiver,
          nearTokens,
          publicKey: btcPublicKey || '',
        },
        category: pairInfo.category,
        currencyIn,
        currencyOut,
        excludedSources,
        registry,
        signal,
        isReadOnly: requestIsReadOnly,
        onQuotes: setQuotes,
        onQuoteReady: () => setLoading(false),
      })
    } catch (error) {
      if ((error as Error).message !== 'Cancelled') {
        console.error('Error getting quotes:', error)
        setQuotes([])
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
        setAllLoading(false)
      }
    }
  }, [
    sender,
    receiver,
    recipient,
    evmWalletAddress,
    isFromEvm,
    isToEvm,
    btcPublicKey,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    inputAmount,
    walletClient?.data,
    disable,
    slippage,
    nearTokens,
    showPreview,
    solanaAddress,
    connection,
    excludedSources,
    checkSameAsset,
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
