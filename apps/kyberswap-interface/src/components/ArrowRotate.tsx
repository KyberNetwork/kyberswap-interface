import { CSSProperties } from 'react'
import { ChevronDown } from 'react-feather'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { Swap as SwapIcon } from 'components/Icons'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

export default function ArrowRotate({
  rotate,
  onClick,
  isVertical = false,
  style = {},
}: {
  rotate: boolean
  onClick?: () => void
  isVertical?: boolean
  style?: CSSProperties
}) {
  const theme = useTheme()
  const rotation = isVertical ? (rotate ? '270deg' : '90deg') : rotate ? '180deg' : '0deg'
  return (
    <div
      onClick={onClick}
      style={{ ...style, transform: `rotate(${rotation})` }}
      className={cn(
        'flex size-10 items-center justify-center rounded-full bg-buttonBlack p-2 transition-transform duration-300',
        onClick && 'cursor-pointer hover:opacity-80',
      )}
    >
      <SwapIcon size={24} color={theme.subText} />
    </div>
  )
}

export const DropdownArrowIcon = ({
  rotate,
  size = 24,
  color,
  arrow = 'arrow',
}: {
  rotate?: boolean
  size?: number
  color?: string
  arrow?: 'chevron' | 'arrow'
}) => (
  <div
    style={{ width: size, height: size, color }}
    className={cn('transition-transform duration-300 [&_path]:fill-current', rotate && '-rotate-180')}
  >
    {arrow === 'chevron' ? <ChevronDown width={size} height={size} color={color} /> : <DropdownSVG width={size} />}
  </div>
)
