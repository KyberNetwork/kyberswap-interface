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
    <div className="z-20 mx-auto my-[-18px]">
      <ArrowRotate rotate={rotated} onClick={handleClick} className="size-7 bg-background p-1" />
    </div>
  )
}

export default ReverseTokenSelectionButton
