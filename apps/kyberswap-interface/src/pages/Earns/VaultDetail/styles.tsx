import { ButtonHTMLAttributes, HTMLAttributes, SVGProps } from 'react'

import { ReactComponent as IconArrowLeftSvg } from 'assets/svg/ic_left_arrow.svg'
import { cn } from 'utils/cn'

const REDUCED_MOTION = 'motion-reduce:!animate-none motion-reduce:!transition-none'

/** Shared panel chrome for the page's two columns. */
const Card = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col rounded-xl bg-background', className)} {...rest} />
)

export const PageWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-full flex-1 flex-col gap-4 [animation:fadeIn_0.25s_ease-out_both]',
      REDUCED_MOTION,
      className,
    )}
    {...rest}
  />
)

export const BackArrow = ({ className, ...rest }: SVGProps<SVGSVGElement>) => (
  <IconArrowLeftSvg
    className={cn(
      'size-6 shrink-0 cursor-pointer text-text transition-[transform,opacity] duration-200',
      'hover:-translate-x-0.5 hover:opacity-80',
      REDUCED_MOTION,
      className,
    )}
    {...rest}
  />
)

export const HeaderRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-wrap items-center gap-3 [animation:earn-fade-in-up_0.35s_ease-out_both] max-sm:gap-2.5',
      REDUCED_MOTION,
      className,
    )}
    {...rest}
  />
)

export const TokenStack = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative size-8 shrink-0 max-sm:size-7', className)} {...rest} />
)

export const HeaderTitle = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h1
    className={cn(
      'm-0 flex items-baseline gap-1.5 text-2xl font-medium leading-7 text-white2',
      'max-sm:text-xl max-sm:leading-6',
      className,
    )}
    {...rest}
  />
)

export const HeaderTitleMuted = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('font-normal text-subText', className)} {...rest} />
)

export const HeaderApy = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('ml-1 flex items-baseline gap-1.5', className)} {...rest} />
)

export const HeaderApyValue = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('text-2xl font-medium leading-7 text-primary max-sm:text-xl max-sm:leading-6', className)}
    {...rest}
  />
)

export const HeaderApyLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-base leading-6 text-subText max-sm:text-sm max-sm:leading-5', className)} {...rest} />
)

// Two children (charts card, action card) reveal in sequence.
export const ContentGrid = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid w-full grid-cols-[minmax(0,1fr)_480px] items-start gap-4 max-lg:grid-cols-[minmax(0,1fr)]',
      '[&>*]:opacity-0 [&>*]:[animation:earn-fade-in-up_0.4s_ease-out_forwards]',
      '[&>*:nth-child(1)]:[animation-delay:0.08s] [&>*:nth-child(2)]:[animation-delay:0.16s]',
      'motion-reduce:[&>*]:!animate-none motion-reduce:[&>*]:opacity-100',
      className,
    )}
    {...rest}
  />
)

export const ChartsColumn = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-w-0 flex-col gap-3', className)} {...rest} />
)

export const ChartsCard = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <Card
    className={cn(
      'gap-6 p-4',
      'max-sm:gap-5 max-sm:p-3.5',
      'max-xxs:gap-[18px] max-xxs:rounded-[10px] max-xxs:p-3',
      className,
    )}
    {...rest}
  />
)

export const VaultMetaRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-white-04 pb-3', className)}
    {...rest}
  />
)

export const VaultMetaLeft = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-w-0 items-center gap-2', className)} {...rest} />
)

export const TokenIconWrapperSm = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative size-6 shrink-0', className)} {...rest} />
)

export const VaultName = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-baseline gap-1 text-base leading-6 text-white2', className)} {...rest} />
)

export const VaultNameMuted = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-gray', className)} {...rest} />
)

export const ProtocolTag = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center gap-1 whitespace-nowrap rounded-lg bg-white-08 px-2 py-0.5 text-sm leading-5 text-subText',
      'max-xxs:text-xs max-xxs:leading-4',
      className,
    )}
    {...rest}
  />
)

