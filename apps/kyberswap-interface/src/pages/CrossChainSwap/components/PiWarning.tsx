import { ErrorWarning } from 'components/ErrorWarning'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'

export const PiWarning = () => {
  const { warning } = useCrossChainSwap()
  if (!warning?.priceImpaceInfo?.message) return null

  return (
    <ErrorWarning
      type={warning.priceImpaceInfo.isVeryHigh ? 'error' : 'warn'}
      title={warning.priceImpaceInfo.message}
    />
  )
}
