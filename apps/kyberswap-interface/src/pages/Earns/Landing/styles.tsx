import { Link, LinkProps } from 'react-router-dom'

import bg from 'assets/images/earn-bg.png'
import { ButtonPrimary } from 'components/Button'
import { cn } from 'utils/cn'

export const WrapperBg: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, style, ...rest }) => (
  <div
    {...rest}
    className={cn('w-screen bg-[length:100%_auto] [background-repeat:repeat-y]', className)}
    style={{ backgroundImage: `url(${bg})`, ...style }}
  />
)

export const Container: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cn('mx-auto max-w-[1152px] px-4 py-[60px] text-center max-xxs:px-3 max-xxs:py-9', className)}
  />
)

export const BorderWrapper: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cn(
      // sm:h-full lets the card fill its (equal-height) grid cell so the bottom-pinned action button
      // lines up across all three cards; on mobile the layout is a stacked flex column, so no h-full.
      'relative overflow-hidden rounded-[20px] bg-clip-padding p-px sm:h-full',
      "before:absolute before:inset-0 before:z-[-1] before:p-px before:content-['']",
      'before:[background:linear-gradient(306.9deg,#262525_38.35%,rgba(49,203,158,0.06)_104.02%),radial-gradient(58.61%_54.58%_at_30.56%_0%,rgba(49,203,158,0.6)_0%,rgba(0,0,0,0)_100%)]',
      'before:[-webkit-mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] before:[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]',
      'hover:before:inset-[-20%]',
      'hover:before:[background:linear-gradient(306.9deg,#262525_38.35%,rgba(49,203,158,0.6)_104.02%),radial-gradient(58.61%_54.58%_at_30.56%_0%,rgba(49,203,158,1)_0%,rgba(0,0,0,0)_100%)]',
      'hover:before:[animation:ks-earn-spin_2s_linear_infinite]',
      className,
    )}
  />
)

export const OverviewWrapper: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'm-0 mt-16 box-border grid min-w-0 grid-cols-3 gap-5',
      'max-sm:mt-5 max-sm:flex max-sm:flex-col',
      'max-xxs:gap-4',
      className,
    )}
  />
)

export const PoolWrapper: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'relative overflow-hidden rounded-[20px] p-px',
      'transition-[box-shadow,transform,background] duration-300 ease-in-out',
      'hover:shadow-[0px_12px_64px_0px_rgba(71,32,139,0.8)]',
      "before:absolute before:inset-0 before:z-[-1] before:rounded-[20px] before:p-px before:content-['']",
      'before:[background:linear-gradient(215.58deg,#262525_-9.03%,rgba(148,115,221,0.2)_59.21%),radial-gradient(58.61%_54.58%_at_30.56%_0%,rgba(130,71,229,0.6)_0%,rgba(0,0,0,0)_100%)]',
      'before:[-webkit-mask-composite:destination-out] before:[mask-composite:destination-out]',
      'hover:before:[background:linear-gradient(215.58deg,#262525_-9.03%,rgba(148,115,221,0.6)_59.21%),radial-gradient(58.61%_54.58%_at_30.56%_0%,rgba(130,71,229,1)_0%,rgba(0,0,0,0)_100%)]',
      className,
    )}
  />
)

export const CardWrapper: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'flex h-full min-h-[360px] cursor-pointer flex-col overflow-hidden rounded-[20px] pb-11 pl-[50px] pr-9 text-left',
      '[background:linear-gradient(119.08deg,rgba(20,29,27,1)_-0.89%,rgba(14,14,14,1)_132.3%)]',
      '[&_button]:cursor-pointer',
      'max-md:px-9 max-md:pb-10',
      'max-sm:h-fit max-sm:min-h-0 max-sm:flex-row max-sm:gap-3 max-sm:p-4 max-sm:py-5',
      className,
    )}
  />
)

export const ButtonPrimaryStyled: React.FC<React.ComponentProps<typeof ButtonPrimary>> = ({ className, ...rest }) => (
  <ButtonPrimary {...rest} className={cn('mt-auto !h-9 !w-[132px] max-sm:!mt-5', className)} />
)

export const ListPoolWrapper: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'h-full cursor-pointer rounded-[20px] p-5 max-md:p-3 max-sm:p-[18px]',
      '[background:linear-gradient(119.08deg,rgba(20,29,27,1)_-0.89%,rgba(14,14,14,1)_132.3%)]',
      className,
    )}
  />
)

export const PoolRow: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div {...rest} className={cn('flex items-center gap-3 rounded-[999px] px-4 py-2 hover:bg-primary-10', className)} />
)

export const Tag: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div {...rest} className={cn('rounded-[999px] bg-text-12 px-2 py-1 text-xs text-subText', className)} />
)

export const RewardsNavigateButton: React.FC<LinkProps> = ({ className, ...rest }) => (
  <Link
    {...rest}
    className={cn(
      'flex shrink-0 cursor-pointer items-center rounded-[30px] py-0.5 pl-5 pr-3.5',
      '[--border-angle:0deg] [animation:ks-earn-border-rotate_2s_infinite_linear]',
      'border border-solid border-transparent backdrop-blur-[2px]',
      '[background:linear-gradient(#1d5b49,#1d5b49)_padding-box,conic-gradient(from_var(--border-angle),#196750_50%,var(--ks-primary))_border-box]',
      'max-sm:w-full max-sm:justify-center',
      className,
    )}
  />
)
