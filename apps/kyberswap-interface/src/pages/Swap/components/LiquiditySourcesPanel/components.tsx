import { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react'
import { ChevronLeft } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import { cn } from 'utils/cn'

type BackIconWrapperProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export const BackIconWrapper = ({ className, ...rest }: BackIconWrapperProps) => (
  <IconButton aria-label="Back" className={className} {...rest}>
    <ChevronLeft size={24} className="text-subText" />
  </IconButton>
)

type SourceListProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>

export const SourceList = ({ className, children, ...rest }: SourceListProps) => (
  <div
    {...rest}
    className={cn(
      'flex h-[280px] max-h-[280px] w-full flex-col gap-2 overflow-x-hidden overflow-y-scroll rounded-b-lg border border-t-0 border-border p-3',
      '[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:rounded-[999px]',
      '[&::-webkit-scrollbar-track]:rounded-[999px] [&::-webkit-scrollbar-track]:bg-transparent',
      '[&::-webkit-scrollbar-thumb]:rounded-[999px] [&::-webkit-scrollbar-thumb]:bg-disableText',
      className,
    )}
  >
    {children}
  </div>
)

type LiquiditySourceHeaderProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>

export const LiquiditySourceHeader = ({ className, children, ...rest }: LiquiditySourceHeaderProps) => (
  <div
    {...rest}
    className={cn(
      'flex items-center justify-between gap-4 rounded-t-lg border border-border bg-tableHeader p-3 text-xs font-medium uppercase text-subText',
      className,
    )}
  >
    {children}
  </div>
)

type SourceProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>

export const Source = ({ className, ...props }: SourceProps) => (
  <div
    className={cn(
      'flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-tabActive',
      className,
    )}
    {...props}
  />
)

type ImageWrapperProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>

export const ImageWrapper = ({ className, ...props }: ImageWrapperProps) => (
  <div className={cn('flex size-6 shrink-0 items-center [&_img]:h-auto [&_img]:w-full', className)} {...props} />
)

type SourceNameProps = PropsWithChildren<HTMLAttributes<HTMLSpanElement>>

export const SourceName = ({ className, ...props }: SourceNameProps) => (
  <span className={cn('text-sm font-normal leading-5 text-text', className)} {...props} />
)
