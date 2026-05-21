import { useState } from 'react'

import ArrowRotate from 'components/ArrowRotate'

type Props = {
  onClick: () => void
}
const ReverseTokenSelectionButton: React.FC<Props> = ({ onClick }) => {
  const [rotated, setRotated] = useState(false)

  const handleClick = () => {
    onClick()
    setRotated(r => !r)
  }

  return (
    <div className="z-10 mx-auto my-[-18px]">
      <ArrowRotate
        rotate={rotated}
        onClick={handleClick}
        style={{ width: 28, height: 28, padding: 4, background: 'var(--ks-background)' }}
      />
    </div>
  )
}

export default ReverseTokenSelectionButton
