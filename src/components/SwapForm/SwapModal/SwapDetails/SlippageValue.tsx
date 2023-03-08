import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { checkRangeSlippage, formatSlippage } from 'utils/slippage'

type Props = {
  value: number
  isStableCoinSwap: boolean
}

const SlippageValue: React.FC<Props> = ({ value, isStableCoinSwap }) => {
  const theme = useTheme()
  const { isValid, message } = checkRangeSlippage(value, isStableCoinSwap)
  const isWarning = isValid && !!message
  return (
    <TYPE.black fontSize={14} color={isWarning ? theme.warning : undefined}>
      {formatSlippage(value, true)}
    </TYPE.black>
  )
}

export default SlippageValue
