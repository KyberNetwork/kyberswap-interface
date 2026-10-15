import React from 'react'

import type { KyberCrossRawQuote } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/types'
import { getKyberCrossRoutePlan } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/utils'
import { CrossChainSource, CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'

const KYBER_CROSS_ADAPTER_NAME = 'kybercross'

const getKyberCrossBridgeProviderName = (quote: Quote): string | undefined => {
  const rawQuote = quote.quote.rawQuote as KyberCrossRawQuote | undefined

  return getKyberCrossRoutePlan(rawQuote)?.bridge.provider
}

const getQuoteProviders = (quote: Quote): CrossChainSource[] => {
  const adapter = quote.adapter
  const adapterName = adapter.getName().toLowerCase()

  if (adapterName === KYBER_CROSS_ADAPTER_NAME) {
    const bridgeProviderName = getKyberCrossBridgeProviderName(quote)
    const bridgeProvider =
      CrossChainSwapFactory.getKyberCrossBridgeSource(bridgeProviderName) || registry.getAdapter(bridgeProviderName)

    return bridgeProvider ? [adapter, bridgeProvider] : [adapter]
  }

  return [adapter]
}

export const QuoteProviderName = ({ quote }: { quote: Quote }) => {
  const providers = getQuoteProviders(quote)

  return (
    <span className="inline-flex items-center gap-1.5">
      {providers.map((provider, index) => (
        <React.Fragment key={`${provider.getName()}-${index}`}>
          {index > 0 && <span>x</span>}
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            {provider.getIcon && <img src={provider.getIcon()} alt="" width={14} height={14} className="shrink-0" />}
            <span>{provider.getName()}</span>
          </span>
        </React.Fragment>
      ))}
    </span>
  )
}
