import { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, HTMLAttributes, forwardRef } from 'react'

import { ReactComponent as IconArrowLeftSvg } from 'assets/svg/ic_left_arrow.svg'
import { cn } from 'utils/cn'

export const IconArrowLeft = ({ className, ...rest }: React.SVGProps<SVGSVGElement>) => (
  <IconArrowLeftSvg className={cn('cursor-pointer text-white2 hover:brightness-150', className)} {...rest} />
)

export const PositionDetailWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex w-full animate-[ks-pd-fade-in_0.3s_ease-out] items-start gap-4 max-md:flex-col',
        className,
      )}
      {...rest}
    />
  ),
)
PositionDetailWrapper.displayName = 'PositionDetailWrapper'

export const LeftColumn = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex min-w-[320px] max-w-[480px] flex-[2_1_0%] flex-col gap-4 max-md:w-full max-md:min-w-0 max-md:max-w-full',
      className,
    )}
    {...rest}
  />
))
LeftColumn.displayName = 'LeftColumn'

export const RightColumn = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn('flex min-w-0 flex-[3_1_0%] flex-col rounded-xl bg-white/[0.04] max-md:w-full', className)}
    {...rest}
  />
))
RightColumn.displayName = 'RightColumn'

export const DarkCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-2 rounded-xl bg-background p-4', className)} {...rest} />
))
DarkCard.displayName = 'DarkCard'

export const CardDivider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-px w-full bg-white/[0.08]', className)} {...rest} />
)

export const TabMenu = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center overflow-hidden rounded-t-xl border-b border-white/[0.04]', className)}
    {...rest}
  />
))
TabMenu.displayName = 'TabMenu'

type TabItemProps = HTMLAttributes<HTMLDivElement> & { active?: boolean }
export const TabItem = forwardRef<HTMLDivElement, TabItemProps>(({ active, className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-12 cursor-pointer items-center justify-center whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium uppercase leading-6 transition-colors',
      active
        ? 'border-primary bg-primary/10 text-primary hover:text-primary'
        : 'border-transparent bg-transparent text-subText hover:text-text',
      className,
    )}
    {...rest}
  />
))
TabItem.displayName = 'TabItem'

export const TabDivider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-5 w-px bg-white/[0.08]', className)} {...rest} />
)

export const TabContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-3 p-4 max-md:p-3', className)} {...rest} />
))
TabContent.displayName = 'TabContent'

export const TabContentArea = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-1 animate-[ks-pd-fade-in_0.25s_ease-out] flex-col gap-3', className)}
      {...rest}
    />
  ),
)
TabContentArea.displayName = 'TabContentArea'

export const DexInfoBadge = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex h-9 items-center gap-1 rounded-xl bg-white/[0.04] px-3 py-1', className)}
      {...rest}
    />
  ),
)
DexInfoBadge.displayName = 'DexInfoBadge'

type ClaimButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
export const ClaimButton = forwardRef<HTMLButtonElement, ClaimButtonProps>(({ className, disabled, ...rest }, ref) => (
  <button
    ref={ref}
    disabled={disabled}
    className={cn(
      'cursor-pointer whitespace-nowrap rounded-xl border border-primary bg-transparent px-3 py-1.5 text-xs font-medium leading-4 text-primary',
      'hover:enabled:brightness-125',
      disabled && 'cursor-not-allowed opacity-30',
      className,
    )}
    {...rest}
  />
))
ClaimButton.displayName = 'ClaimButton'

export const EarningChartContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => <div ref={ref} className={cn('flex w-full flex-col gap-4', className)} {...rest} />,
)
EarningChartContainer.displayName = 'EarningChartContainer'

export const HistorySectionHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex w-full items-center gap-2 border-b border-white/[0.04] pb-1', className)}
      {...rest}
    />
  ),
)
HistorySectionHeader.displayName = 'HistorySectionHeader'

export const PastActionsList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('ks-scrollbar flex max-h-60 flex-col items-end gap-2 overflow-y-auto pr-1', className)}
      style={
        {
          '--ks-scrollbar-thumb': 'rgba(255, 255, 255, 0.16)',
          '--ks-scrollbar-radius': '2px',
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  ),
)
PastActionsList.displayName = 'PastActionsList'

export const HistoryCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('flex flex-1 flex-col gap-2 rounded-xl bg-white/[0.04] p-3', className)} {...rest} />
))
HistoryCard.displayName = 'HistoryCard'

export const NextDistribution = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full flex-wrap items-center justify-between gap-2 rounded-[10px] bg-white/[0.04] px-3 py-2',
        className,
      )}
      {...rest}
    />
  ),
)
NextDistribution.displayName = 'NextDistribution'

export const TotalLiquiditySection = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex min-w-0 flex-[1_1_280px] items-center gap-5 rounded-xl bg-background p-4 max-sm:gap-3 max-sm:p-3',
        className,
      )}
      {...rest}
    />
  ),
)
TotalLiquiditySection.displayName = 'TotalLiquiditySection'

export const PriceSection = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-wrap items-center justify-between rounded-xl border border-white/[0.08] px-4 py-2',
        className,
      )}
      {...rest}
    />
  ),
)
PriceSection.displayName = 'PriceSection'

export const AprSection = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex min-w-0 flex-[1_1_280px] flex-col justify-center gap-1.5 rounded-xl bg-background p-4 max-sm:p-3',
      className,
    )}
    {...rest}
  />
))
AprSection.displayName = 'AprSection'

