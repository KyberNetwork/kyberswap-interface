import { ButtonHTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & {
  size?: number
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 28, style, type = 'button', ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      style={{ width: size, height: size, ...style }}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-1 text-text transition-colors duration-150',
        'hover:bg-tabActive focus-visible:bg-tabActive focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
        className,
      )}
      {...rest}
    />
  ),
)

IconButton.displayName = 'IconButton'

export default IconButton
