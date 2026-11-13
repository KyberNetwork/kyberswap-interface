import { type ReactNode, Suspense, createContext, lazy, useCallback, useContext, useState } from 'react'

import type { EvmRecipient } from 'components/SwapForm/hooks/useEvmRecipient'
import type { Chain } from 'types/crossChain'
import type { PriceImpactAction } from 'utils/prices'

import type { useCrossChainPair } from './useCrossChainPair'
import type { useCrossChainQuote } from './useCrossChainQuote'
import type { useCrossChainRecipient } from './useCrossChainRecipient'

export type CrossChainSwapOptions = {
  evmRecipient?: EvmRecipient
  enabled?: boolean
  fromChain: Chain
  toChain: Chain
  tokenIn: string
  tokenOut: string
  amount: string
  setAmount: (amount: string) => void
}

/** Identity shared by the engine boundary and its page projection. */
export const getCrossChainSwapIdentity = ({
  enabled = true,
  fromChain,
  toChain,
  tokenIn,
  tokenOut,
  amount,
}: Pick<CrossChainSwapOptions, 'enabled' | 'fromChain' | 'toChain' | 'tokenIn' | 'tokenOut' | 'amount'>) =>
  JSON.stringify([enabled, fromChain, toChain, tokenIn, tokenOut, amount])

export type CrossChainSwapState = ReturnType<typeof useCrossChainPair> &
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

const CrossChainSwapContext = createContext<CrossChainSwapState | undefined>(undefined)
const Engine = lazy(() => import('./CrossChainSwapEngine'))
type Props = CrossChainSwapOptions & { children: ReactNode }

/** Stable data boundary: mounting an engine never remounts the form or page. */
const CrossChainSwapProvider = ({ children, enabled = true, ...options }: Props) => {
  const [activated, setActivated] = useState(enabled)
  if (enabled && !activated) setActivated(true)

  const [snapshot, setSnapshot] = useState<{ identity: string; value: CrossChainSwapState }>()
  const identity = getCrossChainSwapIdentity({ enabled, ...options })
  const publish = useCallback((value: CrossChainSwapState) => setSnapshot({ identity, value }), [identity])

  const value = enabled && snapshot?.identity === identity ? snapshot.value : undefined

  return (
    <CrossChainSwapContext.Provider value={value}>
      <Suspense fallback={null}>{activated && <Engine {...options} enabled={enabled} onChange={publish} />}</Suspense>
      {children}
    </CrossChainSwapContext.Provider>
  )
}

export const useOptionalCrossChainSwap = () => useContext(CrossChainSwapContext)

export const useCrossChainSwap = () => {
  const ctx = useOptionalCrossChainSwap()
  if (!ctx) throw new Error('useCrossChainSwap requires a ready cross-chain engine')
  return ctx
}

export default CrossChainSwapProvider
