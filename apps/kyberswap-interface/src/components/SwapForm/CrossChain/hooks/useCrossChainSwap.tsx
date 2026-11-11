import { ReactNode, createContext, useContext, useLayoutEffect, useRef } from 'react'
import { isQuoteExecutable } from 'services/crossChain/utils'

import { useCrossChainExecution } from 'components/SwapForm/CrossChain/hooks/useCrossChainExecution'
import { useCrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { useCrossChainQuote } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuote'
import { useCrossChainRecipient } from 'components/SwapForm/CrossChain/hooks/useCrossChainRecipient'
import { usePriceImpactDegenMode } from 'components/SwapForm/SwapActionButton/usePriceImpactDegenMode'
import { Chain } from 'types/crossChain'
import { type PriceImpactAction, checkPriceImpact } from 'utils/prices'

export type CrossChainSwapOptions = {
  fromChain: Chain
  toChain: Chain
  tokenIn: string
  tokenOut: string
  amount: string
  setAmount: (amount: string) => void
}

type CrossChainSwapContext = ReturnType<typeof useCrossChainPair> &
  ReturnType<typeof useCrossChainRecipient> &
  Omit<ReturnType<typeof useCrossChainQuote>, 'openReview'> & {
    openReview: (checkAllowance: () => Promise<boolean>) => Promise<void>
    priceImpactAction: PriceImpactAction
    reviewHasVeryHighPriceImpact: boolean
    isSubmitting: boolean
    txHash: string
    txError: string
    confirmSwap: () => void
    amount: string
    setAmount: (amount: string) => void
  }

const CrossChainSwapContext = createContext<CrossChainSwapContext | undefined>(undefined)

type Props = CrossChainSwapOptions & { children: ReactNode }

const CrossChainSwapProvider = ({ children, amount, setAmount, fromChain, toChain, tokenIn, tokenOut }: Props) => {
  const pair = useCrossChainPair({ fromChainId: fromChain, toChainId: toChain, tokenIn, tokenOut })
  const recipient = useCrossChainRecipient(pair.fromChainId, pair.toChainId)

  const quote = useCrossChainQuote({
    pair,
    amount,
    sender: recipient.sender,
    receiver: recipient.receiver,
    isReadOnly: recipient.isReadOnly,
  })

  const { isSubmitting, txHash, txError, submitSwap, resetSubmission } = useCrossChainExecution(quote.reviewQuote)

  const { priceImpactAction, requiresDegenMode, requestDegenMode } = usePriceImpactDegenMode(
    quote.selectedQuote?.quote.priceImpact,
  )
  const reviewedImpact = checkPriceImpact(quote.reviewQuote?.quote.priceImpact)
  const reviewHasVeryHighPriceImpact = reviewedImpact.isVeryHigh || reviewedImpact.isInvalid
  const pendingReview = useRef<symbol | null>(null)

  useLayoutEffect(() => {
    pendingReview.current = null
    return () => {
      pendingReview.current = null
    }
  }, [quote.selectedQuote, recipient.sender, recipient.receiver, recipient.isReadOnly])

  const closeReview = () => {
    pendingReview.current = null
    resetSubmission()
    quote.closeReview()
  }

  const openReview = async (checkAllowance: () => Promise<boolean>) => {
    const selectedQuote = quote.selectedQuote
    if (
      pendingReview.current ||
      quote.showPreview ||
      isSubmitting ||
      quote.loading ||
      recipient.isReadOnly ||
      !selectedQuote ||
      !isQuoteExecutable(selectedQuote, recipient.sender, recipient.receiver)
    )
      return

    if (requiresDegenMode(selectedQuote.quote.priceImpact)) {
      requestDegenMode()
      return
    }

    const attempt = Symbol('open review')
    pendingReview.current = attempt
    try {
      const approved = await checkAllowance()
      if (pendingReview.current !== attempt || !approved) return
      if (requiresDegenMode(selectedQuote.quote.priceImpact)) {
        requestDegenMode()
        return
      }
      quote.openReview(selectedQuote)
    } finally {
      if (pendingReview.current === attempt) pendingReview.current = null
    }
  }

  const confirmSwap = () => {
    if (!quote.reviewQuote || isSubmitting) return
    if (requiresDegenMode(quote.reviewQuote.quote.priceImpact)) {
      closeReview()
      requestDegenMode()
      return
    }
    void submitSwap()
  }

  return (
    <CrossChainSwapContext.Provider
      value={{
        ...pair,
        ...recipient,
        ...quote,
        isSubmitting: isSubmitting,
        txHash,
        txError,
        openReview,
        priceImpactAction,
        reviewHasVeryHighPriceImpact,
        confirmSwap,
        closeReview,
        amount,
        setAmount,
      }}
    >
      {children}
    </CrossChainSwapContext.Provider>
  )
}

export const useCrossChainSwap = () => {
  const ctx = useContext(CrossChainSwapContext)

  if (!ctx) throw new Error('useCrossChainSwap must be used within CrossChainSwapProvider')

  return ctx
}

export default CrossChainSwapProvider
