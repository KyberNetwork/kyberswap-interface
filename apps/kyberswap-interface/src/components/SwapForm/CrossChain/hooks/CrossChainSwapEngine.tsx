import { memo, useLayoutEffect, useRef } from 'react'
import { isQuoteExecutable } from 'services/crossChain/utils'

import { useCrossChainExecution } from 'components/SwapForm/CrossChain/hooks/useCrossChainExecution'
import { useCrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { useCrossChainQuote } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuote'
import { useCrossChainRecipient } from 'components/SwapForm/CrossChain/hooks/useCrossChainRecipient'
import { usePriceImpactDegenMode } from 'components/SwapForm/SwapActionButton/usePriceImpactDegenMode'
import { checkPriceImpact } from 'utils/prices'

import type { CrossChainSwapOptions, CrossChainSwapState } from './useCrossChainSwap'

type Props = CrossChainSwapOptions & { onChange: (value: CrossChainSwapState) => void }

const CrossChainSwapEngine = ({
  onChange,
  enabled = true,
  evmRecipient,
  amount,
  setAmount,
  fromChain,
  toChain,
  tokenIn,
  tokenOut,
}: Props) => {
  const pair = useCrossChainPair({ fromChainId: fromChain, toChainId: toChain, tokenIn, tokenOut })
  const recipient = useCrossChainRecipient(pair.fromChainId, pair.toChainId, evmRecipient)

  const quote = useCrossChainQuote({
    enabled,
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
      !enabled ||
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
    if (!enabled || !quote.reviewQuote || isSubmitting) return
    if (requiresDegenMode(quote.reviewQuote.quote.priceImpact)) {
      closeReview()
      requestDegenMode()
      return
    }
    void submitSwap()
  }

  useLayoutEffect(() => {
    onChange({
      ...pair,
      ...recipient,
      ...quote,
      isSubmitting,
      txHash,
      txError,
      openReview,
      priceImpactAction,
      reviewHasVeryHighPriceImpact,
      confirmSwap,
      closeReview,
      amount,
      setAmount,
    })
  })

  return null
}

// Publishing context updates must not rerender the engine with unchanged inputs.
export default memo(CrossChainSwapEngine)
