import { HTMLAttributes, forwardRef } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import { ReactComponent as IconCurrentPrice } from 'assets/svg/earn/ic_position_current_price.svg'
import { PoolPageWrapper, TableHeader, TableWrapper } from 'pages/Earns/PoolExplorer/styles'
import { cn } from 'utils/cn'

const POSITION_GRID =
  'grid grid-cols-[minmax(260px,2.6fr)_minmax(80px,0.8fr)_minmax(90px,0.8fr)_minmax(100px,1fr)_minmax(120px,1fr)_24px_minmax(150px,0.4fr)_minmax(160px,1.8fr)_minmax(75px,auto)]'

type PositionPageWrapperProps = React.ComponentProps<typeof PoolPageWrapper>
export const PositionPageWrapper = forwardRef<HTMLDivElement, PositionPageWrapperProps>(
  ({ className, ...rest }, ref) => (
    <PoolPageWrapper
      ref={ref}
      className={cn('px-24 pb-[62px] pt-6 max-[1300px]:pb-[60px] max-sm:px-4 max-sm:pb-[100px]', className)}
      {...rest}
    />
  ),
)
PositionPageWrapper.displayName = 'PositionPageWrapper'

type PositionRowProps = LinkProps & {
  $isUnfinalized?: boolean
  $index?: number
}
export const PositionRow = forwardRef<HTMLAnchorElement, PositionRowProps>(
  ({ $isUnfinalized, $index, className, style, ...rest }, ref) => {
    const delay = Math.min(($index || 0) * 50, 300)
    return (
      <Link
        ref={ref}
        className={cn(
          POSITION_GRID,
          'relative animate-[fadeInUp_0.3s_ease-out_both] grid-rows-[1fr] gap-y-2 px-7 py-4 !text-inherit no-underline',
          'after:absolute after:inset-x-7 after:bottom-0 after:h-px after:bg-tableHeader after:content-[""]',
          'last:mb-0 last:after:hidden',
          'hover:cursor-pointer hover:bg-primary-10',
          $isUnfinalized ? 'bg-tableHeader/40' : 'bg-background',
          'max-[1300px]:mb-4 max-[1300px]:!grid-cols-3 max-[1300px]:grid-rows-[1fr_1fr] max-[1300px]:justify-start max-[1300px]:rounded-[20px] max-[1300px]:after:hidden',
          $isUnfinalized ? 'max-[1300px]:bg-tableHeader/70' : 'max-[1300px]:bg-background/80',
          'motion-reduce:animate-none max-sm:relative max-sm:!flex max-sm:flex-col max-sm:gap-y-4 max-sm:rounded-none max-sm:p-4 max-sm:after:inset-x-4 max-sm:after:block',
          $isUnfinalized ? 'max-sm:!bg-tableHeader/70' : 'max-sm:!bg-background/80',
          className,
        )}
        style={{ animationDelay: `${delay}ms`, ...style }}
        {...rest}
      />
    )
  },
)
PositionRow.displayName = 'PositionRow'

export const PositionOverview = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 max-[1300px]:col-span-2', className)} {...rest} />
)

export const ImageContainer = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative top-0.5', className)} {...rest} />
)

export enum BadgeType {
  PRIMARY = 'primary',
  WARNING = 'warning',
  SECONDARY = 'secondary',
  ROUNDED = 'rounded',
  DISABLED = 'disabled',
}

export const Badge = ({ type, className, ...rest }: HTMLAttributes<HTMLDivElement> & { type?: BadgeType }) => (
  <div
    className={cn(
      'flex items-center rounded-[30px] bg-white/[0.04] px-3 py-1 text-xs text-subText max-xxs:px-[9px]',
      type === BadgeType.PRIMARY && 'bg-primary/20 text-primary',
      type === BadgeType.WARNING && 'bg-warning/20 text-warning',
      type === BadgeType.SECONDARY && 'bg-primary-10 text-subText',
      type === BadgeType.ROUNDED && 'p-2',
      className,
    )}
    {...rest}
  />
)

export const PositionValueWrapper = ({
  align,
  className,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { align?: string }) => (
  <div
    className={cn('flex min-w-0 items-start justify-start gap-2 pt-2 max-sm:justify-between max-sm:pt-0', className)}
    style={{ ...(align ? { justifyContent: align } : {}), ...style }}
    {...rest}
  />
)

export const PositionActionWrapper = ({
  align,
  className,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { align?: string }) => (
  <div
    className={cn(
      'flex min-w-0 items-start justify-end gap-2 pt-2 max-sm:!absolute max-sm:right-4 max-sm:top-2.5',
      className,
    )}
    style={{ ...(align ? { justifyContent: align } : {}), ...style }}
    {...rest}
  />
)

export const PositionValueLabel = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      'relative top-px m-0 hidden text-sm text-subText max-[1300px]:block max-sm:top-0 max-sm:text-base',
      className,
    )}
    {...rest}
  />
)

export const Divider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative top-px mx-3.5 h-4 w-px bg-tabActive', className)} {...rest} />
)

export const EmptyPositionText = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'my-5 flex h-[400px] flex-col items-center justify-center gap-2 rounded-[20px] text-subText',
      className,
    )}
    {...rest}
  />
)

export const BannerContainer = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'relative h-auto w-full overflow-hidden rounded-xl bg-clip-padding p-px',
      'before:absolute before:inset-0 before:p-px before:content-[""]',
      'before:[background:linear-gradient(90deg,rgba(162,89,255,0.6)_0%,rgba(162,89,255,0)_50%,rgba(162,89,255,0.6)_100%),radial-gradient(58.61%_54.58%_at_30.56%_0%,rgba(162,89,255,0.3)_0%,rgba(0,0,0,0)_100%)]',
      'before:[-webkit-mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] before:[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]',
      className,
    )}
    {...rest}
  />
)