type VerticalDividerProps = HTMLAttributes<HTMLDivElement> & { height?: string }
export const VerticalDivider = ({ height, className, style, ...rest }: VerticalDividerProps) => (
  <div className={cn('w-px bg-tabActive', className)} style={{ height: height || '32px', ...style }} {...rest} />
)

export const RevertIconWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex aspect-square size-6 cursor-pointer items-center justify-center gap-2.5 rounded-full bg-white/[0.08] hover:brightness-90',
        className,
      )}
      {...rest}
    />
  ),
)
RevertIconWrapper.displayName = 'RevertIconWrapper'

export const PositionActionWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-4 py-2 max-sm:flex-col-reverse max-sm:gap-2', className)}
      {...rest}
    />
  ),
)
PositionActionWrapper.displayName = 'PositionActionWrapper'

type PositionActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  outline?: boolean
  outlineDefault?: boolean
  small?: boolean
  load?: boolean
  mobileAutoWidth?: boolean
}
export const PositionAction = forwardRef<HTMLButtonElement, PositionActionProps>(
  ({ className, outline, outlineDefault, small, load, mobileAutoWidth, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary bg-primary px-[18px] py-2.5 text-black',
        small && '!px-4 !py-1.5',
        (outline || outlineDefault) && 'bg-transparent',
        outline && 'text-primary',
        outlineDefault && 'border-white/70 text-white/70',
        !mobileAutoWidth && 'max-sm:w-full max-sm:justify-center',
        'hover:brightness-125',
        disabled && '!cursor-not-allowed border-transparent bg-white/[0.12] text-white/40 !brightness-[0.6]',
        load && '!cursor-not-allowed !brightness-[0.6]',
        className,
      )}
      {...rest}
    />
  ),
)
PositionAction.displayName = 'PositionAction'

export const ChartWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('flex w-full px-8 max-sm:px-0', className)} {...rest} />
  ),
)
ChartWrapper.displayName = 'ChartWrapper'

type ChartFadeInProps = HTMLAttributes<HTMLDivElement> & { $visible?: boolean }
export const ChartFadeIn = forwardRef<HTMLDivElement, ChartFadeInProps>(({ $visible, className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn($visible ? 'animate-[ks-pd-fade-in_0.4s_ease-out]' : 'invisible h-0 overflow-hidden', className)}
    {...rest}
  />
))
ChartFadeIn.displayName = 'ChartFadeIn'

export const MigrationLiquidityRecommend = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex animate-[ks-pd-slide-down_0.3s_ease-out] flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-apr/20 px-5 py-2.5 text-sm max-sm:gap-y-0.5',
        className,
      )}
      {...rest}
    />
  ),
)
MigrationLiquidityRecommend.displayName = 'MigrationLiquidityRecommend'

export const ShareButtonWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-full bg-primary/20 py-1.5 pl-1.5 pr-2 transition-all duration-100 ease-in-out hover:brightness-125 active:brightness-105',
        className,
      )}
      {...rest}
    />
  ),
)
ShareButtonWrapper.displayName = 'ShareButtonWrapper'

export const RewardLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...rest }, ref) => (
    <a ref={ref} className={cn('flex gap-1 border-b border-dashed border-text', className)} {...rest} />
  ),
)
RewardLink.displayName = 'RewardLink'

export const RemoveLiquidityDropdownWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('relative inline-block max-sm:w-full', className)} {...rest} />
  ),
)
RemoveLiquidityDropdownWrapper.displayName = 'RemoveLiquidityDropdownWrapper'

type DropdownButtonProps = PositionActionProps & { isOpen?: boolean }
export const DropdownButton = forwardRef<HTMLButtonElement, DropdownButtonProps>(
  ({ className, isOpen: _isOpen, ...rest }, ref) => (
    <PositionAction ref={ref} className={cn('relative flex items-center justify-center gap-2', className)} {...rest} />
  ),
)
DropdownButton.displayName = 'DropdownButton'

type DropdownMenuProps = HTMLAttributes<HTMLDivElement> & { isOpen: boolean }
export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(({ isOpen, className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'absolute right-0 top-[calc(100%+8px)] z-[1000] w-max flex-col gap-1 rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.1)] max-sm:right-1/2 max-sm:translate-x-1/2',
      isOpen ? 'flex animate-[ks-pd-slide-down_0.2s_ease-out]' : 'hidden',
      className,
    )}
    {...rest}
  />
))
DropdownMenu.displayName = 'DropdownMenu'

export const CompactPriceBox = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('flex h-10 flex-1 items-stretch overflow-hidden rounded-xl', className)} {...rest} />
  ),
)
CompactPriceBox.displayName = 'CompactPriceBox'

export const CompactPriceLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-9 flex-shrink-0 items-center justify-center rounded-l-xl bg-white/[0.08] text-[10px] font-medium uppercase text-subText',
        className,
      )}
      {...rest}
    />
  ),
)
CompactPriceLabel.displayName = 'CompactPriceLabel'

export const CompactPriceValue = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-r-xl bg-white/[0.04] px-2 py-1',
        className,
      )}
      {...rest}
    />
  ),
)
CompactPriceValue.displayName = 'CompactPriceValue'

export const PricePercentage = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-xs font-medium uppercase text-subText', className)} {...rest} />
)

type DropdownMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement>
export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-background px-4 py-2.5 text-left text-sm text-white/70 transition-all',
        'hover:enabled:border-white/20 hover:enabled:bg-background/90 hover:enabled:text-white',
        disabled && 'cursor-not-allowed opacity-50 brightness-[0.6]',
        className,
      )}
      {...rest}
    />
  ),
)
DropdownMenuItem.displayName = 'DropdownMenuItem'
