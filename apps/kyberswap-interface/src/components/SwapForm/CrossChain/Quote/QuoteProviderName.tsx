import type { ReactNode } from 'react'
import type { Quote } from 'services/crossChain/registry'

export const QuoteProviderName = ({ quote: { adapter }, iconBefore }: { quote: Quote; iconBefore?: ReactNode }) => (
  <span className="inline-flex items-center gap-1 whitespace-nowrap">
    {iconBefore}
    {adapter.getIcon && <img src={adapter.getIcon()} alt="" width={14} height={14} className="shrink-0" />}
    <span className="font-medium">{adapter.getName()}</span>
  </span>
)
