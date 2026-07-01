import React from 'react'

import { SwapProvider } from 'pages/CrossChainSwap/adapters'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'

const getStepProviders = (quote: Quote): SwapProvider[] => {
  if (quote.adapter.getName().toLowerCase() !== 'kyberacross') return []

  const steps = quote.quote.rawQuote?.steps
  if (!Array.isArray(steps)) return []

  return steps
    .map(step => {
      const providerName = typeof step?.provider === 'string' ? step.provider : null
      const providerAdapter = registry.getAdapter(providerName)
      return providerAdapter
    })
    .filter(Boolean) as SwapProvider[]
}

export const QuoteProviderName = ({ quote }: { quote: Quote }) => {
  const stepProviders = getStepProviders(quote)
  const adapter = quote.adapter

  if (stepProviders.length > 0) {
    return (
      <>
        {stepProviders.map((provider, index) => (
          <React.Fragment key={provider.getName()}>
            {index > 0 && <span className="mx-1">+</span>}
            <img src={provider.getIcon()} alt={provider.getName()} width={14} height={14} />
            <span className="ml-1">{provider.getName()}</span>
          </React.Fragment>
        ))}
      </>
    )
  }

  const adapterName = adapter.getName()

  return (
    <>
      <img src={adapter.getIcon()} alt={adapterName} width={14} height={14} />
      <span className="ml-1">{adapterName}</span>
    </>
  )
}
