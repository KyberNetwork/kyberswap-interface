import { ErrorWarning } from 'components/ErrorWarning'
import { useKyberCrossSwap } from 'pages/KyberCross/hooks/useKyberCrossSwap'
import type { Quote } from 'pages/Swap/crossChain/registry'

export const PiWarning = ({ quote }: { quote?: Quote | null }) => {
  const { selectedQuote, getQuotePriceImpactInfo } = useKyberCrossSwap()
  const priceImpactInfo = getQuotePriceImpactInfo(quote === undefined ? selectedQuote : quote)
  if (!priceImpactInfo?.message) return null

  return <ErrorWarning type={priceImpactInfo.isVeryHigh ? 'error' : 'warn'} title={priceImpactInfo.message} />
}
