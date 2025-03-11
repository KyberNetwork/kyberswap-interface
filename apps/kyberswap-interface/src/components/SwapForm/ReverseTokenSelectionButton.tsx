import { useState } from 'react'
import styled from 'styled-components'

import ArrowRotate from 'components/ArrowRotate'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  margin: -18px auto;
  z-index: 10;
`

type Props = {
  onClick: () => void
}
const ReverseTokenSelectionButton: React.FC<Props> = ({ onClick }) => {
  const [rotated, setRotated] = useState(false)
  const theme = useTheme()

  const handleClick = () => {
    onClick()
    setRotated(r => !r)
  }

  return (
    <Wrapper>
      <ArrowRotate
        rotate={rotated}
        onClick={handleClick}
        style={{ width: 28, height: 28, padding: 4, background: theme.background }}
      />
    </Wrapper>
  )
}

export default ReverseTokenSelectionButton
