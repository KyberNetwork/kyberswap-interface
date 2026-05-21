import { HTMLAttributes, SVGAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

type WrappedSvgProps = SVGAttributes<SVGSVGElement> & { spinning: boolean }

// 696ms is intentional (matches refresh tick visual cadence) — kept as arbitrary animation value.
export const WrappedSvg = forwardRef<SVGSVGElement, WrappedSvgProps>(({ spinning, className, ...rest }, ref) => (
  <svg ref={ref} {...rest} className={cn(spinning && '[animation:spin_696ms_linear_infinite]', className)} />
))
WrappedSvg.displayName = 'WrappedSvg'

type SpinWrapperProps = HTMLAttributes<HTMLDivElement> & { clickable?: boolean }

export const SpinWrapper = forwardRef<HTMLDivElement, SpinWrapperProps>(({ clickable, className, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={cn('relative flex w-fit items-center', clickable ? 'cursor-pointer' : 'cursor-default', className)}
  />
))
SpinWrapper.displayName = 'SpinWrapper'

export const CountDown = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={cn('absolute inset-x-0 mx-auto text-center text-xs font-medium text-primary', className)}
  />
))
CountDown.displayName = 'CountDown'
