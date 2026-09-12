import { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, HTMLAttributes } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import { cn } from 'utils/cn'
import { hexAlpha } from 'utils/colorAlpha'

export const VaultPageWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-1 flex-col gap-5', className)} {...rest} />
)

export const VaultPageTitle = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className={cn('m-0 text-2xl font-medium text-text', className)} {...rest} />
)

export const FilterRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-wrap items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch', className)}
    {...rest}
  />
)

export const FilterControls = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-wrap items-center gap-3 max-sm:w-full', className)} {...rest} />
)

/** Search sits at the end of the filter row with the layout toggle to its right. */
export const SearchGroup = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-3 max-sm:w-full', className)} {...rest} />
)

export const SortByLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('whitespace-nowrap text-sm text-subText', className)} {...rest} />
)

export const SortByGroup = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-2', className)} {...rest} />
)

// EarnLayout's sidebar is 220px + 72px page padding, so at <= 1200px the list row
// (~900px min) doesn't fit in the content area. Force gallery instead — matches the
// gallery's own 3 -> 2 column transition at the same breakpoint.
export const ViewToggleGroup = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center gap-0.5 rounded-xl border border-solid border-subText-20 bg-white-04 p-0.5 max-lg:hidden',
      className,
    )}
    {...rest}
  />
)

type ViewToggleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { $active?: boolean }
export const ViewToggleButton = ({ $active, className, ...rest }: ViewToggleButtonProps) => (
  <button
    className={cn(
      'flex h-8 w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none p-0',
      'transition-colors hover:text-text [&>svg]:size-4',
      $active
        ? 'bg-white/20 text-text shadow-[0_0_1px_rgba(40,41,61,0.08),0_1px_2px_rgba(0,0,0,0.32)]'
        : 'bg-transparent text-subText shadow-none',
      className,
    )}
    {...rest}
  />
)

export const VaultCardsGrid = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid grid-cols-3 gap-6', 'max-lg:grid-cols-2', 'max-sm:grid-cols-1 max-sm:gap-4', className)}
    {...rest}
  />
)

type VaultCardProps = HTMLAttributes<HTMLDivElement> & {
  $clickable?: boolean
  $disabled?: boolean
  $revealIndex?: number
}
/**
 * Per-item entrance, matching the pool and position tables: a 4px lift over 0.3s, each item 50ms
 * behind the previous one and capped at 300ms so a long list does not trail. Pass `undefined` to
 * skip it, which the gallery/list switch does: the cross-fade already carries that change.
 */
const revealProps = (index: number | undefined) =>
  index === undefined
    ? { className: undefined, style: undefined }
    : {
        className: 'animate-[fadeInUp_0.3s_ease-out_both] motion-reduce:animate-none',
        style: { animationDelay: `${Math.min(index * 50, 300)}ms` },
      }

export const VaultCard = ({ $clickable, $disabled, $revealIndex, className, style, ...rest }: VaultCardProps) => {
  const reveal = revealProps($revealIndex)
  return (
    <div
      className={cn(
        // `duration-200` would also set animation-duration and swallow the entrance's own timing.
        'relative flex flex-col rounded-xl bg-background p-4',
        'transition-[background,transform,box-shadow] [transition-duration:200ms]',
        'hover:bg-background/85',
        $disabled ? 'cursor-not-allowed' : $clickable ? 'cursor-pointer' : 'cursor-default',
        $clickable && !$disabled && 'hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]',
        reveal.className,
        className,
      )}
      style={{ ...reveal.style, ...style }}
      {...rest}
    />
  )
}

/**
 * The card's one navigation control. Its ::after stretches over the whole card, so a click anywhere
 * opens the vault while the keyboard gets a single stop — the action buttons sit above it on their
 * own stacking context and keep their own.
 */
export const CardTitleLink = ({ className, ...rest }: LinkProps) => (
  <Link
    className={cn(
      'text-inherit no-underline outline-none hover:text-inherit',
      'after:absolute after:inset-0 after:rounded-xl after:content-[""]',
      'focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2',
      'focus-visible:after:outline-primary',
      className,
    )}
    {...rest}
  />
)

/** Sits above the title link's overlay so the buttons stay independently clickable. */
export const CardActions = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative z-[1] flex items-center gap-2', className)} {...rest} />
)

export const CardHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-wrap items-center justify-between gap-2 gap-y-3 border-b border-white-04 pb-3', className)}
    {...rest}
  />
)

export const TokenIconWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative size-6 shrink-0', className)} {...rest} />
)

export const ProtocolTag = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center gap-1 whitespace-nowrap rounded-lg bg-white-08 px-2 py-0.5 text-sm leading-5 text-subText',
      className,
    )}
    {...rest}
  />
)

export const CardBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-6 px-1 pb-1 pt-4', className)} {...rest} />
)

export const MetricRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-end gap-2', className)} {...rest} />
)

export const MetricLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-base text-subText', className)} {...rest} />
)

export const ApyValue = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-[32px] font-semibold leading-none text-primary', className)} {...rest} />
)

export const TvlValue = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-2xl font-normal leading-none text-white2', className)} {...rest} />
)

type ChartWrapperProps = HTMLAttributes<HTMLDivElement> & { $height?: number }
export const ChartWrapper = ({ $height, className, style, ...rest }: ChartWrapperProps) => (
  <div className={cn('w-full', className)} style={{ height: $height || 28, ...style }} {...rest} />
)

