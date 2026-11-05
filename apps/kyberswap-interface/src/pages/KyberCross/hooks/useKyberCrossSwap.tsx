import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { kyberCrossSupportedChains } from 'services/crossChain/adapters/KyberCrossAdapter/types'
import { getPriceImpactInfo } from 'services/crossChain/quote/priceImpact'
import { isEvmCurrency } from 'services/crossChain/quote/utils'
import type { Quote } from 'services/crossChain/registry'

import { useCrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { useCrossChainRecipient } from 'components/SwapForm/CrossChain/hooks/useCrossChainRecipient'
import type { CrossChainSwapOptions } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { useKyberCrossQuote } from 'pages/KyberCross/hooks/useKyberCrossQuote'

const useKyberCrossController = ({
  fromChain,
  toChain,
  tokenIn,
  tokenOut,
  amount,
  setAmount,
}: CrossChainSwapOptions) => {
  const pair = useCrossChainPair({ fromChainId: fromChain, toChainId: toChain, tokenIn, tokenOut })
  const recipient = useCrossChainRecipient(fromChain, toChain)
  const gasDropSupported =
    fromChain !== toChain &&
    kyberCrossSupportedChains.includes(fromChain as ChainId) &&
    kyberCrossSupportedChains.includes(toChain as ChainId) &&
    !!pair.currencyOut &&
    isEvmCurrency(pair.currencyOut) &&
    !pair.currencyOut.isNative
  const gasDropKey = JSON.stringify([toChain, tokenOut, recipient.receiver])
  const routeKey = JSON.stringify([gasDropKey, fromChain, tokenIn, amount])
  const [selection, setSelection] = useState({ key: gasDropKey, enabled: true })
  const [failure, setFailure] = useState({ key: '', message: '' })
  const gasDropEnabled = gasDropSupported && selection.key === gasDropKey && selection.enabled
  useEffect(() => setSelection({ key: gasDropKey, enabled: true }), [gasDropKey, gasDropSupported])

  const setGasDropEnabled = (enabled: boolean) => {
    setSelection({ key: gasDropKey, enabled })
    setFailure({ key: '', message: '' })
  }
  const quote = useKyberCrossQuote({
    pair,
    amount,
    sender: recipient.sender,
    receiver: recipient.receiver,
    isReadOnly: recipient.isReadOnly,
    gasDropEnabled,
    onGasDropUnavailable: message => {
      setSelection({ key: gasDropKey, enabled: false })
      setFailure({ key: routeKey, message })
    },
  })

  return {
    ...pair,
    ...recipient,
    ...quote,
    amount,
    setAmount,
    gasDropEnabled,
    gasDropSupported,
    setGasDropEnabled,
    gasDropError: failure.key === routeKey ? failure.message : '',
    getQuotePriceImpactInfo: (item?: Quote | null) =>
      item
        ? getPriceImpactInfo(
            item.quote.priceImpact,
            quote.reviewQuote?.category || quote.category,
            typeof fromChain === 'number' && typeof toChain === 'number',
          )
        : null,
  }
}

const KyberCrossContext = createContext<ReturnType<typeof useKyberCrossController> | undefined>(undefined)

export const KyberCrossProvider = ({ children, ...options }: CrossChainSwapOptions & { children: ReactNode }) => {
  const controller = useKyberCrossController(options)
  return <KyberCrossContext.Provider value={controller}>{children}</KyberCrossContext.Provider>
}

export const useKyberCrossSwap = () => {
  const context = useContext(KyberCrossContext)
  if (!context) throw new Error('useKyberCrossSwap must be used within KyberCrossProvider')
  return context
}
