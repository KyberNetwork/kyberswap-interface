import { HTMLAttributes, forwardRef } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import { ReactComponent as IconCurrentPrice } from 'assets/svg/earn/ic_position_current_price.svg'
import { TableHeader, TableWrapper, getPositionTableGridTemplateColumns } from 'components/Listing/Table'
import { cn } from 'utils/cn'

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
          'relative grid grid-rows-[1fr] items-center p-3 !text-inherit no-underline',
          'animate-[fadeInUp_0.3s_ease-out_both] motion-reduce:animate-none',
          'hover:cursor-pointer hover:bg-primary-10',
          $isUnfinalized && 'bg-tableHeader/40',
          'max-[1300px]:!grid-cols-3 max-[1300px]:grid-rows-none max-[1300px]:justify-start max-[1300px]:rounded-xl',
          $isUnfinalized ? 'max-[1300px]:bg-tableHeader/70' : 'max-[1300px]:bg-background/80',
          'max-sm:relative max-sm:!flex max-sm:flex-col max-sm:rounded-xl max-sm:p-2',
          $isUnfinalized ? 'max-sm:!bg-tableHeader/70' : 'max-sm:!bg-background/80',
          className,
        )}
        style={{
          gridTemplateColumns: getPositionTableGridTemplateColumns(),
          animationDelay: `${delay}ms`,
          ...style,
        }}
        {...rest}
      />
    )
  },
)
PositionRow.displayName = 'PositionRow'

export const PositionOverview = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'box-border flex h-full min-w-0 flex-col items-start justify-start gap-2 px-3 py-2',
      'max-[1300px]:col-span-2 max-sm:w-full max-sm:p-2',
      className,
    )}
    {...rest}
  />
)

export const ImageContainer = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative top-0.5 flex items-end', className)} {...rest} />
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
    className={cn(
      'box-border flex h-full min-w-0 items-start justify-start gap-2 px-3 py-2',
      'max-sm:w-full max-sm:!justify-between max-sm:p-2',
      className,
    )}
    style={{ ...(align ? { justifyContent: align } : {}), ...style }}
    {...rest}
  />
)

export const PositionActionWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'box-border flex h-full min-w-0 items-start justify-end gap-2 px-3 py-2',
      'max-sm:!absolute max-sm:right-2 max-sm:top-2 max-sm:p-2',
      className,
    )}
    {...rest}
  />
)

export const PositionValueLabel = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('relative top-px m-0 hidden text-sm text-subText max-[1300px]:block max-sm:top-0', className)}
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
      'relative grid grid-cols-[1fr_1fr_1.4fr] items-center rounded-xl px-6 py-3 [background:linear-gradient(119.08deg,rgba(20,29,27,1)_-0.89%,rgba(14,14,14,1)_132.3%)]',
      'max-sm:flex max-sm:flex-col max-sm:items-start max-sm:gap-3 max-sm:p-4',
      className,
    )}
    {...rest}
  />
)

export const RewardBannerWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <BannerWrapper className={cn('flex flex-col items-start gap-2', className)} {...rest} />
)

export const RewardBannerDetailWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid w-full grid-cols-[0.8fr_1fr_1.6fr] items-stretch', className)} {...rest} />
)

export const BannerDataItem = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'z-[1] flex min-w-0 flex-col gap-1 max-sm:w-full max-sm:flex-row max-sm:items-center max-sm:justify-between',
      className,
    )}
    {...rest}
  />
)

type PositionTableHeaderProps = React.ComponentProps<typeof TableHeader>
export const PositionTableHeader = ({ className, style, ...rest }: PositionTableHeaderProps) => (
  <TableHeader
    className={cn('relative grid overflow-visible bg-transparent', className)}
    style={{ gridTemplateColumns: getPositionTableGridTemplateColumns(), ...style }}
    {...rest}
  />
)

export const PositionTableHeaderItem = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('box-border flex h-full min-w-0 flex-col px-3 py-2 text-sm font-medium uppercase', className)}
    {...rest}
  />
)

export const PositionTableHeaderFlexItem = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-fit cursor-pointer flex-wrap items-center gap-1 self-start hover:text-text hover:[&_svg_path]:stroke-text',
      className,
    )}
    {...rest}
  />
)

type PositionTableWrapperProps = React.ComponentProps<typeof TableWrapper>
export const PositionTableWrapper = ({ className, ...rest }: PositionTableWrapperProps) => (
  <TableWrapper className={cn('max-[1300px]:rounded-none max-[1300px]:bg-transparent', className)} {...rest} />
)

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
      outOfRange ? 'bg-gray' : '[background:linear-gradient(90deg,#09ae7d_0%,#6368f1_100%)]',
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
  <div className={cn(indicatorBase, outOfRange ? 'bg-gray' : 'bg-[#09ae7d]', className)} {...rest} />
)

export const UpperPriceIndicator = ({
  outOfRange,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { outOfRange: boolean }) => (
  <div className={cn(indicatorBase, outOfRange ? 'bg-gray' : 'bg-[#6368f1]', className)} {...rest} />
)

export const IndicatorLabel = ({
  align,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { align?: 'left' | 'right' }) => (
  <div
    className={cn(
      'absolute -top-5 whitespace-nowrap text-xs text-white2',
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
