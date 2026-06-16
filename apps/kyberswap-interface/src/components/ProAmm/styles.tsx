import { Swap2 as SwapIcon } from 'components/Icons'
import { cn } from 'utils/cn'

export const RotateSwapIcon = ({ rotated, size = 14 }: { rotated: boolean; size: number }) => (
  <div
    className={cn(
      'flex size-fit cursor-pointer items-center justify-center transition-transform duration-300 hover:opacity-80',
      rotated && 'rotate-180',
    )}
  >
    <SwapIcon size={size} />
  </div>
)
