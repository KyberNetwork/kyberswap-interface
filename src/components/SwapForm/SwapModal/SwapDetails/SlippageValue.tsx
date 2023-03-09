import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { checkWarningSlippage, formatSlippage } from 'utils/slippage'

const SlippageValue: React.FC = () => {
  const theme = useTheme()
  const { slippage } = useSwapFormContext()
  const isWarning = checkWarningSlippage(slippage)
  return (
    <TYPE.black fontSize={14} color={isWarning ? theme.warning : undefined}>
      {formatSlippage(slippage)}
    </TYPE.black>
  )
}

export default SlippageValue
