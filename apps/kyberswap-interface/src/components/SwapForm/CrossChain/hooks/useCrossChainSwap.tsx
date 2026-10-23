import { ReactNode, createContext, useContext } from 'react'

import { useCrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { useCrossChainQuote } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuote'
import { useCrossChainRecipient } from 'components/SwapForm/CrossChain/hooks/useCrossChainRecipient'
import { Chain } from 'pages/CrossChainSwap/adapters/types'
import { useRestoreMyNearWalletPendingTransaction } from 'pages/CrossChainSwap/hooks/useRestoreMyNearWalletPendingTransaction'

export type CrossChainSwapOptions = {
  fromChain: Chain
  toChain: Chain
  tokenIn: string
  tokenOut: string
  amount: string
  onAmountChange: (amount: string) => void
}

type CrossChainSwapContext = ReturnType<typeof useCrossChainPair> &
  ReturnType<typeof useCrossChainRecipient> &
  ReturnType<typeof useCrossChainQuote> & {
    amount: string
    setAmount: (amount: string) => void
  }

const CrossChainSwapContext = createContext<CrossChainSwapContext | undefined>(undefined)

type Props = CrossChainSwapOptions & { children: ReactNode }

const CrossChainSwapProvider = ({
  children,
  amount,
  onAmountChange: setAmount,
  fromChain,
  toChain,
  tokenIn,
  tokenOut,
}: Props) => {
  useRestoreMyNearWalletPendingTransaction()
  const pair = useCrossChainPair({ fromChainId: fromChain, toChainId: toChain, tokenIn, tokenOut })
  const recipient = useCrossChainRecipient(pair.fromChainId, pair.toChainId)
  const quote = useCrossChainQuote({
    pair,
    amount,
    sender: recipient.sender,
    receiver: recipient.receiver,
    isReadOnly: recipient.isReadOnly,
  })

  return (
    <CrossChainSwapContext.Provider value={{ ...pair, ...recipient, ...quote, amount, setAmount }}>
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
