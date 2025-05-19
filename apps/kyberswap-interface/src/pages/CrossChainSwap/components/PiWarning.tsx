import useTheme from 'hooks/useTheme'
import { useCrossChainSwap } from '../hooks/useCrossChainSwap'
import { Flex } from 'rebass'
import WarningIcon from 'components/Icons/WarningIcon'
import { rgba } from 'polished'

export const PiWarning = () => {
  const { warning } = useCrossChainSwap()
  const theme = useTheme()
  if (!warning?.priceImpaceInfo?.message) return null

  return (
    <Flex
      sx={{
        backgroundColor: rgba(warning.priceImpaceInfo.isVeryHigh ? theme.red : theme.warning, 0.1),
        borderRadius: '999px',
        padding: '8px 12px',
        fontSize: '12px',
        gap: '4px',
        color: warning.priceImpaceInfo.isVeryHigh ? theme.red : theme.warning,
      }}
    >
      <WarningIcon color={warning.priceImpaceInfo.isVeryHigh ? theme.red : theme.warning} size={18} />
      {warning.priceImpaceInfo?.message}
    </Flex>
  )
}
