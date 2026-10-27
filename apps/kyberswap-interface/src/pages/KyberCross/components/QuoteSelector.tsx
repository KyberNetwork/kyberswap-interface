import { t } from '@lingui/macro'
import { DollarSign, Star, Zap } from 'react-feather'

import { HStack } from 'components/Stack'
import { CrossChainQuoteSelectorView } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSelector'
import { MouseoverTooltip } from 'components/Tooltip'
import { useKyberCrossSwap } from 'pages/KyberCross/hooks/useKyberCrossSwap'
import { getKyberCrossRoutePlan } from 'pages/Swap/crossChain/adapters/KyberCrossAdapter/utils'
import { Currency } from 'pages/Swap/crossChain/adapters/types'
import { Quote } from 'pages/Swap/crossChain/registry'

const RouteTags = ({ quote }: { quote: Quote }) => {
  const tags = getKyberCrossRoutePlan(quote.quote.rawQuote)?.tags || []
  const entries = [
    { tag: 'RECOMMENDED', label: t`Recommended`, Icon: Star },
    { tag: 'FASTEST', label: t`Fastest`, Icon: Zap },
    { tag: 'BEST_OUTPUT', label: t`Best Output`, Icon: DollarSign },
  ]
  return (
    <HStack className="shrink-0 items-center gap-1">
      {entries
        .filter(entry => tags.includes(entry.tag))
        .map(({ tag, label, Icon }) => (
          <MouseoverTooltip key={tag} text={label} width="max-content" placement="top" noArrow>
            <span
              aria-label={label}
              className="flex size-6 items-center justify-center rounded bg-primary-20 text-primary"
            >
              <Icon size={16} aria-hidden="true" />
            </span>
          </MouseoverTooltip>
        ))}
    </HStack>
  )
}

type Props = { quotes: Quote[]; selectedQuote: Quote; onChange: (quote: Quote) => void; tokenOut?: Currency }
export const QuoteSelector = (props: Props) => {
  const { loading, allLoading, disable } = useKyberCrossSwap()
  return (
    <CrossChainQuoteSelectorView
      {...props}
      isLoading={!disable && (loading || allLoading)}
      routeBadge={quote => <RouteTags quote={quote} />}
    />
  )
}
