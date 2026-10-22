import { type HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

import './styles.css'

export type ScrollbarOrientation = 'both' | 'horizontal' | 'vertical'
export type ScrollbarSize = 'md' | 'sm'

export type ScrollAreaProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Scrollbar thickness. Defaults to sm; use md for a wider scrollbar.
   */
  size?: ScrollbarSize
  /**
   * Visible scrollbar axis. Defaults to horizontal for wide content such as tables.
   */
  scrollbar?: ScrollbarOrientation
}

/**
 * Reusable overflow container that opts into a visible scrollbar despite the app-level scrollbar reset.
 * Layout remains caller-owned through regular div props and `className`.
 *
 * Customize its dimensions with `--ks-scrollbar-width` and `--ks-scrollbar-height`,
 * or override the dark track with `--ks-scrollbar-track`.
 */
const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, scrollbar = 'horizontal', size = 'sm', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('ks-scroll-area', className)}
      data-scrollbar={scrollbar}
      data-scrollbar-size={size}
      {...props}
    />
  ),
)

ScrollArea.displayName = 'ScrollArea'

export default ScrollArea
