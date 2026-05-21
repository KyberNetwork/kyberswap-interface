import { CSSProperties, forwardRef } from 'react'

import { cn } from 'utils/cn'

type Props = {
  text?: string | React.ReactNode
  active?: boolean
  onClick?: () => void
  style?: CSSProperties
  separator?: boolean
  className?: string
}

const TabButton = forwardRef<HTMLDivElement, Props>(function TabButton(
  { text, active, onClick, style, separator, className },
  ref,
) {
  return (
    <div
      onClick={onClick}
      style={style}
      ref={ref}
      className={cn(
        'box-border flex h-10 flex-1 cursor-pointer select-none items-center justify-center text-xs leading-4 transition-all duration-200 ease-linear hover:brightness-125',
        active
          ? 'bg-primary-25 text-primary shadow-[inset_0_-2px_0_0_var(--ks-primary)]'
          : 'bg-background text-subText',
        // Vertical separator (only on inactive tabs)
        separator &&
          !active &&
          "relative before:absolute before:left-0 before:h-4 before:border before:border-border before:content-['']",
        className,
      )}
    >
      {text}
    </div>
  )
})

export default TabButton
