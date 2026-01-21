import { t } from '@lingui/macro'
import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { SwapProvider } from 'pages/CrossChainSwap/adapters'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { Quote } from 'pages/CrossChainSwap/registry'

const Tag = styled.div`
  background-color: ${({ theme }) => theme.subText + '33'};
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  margin-left: 4px;
  font-size: 10px;
  padding: 2px 6px;
`

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
            {index > 0 && <Text mx="4px">+</Text>}
            <img src={provider.getIcon()} alt={provider.getName()} width={14} height={14} />
            <Text ml="4px">{provider.getName()}</Text>
          </React.Fragment>
        ))}
      </>
    )
  }

  const adapterName = adapter.getName()
  const isBeta = adapterName === 'Optimex'

  return (
    <>
      <img src={adapter.getIcon()} alt={adapterName} width={14} height={14} />
      <Text ml="4px">{adapterName}</Text>
      {isBeta && <Tag>{t`Beta`}</Tag>}
    </>
  )
}
