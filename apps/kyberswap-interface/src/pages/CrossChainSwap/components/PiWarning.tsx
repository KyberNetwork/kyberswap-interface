import WarningIcon from 'components/Icons/WarningIcon'
import useTheme from 'hooks/useTheme'

import { useCrossChainSwap } from '../hooks/useCrossChainSwap'

export const PiWarning = () => {
  const { warning } = useCrossChainSwap()
  const theme = useTheme()
  if (!warning?.priceImpaceInfo || !warning?.priceImpaceInfo?.message) return null

  const isVeryHigh = warning.priceImpaceInfo.isVeryHigh
  const color = isVeryHigh ? theme.red : theme.warning

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs ${
        isVeryHigh ? 'bg-red/10 text-red' : 'bg-warning/10 text-warning'
      }`}
    >
      <WarningIcon color={color} size={18} />
      {warning.priceImpaceInfo?.message}
    </div>
  )
}
