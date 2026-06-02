import { ComponentProps, forwardRef } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import { ReactComponent as MoveBackSvg } from 'assets/svg/ic_move_back.svg'
import { ReactComponent as MoveForwardSvg } from 'assets/svg/ic_move_forward.svg'
import { cn } from 'utils/cn'

export const TrendingWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={cn(
        'relative flex w-full shrink-0 flex-col items-stretch justify-around gap-2 rounded-2xl border border-solid border-transparent px-4 py-2 backdrop-blur-[2px]',
        '[background:linear-gradient(#1d5b49,#1d5b49)_padding-box,linear-gradient(135deg,#4ec7a2_0%,#1d5b49_40%,#1d5b49_60%,#4ec7a2_100%)_border-box]',
        className,
      )}
    >
      {children}
    </div>
  ),
)
TrendingWrapper.displayName = 'TrendingWrapper'

export const BannerHeaderLink = ({ className, ...rest }: LinkProps) => (
  <Link {...rest} className={cn('inline-flex items-center gap-2 text-inherit no-underline', className)} />
)

type PoolWrapperProps = LinkProps & { animate: boolean }
export const PoolWrapper = ({ animate, className, ...rest }: PoolWrapperProps) => (
  <Link
    {...rest}
    className={cn(
      'flex w-full items-center justify-between text-inherit no-underline',
      animate && '[animation:ks-earn-pulse_0.6s]',
      className,
    )}
  />
)

export const PoolAprWrapper: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'rounded-2xl shadow-[0_8px_8px_0_rgba(0,0,0,0.3)] [background-image:linear-gradient(to_right,#66666600,#66666600,#a2e9d4,#66666600,#66666600)]',
      className,
    )}
  />
)

export const AprText: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...rest }) => (
  <span {...rest} className={cn('ml-1.5 max-xxs:hidden', className)} />
)

export const PoolApr: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cn('mb-px flex h-[27px] w-max rounded-2xl bg-black px-4 py-1 font-semibold text-primary', className)}
  />
)

export const FarmingWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={cn(
        'relative flex w-full shrink-0 flex-col items-stretch justify-around gap-2 rounded-2xl border border-solid border-transparent px-4 py-2 backdrop-blur-[2px]',
        '[background:linear-gradient(#272e62,#272e62)_padding-box,linear-gradient(135deg,#5a7fff_0%,#272e62_70%,#272e62_30%,#5a7fff_100%)_border-box]',
        className,
      )}
    >
      {children}
    </div>
  ),
)
FarmingWrapper.displayName = 'FarmingWrapper'

export const FarmingPoolContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div {...rest} className={cn('mx-auto w-[calc(100%-72px)] overflow-hidden', className)} />
)

type FarmingPoolWrapperProps = React.HTMLAttributes<HTMLDivElement> & {
  animateMoveForward: boolean
  animateMoveBack: boolean
}
export const FarmingPoolWrapper: React.FC<FarmingPoolWrapperProps> = ({
  animateMoveForward,
  animateMoveBack,
  className,
  ...rest
}) => (
  <div
    {...rest}
    className={cn(
      'relative -left-1/2 flex items-center max-[500px]:-left-full',
      animateMoveForward &&
        '[animation:ks-earn-move-forward_0.8s] max-[500px]:[animation:ks-earn-move-forward-xs_0.8s]',
      animateMoveBack && '[animation:ks-earn-move-back_0.8s] max-[500px]:[animation:ks-earn-move-back-xs_0.8s]',
      className,
    )}
  />
)

export const FarmingPool = ({ className, ...rest }: LinkProps) => (
  <Link
    {...rest}
    className={cn('flex items-center justify-center gap-1 px-1.5 text-inherit no-underline', className)}
  />
)

export const FarmingAprBadge: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div {...rest} className={cn('rounded-[20px] bg-[#221749] px-3 py-1 text-primary', className)} />
)

export const MoveBackIcon: React.FC<ComponentProps<typeof MoveBackSvg>> = ({ className, ...rest }) => (
  <MoveBackSvg
    {...rest}
    className={cn(
      'cursor-pointer transition-[filter] duration-150 ease-in-out',
      '[filter:drop-shadow(0_4px_8px_black)] hover:[filter:drop-shadow(0_4px_8px_black)_brightness(1.15)]',
      className,
    )}
  />
)

export const MoveForwardIcon: React.FC<ComponentProps<typeof MoveForwardSvg>> = ({ className, ...rest }) => (
  <MoveForwardSvg
    {...rest}
    className={cn(
      'cursor-pointer transition-[filter] duration-150 ease-in-out',
      '[filter:drop-shadow(0_4px_8px_black)] hover:[filter:drop-shadow(0_4px_8px_black)_brightness(1.15)]',
      className,
    )}
  />
)

export const PoolPairText: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...rest }) => (
  <span {...rest} className={cn('max-w-[120px] truncate text-left', className)} />
)
