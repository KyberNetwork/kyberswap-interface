import { useState } from 'react'

import ArrowRotate from 'components/ArrowRotate'

type Props = {
  onClick: () => void
}
const ReverseTokenSelectionButton: React.FC<Props> = ({ onClick }) => {
  const [rotated, setRotated] = useState(false)

  return (
    <ArrowRotate
      rotate={rotated}
      onClick={() => {
        onClick()
        setRotated(r => !r)
      }}
    />
  )
}

export default ReverseTokenSelectionButton
