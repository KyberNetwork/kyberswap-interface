import { ComponentProps, HTMLAttributes, forwardRef } from 'react'

import bgimg from 'assets/images/about_background.png'
import { ButtonPrimary } from 'components/Button'
import { cn } from 'utils/cn'

export const Wrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mx-auto max-w-[1228px] bg-transparent px-3 py-40 max-sm:py-[100px]',
      '[&_.swiper]:!overflow-visible',
      '[&_.swiper-pagination]:!-bottom-4',
      '[&_.swiper-pagination-bullet]:w-2 [&_.swiper-pagination-bullet]:rounded-lg [&_.swiper-pagination-bullet]:bg-subText',
      '[&_.swiper-pagination-bullet-active]:w-2 [&_.swiper-pagination-bullet-active]:rounded-lg [&_.swiper-pagination-bullet-active]:bg-primary',
      className,
    )}
    {...rest}
  />
))
Wrapper.displayName = 'Wrapper'

export const SupportedChain = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('m-auto mt-8 flex flex-wrap justify-center gap-5', className)} {...rest} />
  ),
)
SupportedChain.displayName = 'SupportedChain'

export const BtnPrimary = forwardRef<HTMLButtonElement, ComponentProps<typeof ButtonPrimary>>(
  ({ className, ...rest }, ref) => (
    <ButtonPrimary
      ref={ref}
      className={cn('w-[216px] flex-1 rounded-[32px] px-3 py-2.5 max-sm:w-full', className)}
      {...rest}
    />
  ),
)
BtnPrimary.displayName = 'BtnPrimary'

export const StatisticWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('m-auto mt-[100px] flex max-w-[900px] flex-row justify-center gap-4', className)}
      {...rest}
    />
  ),
)
StatisticWrapper.displayName = 'StatisticWrapper'

export const StatisticItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-1 flex-col rounded-lg bg-background py-5 text-center text-sm', className)}
      {...rest}
    />
  ),
)
StatisticItem.displayName = 'StatisticItem'

export const ForTrader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('mt-40 flex gap-6 max-sm:mt-[100px] max-sm:flex-col', className)} {...rest} />
))
ForTrader.displayName = 'ForTrader'

export const ForTraderInfo = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative mt-5 flex items-center justify-center rounded-lg border border-primary bg-background py-5',
        'max-lg:flex-col max-lg:gap-6 max-lg:px-4 max-lg:py-5',
        className,
      )}
      {...rest}
    />
  ),
)
ForTraderInfo.displayName = 'ForTraderInfo'

export const ForTraderInfoShadow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'absolute -inset-y-px -right-3 left-0 rounded-lg bg-primary-20',
        'max-lg:-inset-x-px max-lg:-bottom-3 max-lg:top-0',
        className,
      )}
      {...rest}
    />
  ),
)
ForTraderInfoShadow.displayName = 'ForTraderInfoShadow'

type ForTraderDividerProps = HTMLAttributes<HTMLDivElement> & { horizontal?: boolean }

export const ForTraderDivider = forwardRef<HTMLDivElement, ForTraderDividerProps>(
  ({ className, horizontal, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('bg-border', horizontal ? 'h-px w-full' : 'h-[50px] w-px max-md:h-auto', className)}
      {...rest}
    />
  ),
)
ForTraderDivider.displayName = 'ForTraderDivider'

export const ForLiquidityProviderItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex w-full rounded-[20px] bg-background p-12 max-md:p-8 max-md:pb-12', className)}
      {...rest}
    />
  ),
)
ForLiquidityProviderItem.displayName = 'ForLiquidityProviderItem'

export const GridWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('mt-10 grid gap-4 overflow-x-auto pb-4', className)}
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gridAutoFlow: 'column',
        gridAutoColumns: 'minmax(300px, 1fr)',
        ...style,
      }}
      {...rest}
    />
  ),
)
GridWrapper.displayName = 'GridWrapper'

export const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { background?: string }>(
  ({ className, background: _bg, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'w-full bg-background [filter:drop-shadow(0px_-4px_16px_rgba(0,0,0,0.04))]',
        'max-lg:mb-16',
        className,
      )}
      {...rest}
    />
  ),
)
Footer.displayName = 'Footer'

export const FooterContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'm-auto flex max-w-[1244px] items-center justify-between gap-6 p-6 text-sm',
        '[&_a]:text-subText',
        'max-sm:flex-col max-sm:justify-center',
        className,
      )}
      {...rest}
    />
  ),
)
FooterContainer.displayName = 'FooterContainer'

export const Powered = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-12 flex flex-wrap items-center justify-center gap-[52px]',
      '[&>*]:w-[calc(100%/5-52px)]',
      '[&_svg]:max-w-full',
      'max-md:[&>*]:w-[calc(25%-52px)]',
      'max-sm:[&>*]:w-[calc(100%/3-52px)]',
      'max-[500px]:[&>*]:w-[calc(50%-52px)]',
      className,
    )}
    {...rest}
  />
))
Powered.displayName = 'Powered'

export const Exchange = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn('mt-12 grid grid-cols-4 items-center gap-[52px]', '[&_svg]:max-w-full', className)}
    {...rest}
  />
))
Exchange.displayName = 'Exchange'

export const AboutPage = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('z-[1] w-full bg-transparent', className)}
      style={{
        backgroundImage: `url(${bgimg}), url(${bgimg})`,
        backgroundSize: 'contain, contain',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundPosition: 'top, bottom',
        ...style,
      }}
      {...rest}
    />
  ),
)
AboutPage.displayName = 'AboutPage'

export const VerticalDivider = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('h-0 w-px bg-border max-sm:h-auto', className)} {...rest} />
  ),
)
VerticalDivider.displayName = 'VerticalDivider'

export const AboutKNC = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('mt-40 flex gap-[76px] max-sm:mt-[100px] max-sm:flex-col', className)} {...rest} />
))
AboutKNC.displayName = 'AboutKNC'

export const ExchangeWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('my-7 flex h-[152px] rounded-lg bg-background', className)} {...rest} />
  ),
)
ExchangeWrapper.displayName = 'ExchangeWrapper'

export const MoreInfoWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-[100px] flex w-full rounded-[20px] bg-background p-16',
        'max-sm:flex-col max-sm:items-center max-sm:p-12 max-sm:text-center',
        className,
      )}
      {...rest}
    />
  ),
)
MoreInfoWrapper.displayName = 'MoreInfoWrapper'
