import { ErrorWarning } from 'components/ErrorWarning'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import type { Quote } from 'pages/CrossChainSwap/registry'

export const PiWarning = ({ quote }: { quote?: Quote | null }) => {
  const { selectedQuote, getQuotePriceImpactInfo } = useCrossChainSwap()
  const priceImpactInfo = getQuotePriceImpactInfo(quote === undefined ? selectedQuote : quote)
  if (!priceImpactInfo?.message) return null

  return <ErrorWarning type={priceImpactInfo.isVeryHigh ? 'error' : 'warn'} title={priceImpactInfo.message} />
}
