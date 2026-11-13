import { useState } from 'react'

import ArrowRotate from 'components/ArrowRotate'
import { cn } from 'utils/cn'

type Props = {
  className?: string
  onClick?: () => void
}
const ReverseTokenSelectionButton = ({ className, onClick }: Props) => {
  const [rotated, setRotated] = useState(false)

  const handleClick = () => {
    onClick?.()
    setRotated(r => !r)
  }

  return (
    <button
      type="button"
      disabled={!onClick}
      aria-label="Reverse input and output"
      onClick={handleClick}
      className={cn('flex rounded-full border-0 bg-transparent p-0', className)}
    >
      <ArrowRotate rotate={rotated} className="size-7 bg-background p-1 hover:bg-buttonGray" />
    </button>
  )
}

export default ReverseTokenSelectionButton
