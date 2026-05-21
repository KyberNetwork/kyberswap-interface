import { ButtonHTMLAttributes, HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

export const PoolsPageWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full max-w-[1500px] flex-col gap-5 px-6 pb-12 pt-8 max-sm:px-4 max-sm:pb-24 max-sm:pt-6',
        className,
      )}
      {...rest}
    />
  ),
)
PoolsPageWrapper.displayName = 'PoolsPageWrapper'

export const IconWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn('flex h-[18px] w-[18px] items-center justify-center rounded-full bg-apr', className)}
    {...rest}
  />
))
IconWrapper.displayName = 'IconWrapper'

type ButtonIconProps = ButtonHTMLAttributes<HTMLButtonElement> & { color?: string }

// 0x33 = 20% alpha. The original used `polished.rgba(color, 0.2)` for bg.
// Hover applies a brightness boost as a Tailwind-compatible approximation of `polished.lighten`.
export const ButtonIcon = forwardRef<HTMLButtonElement, ButtonIconProps>(
  ({ color, className, style, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'flex size-7 min-h-7 min-w-7 cursor-pointer items-center justify-center rounded-full border border-transparent p-0 transition-[filter] hover:brightness-125',
        className,
      )}
      style={{
        background: color ? `${color}33` : 'var(--ks-subText-20)',
        color: color || 'var(--ks-subText)',
        ...style,
      }}
      {...rest}
    />
  ),
)
ButtonIcon.displayName = 'ButtonIcon'
