import type { ReactNode } from 'react'

import type { Quote } from 'pages/Swap/crossChain/registry'

export const QuoteProviderName = ({ quote: { adapter }, iconAfter }: { quote: Quote; iconAfter?: ReactNode }) => (
  <span className="inline-flex items-center gap-1 whitespace-nowrap">
    {adapter.getIcon && <img src={adapter.getIcon()} alt="" width={14} height={14} className="shrink-0" />}
    {iconAfter}
    <span className="font-medium">{adapter.getName()}</span>
  </span>
)
