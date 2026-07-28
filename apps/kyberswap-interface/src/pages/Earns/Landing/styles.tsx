import { CSSProperties, HTMLAttributes } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'
import { hexAlpha } from 'utils/colorAlpha'

const STABLE_PAIR_BG = 'bg-[rgba(8,161,231,0.06)]'
const STABLE_PAIR_BG_HOVER = 'hover:bg-[rgba(8,161,231,0.16)]'

// Sections reveal in a stagger as the page mounts. Each delay is spelled out in full —
// Tailwind only generates classes it can find as complete literals in the source.
const FADE_IN_BASE = 'opacity-0 motion-reduce:!animate-none motion-reduce:opacity-100'
const FADE_IN = {
  hero: cn(FADE_IN_BASE, '[animation:earn-fade-in-up_0.5s_ease-out_0s_forwards]'),
  top: cn(FADE_IN_BASE, '[animation:earn-fade-in-up_0.5s_ease-out_0.15s_forwards]'),
  bottom: cn(FADE_IN_BASE, '[animation:earn-fade-in-up_0.5s_ease-out_0.3s_forwards]'),
  explore: cn(FADE_IN_BASE, '[animation:earn-fade-in-up_0.5s_ease-out_0.45s_forwards]'),
}

export const PageGrid = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-6', className)} {...rest} />
)

export const HeroSection = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col items-center gap-8 px-4 pb-4 pt-8',
      'max-xs:gap-6 max-xs:px-0 max-xs:pb-2 max-xs:pt-4',
      FADE_IN.hero,
      className,
    )}
    {...rest}
  />
)

export const HeroTitle = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex max-w-[880px] flex-col items-center gap-4 text-center', className)} {...rest} />
)

export const HeroRewardRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-wrap items-center justify-center gap-8 max-xs:flex-col max-xs:gap-4', className)}
    {...rest}
  />
)

export const TopSectionsRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid grid-cols-[868fr_408fr] gap-[22px]', 'max-lg:grid-cols-1 max-lg:gap-4', FADE_IN.top, className)}
    {...rest}
  />
)

export const BottomSectionsRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(FADE_IN.bottom, className)} {...rest} />
)

export const BottomSectionInner = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative grid grid-cols-[2fr_1fr] items-stretch max-lg:grid-cols-1', className)} {...rest} />
)

export const BottomLeftCol = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'min-w-0 p-6 pt-5',
      'max-lg:px-5 max-lg:pb-6 max-lg:pt-5',
      'max-md:px-4 max-md:pb-5 max-md:pt-4',
      'max-xs:px-0 max-xs:pb-0 max-xs:pt-6',
      className,
    )}
    {...rest}
  />
)

export const BottomRightCol = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'relative min-w-0 p-6 pt-5',
      // Vertical rule between the two bottom columns; drops away once they stack.
      "before:absolute before:bottom-6 before:left-0 before:top-[76px] before:w-px before:bg-border/40 before:content-['']",
      'max-lg:px-5 max-lg:pb-6 max-lg:pt-0 max-lg:before:hidden',
      'max-md:px-4 max-md:pb-5 max-md:pt-0',
      'max-xs:px-0 max-xs:pb-0 max-xs:pt-6',
      className,
    )}
    {...rest}
  />
)

type SectionContainerProps = HTMLAttributes<HTMLDivElement> & {
  accentColor?: string
  clickable?: boolean
}
export const SectionContainer = ({ accentColor, clickable, className, style, ...rest }: SectionContainerProps) => {
  const theme = useTheme()
  const accent = accentColor || theme.primary
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[20px] bg-clip-padding p-px transition-transform duration-200',
        clickable && 'cursor-pointer',
        "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[20px] before:p-px before:content-['']",
        'before:[--border-angle:0deg] before:[background:var(--ks-section-border)]',
        'before:[-webkit-mask-composite:xor] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]',
        'before:[mask-composite:exclude] before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]',
        'hover:-translate-y-0.5',
        'hover:before:[animation:ks-earn-border-rotate_3s_linear_infinite] hover:before:[background:var(--ks-section-border-hover)]',
        // Full-bleed on the smallest screens: card chrome is dropped and the section
        // spans the content area's horizontal padding.
        'max-xs:-mx-4 max-xs:rounded-none max-xs:bg-none max-xs:p-0',
        'max-xs:before:hidden max-xs:hover:translate-y-0 max-xs:hover:before:hidden',
        'max-xxs:-mx-3',
        className,
      )}
      style={
        {
          '--ks-section-border': `linear-gradient(306.9deg, #262525 38.35%, ${hexAlpha(
            accent,
            0.06,
          )} 104.02%), radial-gradient(58.61% 54.58% at 30.56% 0%, ${hexAlpha(accent, 0.6)} 0%, rgba(0, 0, 0, 0) 100%)`,
          '--ks-section-border-hover': `conic-gradient(from var(--border-angle), ${hexAlpha(
            accent,
            0.05,
          )} 0%, ${hexAlpha(accent, 0.9)} 10%, ${hexAlpha(accent, 0.05)} 25%, ${hexAlpha(accent, 0.05)} 100%)`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  )
}

