import { AnchorHTMLAttributes, CSSProperties, HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

import './styled.css'

type RoutingFadeYProps = HTMLAttributes<HTMLDivElement> & { backgroundColor?: string }

export const RoutingFadeY = forwardRef<HTMLDivElement, RoutingFadeYProps>(
  ({ className, backgroundColor, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('ks-trade-routing-fade-y relative min-h-0 overflow-hidden', className)}
      style={{ ...(backgroundColor ? ({ '--ks-tr-bg': backgroundColor } as CSSProperties) : {}), ...style }}
      {...rest}
    />
  ),
)
RoutingFadeY.displayName = 'RoutingFadeY'

export const RoutingViewport = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('ks-trade-routing-viewport ml-0 max-h-full max-w-full flex-1', className)} {...rest} />
  ),
)
RoutingViewport.displayName = 'RoutingViewport'

export const PairRow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('relative flex items-center justify-between pt-3', className)} {...rest} />
))
PairRow.displayName = 'PairRow'

export const PairTokenSlot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex min-h-[38px] w-max min-w-[100px] items-center justify-between whitespace-nowrap rounded-lg text-base font-medium max-sm:min-w-[120px]',
        className,
      )}
      {...rest}
    />
  ),
)
PairTokenSlot.displayName = 'PairTokenSlot'

type TokenLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  reverse?: boolean
  as?: 'a' | 'div'
}

export const TokenLink = forwardRef<HTMLAnchorElement, TokenLinkProps>(
  ({ className, reverse, as: As = 'a', ...rest }, ref) => {
    const cls = cn(
      'flex w-full items-center whitespace-nowrap pb-2 text-subText no-underline [&>span]:mx-1',
      reverse && 'flex-row-reverse justify-start',
      className,
    )
    if (As === 'div') {
      const { href: _href, ...divRest } = rest
      return (
        <div
          ref={ref as unknown as React.Ref<HTMLDivElement>}
          className={cls}
          {...(divRest as HTMLAttributes<HTMLDivElement>)}
        />
      )
    }
    return <a ref={ref} className={cls} {...rest} />
  },
)
TokenLink.displayName = 'TokenLink'

export const RouteList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('ks-trade-routing-list relative m-auto w-full px-2.5 pt-5', className)} {...rest} />
))
RouteList.displayName = 'RouteList'

type RouteDotProps = HTMLAttributes<HTMLElement> & { out?: boolean }

export const RouteDot = forwardRef<HTMLElement, RouteDotProps>(({ className, out, ...rest }, ref) => (
  <i
    ref={ref}
    className={cn(
      'absolute top-0 z-[1] inline-block size-2 rounded-full bg-primary',
      out ? 'right-[6.5px]' : 'left-[6.5px]',
      className,
    )}
    {...rest}
  />
))
RouteDot.displayName = 'RouteDot'

export const RouteRow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('ks-trade-routing-row relative flex items-center justify-end', className)} {...rest} />
))
RouteRow.displayName = 'RouteRow'

export const RouteBadge = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'absolute left-2 top-[calc(50%-15px)] z-[2] translate-y-1/2 bg-buttonBlack px-1 text-xs font-bold leading-[14px] text-primary',
      className,
    )}
    {...rest}
  />
))
RouteBadge.displayName = 'RouteBadge'

export const RouteConnector = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('absolute left-0 w-full border-b border-buttonGray', className)} {...rest} />
  ),
)
RouteConnector.displayName = 'RouteConnector'

type RoutingFadeXProps = HTMLAttributes<HTMLDivElement> & { backgroundColor?: string }

export const RoutingFadeX = forwardRef<HTMLDivElement, RoutingFadeXProps>(
  ({ className, backgroundColor, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('ks-trade-routing-fade-x my-2.5 ml-1.5 w-[calc(100%-68px)]', className)}
      style={{ ...(backgroundColor ? ({ '--ks-tr-bg': backgroundColor } as CSSProperties) : {}), ...style }}
      {...rest}
    />
  ),
)
RoutingFadeX.displayName = 'RoutingFadeX'

export const HopList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('z-[1] flex items-center', className)} {...rest} />
))
HopList.displayName = 'HopList'

export const HopCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative m-auto h-fit shrink-0 grow-0 basis-[168px] rounded-lg border border-buttonGray bg-buttonBlack p-3',
      className,
    )}
    {...rest}
  />
))
HopCard.displayName = 'HopCard'

export const PoolList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('mt-1 flex flex-col gap-2 rounded-lg bg-background px-3 py-2', className)} {...rest} />
))
PoolList.displayName = 'PoolList'

const POOL_ITEM_CLASS =
  'flex w-full items-center whitespace-nowrap rounded-xl text-[10px] leading-5 text-subText no-underline [&>.img--sm]:mr-1 [&>.img--sm]:size-3.5'

export const PoolLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...rest }, ref) => (
    <a ref={ref} className={cn(POOL_ITEM_CLASS, 'hover:text-white', className)} {...rest} />
  ),
)
PoolLink.displayName = 'PoolLink'

export const PoolLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(POOL_ITEM_CLASS, className)} {...rest} />
))
PoolLabel.displayName = 'PoolLabel'

export const RouteArrow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('z-[1] flex h-6 min-w-[24px] items-center justify-center', className)} {...rest} />
))
RouteArrow.displayName = 'RouteArrow'

export const ArrowHead = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn('size-0 border-y-[5px] border-l-[5px] border-y-transparent border-l-primary', className)}
    {...rest}
  />
))
ArrowHead.displayName = 'ArrowHead'
