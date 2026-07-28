import { type VariantProps, cva } from 'class-variance-authority'
import { ButtonHTMLAttributes, MouseEvent, forwardRef } from 'react'

import { cn } from 'utils/cn'

const iconButtonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent transition-colors duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
  {
    variants: {
      variant: {
        default: 'size-7 p-1 text-text hover:bg-tabActive focus-visible:bg-tabActive',
        action: 'size-8 p-0 text-text hover:bg-background focus-visible:bg-background',
        compact:
          'size-6 p-[0.2rem] text-sm font-normal text-text2 transition-none hover:bg-transparent focus-visible:bg-transparent',
      },
      active: {
        true: 'bg-buttonGray',
        false: null,
      },
    },
    defaultVariants: {
      variant: 'default',
      active: false,
    },
  },
)

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> &
  VariantProps<typeof iconButtonVariants> & {
    size?: number
    hoverBg?: string
  }

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const {
    active = false,
    className,
    hoverBg,
    onMouseEnter,
    onMouseLeave,
    size,
    style,
    type = 'button',
    variant,
    ...rest
  } = props

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    if (hoverBg) event.currentTarget.style.backgroundColor = hoverBg
    onMouseEnter?.(event)
  }

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    if (hoverBg) event.currentTarget.style.backgroundColor = style?.backgroundColor || ''
    onMouseLeave?.(event)
  }

  return (
    <button
      ref={ref}
      type={type}
      style={size === undefined ? style : { width: size, height: size, ...style }}
      className={cn(iconButtonVariants({ variant, active }), className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    />
  )
})

IconButton.displayName = 'IconButton'

export default IconButton