type SectionInnerProps = HTMLAttributes<HTMLDivElement> & { accentColor?: string }
export const SectionInner = ({ accentColor, className, style, ...rest }: SectionInnerProps) => {
  const theme = useTheme()
  const accent = accentColor || theme.primary
  return (
    <div
      className={cn(
        'relative z-[1] flex h-full flex-col gap-5 rounded-[20px] bg-black/20 px-8 pb-6 backdrop-blur-[5px]',
        'max-md:gap-4 max-md:px-6 max-md:pb-5',
        'max-sm:px-5 max-sm:pb-5',
        'max-xs:rounded-none max-xs:px-4 max-xs:pb-4',
        // Accent hairlines only show in the full-bleed mobile layout, where the card
        // border is gone and they take over as the section separators.
        "after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:opacity-0 after:content-[''] after:[background:var(--ks-accent-line-top)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:opacity-0 before:content-[''] before:[background:var(--ks-accent-line-bottom)]",
        'max-xs:before:opacity-100 max-xs:after:opacity-100',
        className,
      )}
      style={
        {
          '--ks-accent-line-top': `linear-gradient(90deg, ${hexAlpha(accent, 0.15)} 0%, ${hexAlpha(
            accent,
            0.85,
          )} 18%, ${hexAlpha(accent, 0.2)} 50%, ${hexAlpha(accent, 0.1)} 80%, ${hexAlpha(accent, 0.05)} 100%)`,
          '--ks-accent-line-bottom': `linear-gradient(90deg, ${hexAlpha(accent, 0.08)} 0%, ${hexAlpha(
            accent,
            0.45,
          )} 18%, ${hexAlpha(accent, 0.1)} 50%, ${hexAlpha(accent, 0.05)} 80%, transparent 100%)`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  )
}

export const SectionHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-start gap-5', className)} {...rest} />
)

export const HeaderIconWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative flex w-20 shrink-0 flex-col items-center max-xs:w-16', className)} {...rest} />
)

type AccentProps = HTMLAttributes<HTMLDivElement> & { accentColor?: string }

export const HeaderIconLine = ({ accentColor, className, style, ...rest }: AccentProps) => (
  <div
    className={cn('h-5 w-px bg-primary', className)}
    style={accentColor ? { background: accentColor, ...style } : style}
    {...rest}
  />
)

export const HeaderIconCircle = ({ accentColor, className, style, ...rest }: AccentProps) => {
  const theme = useTheme()
  const accent = accentColor || theme.primary
  return (
    <div
      className={cn(
        'relative flex size-20 items-center justify-center rounded-full border border-solid bg-transparent text-subText',
        "before:pointer-events-none before:absolute before:inset-2 before:rounded-full before:bg-[var(--ks-icon-fill)] before:content-['']",
        '[&>*]:relative [&>*]:z-[1]',
        'max-xs:size-16 max-xs:before:inset-1.5',
        className,
      )}
      style={
        {
          borderColor: hexAlpha(accent, 0.6),
          '--ks-icon-fill': hexAlpha(accent, accentColor ? 0.2 : 0.15),
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  )
}

export const HeaderTextBlock = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-w-0 flex-1 flex-col gap-2 pt-8 max-xs:pt-5', className)} {...rest} />
)

export const SectionDivider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-px w-full bg-border/40', className)} {...rest} />
)