const buttonBase = cn(
  'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-3xl px-3 py-1.5',
  'bg-transparent font-[inherit] text-sm font-medium leading-5 transition-[opacity,background] duration-150',
  'hover:opacity-80 disabled:cursor-not-allowed',
)

type DisableableButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { $disabled?: boolean }

export const DepositButton = ({ $disabled, className, ...rest }: DisableableButtonProps) => (
  <button
    className={cn(
      buttonBase,
      'border border-solid border-primary text-primary',
      $disabled ? 'cursor-not-allowed opacity-30 hover:bg-transparent hover:opacity-30' : 'hover:bg-primary/[0.06]',
      className,
    )}
    {...rest}
  />
)

export const ViewPositionButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(buttonBase, 'border border-solid border-blue3 text-blue3 hover:bg-blue3/[0.06]', className)}
    {...rest}
  />
)

export const WithdrawButton = ({ $disabled, className, ...rest }: DisableableButtonProps) => (
  <button
    className={cn(
      buttonBase,
      'border border-solid border-subText text-subText',
      $disabled ? 'cursor-not-allowed opacity-30 hover:bg-transparent hover:opacity-30' : 'hover:bg-subText/[0.06]',
      className,
    )}
    {...rest}
  />
)

export const CardFooter = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-wrap items-end', className)} {...rest} />
)

export const InfoRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-start justify-between text-base', className)} {...rest} />
)

export const InfoLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-gray', className)} {...rest} />
)

export const InfoValue = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col items-end gap-1', className)} {...rest} />
)

export const InfoValuePrimary = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('flex items-center gap-1 text-base text-white2', className)} {...rest} />
)

export const InfoValueSecondary = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-base text-gray', className)} {...rest} />
)

export const Disclaimer = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto pt-6 text-center text-sm italic leading-6 text-gray', className)} {...rest} />
)

export const MyVaultCardBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-1 flex-col gap-3 pt-3', className)} {...rest} />
)

export const MyVaultFooter = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col gap-2', className)} {...rest} />
)

export const ApyTvlRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between', className)} {...rest} />
)

export const FooterMetric = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-2 text-base', className)} {...rest} />
)

export const FooterMetricLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-base text-gray', className)} {...rest} />
)

export const CardFooterRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between', className)} {...rest} />
)

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & { $color: string }
export const StatusBadge = ({ $color, className, style, ...rest }: StatusBadgeProps) => (
  <span
    className={cn('inline-flex items-center whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-medium', className)}
    style={{ color: $color, background: hexAlpha($color, 0.12), ...style }}
    {...rest}
  />
)

export const TxLink = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('cursor-pointer text-sm text-blue3 hover:underline', className)} {...rest} />
)

export const VaultList = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-3', className)} {...rest} />
)

// Flexible tracks (minmax) so the grid fits at a 1201px viewport with the EarnLayout
// sidebar expanded (~909px of content area) up to the 1600px max content width. Tracks
// sit at their min on tight screens and expand to max on wide ones; space-between
// distributes the remainder so columns align across rows at every size.
const VAULT_LIST_ROW_COLUMNS = 'minmax(320px, 1fr) minmax(175px, 200px) minmax(175px, 200px) minmax(210px, 230px)'

type VaultListRowProps = HTMLAttributes<HTMLDivElement> & { $disabled?: boolean; $revealIndex?: number }
export const VaultListRow = ({ $disabled, $revealIndex, className, style, ...rest }: VaultListRowProps) => {
  const reveal = revealProps($revealIndex)
  return (
    <div
      className={cn(
        'relative grid items-center justify-between gap-6 rounded-xl bg-background p-4',
        'transition-[background,transform,box-shadow] [transition-duration:200ms]',
        'hover:-translate-y-px hover:bg-background/85 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]',
        $disabled ? 'opacity-60' : 'opacity-100',
        reveal.className,
        className,
      )}
      style={{ gridTemplateColumns: VAULT_LIST_ROW_COLUMNS, ...reveal.style, ...style }}
      {...rest}
    />
  )
}

export const VaultListRowMain = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-w-0 items-center gap-2', className)} {...rest} />
)

export const VaultListMetric = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-w-0 items-center gap-3', className)} {...rest} />
)

export const VaultListMetricText = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-baseline gap-1 whitespace-nowrap', className)} {...rest} />
)

export const VaultListMetricLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-sm text-subText', className)} {...rest} />
)

export const VaultListMetricValue = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-base text-white2', className)} {...rest} />
)

export const VaultListChartWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-7 w-[82px] shrink-0', className)} {...rest} />
)

export const VaultListActions = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex shrink-0 items-center justify-end gap-3', className)} {...rest} />
)

export const EmptyStateWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-[20px] px-5 py-12 text-subText',
      '[&>svg]:size-20 [&>svg]:opacity-90',
      className,
    )}
    {...rest}
  />
)

export const EmptyStateTitle = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-center text-base font-medium text-text', className)} {...rest} />
)

export const EmptyStateSubtitle = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-center gap-1 text-center text-sm leading-5 text-subText',
      'max-sm:flex-col max-sm:gap-0.5',
      className,
    )}
    {...rest}
  />
)

type EmptyStateLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { as?: ElementType; to?: string }
export const EmptyStateLink = ({ as: Tag = 'a', className, ...rest }: EmptyStateLinkProps) => (
  <Tag className={cn('cursor-pointer text-primary no-underline hover:underline', className)} {...rest} />
)
