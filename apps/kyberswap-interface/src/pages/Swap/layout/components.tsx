import { type HTMLAttributes, type PropsWithChildren } from 'react'

import { BodyWrapper } from 'pages/AppBody'
import { cn } from 'utils/cn'

type DivProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>

export const TradeBody = ({ children, className, ...rest }: DivProps) => {
  return (
    <BodyWrapper
      className={cn('mt-0 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] data-[highlight=true]:animate-highlight', className)}
      {...rest}
    >
      {children}
    </BodyWrapper>
  )
}

export const PageWrapper = ({ children, className, ...rest }: DivProps) => (
  <div
    className={cn(
      'flex w-full max-w-[1464px] flex-col items-stretch gap-6 px-9 py-6 max-lg:h-auto max-sm:gap-4 max-sm:px-4 max-sm:py-5',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const Container = ({ children, className, ...rest }: DivProps) => (
  <div
    className={cn(
      'flex w-full items-start justify-center gap-12 max-lg:flex-col max-lg:items-center max-lg:gap-6',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const SwapFormWrapper = ({ children, className, ...rest }: DivProps) => (
  <div
    className={cn(
      'z-[1] flex w-full max-w-[425px] flex-shrink-0 flex-col items-center justify-center gap-4 lg:sticky lg:top-4',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const RightPanelWrapper = ({ children, className, ...rest }: DivProps) => (
  <div
    className={cn('flex min-w-0 max-w-[920px] flex-1 flex-col gap-5 max-lg:w-full max-lg:flex-none', className)}
    {...rest}
  >
    {children}
  </div>
)

export const RightPanel = ({ children }: PropsWithChildren) => {
  const content = Array.isArray(children) ? children : [children]
  return content.filter(Boolean).length ? <RightPanelWrapper>{children}</RightPanelWrapper> : null
}

export const BannerWrapper = ({ children, className, ...rest }: DivProps) => (
  <div
    className={cn('grid w-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 overflow-hidden max-lg:hidden', className)}
    {...rest}
  >
    {children}
  </div>
)
