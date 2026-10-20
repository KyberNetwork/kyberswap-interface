import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useLazyCheckSameAssetQuery } from 'services/tokenCatalog'
import { parseUnits } from 'viem'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import useDebounce from 'hooks/useDebounce'
import { useGatedWalletClient } from 'hooks/useGatedWalletClient'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { adaptRelaySolanaWallet } from 'pages/CrossChainSwap/adapters/RelayAdapter/relaySolanaWallet'
import { NonEvmChain, isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { registry } from 'pages/CrossChainSwap/factory'
import { getQuotes } from 'pages/CrossChainSwap/quote/adapterQuotes'
import { getPairInfo } from 'pages/CrossChainSwap/quote/getPairInfo'
import { PairCategory } from 'pages/CrossChainSwap/quote/utils'
import { Quote } from 'pages/CrossChainSwap/registry'
import { CROSS_CHAIN_FEE_RECEIVER_SOLANA } from 'pages/CrossChainSwap/utils'
import { getQuoteWarning } from 'pages/Swap/hooks/crossChain/getQuoteWarning'
import { CrossChainPair } from 'pages/Swap/hooks/crossChain/useCrossChainPair'
import { useAppSelector } from 'state/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'

export type ReviewedQuote = Quote & { category: PairCategory }

const REFRESH_SECONDS = 10
const EMPTY_SOURCES: string[] = []
const EMPTY_QUOTE_STATE = {
  quotes: [] as Quote[],
  selectedAdapter: null as string | null,
  category: 'commonPair' as PairCategory,
  reviewQuote: null as ReviewedQuote | null,
  loading: false,
  allLoading: false,
  countdown: 0,
}

type Props = {
  pair: CrossChainPair
  amount: string
  sender: string
  receiver: string
  isReadOnly: boolean
}

/** Owns the complete quote session: inputs, stream, cancellation, refresh and preview. */
export const useCrossChainQuote = ({ pair, amount, sender, receiver, isReadOnly }: Props) => {
  const { pairKey, fromChainId, toChainId, currencyIn, currencyOut, nearTokens } = pair
  const debouncedAmount = useDebounce(amount, 500)
  const amountInWei = currencyIn ? parseUnits(debouncedAmount || '0', currencyIn.decimals).toString() : undefined
  const isAmountPending = amount !== debouncedAmount
  const walletClient = useGatedWalletClient()
  const { publicKey } = useWallet()
  const solanaAddress = publicKey?.toString() || CROSS_CHAIN_FEE_RECEIVER_SOLANA
  const { connection } = useConnection()
  const { walletInfo } = useBitcoinWallet()
  const btcPublicKey = walletInfo?.publicKey || ''
  const [slippage] = useUserSlippageTolerance()
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources) || EMPTY_SOURCES
  const [checkSameAsset] = useLazyCheckSameAssetQuery()
  const { trackingHandler } = useTracking()

  // Stable request identity includes raw input so editing immediately invalidates an old response/review.
  const request = useMemo(() => {
    const params =
      fromChainId && toChainId && currencyIn && currencyOut && amountInWei && amountInWei !== '0'
        ? {
            fromChain: fromChainId,
            toChain: toChainId,
            fromToken: currencyIn,
            toToken: currencyOut,
            amount: amountInWei,
            slippage,
            sender,
            recipient: receiver,
            nearTokens,
            publicKey: btcPublicKey,
            walletClient:
              fromChainId === NonEvmChain.Solana
                ? adaptRelaySolanaWallet(solanaAddress, 792703809, connection, async (transaction, options) => ({
                    signature: await (connection.sendTransaction as any)(transaction, options),
                  }))
                : walletClient?.data,
          }
        : null
    return { pairKey, amount, isAmountPending, params, excludedSources, isReadOnly }
  }, [
    pairKey,
    amount,
    isAmountPending,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    amountInWei,
    slippage,
    sender,
    receiver,
    nearTokens,
    btcPublicKey,
    solanaAddress,
    connection,
    walletClient?.data,
    excludedSources,
    isReadOnly,
  ])
  const disable = !request.params
  const [state, setState] = useState({ ...EMPTY_QUOTE_STATE, request, loading: !disable })
  if (state.request !== request) {
    // Reset only quote-owned state. Recipient and form state live outside this session.
    const previous = state.request.pairKey === pairKey ? state : EMPTY_QUOTE_STATE
    setState({
      ...previous,
      request,
      // Quotes from another amount/address/slippage must never become executable on a soft timeout.
      quotes: [],
      loading: !disable,
      allLoading: false,
      countdown: 0,
    })
  }
  const { quotes, selectedAdapter, reviewQuote, category, loading, allLoading, countdown } = state
  const showPreview = reviewQuote !== null
  const update = useCallback(
    (patch: Partial<typeof EMPTY_QUOTE_STATE>) => {
      setState(previous => (previous.request === request ? { ...previous, ...patch } : previous))
    },
    [request],
  )
  const runRef = useRef<(() => void) | null>(null)
  const nextManualRefreshAt = useRef(0)

  useEffect(() => {
    const { params } = request
    if (!params || request.isAmountPending || showPreview) return

    const controller = new AbortController()
    const { signal } = controller
    let running = false
    let timer: ReturnType<typeof setTimeout>
    let ticker: ReturnType<typeof setInterval> | undefined
    const run = async () => {
      if (signal.aborted || running) return
      clearTimeout(timer)
      clearInterval(ticker)
      running = true
      update({ loading: true, allLoading: true, countdown: 0 })
      // The same cancellation boundary covers pair lookup, streaming, periodic and manual refresh.
      const publish = (patch: Partial<typeof EMPTY_QUOTE_STATE>) => {
        if (!signal.aborted) update(patch)
      }
      try {
        const pairInfo = await getPairInfo({
          currencyIn: params.fromToken,
          currencyOut: params.toToken,
          fromChainId: params.fromChain,
          toChainId: params.toChain,
          checkSameAsset: params => checkSameAsset(params, true),
          signal,
        })
        if (!pairInfo || signal.aborted) return
        publish({ category: pairInfo.category })
        await getQuotes({
          quoteMode: 'stream',
          params: {
            ...params,
            feeBps: pairInfo.feeBps,
            tokenInUsd: pairInfo.tokenInUsd,
            tokenOutUsd: pairInfo.tokenOutUsd,
          },
          category: pairInfo.category,
          currencyIn: params.fromToken,
          currencyOut: params.toToken,
          excludedSources: request.excludedSources,
          registry,
          signal,
          isReadOnly: request.isReadOnly,
          onQuotes: quotes => publish({ quotes }),
          onQuoteReady: () => publish({ loading: false }),
        })
      } catch (error) {
        if (!signal.aborted && (error as Error).message !== 'Cancelled') {
          console.error('Error getting quotes:', error)
          publish({ quotes: [] })
        }
      } finally {
        running = false
        if (!signal.aborted) {
          const deadline = Date.now() + REFRESH_SECONDS * 1000
          update({ loading: false, allLoading: false, countdown: REFRESH_SECONDS * 1000 })
          ticker = setInterval(() => update({ countdown: Math.max(0, deadline - Date.now()) }), 1000)
          timer = setTimeout(() => void run(), REFRESH_SECONDS * 1000)
        }
      }
    }

    runRef.current = () => void run()
    timer = setTimeout(() => void run(), 300)
    return () => {
      controller.abort()
      runRef.current = null
      clearTimeout(timer)
      clearInterval(ticker)
    }
  }, [request, showPreview, checkSameAsset, update])

  const onRefresh = useCallback(() => {
    if (!runRef.current || Date.now() < nextManualRefreshAt.current) return
    nextManualRefreshAt.current = Date.now() + 2000
    runRef.current()
  }, [])
  const setSelectedAdapter = (selectedAdapter: string | null) => update({ selectedAdapter })
  const openReview = (quote: Quote) => {
    // Validate after the async allowance check, against the current request AND selected route.
    setState(previous => {
      const selected =
        previous.quotes.find(item => item.adapter.getName() === previous.selectedAdapter) || previous.quotes[0]
      return previous.request === request && !previous.loading && selected === quote
        ? { ...previous, reviewQuote: { ...quote, category: previous.category } }
        : previous
    })
  }
  const closeReview = () => update({ reviewQuote: null, loading: !disable })

  const trackReviewOpened = useEffectEvent((reviewedQuote: Quote) => {
    const { quote, adapter } = reviewedQuote
    trackingHandler(TRACKING_EVENT_TYPE.CC_REVIEW_OPENED, {
      from_token: quote.quoteParams.fromToken.symbol,
      to_token: quote.quoteParams.toToken.symbol,
      from_chain: quote.quoteParams.fromChain,
      to_chain: quote.quoteParams.toChain,
      amount_in: quote.inputUsd,
      amount_out_estimated: quote.outputUsd,
      routing_source: adapter.getName(),
    })
  })
  // Analytics follows only accepted previews, independently of wallet/analytics context updates.
  useEffect(() => {
    if (reviewQuote) trackReviewOpened(reviewQuote)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Effect Events are non-reactive (React 19).
  }, [reviewQuote])

  const selectedQuote = quotes.find(quote => quote.adapter.getName() === selectedAdapter) || quotes[0] || null
  const warning = getQuoteWarning({
    selectedQuote,
    category,
    isEvmPair: isEvmChain(fromChainId) && !!toChainId && isEvmChain(toChainId),
    slippage,
  })

  return {
    quotes,
    selectedQuote,
    setSelectedAdapter,
    reviewQuote,
    openReview,
    closeReview,
    showPreview,
    disable,
    loading: loading || isAmountPending,
    allLoading,
    amountInWei,
    warning,
    slippage,
    refresh: {
      countdown,
      refreshTime: REFRESH_SECONDS,
      disableRefresh: disable || showPreview || isAmountPending,
      onRefresh,
    },
  }
}