export const BannerWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'relative flex flex-wrap items-center justify-start gap-[26px] rounded-xl px-8 py-[32.5px] [background:linear-gradient(119.08deg,rgba(20,29,27,1)_-0.89%,rgba(14,14,14,1)_132.3%)]',
      'max-sm:flex-col max-sm:items-start max-sm:gap-4 max-sm:p-4 min-[1200px]:max-[1330px]:gap-[18px]',
      className,
    )}
    {...rest}
  />
)

export const RewardBannerWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <BannerWrapper className={cn('flex-col items-start gap-2 px-8 py-3.5', className)} {...rest} />
)

export const RewardBannerDetailWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-start gap-x-8 gap-y-2 min-[1200px]:max-[1330px]:gap-[18px]',
      className,
    )}
    {...rest}
  />
)

export const BannerDivider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-[60px] w-px bg-tabActive max-sm:hidden', className)} {...rest} />
)

export const BannerDataItem = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'z-[1] flex flex-col gap-2 max-sm:w-full max-sm:flex-row max-sm:items-center max-sm:justify-between',
      className,
    )}
    {...rest}
  />
)

type PositionTableHeaderProps = React.ComponentProps<typeof TableHeader>
export const PositionTableHeader = forwardRef<HTMLDivElement, PositionTableHeaderProps>(
  ({ className, ...rest }, ref) => (
    <TableHeader
      ref={ref}
      className={cn(
        POSITION_GRID,
        'relative overflow-visible rounded-t-[20px] border-b-0 bg-background px-7 py-4 text-xs font-medium uppercase text-subText',
        'after:absolute after:inset-x-7 after:bottom-0 after:h-px after:bg-tableHeader after:content-[""]',
        className,
      )}
      {...rest}
    />
  ),
)
PositionTableHeader.displayName = 'PositionTableHeader'

export const PositionTableHeaderItem = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-full', className)} {...rest} />
)

export const PositionTableHeaderFlexItem = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex w-fit flex-wrap items-center gap-1 self-start hover:[&_svg_path]:stroke-text', className)}
    {...rest}
  />
)

type PositionTableWrapperProps = React.ComponentProps<typeof TableWrapper>
export const PositionTableWrapper = forwardRef<HTMLDivElement, PositionTableWrapperProps>(
  ({ className, ...rest }, ref) => (
    <TableWrapper
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-[20px] bg-background max-[1300px]:rounded-none max-[1300px]:bg-transparent max-sm:-mx-4',
        className,
      )}
      {...rest}
    />
  ),
)
PositionTableWrapper.displayName = 'PositionTableWrapper'

export const PriceRangeWrapper = ({
  outOfRange,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { outOfRange: boolean }) => (
  <div
    className={cn(
      'relative top-[46%] h-1 w-[90%] rounded',
      outOfRange ? 'bg-warning/30' : 'bg-border',
      'max-sm:my-[30px] max-sm:mb-5 max-sm:w-full',
      className,
    )}
    {...rest}
  />
)

export const PriceRangeEl = ({
  outOfRange,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { outOfRange: boolean }) => (
  <div
    className={cn(
      'absolute flex h-full items-center justify-between rounded',
      outOfRange ? 'bg-[#737373]' : '[background:linear-gradient(90deg,#09ae7d_0%,#6368f1_100%)]',
      className,
    )}
    {...rest}
  />
)

const indicatorBase = 'relative h-4 w-1 rounded'

export const PriceIndicator = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(indicatorBase, className)} {...rest} />
)

export const LowerPriceIndicator = ({
  outOfRange,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { outOfRange: boolean }) => (
  <div className={cn(indicatorBase, outOfRange ? 'bg-[#737373]' : 'bg-[#09ae7d]', className)} {...rest} />
)

export const UpperPriceIndicator = ({
  outOfRange,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { outOfRange: boolean }) => (
  <div className={cn(indicatorBase, outOfRange ? 'bg-[#737373]' : 'bg-[#6368f1]', className)} {...rest} />
)

export const IndicatorLabel = ({
  align,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { align?: 'left' | 'right' }) => (
  <div
    className={cn(
      'absolute -top-5 whitespace-nowrap text-xs text-[#fafafa]',
      align === 'left' && 'left-0 translate-x-[-60%]',
      align === 'right' && 'left-0 translate-x-[-40%]',
      !align && 'translate-x-[-42%]',
      className,
    )}
    {...rest}
  />
)

export const CurrentPriceWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { lower?: boolean }>(
  ({ lower, className, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('absolute top-[-5px]', className)}
      style={{ left: lower ? '6%' : '86%', ...style }}
      {...rest}
    />
  ),
)
CurrentPriceWrapper.displayName = 'CurrentPriceWrapper'

export const CustomIconCurrentPrice = ({
  lower: _lower,
  className,
  ...rest
}: React.SVGProps<SVGSVGElement> & { lower?: boolean }) => (
  <IconCurrentPrice
    className={cn('transition-transform duration-200 ease-in-out hover:scale-110', className)}
    {...rest}
  />
)

export const CurrentPriceTooltip = ({
  show,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { show?: boolean }) => (
  <div
    className={cn(
      'relative -left-1/2 w-max text-xs text-subText opacity-0 transition-opacity duration-200 ease-in-out',
      show && 'opacity-100',
      className,
    )}
    {...rest}
  />
)

export const HorizontalDivider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('my-1 h-px w-full bg-white/[0.08]', className)} {...rest} />
)
