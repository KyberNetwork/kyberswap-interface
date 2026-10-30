import type { Quote } from 'pages/Swap/crossChain/registry'

export const QuoteProviderName = ({ quote: { adapter } }: { quote: Quote }) => (
  <span className="inline-flex items-center gap-1 whitespace-nowrap">
    {adapter.getIcon && <img src={adapter.getIcon()} alt="" width={14} height={14} className="shrink-0" />}
    <span className="font-medium">{adapter.getName()}</span>
  </span>
)
