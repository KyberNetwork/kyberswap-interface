import { rgba } from 'polished'
import { CSSProperties } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components'

import { useUserSlippageTolerance } from 'state/user/hooks'
import { checkRangeSlippage } from 'utils/slippage'

const Wrapper = styled.div`
  padding: 12px 16px;

  display: flex;
  align-items: center;

  border-radius: 999px;
  color: ${({ theme }) => theme.warning};
  background: ${({ theme }) => rgba(theme.warning, 0.2)};
  font-size: 12px;
`

type Props = {
  style?: CSSProperties
}
const SlippageNote: React.FC<Props> = ({ style }) => {
  const [rawSlippage] = useUserSlippageTolerance()
  const { isValid, message } = checkRangeSlippage(rawSlippage)

  if (!isValid || !message) {
    return null
  }

  return (
    <Wrapper style={style}>
      <AlertTriangle size={16} style={{ marginRight: '10px' }} />
      {message}
    </Wrapper>
  )
}

export default SlippageNote