export const TwoColumnGrid = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-2 gap-5 max-xs:grid-cols-1 max-xs:gap-4', className)} {...rest} />
)

export const InnerSectionTitle = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 flex items-center gap-2', className)} {...rest} />
)

export const InnerListContainer = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-3', className)} {...rest} />
)

export const PartnerVaultsList = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-4', className)} {...rest} />
)

export const HighlightedPoolsGrid = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-2 gap-5 max-lg:gap-4 max-xs:grid-cols-1 max-xs:gap-3', className)} {...rest} />
)

export const FarmingPoolsList = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-5 max-lg:gap-3', className)} {...rest} />
)

export const SimpleSectionHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mb-1 flex items-center gap-2 pb-4 pl-0 pr-6 pt-2', 'max-md:pb-3 max-md:pr-3 max-md:pt-1', className)}
    {...rest}
  />
)

type PoolRowVariant = 'default' | 'stable' | 'farming'

// Stable pairs get a blue wash; farming rows a faint primary tint; everything else a
// neutral white tint. All three share the same primary hover except stable pairs, which
// deepen their own blue.
const poolRowSurface = (variant?: PoolRowVariant) =>
  variant === 'stable'
    ? cn(STABLE_PAIR_BG, STABLE_PAIR_BG_HOVER)
    : cn(variant === 'farming' ? 'bg-primary/[0.04]' : 'bg-white-04', 'hover:bg-primary/[0.16]')

type LargePoolRowProps = HTMLAttributes<HTMLDivElement> & { variant?: PoolRowVariant }
export const LargePoolRow = ({ variant, className, ...rest }: LargePoolRowProps) => (
  <div
    className={cn(
      'flex cursor-pointer flex-col gap-3 rounded-xl p-4 transition-colors',
      poolRowSurface(variant),
      className,
    )}
    {...rest}
  />
)

type SmallPoolRowProps = HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'stable' }
export const SmallPoolRow = ({ variant, className, ...rest }: SmallPoolRowProps) => (
  <div
    className={cn(
      'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors',
      poolRowSurface(variant),
      variant !== 'stable' && 'max-xs:flex-col max-xs:items-start max-xs:gap-2 max-xs:p-4',
      className,
    )}
    {...rest}
  />
)

export const Tag = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'shrink-0 whitespace-nowrap rounded-[999px] bg-white-08 px-2 py-1 text-xs leading-4 text-subText',
      className,
    )}
    {...rest}
  />
)

export const ProtocolTag = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex max-w-full shrink-0 items-center gap-1 truncate rounded-lg bg-white-08 px-2 py-0.5 text-xs leading-4 text-subText',
      className,
    )}
    {...rest}
  />
)

// Rotating conic-gradient border shared by both call-to-action buttons.
const rewardsButtonBase = cn(
  'flex shrink-0 cursor-pointer items-center gap-2 rounded-[30px] border border-solid border-transparent',
  '[--border-angle:0deg] [animation:ks-earn-border-rotate_2s_infinite_linear]',
  '[background:linear-gradient(161.87deg,rgba(22,31,28,0.8)_8.13%,rgba(24,45,39,0.8)_99%)_padding-box,conic-gradient(from_var(--border-angle),var(--ks-primary)_0%,#196750_15%,#196750_35%,var(--ks-primary)_50%,#196750_65%,#196750_85%,var(--ks-primary)_100%)_border-box]',
  'shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-[box-shadow,filter] duration-200',
  'max-xs:w-full max-xs:justify-center',
)

export const RewardsNavigateButton = ({ className, ...rest }: LinkProps) => (
  <Link
    className={cn(
      rewardsButtonBase,
      'px-5 py-2',
      'hover:shadow-[0px_4px_16px_rgba(49,203,158,0.25)] hover:brightness-125',
      className,
    )}
    {...rest}
  />
)

export const ExplorePoolsButton = ({ className, ...rest }: LinkProps) => (
  <Link
    className={cn(
      rewardsButtonBase,
      'mx-auto mt-4 px-8 py-4 text-base max-xs:px-6 max-xs:py-3',
      'hover:shadow-[0px_6px_24px_rgba(49,203,158,0.3)] hover:brightness-125',
      className,
    )}
    {...rest}
  />
)

export const ExplorePoolsWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex justify-center', FADE_IN.explore, className)} {...rest} />
)
