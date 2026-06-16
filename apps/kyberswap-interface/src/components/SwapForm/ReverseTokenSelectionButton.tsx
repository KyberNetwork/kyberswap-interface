import { useState } from 'react'

import ArrowRotate from 'components/ArrowRotate'
import { cn } from 'utils/cn'

type Props = {
  className?: string
  onClick: () => void
}
const ReverseTokenSelectionButton: React.FC<Props> = ({ className, onClick }) => {
  const [rotated, setRotated] = useState(false)

  const handleClick = () => {
    onClick()
    setRotated(r => !r)
  }

  return (
    <ArrowRotate
      rotate={rotated}
      onClick={handleClick}
      className={cn('mx-auto size-7 bg-background p-1 hover:bg-buttonGray', className)}
    />
  )
}

export default ReverseTokenSelectionButton
