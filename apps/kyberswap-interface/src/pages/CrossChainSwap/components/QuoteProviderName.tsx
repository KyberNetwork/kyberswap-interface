import React from 'react'

import { SwapProvider } from 'pages/CrossChainSwap/adapters'
import type { KyberCrossRawQuote } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/types'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'

const KYBER_CROSS_ADAPTER_NAME = 'kybercross'

const getKyberCrossBridgeProviderName = (quote: Quote): string | undefined => {
  const rawQuote = quote.quote.rawQuote as KyberCrossRawQuote | undefined

  return rawQuote?.data?.route_plans?.[0]?.bridge?.provider
}

const getQuoteProviders = (quote: Quote): SwapProvider[] => {
  const adapter = quote.adapter
  const adapterName = adapter.getName().toLowerCase()

  if (adapterName === KYBER_CROSS_ADAPTER_NAME) {
    const bridgeProviderName = getKyberCrossBridgeProviderName(quote)
    const bridgeProvider = registry.getAdapter(bridgeProviderName)

    return bridgeProvider ? [adapter, bridgeProvider] : [adapter]
  }

  return [adapter]
}

export const QuoteProviderName = ({ quote }: { quote: Quote }) => {
  const providers = getQuoteProviders(quote)

  return (
    <>
      {providers.map((provider, index) => (
        <React.Fragment key={`${provider.getName()}-${index}`}>
          {index > 0 && <span className="mx-1">x</span>}
          <img src={provider.getIcon()} alt={provider.getName()} width={14} height={14} />
          <span className="ml-1">{provider.getName()}</span>
        </React.Fragment>
      ))}
    </>
  )
}