export const ChartsBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-8 max-sm:gap-6', className)} {...rest} />
)

export const ChartSection = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-4 max-sm:gap-3', className)} {...rest} />
)

export const ChartHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between gap-3', className)} {...rest} />
)

export const ChartTitle = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('text-lg font-medium leading-6 text-white2 max-sm:text-base max-sm:leading-[22px]', className)}
    {...rest}
  />
)

export const PeriodTabs = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex h-7 items-center gap-0.5 rounded-[20px] border border-solid border-white-08 bg-white-04 p-0.5',
      className,
    )}
    {...rest}
  />
)

type TabProps = ButtonHTMLAttributes<HTMLButtonElement> & { $active?: boolean }

export const PeriodTab = ({ $active, className, ...rest }: TabProps) => (
  <button
    className={cn(
      'inline-flex h-6 min-w-10 cursor-pointer items-center justify-center rounded-[20px] border-none px-3',
      'text-xs font-medium leading-4 transition-colors duration-200 hover:text-text',
      $active ? 'bg-white-08 text-text' : 'bg-transparent text-subText',
      REDUCED_MOTION,
      className,
    )}
    {...rest}
  />
)

export const ChartBox = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('w-full [animation:fadeIn_0.35s_ease-out_both]', REDUCED_MOTION, className)} {...rest} />
)

export const HowItWorks = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-wrap items-start gap-1.5 text-base leading-6 text-subText max-sm:text-sm max-sm:leading-5',
      className,
    )}
    {...rest}
  />
)

export const HowItWorksLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-gray', className)} {...rest} />
)

export const ActionCard = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <Card
    className={cn(
      'min-h-[420px] overflow-hidden',
      'max-lg:min-h-[320px]',
      'max-xxs:min-h-[280px] max-xxs:rounded-[10px]',
      className,
    )}
    {...rest}
  />
)

export const ActionTabs = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full items-center border-b border-white-04', className)} {...rest} />
)

export const ActionTab = ({ $active, className, ...rest }: TabProps) => (
  <button
    className={cn(
      'flex h-12 w-[148px] shrink-0 cursor-pointer items-center justify-center gap-1 border-b-2 border-solid px-5 py-3',
      'text-sm font-medium uppercase leading-6 tracking-[0.02em]',
      'transition-[color,border-color,background-color] [transition-duration:250ms]',
      $active
        ? 'border-b-primary bg-primary/10 text-primary'
        : 'border-b-transparent bg-transparent text-subText hover:bg-white/[0.02] hover:text-text',
      'max-xxs:w-auto max-xxs:flex-1',
      REDUCED_MOTION,
      className,
    )}
    {...rest}
  />
)

export const ActionTabDivider = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-5 w-px bg-white-08', className)} {...rest} />
)

export const ActionBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-1 flex-col gap-4 p-5',
      '[animation:fadeIn_0.25s_ease-out_both]',
      'max-xxs:gap-3 max-xxs:p-4',
      REDUCED_MOTION,
      className,
    )}
    {...rest}
  />
)

export const DetailRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between gap-3 text-sm leading-5', className)} {...rest} />
)

export const DetailLabel = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-subText', className)} {...rest} />
)

export const DetailValue = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('text-right text-text', className)} {...rest} />
)

export const RequestList = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2', className)} {...rest} />
)

export const RequestCard = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 rounded-xl border border-white-08 bg-white-04 p-3', className)} {...rest} />
)

export const RequestStatusBadge = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium leading-4 tracking-[0.02em]', className)}
    {...rest}
  />
)

export const CancelRequestButton = ({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'shrink-0 rounded-full border border-red-30 bg-transparent px-3 py-1 text-xs font-medium text-red',
      'transition-colors duration-200 hover:bg-red-20',
      'disabled:cursor-not-allowed disabled:opacity-50',
      REDUCED_MOTION,
      className,
    )}
    {...rest}
  />
)
