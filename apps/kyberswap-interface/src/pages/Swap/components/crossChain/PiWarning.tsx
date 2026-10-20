import { ErrorWarning } from 'components/ErrorWarning'
import type { getQuoteWarning } from 'pages/Swap/hooks/crossChain/getQuoteWarning'

export const PiWarning = ({ warning }: { warning: ReturnType<typeof getQuoteWarning> }) => {
  if (!warning?.priceImpactInfo?.message) return null

  return (
    <ErrorWarning
      type={warning.priceImpactInfo.isVeryHigh ? 'error' : 'warn'}
      title={warning.priceImpactInfo.message}
    />
  )
}
